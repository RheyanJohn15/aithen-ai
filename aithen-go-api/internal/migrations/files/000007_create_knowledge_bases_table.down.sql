-- Migration: create_knowledge_bases_table (rollback)
-- Drops knowledge_bases and knowledge_base_files tables

-- Drop foreign key constraints first
ALTER TABLE knowledge_base_files 
    DROP CONSTRAINT IF EXISTS fk_knowledge_base_files_knowledge_base;

ALTER TABLE knowledge_bases 
    DROP CONSTRAINT IF EXISTS fk_knowledge_bases_organization;

-- Drop indexes
DROP INDEX IF EXISTS idx_knowledge_base_files_status;
DROP INDEX IF EXISTS idx_knowledge_base_files_kb_id;
DROP INDEX IF EXISTS idx_knowledge_bases_status;
DROP INDEX IF EXISTS idx_knowledge_bases_org_id;

-- Drop tables
DROP TABLE IF EXISTS knowledge_base_files;
DROP TABLE IF EXISTS knowledge_bases;

