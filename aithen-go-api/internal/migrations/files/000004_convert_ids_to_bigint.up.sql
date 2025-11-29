-- Migration: convert_ids_to_bigint
-- Created: 2025-01-XX
-- Converts all ID columns from SERIAL/INTEGER to BIGINT for Snowflake IDs

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;

-- Convert users.id from SERIAL to BIGINT
ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE BIGINT;

-- Convert chats.id from SERIAL to BIGINT
ALTER TABLE IF EXISTS chats ALTER COLUMN id TYPE BIGINT;

-- Convert chats.user_id from INTEGER to BIGINT
ALTER TABLE IF EXISTS chats ALTER COLUMN user_id TYPE BIGINT;

-- Convert messages.id from SERIAL to BIGINT
ALTER TABLE IF EXISTS messages ALTER COLUMN id TYPE BIGINT;

-- Convert messages.chat_id from INTEGER to BIGINT
ALTER TABLE IF EXISTS messages ALTER COLUMN chat_id TYPE BIGINT;

-- Recreate foreign key constraints
ALTER TABLE IF EXISTS chats 
  ADD CONSTRAINT chats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS messages 
  ADD CONSTRAINT messages_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

