-- Rollback: create_chats_table

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_chat_id;
DROP INDEX IF EXISTS idx_chats_created_at;
DROP INDEX IF EXISTS idx_chats_user_id;

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;

