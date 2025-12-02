-- Migration: create_knowledge_base_versions_table
-- Created: 2025-01-XX
-- Creates knowledge_base_versions table for tracking training versions

-- Create knowledge_base_versions table
CREATE TABLE IF NOT EXISTS knowledge_base_versions (
    id BIGINT PRIMARY KEY,
    knowledge_base_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL, -- Sequential version number (1, 2, 3, ...)
    version_string VARCHAR(50) NOT NULL, -- Human-readable version (v1.0.0, v2.0.0, etc.)
    status VARCHAR(50) NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'completed', 'failed')),
    training_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    training_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_base_id, version_number) -- Ensure unique version numbers per KB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_versions_kb_id ON knowledge_base_versions(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_versions_status ON knowledge_base_versions(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_versions_version_number ON knowledge_base_versions(knowledge_base_id, version_number DESC);

-- Create foreign key constraint
ALTER TABLE knowledge_base_versions
    ADD CONSTRAINT fk_knowledge_base_versions_knowledge_base
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE;

