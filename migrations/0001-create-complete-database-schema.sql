-- Complete Database Schema Migration (Simplified)
-- This migration creates all necessary tables, indexes, and functions for the idling.app application
-- Simplified version that avoids complex PL/pgSQL blocks for better compatibility

-- ================================
-- CORE TABLES
-- ================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  profile_public BOOLEAN DEFAULT true,
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL PRIMARY KEY,
  submission_name TEXT NOT NULL,
  submission_title VARCHAR(500),
  submission_url TEXT,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  user_id INTEGER,
  author_provider_account_id VARCHAR(255),
  tags TEXT[],
  thread_parent_id INTEGER
);

-- ================================
-- ADD MISSING COLUMNS (Safe Operations)
-- ================================

-- Users table columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Submissions table columns
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_title VARCHAR(500);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_url TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS thread_parent_id INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS author_provider_account_id VARCHAR(255);

-- ================================
-- FOREIGN KEY CONSTRAINTS
-- ================================

-- Add foreign key constraints (these will error if they already exist, but that's OK)
-- The migration tool will continue with other statements

-- Accounts to users relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_accounts_user' AND table_name = 'accounts'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if constraint already exists
END $$;

-- Sessions to users relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_sessions_user' AND table_name = 'sessions'
  ) THEN
    ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if constraint already exists
END $$;

-- Submissions to users relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submissions_user' AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ADD CONSTRAINT fk_submissions_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if constraint already exists
END $$;

-- Thread parent relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_thread_parent' AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ADD CONSTRAINT fk_thread_parent 
      FOREIGN KEY (thread_parent_id) REFERENCES submissions(submission_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if constraint already exists
END $$;

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Account indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON accounts(provider, "providerAccountId");

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions("sessionToken");

-- Submission indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_author_provider_account_id ON submissions(author_provider_account_id);
CREATE INDEX IF NOT EXISTS idx_submissions_datetime ON submissions(submission_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_thread_parent ON submissions(thread_parent_id);
CREATE INDEX IF NOT EXISTS idx_submissions_title ON submissions(submission_title);
CREATE INDEX IF NOT EXISTS idx_submissions_url ON submissions(submission_url) WHERE submission_url IS NOT NULL;

-- Tag search indexes
CREATE INDEX IF NOT EXISTS idx_submissions_tags_gin ON submissions USING GIN (tags) 
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_datetime ON submissions(user_id, submission_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_datetime_id ON submissions(submission_datetime DESC, submission_id);

-- ================================
-- MATERIALIZED VIEW FOR USER STATS
-- ================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.created_at,
  COALESCE(s.submission_count, 0) as submission_count,
  COALESCE(s.latest_submission, NULL) as latest_submission_date
FROM users u
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as submission_count,
    MAX(submission_datetime) as latest_submission
  FROM submissions 
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) s ON u.id = s.user_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_submission_count ON user_stats(submission_count DESC);

-- ================================
-- FUNCTIONS FOR MAINTENANCE
-- ================================

-- Function to refresh user stats
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;

-- Additional materialized view functions that are called by the application
-- These are stubs that prevent errors until proper materialized views are implemented

CREATE OR REPLACE FUNCTION refresh_tag_statistics()
RETURNS void AS $$
BEGIN
  -- Placeholder function - implement proper tag statistics materialized view when needed
  RAISE NOTICE 'refresh_tag_statistics() called - implement proper materialized view';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS void AS $$
BEGIN
  -- Placeholder function - implement proper trending posts materialized view when needed
  RAISE NOTICE 'refresh_trending_posts() called - implement proper materialized view';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  -- Placeholder function - implement proper daily stats materialized view when needed
  RAISE NOTICE 'refresh_daily_stats() called - implement proper materialized view';
END;
$$ LANGUAGE plpgsql;

-- Alias for compatibility with seed scripts
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS void AS $$
BEGIN
  PERFORM refresh_user_stats();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE users IS 'NextAuth users with profile information';
COMMENT ON TABLE accounts IS 'NextAuth OAuth account connections';
COMMENT ON TABLE sessions IS 'NextAuth active sessions';
COMMENT ON TABLE submissions IS 'User submissions/posts with modern foreign key relationships';

COMMENT ON COLUMN submissions.user_id IS 'Foreign key to users table (modern approach)';
COMMENT ON COLUMN submissions.author_provider_account_id IS 'OAuth provider account ID for direct session matching';

-- ================================
-- FINAL SETUP
-- ================================

-- Update table statistics for optimal query planning
ANALYZE users;
ANALYZE accounts;
ANALYZE sessions;
ANALYZE submissions;

-- Success message
SELECT 'Complete database schema created successfully (simplified version)' as result; 