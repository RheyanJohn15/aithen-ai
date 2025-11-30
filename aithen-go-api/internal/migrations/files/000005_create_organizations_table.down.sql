-- Rollback: create_organizations_table

-- Drop foreign key constraints
ALTER TABLE IF EXISTS organization_members DROP CONSTRAINT IF EXISTS fk_organization_members_organization;
ALTER TABLE IF EXISTS organization_members DROP CONSTRAINT IF EXISTS fk_organization_members_user;

-- Drop indexes
DROP INDEX IF EXISTS idx_organizations_slug;
DROP INDEX IF EXISTS idx_organization_members_org_id;
DROP INDEX IF EXISTS idx_organization_members_user_id;
DROP INDEX IF EXISTS idx_organization_members_role;
DROP INDEX IF EXISTS idx_organization_members_status;

-- Drop tables
DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS organizations;

