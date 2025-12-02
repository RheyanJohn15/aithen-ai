-- Migration: create_knowledge_base_embeddings_table
-- Created: 2025-01-XX
-- Creates knowledge_base_embeddings table for storing vector embeddings

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_base_embeddings table
CREATE TABLE IF NOT EXISTS knowledge_base_embeddings (
    id BIGINT PRIMARY KEY,
    knowledge_base_id BIGINT NOT NULL,
    knowledge_base_version_id BIGINT NOT NULL,
    knowledge_base_file_id BIGINT NOT NULL,
    chunk_index INTEGER NOT NULL, -- Index of chunk within the file (0-based)
    chunk_text TEXT NOT NULL, -- The text content of this chunk
    embedding vector(1536), -- OpenAI-compatible embedding dimension (can be adjusted)
    metadata JSONB, -- Additional metadata (page number, section, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_kb_id ON knowledge_base_embeddings(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_version_id ON knowledge_base_embeddings(knowledge_base_version_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_file_id ON knowledge_base_embeddings(knowledge_base_file_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_kb_version ON knowledge_base_embeddings(knowledge_base_id, knowledge_base_version_id);

-- Create vector similarity search index (IVFFlat for faster approximate search)
-- Note: This index requires some data to be present. Consider creating it after initial data load.
-- CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_vector ON knowledge_base_embeddings 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create foreign key constraints
ALTER TABLE knowledge_base_embeddings
    ADD CONSTRAINT fk_knowledge_base_embeddings_knowledge_base
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE;

ALTER TABLE knowledge_base_embeddings
    ADD CONSTRAINT fk_knowledge_base_embeddings_version
    FOREIGN KEY (knowledge_base_version_id) REFERENCES knowledge_base_versions(id) ON DELETE CASCADE;

ALTER TABLE knowledge_base_embeddings
    ADD CONSTRAINT fk_knowledge_base_embeddings_file
    FOREIGN KEY (knowledge_base_file_id) REFERENCES knowledge_base_files(id) ON DELETE CASCADE;

-- Ensure unique chunks per file per version
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_unique_chunk 
ON knowledge_base_embeddings(knowledge_base_version_id, knowledge_base_file_id, chunk_index);

