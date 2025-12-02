-- Migration: create_knowledge_bases_table
-- Created: 2025-01-XX
-- Creates knowledge_bases table and knowledge_base_files table

-- Create knowledge_bases table
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id BIGINT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'training', 'error')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create knowledge_base_files table
CREATE TABLE IF NOT EXISTS knowledge_base_files (
    id BIGINT PRIMARY KEY,
    knowledge_base_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    mime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'error')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_org_id ON knowledge_bases(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_status ON knowledge_bases(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_kb_id ON knowledge_base_files(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_status ON knowledge_base_files(status);

-- Create foreign key constraints
ALTER TABLE knowledge_bases 
    ADD CONSTRAINT fk_knowledge_bases_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE knowledge_base_files 
    ADD CONSTRAINT fk_knowledge_base_files_knowledge_base 
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE;

