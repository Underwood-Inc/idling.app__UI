-- Migration: Create core database tables

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255) NOT NULL,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  tags TEXT[],
  thread_parent_id INTEGER,
  CONSTRAINT fk_thread_parent FOREIGN KEY (thread_parent_id) REFERENCES submissions(submission_id)
);

-- Create index on thread_parent_id for better performance
CREATE INDEX IF NOT EXISTS idx_thread_parent_id ON submissions(thread_parent_id);

-- Create NextAuth required tables
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  PRIMARY KEY (id)
);

-- Add foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS fk_accounts_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT IF NOT EXISTS fk_sessions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE; 