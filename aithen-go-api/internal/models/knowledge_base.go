package models

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aithen/go-api/internal/id"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrKnowledgeBaseNotFound        = errors.New("knowledge base not found")
	ErrKnowledgeBaseFileNotFound    = errors.New("knowledge base file not found")
	ErrKnowledgeBaseVersionNotFound = errors.New("knowledge base version not found")
)

// KnowledgeBase represents a knowledge base in the database
type KnowledgeBase struct {
	ID             int64     `json:"-" db:"id"`
	OrganizationID int64     `json:"-" db:"organization_id"`
	Name           string    `json:"name" db:"name"`
	Description    string    `json:"description" db:"description"`
	Status         string    `json:"status" db:"status"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (kb KnowledgeBase) MarshalJSON() ([]byte, error) {
	type Alias KnowledgeBase
	return json.Marshal(&struct {
		ID             string `json:"id"`
		OrganizationID string `json:"organization_id"`
		*Alias
	}{
		ID:             fmt.Sprintf("%d", kb.ID),
		OrganizationID: fmt.Sprintf("%d", kb.OrganizationID),
		Alias:          (*Alias)(&kb),
	})
}

// KnowledgeBaseFile represents a file in a knowledge base
type KnowledgeBaseFile struct {
	ID              int64     `json:"-" db:"id"`
	KnowledgeBaseID int64     `json:"-" db:"knowledge_base_id"`
	Name            string    `json:"name" db:"name"`
	FilePath        string    `json:"file_path" db:"file_path"`
	FileSize        int64     `json:"file_size" db:"file_size"`
	MimeType        string    `json:"mime_type" db:"mime_type"`
	Status          string    `json:"status" db:"status"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (kbf KnowledgeBaseFile) MarshalJSON() ([]byte, error) {
	type Alias KnowledgeBaseFile
	return json.Marshal(&struct {
		ID              string `json:"id"`
		KnowledgeBaseID string `json:"knowledge_base_id"`
		*Alias
	}{
		ID:              fmt.Sprintf("%d", kbf.ID),
		KnowledgeBaseID: fmt.Sprintf("%d", kbf.KnowledgeBaseID),
		Alias:           (*Alias)(&kbf),
	})
}

// KnowledgeBaseModel handles database operations for knowledge bases
type KnowledgeBaseModel struct {
	DB *pgxpool.Pool
}

// NewKnowledgeBaseModel creates a new KnowledgeBaseModel instance
func NewKnowledgeBaseModel(db *pgxpool.Pool) *KnowledgeBaseModel {
	return &KnowledgeBaseModel{DB: db}
}

// Create creates a new knowledge base
func (m *KnowledgeBaseModel) Create(ctx context.Context, organizationID int64, name, description string) (*KnowledgeBase, error) {
	kbID := id.Generate()

	query := `
		INSERT INTO knowledge_bases (id, organization_id, name, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
		RETURNING id, organization_id, name, description, status, created_at, updated_at
	`

	var kb KnowledgeBase
	err := m.DB.QueryRow(ctx, query, kbID, organizationID, name, description).Scan(
		&kb.ID, &kb.OrganizationID, &kb.Name, &kb.Description, &kb.Status, &kb.CreatedAt, &kb.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create knowledge base: %w", err)
	}

	return &kb, nil
}

// FindByID finds a knowledge base by ID
func (m *KnowledgeBaseModel) FindByID(ctx context.Context, id int64) (*KnowledgeBase, error) {
	query := `
		SELECT id, organization_id, name, description, status, created_at, updated_at
		FROM knowledge_bases
		WHERE id = $1
	`

	var kb KnowledgeBase
	err := m.DB.QueryRow(ctx, query, id).Scan(
		&kb.ID, &kb.OrganizationID, &kb.Name, &kb.Description, &kb.Status, &kb.CreatedAt, &kb.UpdatedAt,
	)

	if err != nil {
		return nil, ErrKnowledgeBaseNotFound
	}

	return &kb, nil
}

// FindByOrganizationID finds all knowledge bases for an organization
func (m *KnowledgeBaseModel) FindByOrganizationID(ctx context.Context, organizationID int64) ([]*KnowledgeBase, error) {
	query := `
		SELECT id, organization_id, name, description, status, created_at, updated_at
		FROM knowledge_bases
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`

	rows, err := m.DB.Query(ctx, query, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var kbs []*KnowledgeBase
	for rows.Next() {
		var kb KnowledgeBase
		err := rows.Scan(
			&kb.ID, &kb.OrganizationID, &kb.Name, &kb.Description, &kb.Status, &kb.CreatedAt, &kb.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		kbs = append(kbs, &kb)
	}

	return kbs, rows.Err()
}

// Update updates a knowledge base
func (m *KnowledgeBaseModel) Update(ctx context.Context, id int64, name, description, status string) (*KnowledgeBase, error) {
	query := `
		UPDATE knowledge_bases
		SET name = $1, description = $2, status = COALESCE(NULLIF($3, ''), status), updated_at = NOW()
		WHERE id = $4
		RETURNING id, organization_id, name, description, status, created_at, updated_at
	`

	var kb KnowledgeBase
	err := m.DB.QueryRow(ctx, query, name, description, status, id).Scan(
		&kb.ID, &kb.OrganizationID, &kb.Name, &kb.Description, &kb.Status, &kb.CreatedAt, &kb.UpdatedAt,
	)

	if err != nil {
		return nil, ErrKnowledgeBaseNotFound
	}

	return &kb, nil
}

// Delete deletes a knowledge base by ID (cascade deletes files)
func (m *KnowledgeBaseModel) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM knowledge_bases WHERE id = $1`
	_, err := m.DB.Exec(ctx, query, id)
	return err
}

// AddFile adds a file to a knowledge base
func (m *KnowledgeBaseModel) AddFile(ctx context.Context, knowledgeBaseID int64, name, filePath string, fileSize int64, mimeType string) (*KnowledgeBaseFile, error) {
	fileID := id.Generate()

	query := `
		INSERT INTO knowledge_base_files (id, knowledge_base_id, name, file_path, file_size, mime_type, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, 'ready', NOW(), NOW())
		RETURNING id, knowledge_base_id, name, file_path, file_size, mime_type, status, created_at, updated_at
	`

	var file KnowledgeBaseFile
	err := m.DB.QueryRow(ctx, query, fileID, knowledgeBaseID, name, filePath, fileSize, mimeType).Scan(
		&file.ID, &file.KnowledgeBaseID, &file.Name, &file.FilePath, &file.FileSize, &file.MimeType, &file.Status, &file.CreatedAt, &file.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to add file: %w", err)
	}

	return &file, nil
}

// GetFilesByKnowledgeBaseID gets all files for a knowledge base
func (m *KnowledgeBaseModel) GetFilesByKnowledgeBaseID(ctx context.Context, knowledgeBaseID int64) ([]*KnowledgeBaseFile, error) {
	query := `
		SELECT id, knowledge_base_id, name, file_path, file_size, mime_type, status, created_at, updated_at
		FROM knowledge_base_files
		WHERE knowledge_base_id = $1
		ORDER BY created_at DESC
	`

	rows, err := m.DB.Query(ctx, query, knowledgeBaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []*KnowledgeBaseFile
	for rows.Next() {
		var file KnowledgeBaseFile
		err := rows.Scan(
			&file.ID, &file.KnowledgeBaseID, &file.Name, &file.FilePath, &file.FileSize, &file.MimeType, &file.Status, &file.CreatedAt, &file.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		files = append(files, &file)
	}

	return files, rows.Err()
}

// DeleteFile deletes a file from a knowledge base
func (m *KnowledgeBaseModel) DeleteFile(ctx context.Context, fileID int64) error {
	query := `DELETE FROM knowledge_base_files WHERE id = $1`
	_, err := m.DB.Exec(ctx, query, fileID)
	return err
}

// GetFileByID gets a file by ID
func (m *KnowledgeBaseModel) GetFileByID(ctx context.Context, fileID int64) (*KnowledgeBaseFile, error) {
	query := `
		SELECT id, knowledge_base_id, name, file_path, file_size, mime_type, status, created_at, updated_at
		FROM knowledge_base_files
		WHERE id = $1
	`

	var file KnowledgeBaseFile
	err := m.DB.QueryRow(ctx, query, fileID).Scan(
		&file.ID, &file.KnowledgeBaseID, &file.Name, &file.FilePath, &file.FileSize, &file.MimeType, &file.Status, &file.CreatedAt, &file.UpdatedAt,
	)

	if err != nil {
		return nil, ErrKnowledgeBaseFileNotFound
	}

	return &file, nil
}

// GetFileCount returns the count of files for a knowledge base
func (m *KnowledgeBaseModel) GetFileCount(ctx context.Context, knowledgeBaseID int64) (int, error) {
	query := `SELECT COUNT(*) FROM knowledge_base_files WHERE knowledge_base_id = $1`
	var count int
	err := m.DB.QueryRow(ctx, query, knowledgeBaseID).Scan(&count)
	return count, err
}

// KnowledgeBaseVersion represents a version of a knowledge base
type KnowledgeBaseVersion struct {
	ID                  int64      `json:"-" db:"id"`
	KnowledgeBaseID     int64      `json:"-" db:"knowledge_base_id"`
	VersionNumber       int        `json:"version_number" db:"version_number"`
	VersionString       string     `json:"version_string" db:"version_string"`
	Status              string     `json:"status" db:"status"`
	TrainingStartedAt   time.Time  `json:"training_started_at" db:"training_started_at"`
	TrainingCompletedAt *time.Time `json:"training_completed_at,omitempty" db:"training_completed_at"`
	TotalEmbeddings     int        `json:"total_embeddings" db:"total_embeddings"`
	TotalChunks         int        `json:"total_chunks" db:"total_chunks"`
	EmbeddingDimension  int        `json:"embedding_dimension" db:"embedding_dimension"`
	TotalStorageSize    int64      `json:"total_storage_size" db:"total_storage_size"`
	AverageChunkSize    int        `json:"average_chunk_size" db:"average_chunk_size"`
	QualityScore        *float64   `json:"quality_score,omitempty" db:"quality_score"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (kbv KnowledgeBaseVersion) MarshalJSON() ([]byte, error) {
	type Alias KnowledgeBaseVersion
	return json.Marshal(&struct {
		ID              string `json:"id"`
		KnowledgeBaseID string `json:"knowledge_base_id"`
		*Alias
	}{
		ID:              fmt.Sprintf("%d", kbv.ID),
		KnowledgeBaseID: fmt.Sprintf("%d", kbv.KnowledgeBaseID),
		Alias:           (*Alias)(&kbv),
	})
}

// CreateVersion creates a new version for a knowledge base
func (m *KnowledgeBaseModel) CreateVersion(ctx context.Context, knowledgeBaseID int64) (*KnowledgeBaseVersion, error) {
	// Get the latest version number
	var latestVersion int
	query := `SELECT COALESCE(MAX(version_number), 0) FROM knowledge_base_versions WHERE knowledge_base_id = $1`
	err := m.DB.QueryRow(ctx, query, knowledgeBaseID).Scan(&latestVersion)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest version: %w", err)
	}

	// Increment version number
	newVersionNumber := latestVersion + 1
	versionString := fmt.Sprintf("v%d.0.0", newVersionNumber)

	versionID := id.Generate()

	insertQuery := `
		INSERT INTO knowledge_base_versions (id, knowledge_base_id, version_number, version_string, status, training_started_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'training', NOW(), NOW(), NOW())
		RETURNING id, knowledge_base_id, version_number, version_string, status, training_started_at, training_completed_at, 
		          total_embeddings, total_chunks, embedding_dimension, total_storage_size, average_chunk_size, quality_score, 
		          created_at, updated_at
	`

	var version KnowledgeBaseVersion
	var trainingCompletedAt *time.Time
	err = m.DB.QueryRow(ctx, insertQuery, versionID, knowledgeBaseID, newVersionNumber, versionString).Scan(
		&version.ID, &version.KnowledgeBaseID, &version.VersionNumber, &version.VersionString,
		&version.Status, &version.TrainingStartedAt, &trainingCompletedAt,
		&version.TotalEmbeddings, &version.TotalChunks, &version.EmbeddingDimension, &version.TotalStorageSize,
		&version.AverageChunkSize, &version.QualityScore, &version.CreatedAt, &version.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}

	version.TrainingCompletedAt = trainingCompletedAt

	// Update knowledge base status to 'training'
	updateKBQuery := `UPDATE knowledge_bases SET status = 'training', updated_at = NOW() WHERE id = $1`
	_, err = m.DB.Exec(ctx, updateKBQuery, knowledgeBaseID)
	if err != nil {
		return nil, fmt.Errorf("failed to update knowledge base status: %w", err)
	}

	return &version, nil
}

// GetLatestVersion gets the latest version for a knowledge base
func (m *KnowledgeBaseModel) GetLatestVersion(ctx context.Context, knowledgeBaseID int64) (*KnowledgeBaseVersion, error) {
	query := `
		SELECT id, knowledge_base_id, version_number, version_string, status, training_started_at, training_completed_at,
		       total_embeddings, total_chunks, embedding_dimension, total_storage_size, average_chunk_size, quality_score,
		       created_at, updated_at
		FROM knowledge_base_versions
		WHERE knowledge_base_id = $1
		ORDER BY version_number DESC
		LIMIT 1
	`

	var version KnowledgeBaseVersion
	var trainingCompletedAt *time.Time
	err := m.DB.QueryRow(ctx, query, knowledgeBaseID).Scan(
		&version.ID, &version.KnowledgeBaseID, &version.VersionNumber, &version.VersionString,
		&version.Status, &version.TrainingStartedAt, &trainingCompletedAt,
		&version.TotalEmbeddings, &version.TotalChunks, &version.EmbeddingDimension, &version.TotalStorageSize,
		&version.AverageChunkSize, &version.QualityScore, &version.CreatedAt, &version.UpdatedAt,
	)
	if err != nil {
		return nil, ErrKnowledgeBaseVersionNotFound
	}

	version.TrainingCompletedAt = trainingCompletedAt
	return &version, nil
}

// GetVersionCount returns the total number of versions for a knowledge base
func (m *KnowledgeBaseModel) GetVersionCount(ctx context.Context, knowledgeBaseID int64) (int, error) {
	query := `SELECT COUNT(*) FROM knowledge_base_versions WHERE knowledge_base_id = $1`
	var count int
	err := m.DB.QueryRow(ctx, query, knowledgeBaseID).Scan(&count)
	return count, err
}

// GetAllVersions gets all versions for a knowledge base, ordered by version number descending
func (m *KnowledgeBaseModel) GetAllVersions(ctx context.Context, knowledgeBaseID int64) ([]*KnowledgeBaseVersion, error) {
	query := `
		SELECT id, knowledge_base_id, version_number, version_string, status, training_started_at, training_completed_at,
		       total_embeddings, total_chunks, embedding_dimension, total_storage_size, average_chunk_size, quality_score,
		       created_at, updated_at
		FROM knowledge_base_versions
		WHERE knowledge_base_id = $1
		ORDER BY version_number DESC
	`

	rows, err := m.DB.Query(ctx, query, knowledgeBaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []*KnowledgeBaseVersion
	for rows.Next() {
		var version KnowledgeBaseVersion
		var trainingCompletedAt *time.Time
		err := rows.Scan(
			&version.ID, &version.KnowledgeBaseID, &version.VersionNumber, &version.VersionString,
			&version.Status, &version.TrainingStartedAt, &trainingCompletedAt,
			&version.TotalEmbeddings, &version.TotalChunks, &version.EmbeddingDimension, &version.TotalStorageSize,
			&version.AverageChunkSize, &version.QualityScore, &version.CreatedAt, &version.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		version.TrainingCompletedAt = trainingCompletedAt
		versions = append(versions, &version)
	}

	return versions, rows.Err()
}

// DeleteVersion deletes a version by ID
func (m *KnowledgeBaseModel) DeleteVersion(ctx context.Context, versionID int64) error {
	query := `DELETE FROM knowledge_base_versions WHERE id = $1`
	_, err := m.DB.Exec(ctx, query, versionID)
	return err
}

// GetVersionByID gets a specific version by ID
func (m *KnowledgeBaseModel) GetVersionByID(ctx context.Context, versionID int64) (*KnowledgeBaseVersion, error) {
	query := `
		SELECT id, knowledge_base_id, version_number, version_string, status, training_started_at, training_completed_at,
		       total_embeddings, total_chunks, embedding_dimension, total_storage_size, average_chunk_size, quality_score,
		       created_at, updated_at
		FROM knowledge_base_versions
		WHERE id = $1
	`

	var version KnowledgeBaseVersion
	var trainingCompletedAt *time.Time
	err := m.DB.QueryRow(ctx, query, versionID).Scan(
		&version.ID, &version.KnowledgeBaseID, &version.VersionNumber, &version.VersionString,
		&version.Status, &version.TrainingStartedAt, &trainingCompletedAt,
		&version.TotalEmbeddings, &version.TotalChunks, &version.EmbeddingDimension, &version.TotalStorageSize,
		&version.AverageChunkSize, &version.QualityScore, &version.CreatedAt, &version.UpdatedAt,
	)
	if err != nil {
		return nil, ErrKnowledgeBaseVersionNotFound
	}

	version.TrainingCompletedAt = trainingCompletedAt
	return &version, nil
}

// UpdateVersionStatus updates the status of a version
func (m *KnowledgeBaseModel) UpdateVersionStatus(ctx context.Context, versionID int64, status string, completedAt *time.Time) error {
	query := `
		UPDATE knowledge_base_versions
		SET status = $1, training_completed_at = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err := m.DB.Exec(ctx, query, status, completedAt, versionID)
	return err
}

// UpdateVersionQualityMetrics calculates and updates quality metrics for a version
func (m *KnowledgeBaseModel) UpdateVersionQualityMetrics(ctx context.Context, versionID int64) error {
	// Calculate metrics from embeddings
	query := `
		UPDATE knowledge_base_versions v
		SET 
			total_embeddings = (
				SELECT COUNT(*) 
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
			),
			total_chunks = (
				SELECT COUNT(DISTINCT (e.knowledge_base_file_id, e.chunk_index))
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
			),
			embedding_dimension = COALESCE((
				SELECT vector_dims(e.embedding)
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
				LIMIT 1
			), 1536),
			total_storage_size = (
				SELECT COALESCE(SUM(
					LENGTH(e.chunk_text) + 
					(vector_dims(e.embedding) * 4) +
					LENGTH(COALESCE(e.metadata::text, '{}'))
				), 0)
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
			),
			average_chunk_size = (
				SELECT COALESCE(AVG(LENGTH(e.chunk_text))::INTEGER, 0)
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
			),
			quality_score = (
				SELECT CASE 
					WHEN COUNT(*) = 0 THEN NULL
					ELSE LEAST(100, GREATEST(0,
						-- Base score from chunk quality (average chunk size vs optimal)
						LEAST(50, (AVG(LENGTH(e.chunk_text)) / 1000.0 * 50)) +
						-- Score from embedding coverage (files processed)
						LEAST(30, (COUNT(DISTINCT e.knowledge_base_file_id) * 5.0)) +
						-- Score from chunk diversity
						LEAST(20, (COUNT(DISTINCT e.chunk_index) / GREATEST(COUNT(*), 1) * 20.0))
					))
				END
				FROM knowledge_base_embeddings e 
				WHERE e.knowledge_base_version_id = v.id
			),
			updated_at = NOW()
		WHERE v.id = $1
	`
	_, err := m.DB.Exec(ctx, query, versionID)
	return err
}

// KnowledgeBaseEmbedding represents a vector embedding in the database
type KnowledgeBaseEmbedding struct {
	ID                     int64     `json:"-" db:"id"`
	KnowledgeBaseID        int64     `json:"-" db:"knowledge_base_id"`
	KnowledgeBaseVersionID int64     `json:"-" db:"knowledge_base_version_id"`
	KnowledgeBaseFileID    int64     `json:"-" db:"knowledge_base_file_id"`
	ChunkIndex             int       `json:"chunk_index" db:"chunk_index"`
	ChunkText              string    `json:"chunk_text" db:"chunk_text"`
	Embedding              []float32 `json:"-" db:"embedding"`       // Vector embedding
	Metadata               string    `json:"metadata" db:"metadata"` // JSONB stored as string
	CreatedAt              time.Time `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time `json:"updated_at" db:"updated_at"`
}

// StoreEmbedding stores an embedding in the database
func (m *KnowledgeBaseModel) StoreEmbedding(
	ctx context.Context,
	knowledgeBaseID, versionID, fileID int64,
	chunkIndex int,
	chunkText string,
	embedding []float32,
	metadata map[string]interface{},
) error {
	embeddingID := id.Generate()

	// Convert metadata to JSON string
	metadataJSON := "{}"
	if len(metadata) > 0 {
		metadataBytes, err := json.Marshal(metadata)
		if err == nil {
			metadataJSON = string(metadataBytes)
		}
	}

	// Convert embedding to PostgreSQL vector format: [1,2,3,...]
	embeddingStr := formatVector(embedding)

	query := `
		INSERT INTO knowledge_base_embeddings (
			id, knowledge_base_id, knowledge_base_version_id, knowledge_base_file_id,
			chunk_index, chunk_text, embedding, metadata, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb, NOW(), NOW())
		ON CONFLICT (knowledge_base_version_id, knowledge_base_file_id, chunk_index) 
		DO UPDATE SET
			chunk_text = EXCLUDED.chunk_text,
			embedding = EXCLUDED.embedding,
			metadata = EXCLUDED.metadata,
			updated_at = NOW()
	`

	_, err := m.DB.Exec(ctx, query, embeddingID, knowledgeBaseID, versionID, fileID,
		chunkIndex, chunkText, embeddingStr, metadataJSON)
	return err
}

// formatVector converts []float32 to PostgreSQL vector string format
func formatVector(vec []float32) string {
	if len(vec) == 0 {
		return "[]"
	}
	str := "["
	for i, v := range vec {
		if i > 0 {
			str += ","
		}
		str += fmt.Sprintf("%.6f", v)
	}
	str += "]"
	return str
}
