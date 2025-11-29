-- Rollback: Initialize database schema

-- Drop indexes
-- DROP INDEX IF EXISTS idx_messages_created_at;
-- DROP INDEX IF EXISTS idx_messages_session_id;
-- DROP INDEX IF EXISTS idx_chat_sessions_user_id;

-- Drop tables (in reverse order due to foreign keys)
-- DROP TABLE IF EXISTS messages;
-- DROP TABLE IF EXISTS chat_sessions;
-- DROP TABLE IF EXISTS users;

