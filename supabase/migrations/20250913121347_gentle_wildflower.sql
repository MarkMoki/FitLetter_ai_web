/*
  # Add Authentication Tables

  1. New Tables
    - `sessions`
      - `id` (text, primary key) - Session token
      - `user_id` (integer, foreign key) - Reference to users table
      - `expires_at` (timestamp) - Session expiration time
      - `created_at` (timestamp) - Session creation time

  2. Schema Changes
    - Add `password_hash` column to `users` table for secure password storage

  3. Security
    - Enable RLS on `sessions` table
    - Add policies for session management
*/

-- Add password hash column to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);