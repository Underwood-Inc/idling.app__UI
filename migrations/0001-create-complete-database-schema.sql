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

-- Submissions table (modern schema with providerAccountId for direct auth matching)
CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL PRIMARY KEY,
  submission_name TEXT NOT NULL,
  submission_title VARCHAR(500),
  submission_url TEXT,
  user_id INTEGER NOT NULL,
  author_provider_account_id VARCHAR(255) NOT NULL,
  tags TEXT[],
  thread_parent_id INTEGER,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ensure required columns exist (in case tables existed before)

-- Add missing columns to users table
DO $$ 
BEGIN
  -- Add emailVerified if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'emailVerified'
  ) THEN
    ALTER TABLE users ADD COLUMN "emailVerified" TIMESTAMPTZ;
  END IF;

  -- Add image if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'image'
  ) THEN
    ALTER TABLE users ADD COLUMN image TEXT;
  END IF;

  -- Add profile_public if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_public'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_public BOOLEAN DEFAULT true;
  END IF;

  -- Add bio if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
  END IF;

  -- Add location if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users ADD COLUMN location VARCHAR(255);
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add missing columns to submissions table
DO $$ 
DECLARE
  first_user_id INTEGER;
BEGIN
  -- Add submission_title if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'submission_title'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submission_title VARCHAR(500);
  END IF;

  -- Add submission_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'submission_url'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submission_url TEXT;
  END IF;

  -- Add tags if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'tags'
  ) THEN
    ALTER TABLE submissions ADD COLUMN tags TEXT[];
  END IF;

  -- Add thread_parent_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'thread_parent_id'
  ) THEN
    ALTER TABLE submissions ADD COLUMN thread_parent_id INTEGER;
  END IF;

  -- Add submission_datetime if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'submission_datetime'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;
  END IF;

  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'user_id'
  ) THEN
    -- Add user_id column as nullable first
    ALTER TABLE submissions ADD COLUMN user_id INTEGER;
    
    -- Get the first user ID (create a default user if none exist)
    SELECT id INTO first_user_id FROM users LIMIT 1;
    
    IF first_user_id IS NULL THEN
      -- Create a default system user if no users exist
      INSERT INTO users (name, email) 
      VALUES ('System', 'system@idling.app') 
      RETURNING id INTO first_user_id;
    END IF;
    
    -- Update existing submissions to reference the first user
    UPDATE submissions SET user_id = first_user_id WHERE user_id IS NULL;
    
    -- Make the column NOT NULL after updating existing data
    ALTER TABLE submissions ALTER COLUMN user_id SET NOT NULL;
  END IF;

  -- Add author_provider_account_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'author_provider_account_id'
  ) THEN
    -- Add author_provider_account_id column as nullable first
    ALTER TABLE submissions ADD COLUMN author_provider_account_id VARCHAR(255);
    
    -- Update existing submissions to get providerAccountId from linked accounts
    UPDATE submissions SET author_provider_account_id = (
      SELECT a."providerAccountId" 
      FROM users u 
      JOIN accounts a ON u.id = a."userId" 
      WHERE u.id = submissions.user_id 
      LIMIT 1
    ) WHERE author_provider_account_id IS NULL;
    
    -- Make the column NOT NULL after updating existing data
    ALTER TABLE submissions ALTER COLUMN author_provider_account_id SET NOT NULL;
  END IF;
END $$;

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
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
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
SELECT 'Complete database schema created successfully' as result; 