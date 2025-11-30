-- Rollback: update_users_table_for_organizations

-- Remove columns from users table
ALTER TABLE users 
    DROP COLUMN IF EXISTS profile_picture_url,
    DROP COLUMN IF EXISTS last_active_at;

