-- Migration: Initialize database schema
-- Created: Initial migration

-- Create migrations tracking table (handled by migrate tool)
-- This file is for your application tables

-- Example: Users table (uncomment and modify as needed)
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Example: Chat sessions table (uncomment and modify as needed)
-- CREATE TABLE IF NOT EXISTS chat_sessions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     personality VARCHAR(100),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Example: Messages table (uncomment and modify as needed)
-- CREATE TABLE IF NOT EXISTS messages (
--     id SERIAL PRIMARY KEY,
--     session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
--     role VARCHAR(50) NOT NULL,
--     content TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create indexes for better query performance
-- CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

