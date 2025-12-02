package queue

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/aithen/go-api/internal/models"
	"github.com/aithen/go-api/internal/websocket"
)

const (
	// MaxFilesPerJob limits the number of files processed in a single job
	MaxFilesPerJob = 5
	// MaxConcurrentJobs limits the number of concurrent training jobs
	MaxConcurrentJobs = 3
)

// TrainingJob represents a single training job
type TrainingJob struct {
	ID              string
	KnowledgeBaseID int64
	VersionID       int64
	Files           []*models.KnowledgeBaseFile
	JobIndex        int
	TotalJobs       int
	Status          string // pending, processing, completed, failed
	StartedAt       *time.Time
	CompletedAt     *time.Time
	Error           error
	ChannelID       string
}

// TrainingQueue manages training jobs
type TrainingQueue struct {
	jobs         []*TrainingJob
	activeJobs   map[string]*TrainingJob
	mu           sync.RWMutex
	processQueue chan *TrainingJob
	wsHub        *websocket.Hub
	models       *models.Models
}

var (
	queueInstance *TrainingQueue
	queueOnce     sync.Once
)

// GetTrainingQueue returns the singleton training queue instance
func GetTrainingQueue() *TrainingQueue {
	queueOnce.Do(func() {
		queueInstance = &TrainingQueue{
			jobs:         make([]*TrainingJob, 0),
			activeJobs:   make(map[string]*TrainingJob),
			processQueue: make(chan *TrainingJob, 100),
			wsHub:        websocket.GetHub(),
		}
		go queueInstance.processJobs()
	})
	return queueInstance
}

// SetModels sets the models instance for the queue
func (q *TrainingQueue) SetModels(m *models.Models) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.models = m
}

// EnqueueTrainingJob creates and enqueues training jobs for a knowledge base
func (q *TrainingQueue) EnqueueTrainingJob(ctx context.Context, kbID, versionID int64, files []*models.KnowledgeBaseFile, channelID string) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	if q.models == nil {
		return fmt.Errorf("models not set for training queue")
	}

	// Chunk files into batches
	totalFiles := len(files)
	totalJobs := (totalFiles + MaxFilesPerJob - 1) / MaxFilesPerJob // Ceiling division

	log.Printf("Chunking %d files into %d jobs (max %d files per job)", totalFiles, totalJobs, MaxFilesPerJob)

	// Create jobs for each batch
	jobs := make([]*TrainingJob, 0, totalJobs)
	for i := 0; i < totalJobs; i++ {
		start := i * MaxFilesPerJob
		end := start + MaxFilesPerJob
		if end > totalFiles {
			end = totalFiles
		}

		jobFiles := files[start:end]
		jobID := fmt.Sprintf("%s_job_%d", channelID, i+1)

		job := &TrainingJob{
			ID:              jobID,
			KnowledgeBaseID: kbID,
			VersionID:       versionID,
			Files:           jobFiles,
			JobIndex:        i + 1,
			TotalJobs:       totalJobs,
			Status:          "pending",
			ChannelID:       channelID,
		}

		jobs = append(jobs, job)
		q.jobs = append(q.jobs, job)
	}

	// Send initial job queue message
	q.wsHub.Broadcast(channelID, "job_queue_created", map[string]interface{}{
		"total_jobs":  totalJobs,
		"total_files": totalFiles,
		"jobs":        jobs,
	}, nil, nil)

	// Enqueue all jobs
	for _, job := range jobs {
		select {
		case q.processQueue <- job:
			log.Printf("Enqueued job %s (%d/%d)", job.ID, job.JobIndex, job.TotalJobs)
		default:
			log.Printf("Warning: Job queue is full, job %s may be delayed", job.ID)
			// Try again in a goroutine
			go func(j *TrainingJob) {
				time.Sleep(1 * time.Second)
				q.processQueue <- j
			}(job)
		}
	}

	return nil
}

// processJobs processes jobs from the queue
func (q *TrainingQueue) processJobs() {
	semaphore := make(chan struct{}, MaxConcurrentJobs)

	for job := range q.processQueue {
		// Wait for available slot
		semaphore <- struct{}{}

		go func(j *TrainingJob) {
			defer func() { <-semaphore }()

			q.mu.Lock()
			j.Status = "processing"
			now := time.Now()
			j.StartedAt = &now
			q.activeJobs[j.ID] = j
			q.mu.Unlock()

			log.Printf("Processing job %s (%d/%d) with %d files", j.ID, j.JobIndex, j.TotalJobs, len(j.Files))

			// Send job start message
			q.wsHub.Broadcast(j.ChannelID, "job_started", map[string]interface{}{
				"job_id":     j.ID,
				"job_index":  j.JobIndex,
				"total_jobs": j.TotalJobs,
				"file_count": len(j.Files),
				"files":      j.Files,
			}, nil, nil)

			// Process the job (this will call the training service)
			err := q.processJob(context.Background(), j)

			q.mu.Lock()
			now = time.Now()
			j.CompletedAt = &now
			if err != nil {
				j.Status = "failed"
				j.Error = err
				log.Printf("Job %s failed: %v", j.ID, err)
			} else {
				j.Status = "completed"
				log.Printf("Job %s completed successfully", j.ID)
			}
			delete(q.activeJobs, j.ID)
			q.mu.Unlock()

			// Send job completion message
			msgType := "job_completed"
			if err != nil {
				msgType = "job_failed"
			}
			q.wsHub.Broadcast(j.ChannelID, msgType, map[string]interface{}{
				"job_id":     j.ID,
				"job_index":  j.JobIndex,
				"total_jobs": j.TotalJobs,
				"error":      err,
			}, nil, err)

			// Check if all jobs are completed
			q.checkAllJobsCompleted(j.ChannelID, j.VersionID, j.KnowledgeBaseID)
		}(job)
	}
}

// processJob processes a single training job by calling the training service
func (q *TrainingQueue) processJob(ctx context.Context, job *TrainingJob) error {
	return q.callTrainingService(ctx, job)
}

// callTrainingService calls the Python training service for a job batch
func (q *TrainingQueue) callTrainingService(ctx context.Context, job *TrainingJob) error {
	// Get database config
	dbConfig := map[string]string{
		"host":     os.Getenv("DB_HOST"),
		"port":     os.Getenv("DB_PORT"),
		"user":     os.Getenv("DB_USER"),
		"password": os.Getenv("DB_PASS"),
		"dbname":   os.Getenv("DB_NAME"),
	}

	// Prepare file list
	fileList := make([]map[string]interface{}, len(job.Files))
	for i, file := range job.Files {
		absPath := file.FilePath
		if !filepath.IsAbs(file.FilePath) {
			wd, err := os.Getwd()
			if err == nil {
				absPath = filepath.Join(wd, file.FilePath)
			}
		}

		// Verify file exists, if not try to fix path (remove duplicate extensions)
		if _, err := os.Stat(absPath); os.IsNotExist(err) {
			// Try to fix duplicate extensions (e.g., .xlsx.xlsx -> .xlsx)
			dir := filepath.Dir(absPath)
			baseName := filepath.Base(absPath)
			originalBaseName := baseName
			// Remove duplicate extensions
			for {
				ext := filepath.Ext(baseName)
				if ext == "" {
					break
				}
				baseWithoutExt := baseName[:len(baseName)-len(ext)]
				prevExt := filepath.Ext(baseWithoutExt)
				if prevExt == ext {
					// Found duplicate extension, remove one
					baseName = baseWithoutExt + ext
					absPath = filepath.Join(dir, baseName)
					// Verify the corrected path exists
					if _, err := os.Stat(absPath); err == nil {
						// File found with corrected path, update database record
						correctedRelativePath := file.FilePath
						if filepath.IsAbs(file.FilePath) {
							// Extract relative path from absolute
							wd, _ := os.Getwd()
							if relPath, err := filepath.Rel(wd, absPath); err == nil {
								correctedRelativePath = relPath
							}
						} else {
							// Update relative path
							dirPart := filepath.Dir(file.FilePath)
							correctedRelativePath = filepath.Join(dirPart, baseName)
						}
						// Update file path in database (if models support it)
						// Note: This would require adding an UpdateFilePath method to the model
						log.Printf("Fixed file path for file %d: %s -> %s", file.ID, file.FilePath, correctedRelativePath)
					}
					break
				}
				baseName = baseWithoutExt
				if baseName == originalBaseName {
					break // No change, avoid infinite loop
				}
			}
		}

		fileList[i] = map[string]interface{}{
			"id":        fmt.Sprintf("%d", file.ID),
			"name":      file.Name,
			"path":      absPath,
			"mime_type": file.MimeType,
			"size":      file.FileSize,
		}
	}

	// Prepare training request
	trainingReq := map[string]interface{}{
		"knowledge_base_id": fmt.Sprintf("%d", job.KnowledgeBaseID),
		"version_id":        fmt.Sprintf("%d", job.VersionID),
		"files":             fileList,
		"db_config":         dbConfig,
		"job_id":            job.ID,
		"job_index":         job.JobIndex,
		"total_jobs":        job.TotalJobs,
	}

	// Call Python training service
	aiServiceURL := getTrainingServiceURL()
	trainingURL := fmt.Sprintf("%s/training/stream", aiServiceURL)

	reqBody, err := json.Marshal(trainingReq)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", trainingURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 0}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to connect to training service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("training service error: %s", string(body))
	}

	// Parse SSE stream and forward to WebSocket
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			var progressData map[string]interface{}
			if err := json.Unmarshal([]byte(data), &progressData); err != nil {
				continue
			}

			// Add job info to progress data
			progressData["job_id"] = job.ID
			progressData["job_index"] = job.JobIndex
			progressData["total_jobs"] = job.TotalJobs

			// Convert to Progress struct
			progress := &websocket.Progress{}
			if currFile, ok := progressData["current_file"].(float64); ok {
				progress.CurrentFile = int(currFile)
			}
			if totalFiles, ok := progressData["total_files"].(float64); ok {
				progress.TotalFiles = int(totalFiles)
			}
			if currChunk, ok := progressData["current_chunk"].(float64); ok {
				progress.CurrentChunk = int(currChunk)
			}
			if totalChunks, ok := progressData["total_chunks"].(float64); ok {
				progress.TotalChunks = int(totalChunks)
			}
			if pct, ok := progressData["percentage"].(float64); ok {
				progress.Percentage = int(pct)
			}
			if status, ok := progressData["status"].(string); ok {
				progress.Status = status
			}
			if msg, ok := progressData["message"].(string); ok {
				progress.Message = msg
			}
			if fileName, ok := progressData["current_file_name"].(string); ok {
				progress.CurrentFileURL = fileName
				progress.CurrentFileName = fileName
			}
			if jobID, ok := progressData["job_id"].(string); ok {
				progress.JobID = jobID
			}
			if jobIdx, ok := progressData["job_index"].(float64); ok {
				progress.JobIndex = int(jobIdx)
			}
			if totalJobs, ok := progressData["total_jobs"].(float64); ok {
				progress.TotalJobs = int(totalJobs)
			}

			msgType := "progress"
			if t, ok := progressData["type"].(string); ok {
				msgType = t
			}

			// Broadcast progress update
			q.wsHub.Broadcast(job.ChannelID, msgType, progressData, progress, nil)

			// Handle completion
			if msgType == "complete" {
				break
			}

			// Handle errors
			if msgType == "error" {
				return fmt.Errorf("training error: %v", progressData["message"])
			}
		}
	}

	return scanner.Err()
}

func getTrainingServiceURL() string {
	url := os.Getenv("AI_SERVICE_URL")
	if url == "" {
		return "http://localhost:8000"
	}
	return url
}

// checkAllJobsCompleted checks if all jobs for a channel are completed
func (q *TrainingQueue) checkAllJobsCompleted(channelID string, versionID, kbID int64) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	// Count jobs for this channel
	var pending, processing, completed, failed int
	for _, job := range q.jobs {
		if job.ChannelID == channelID {
			switch job.Status {
			case "pending":
				pending++
			case "processing":
				processing++
			case "completed":
				completed++
			case "failed":
				failed++
			}
		}
	}

	// If no pending or processing jobs, all are done
	if pending == 0 && processing == 0 {
		if failed > 0 {
			// Some jobs failed
			q.wsHub.Broadcast(channelID, "all_jobs_completed", map[string]interface{}{
				"status":    "partial_failure",
				"completed": completed,
				"failed":    failed,
			}, nil, fmt.Errorf("%d jobs failed", failed))
		} else {
			// All jobs completed successfully
			q.wsHub.Broadcast(channelID, "all_jobs_completed", map[string]interface{}{
				"status":    "success",
				"completed": completed,
			}, nil, nil)

			// Update version status and quality metrics
			if q.models != nil {
				ctx := context.Background()
				now := time.Now()
				q.models.KnowledgeBases.UpdateVersionStatus(ctx, versionID, "completed", &now)
				if err := q.models.KnowledgeBases.UpdateVersionQualityMetrics(ctx, versionID); err != nil {
					log.Printf("Warning: Failed to update quality metrics for version %d: %v", versionID, err)
				}
				q.models.KnowledgeBases.Update(ctx, kbID, "", "", "active")
			}
		}
	}
}

// GetJobStatus returns the status of jobs for a channel
func (q *TrainingQueue) GetJobStatus(channelID string) map[string]interface{} {
	q.mu.RLock()
	defer q.mu.RUnlock()

	var jobs []map[string]interface{}
	var pending, processing, completed, failed int

	for _, job := range q.jobs {
		if job.ChannelID == channelID {
			jobs = append(jobs, map[string]interface{}{
				"id":           job.ID,
				"job_index":    job.JobIndex,
				"total_jobs":   job.TotalJobs,
				"status":       job.Status,
				"file_count":   len(job.Files),
				"started_at":   job.StartedAt,
				"completed_at": job.CompletedAt,
				"error":        job.Error,
			})

			switch job.Status {
			case "pending":
				pending++
			case "processing":
				processing++
			case "completed":
				completed++
			case "failed":
				failed++
			}
		}
	}

	return map[string]interface{}{
		"jobs":       jobs,
		"pending":    pending,
		"processing": processing,
		"completed":  completed,
		"failed":     failed,
	}
}
