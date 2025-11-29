-- Rollback: convert_ids_to_bigint

-- Drop foreign key constraints
ALTER TABLE IF EXISTS chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;

-- Convert back to INTEGER (note: this may fail if values exceed INTEGER range)
ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE INTEGER;
ALTER TABLE IF EXISTS chats ALTER COLUMN id TYPE INTEGER;
ALTER TABLE IF EXISTS chats ALTER COLUMN user_id TYPE INTEGER;
ALTER TABLE IF EXISTS messages ALTER COLUMN id TYPE INTEGER;
ALTER TABLE IF EXISTS messages ALTER COLUMN chat_id TYPE INTEGER;

-- Recreate foreign key constraints
ALTER TABLE IF EXISTS chats 
  ADD CONSTRAINT chats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS messages 
  ADD CONSTRAINT messages_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

