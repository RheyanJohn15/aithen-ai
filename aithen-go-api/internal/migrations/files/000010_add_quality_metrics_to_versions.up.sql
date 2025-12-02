-- Migration: add_quality_metrics_to_versions
-- Created: 2025-01-XX
-- Adds quality metrics columns to knowledge_base_versions table

-- Add quality metrics columns
ALTER TABLE knowledge_base_versions
ADD COLUMN IF NOT EXISTS total_embeddings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chunks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS embedding_dimension INTEGER DEFAULT 1536,
ADD COLUMN IF NOT EXISTS total_storage_size BIGINT DEFAULT 0, -- in bytes
ADD COLUMN IF NOT EXISTS average_chunk_size INTEGER DEFAULT 0, -- average characters per chunk
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2) DEFAULT NULL; -- 0-100 quality score

-- Create index for quality metrics queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_versions_quality ON knowledge_base_versions(quality_score);

-- Update existing versions with calculated metrics
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
            (vector_dims(e.embedding) * 4) + -- 4 bytes per float32
            LENGTH(COALESCE(e.metadata::text, '{}'))
        ), 0)
        FROM knowledge_base_embeddings e 
        WHERE e.knowledge_base_version_id = v.id
    ),
    average_chunk_size = (
        SELECT COALESCE(AVG(LENGTH(e.chunk_text)), 0)::INTEGER
        FROM knowledge_base_embeddings e 
        WHERE e.knowledge_base_version_id = v.id
    )
WHERE v.status = 'completed';

