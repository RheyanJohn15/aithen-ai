-- Migration: update_users_table_for_organizations
-- Created: 2025-01-XX
-- Updates users table to support roles, status, profile picture, and last active tracking

-- Add new columns to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- Note: role and status are stored in organization_members table, not users table
-- This allows users to have different roles in different organizations

