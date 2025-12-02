-- Migration: add_quality_metrics_to_versions (rollback)
-- Removes quality metrics columns from knowledge_base_versions table

ALTER TABLE knowledge_base_versions
DROP COLUMN IF EXISTS total_embeddings,
DROP COLUMN IF EXISTS total_chunks,
DROP COLUMN IF EXISTS embedding_dimension,
DROP COLUMN IF EXISTS total_storage_size,
DROP COLUMN IF EXISTS average_chunk_size,
DROP COLUMN IF EXISTS quality_score;

DROP INDEX IF EXISTS idx_knowledge_base_versions_quality;

