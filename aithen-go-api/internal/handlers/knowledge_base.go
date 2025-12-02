package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/aithen/go-api/internal/models"
	"github.com/aithen/go-api/internal/queue"
	"github.com/gin-gonic/gin"
)

// GetKnowledgeBases retrieves all knowledge bases for an organization
func GetKnowledgeBases(c *gin.Context) {
	// Get organization slug from path parameter
	orgSlug := c.Param("slug")

	if orgSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization slug is required"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Find organization by slug
	org, err := m.Organizations.FindBySlug(ctx, orgSlug)
	if err != nil {
		if err == models.ErrOrganizationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve organization"})
		return
	}

	// Get knowledge bases for this organization
	kbs, err := m.KnowledgeBases.FindByOrganizationID(ctx, org.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge bases"})
		return
	}

	// Enrich with file counts and other computed fields
	type QualityMetrics struct {
		TotalEmbeddings    int      `json:"total_embeddings"`
		TotalChunks        int      `json:"total_chunks"`
		EmbeddingDimension int      `json:"embedding_dimension"`
		TotalStorageSize   int64    `json:"total_storage_size"`
		AverageChunkSize   int      `json:"average_chunk_size"`
		QualityScore       *float64 `json:"quality_score,omitempty"`
	}

	type KnowledgeBaseResponse struct {
		*models.KnowledgeBase
		TotalDatasets  int             `json:"total_datasets"`
		CurrentVersion string          `json:"current_version"`
		TotalVersions  int             `json:"total_versions"`
		LastUpdated    string          `json:"last_updated"`
		QualityMetrics *QualityMetrics `json:"quality_metrics,omitempty"`
	}

	response := make([]KnowledgeBaseResponse, len(kbs))
	for i, kb := range kbs {
		fileCount, _ := m.KnowledgeBases.GetFileCount(ctx, kb.ID)
		versionCount, _ := m.KnowledgeBases.GetVersionCount(ctx, kb.ID)

		// Get latest version with quality metrics
		latestVersion, err := m.KnowledgeBases.GetLatestVersion(ctx, kb.ID)
		currentVersion := "v1.0.0" // Default if no versions exist
		var qualityMetrics *QualityMetrics
		if err == nil && latestVersion != nil {
			currentVersion = latestVersion.VersionString
			if latestVersion.Status == "completed" {
				qualityMetrics = &QualityMetrics{
					TotalEmbeddings:    latestVersion.TotalEmbeddings,
					TotalChunks:        latestVersion.TotalChunks,
					EmbeddingDimension: latestVersion.EmbeddingDimension,
					TotalStorageSize:   latestVersion.TotalStorageSize,
					AverageChunkSize:   latestVersion.AverageChunkSize,
					QualityScore:       latestVersion.QualityScore,
				}
			}
		}

		response[i] = KnowledgeBaseResponse{
			KnowledgeBase:  kb,
			TotalDatasets:  fileCount,
			CurrentVersion: currentVersion,
			TotalVersions:  versionCount,
			LastUpdated:    kb.UpdatedAt.Format("2006-01-02"),
			QualityMetrics: qualityMetrics,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetKnowledgeBase retrieves a knowledge base by ID
func GetKnowledgeBase(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	kb, err := m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	fileCount, _ := m.KnowledgeBases.GetFileCount(ctx, kb.ID)
	versionCount, _ := m.KnowledgeBases.GetVersionCount(ctx, kb.ID)

	// Get latest version with quality metrics
	latestVersion, err := m.KnowledgeBases.GetLatestVersion(ctx, kb.ID)
	currentVersion := "v1.0.0" // Default if no versions exist
	var qualityMetrics *struct {
		TotalEmbeddings    int      `json:"total_embeddings"`
		TotalChunks        int      `json:"total_chunks"`
		EmbeddingDimension int      `json:"embedding_dimension"`
		TotalStorageSize   int64    `json:"total_storage_size"`
		AverageChunkSize   int      `json:"average_chunk_size"`
		QualityScore       *float64 `json:"quality_score,omitempty"`
	}
	if err == nil && latestVersion != nil {
		currentVersion = latestVersion.VersionString
		if latestVersion.Status == "completed" {
			qualityMetrics = &struct {
				TotalEmbeddings    int      `json:"total_embeddings"`
				TotalChunks        int      `json:"total_chunks"`
				EmbeddingDimension int      `json:"embedding_dimension"`
				TotalStorageSize   int64    `json:"total_storage_size"`
				AverageChunkSize   int      `json:"average_chunk_size"`
				QualityScore       *float64 `json:"quality_score,omitempty"`
			}{
				TotalEmbeddings:    latestVersion.TotalEmbeddings,
				TotalChunks:        latestVersion.TotalChunks,
				EmbeddingDimension: latestVersion.EmbeddingDimension,
				TotalStorageSize:   latestVersion.TotalStorageSize,
				AverageChunkSize:   latestVersion.AverageChunkSize,
				QualityScore:       latestVersion.QualityScore,
			}
		}
	}

	type KnowledgeBaseResponse struct {
		*models.KnowledgeBase
		TotalDatasets  int         `json:"total_datasets"`
		CurrentVersion string      `json:"current_version"`
		TotalVersions  int         `json:"total_versions"`
		LastUpdated    string      `json:"last_updated"`
		QualityMetrics interface{} `json:"quality_metrics,omitempty"`
	}

	response := KnowledgeBaseResponse{
		KnowledgeBase:  kb,
		TotalDatasets:  fileCount,
		CurrentVersion: currentVersion,
		TotalVersions:  versionCount,
		LastUpdated:    kb.UpdatedAt.Format("2006-01-02"),
		QualityMetrics: qualityMetrics,
	}

	c.JSON(http.StatusOK, response)
}

// CreateKnowledgeBaseRequest represents request to create a knowledge base
type CreateKnowledgeBaseRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreateKnowledgeBase creates a new knowledge base
func CreateKnowledgeBase(c *gin.Context) {
	// Get organization slug from path parameter
	orgSlug := c.Param("slug")

	if orgSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization slug is required"})
		return
	}

	var req CreateKnowledgeBaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Find organization by slug
	org, err := m.Organizations.FindBySlug(ctx, orgSlug)
	if err != nil {
		if err == models.ErrOrganizationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve organization"})
		return
	}

	// Create knowledge base
	kb, err := m.KnowledgeBases.Create(ctx, org.ID, req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create knowledge base"})
		return
	}

	c.JSON(http.StatusCreated, kb)
}

// UpdateKnowledgeBaseRequest represents request to update a knowledge base
type UpdateKnowledgeBaseRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

// UpdateKnowledgeBase updates a knowledge base
func UpdateKnowledgeBase(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	var req UpdateKnowledgeBaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	_, err = m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Update knowledge base
	kb, err := m.KnowledgeBases.Update(ctx, id, req.Name, req.Description, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update knowledge base"})
		return
	}

	c.JSON(http.StatusOK, kb)
}

// DeleteKnowledgeBase deletes a knowledge base and all related data
func DeleteKnowledgeBase(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	_, err = m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Step 1: Get all files before deleting to clean up physical storage
	files, err := m.KnowledgeBases.GetFilesByKnowledgeBaseID(ctx, id)
	if err == nil {
		// Delete individual files from storage
		for _, file := range files {
			if file.FilePath != "" {
				// Handle both absolute and relative paths
				filePath := file.FilePath
				if !filepath.IsAbs(filePath) {
					wd, err := os.Getwd()
					if err == nil {
						filePath = filepath.Join(wd, filePath)
					}
				}

				if err := os.Remove(filePath); err != nil {
					// Log but don't fail - file might already be deleted
					log.Printf("Warning: Failed to delete file %s: %v", filePath, err)
				}
			}
		}
	}

	// Step 2: Delete the entire upload directory for this knowledge base
	uploadDir := filepath.Join("uploads", "knowledge_bases", fmt.Sprintf("%d", id))
	if !filepath.IsAbs(uploadDir) {
		wd, err := os.Getwd()
		if err == nil {
			uploadDir = filepath.Join(wd, uploadDir)
		}
	}

	// Remove the entire directory and all its contents
	if err := os.RemoveAll(uploadDir); err != nil {
		// Log but don't fail - directory might not exist or already be deleted
		log.Printf("Warning: Failed to delete upload directory %s: %v", uploadDir, err)
	}

	// Step 3: Delete knowledge base from database
	// This will CASCADE DELETE:
	// - knowledge_base_files (via FK constraint)
	// - knowledge_base_versions (via FK constraint)
	// - knowledge_base_embeddings (via FK constraint on knowledge_base_id)
	// All embeddings are automatically deleted because:
	// 1. knowledge_base_embeddings -> knowledge_base_id FK has ON DELETE CASCADE
	// 2. knowledge_base_embeddings -> knowledge_base_version_id FK has ON DELETE CASCADE
	// 3. knowledge_base_embeddings -> knowledge_base_file_id FK has ON DELETE CASCADE
	err = m.KnowledgeBases.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete knowledge base"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Knowledge base and all related data deleted successfully"})
}

// GetKnowledgeBaseFiles retrieves all files for a knowledge base
func GetKnowledgeBaseFiles(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	files, err := m.KnowledgeBases.GetFilesByKnowledgeBaseID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
		return
	}

	// Transform to match frontend expectations
	type FileResponse struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Size       int64  `json:"size"`
		UploadedAt string `json:"uploaded_at"`
		Status     string `json:"status"`
	}

	response := make([]FileResponse, len(files))
	for i, file := range files {
		response[i] = FileResponse{
			ID:         fmt.Sprintf("%d", file.ID),
			Name:       file.Name,
			Size:       file.FileSize,
			UploadedAt: file.CreatedAt.Format("2006-01-02"),
			Status:     file.Status,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UploadKnowledgeBaseFiles handles file uploads for a knowledge base
func UploadKnowledgeBaseFiles(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	_, err = m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Parse multipart form
	err = c.Request.ParseMultipartForm(100 << 20) // 100 MB max
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	files := c.Request.MultipartForm.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files provided"})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := filepath.Join("uploads", "knowledge_bases", fmt.Sprintf("%d", id))
	err = os.MkdirAll(uploadDir, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	var uploadedFiles []*models.KnowledgeBaseFile

	// Process each file
	for _, fileHeader := range files {
		// Open uploaded file
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		// Generate unique filename
		timestamp := time.Now().UnixNano()
		baseName := filepath.Base(fileHeader.Filename)
		// Remove all extensions to avoid duplication (e.g., .xlsx.xlsx)
		baseNameWithoutExt := baseName
		for {
			ext := filepath.Ext(baseNameWithoutExt)
			if ext == "" {
				break
			}
			baseNameWithoutExt = baseNameWithoutExt[:len(baseNameWithoutExt)-len(ext)]
		}
		// Get the original extension from the original filename
		ext := filepath.Ext(fileHeader.Filename)
		filename := fmt.Sprintf("%d_%s%s", timestamp, sanitizeFilename(baseNameWithoutExt), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Create destination file
		dst, err := os.Create(filePath)
		if err != nil {
			continue
		}
		defer dst.Close()

		// Copy file content
		_, err = io.Copy(dst, file)
		if err != nil {
			os.Remove(filePath)
			continue
		}

		// Get file size
		fileInfo, _ := os.Stat(filePath)
		fileSize := fileInfo.Size()

		// Get MIME type
		mimeType := fileHeader.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		// Save file record to database
		kbFile, err := m.KnowledgeBases.AddFile(ctx, id, fileHeader.Filename, filePath, fileSize, mimeType)
		if err != nil {
			os.Remove(filePath)
			continue
		}

		uploadedFiles = append(uploadedFiles, kbFile)
	}

	if len(uploadedFiles) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upload any files"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Successfully uploaded %d file(s)", len(uploadedFiles)),
		"files":   uploadedFiles,
	})
}

// DeleteKnowledgeBaseFile deletes a file from a knowledge base
func DeleteKnowledgeBaseFile(c *gin.Context) {
	kbID := c.Param("id")
	fileID := c.Param("file_id")

	if kbID == "" || fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID and file ID are required"})
		return
	}

	fileIDInt, err := strconv.ParseInt(fileID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Get file to get file path
	file, err := m.KnowledgeBases.GetFileByID(ctx, fileIDInt)
	if err != nil {
		if err == models.ErrKnowledgeBaseFileNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		return
	}

	// Verify file belongs to knowledge base
	kbIDInt, _ := strconv.ParseInt(kbID, 10, 64)
	if file.KnowledgeBaseID != kbIDInt {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File does not belong to this knowledge base"})
		return
	}

	// Delete file from storage
	if file.FilePath != "" {
		os.Remove(file.FilePath)
	}

	// Delete file record from database
	err = m.KnowledgeBases.DeleteFile(ctx, fileIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// TrainKnowledgeBase starts training for a knowledge base and creates a new version
func TrainKnowledgeBase(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	kb, err := m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Check if knowledge base is already training
	if kb.Status == "training" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base is already being trained"})
		return
	}

	// Get all files for this knowledge base
	files, err := m.KnowledgeBases.GetFilesByKnowledgeBaseID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
		return
	}

	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot train knowledge base without files"})
		return
	}

	// Create new version (this also sets KB status to 'training')
	version, err := m.KnowledgeBases.CreateVersion(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create version: %v", err)})
		return
	}

	// Start training using queue system
	channelID := fmt.Sprintf("training_%s_%s", kbID, fmt.Sprintf("%d", version.ID))

	// Initialize queue and enqueue training jobs
	trainingQueue := queue.GetTrainingQueue()
	trainingQueue.SetModels(m)
	if err := trainingQueue.EnqueueTrainingJob(ctx, id, version.ID, files, channelID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to enqueue training: %v", err)})
		return
	}

	// Jobs will be processed automatically by the queue system

	c.JSON(http.StatusOK, gin.H{
		"message":        "Training started successfully",
		"version":        version,
		"knowledge_base": kb,
		"channel":        channelID, // WebSocket channel for progress updates
	})
}

// GetKnowledgeBaseVersions retrieves all versions for a knowledge base
func GetKnowledgeBaseVersions(c *gin.Context) {
	kbID := c.Param("id")
	if kbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID is required"})
		return
	}

	id, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	_, err = m.KnowledgeBases.FindByID(ctx, id)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Get all versions
	versions, err := m.KnowledgeBases.GetAllVersions(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve versions"})
		return
	}

	c.JSON(http.StatusOK, versions)
}

// DeleteKnowledgeBaseVersion deletes a specific version
func DeleteKnowledgeBaseVersion(c *gin.Context) {
	kbID := c.Param("id")
	versionID := c.Param("version_id")

	if kbID == "" || versionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Knowledge base ID and version ID are required"})
		return
	}

	kbIDInt, err := strconv.ParseInt(kbID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid knowledge base ID"})
		return
	}

	versionIDInt, err := strconv.ParseInt(versionID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid version ID"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Verify knowledge base exists
	_, err = m.KnowledgeBases.FindByID(ctx, kbIDInt)
	if err != nil {
		if err == models.ErrKnowledgeBaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge base not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve knowledge base"})
		return
	}

	// Get version to verify it exists and belongs to this KB
	version, err := m.KnowledgeBases.GetVersionByID(ctx, versionIDInt)
	if err != nil {
		if err == models.ErrKnowledgeBaseVersionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Version not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve version"})
		return
	}

	// Verify version belongs to this knowledge base
	if version.KnowledgeBaseID != kbIDInt {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Version does not belong to this knowledge base"})
		return
	}

	// Check if this is the only version
	versionCount, err := m.KnowledgeBases.GetVersionCount(ctx, kbIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check version count"})
		return
	}

	if versionCount <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete the only version"})
		return
	}

	// Check if this is the latest version (current version)
	latestVersion, err := m.KnowledgeBases.GetLatestVersion(ctx, kbIDInt)
	if err == nil && latestVersion != nil && latestVersion.ID == versionIDInt {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete the current version. Please train a new version first or select a different version as current."})
		return
	}

	// Prevent deletion if version is currently training
	if version.Status == "training" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete a version that is currently training"})
		return
	}

	// Delete the version (embeddings will be cascade deleted)
	err = m.KnowledgeBases.DeleteVersion(ctx, versionIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete version"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Version deleted successfully"})
}

// sanitizeFilename removes unsafe characters from filename
func sanitizeFilename(filename string) string {
	// Remove path separators and other unsafe characters
	filename = strings.ReplaceAll(filename, "/", "_")
	filename = strings.ReplaceAll(filename, "\\", "_")
	filename = strings.ReplaceAll(filename, "..", "_")
	filename = strings.ReplaceAll(filename, " ", "_")
	return filename
}
