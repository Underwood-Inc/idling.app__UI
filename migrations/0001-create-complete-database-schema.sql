-- Migration: Create complete database schema
-- This migration consolidates all previous migrations into a single, clean schema
-- Designed for NextAuth integration with modern user management

-- ================================
-- CORE TABLES
-- ================================

-- Users table (NextAuth compatible)
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

-- NextAuth accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
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
  UNIQUE(provider, "providerAccountId")
);

-- NextAuth sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);

-- NextAuth verification tokens
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Submissions table (modern schema with user_id foreign key)
CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL PRIMARY KEY,
  submission_name TEXT NOT NULL,
  submission_title VARCHAR(500),
  submission_url TEXT,
  user_id INTEGER NOT NULL,
  tags TEXT[],
  thread_parent_id INTEGER,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ================================
-- FOREIGN KEY CONSTRAINTS
-- ================================

-- Link accounts to users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_accounts_user' 
    AND table_name = 'accounts'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Link sessions to users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_sessions_user' 
    AND table_name = 'sessions'
  ) THEN
    ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Link submissions to users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submissions_user' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ADD CONSTRAINT fk_submissions_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Thread parent relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_thread_parent' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ADD CONSTRAINT fk_thread_parent 
      FOREIGN KEY (thread_parent_id) REFERENCES submissions(submission_id);
  END IF;
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

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE users IS 'NextAuth users with profile information';
COMMENT ON TABLE accounts IS 'NextAuth OAuth account connections';
COMMENT ON TABLE sessions IS 'NextAuth active sessions';
COMMENT ON TABLE submissions IS 'User submissions/posts with modern foreign key relationships';

COMMENT ON COLUMN submissions.user_id IS 'Foreign key to users table (modern approach)';

-- ================================
-- FINAL SETUP
-- ================================

-- Update table statistics for optimal query planning
ANALYZE users;
ANALYZE accounts;
ANALYZE sessions;
ANALYZE submissions;

-- Success message
SELECT 'Complete database schema created successfully' as result; 