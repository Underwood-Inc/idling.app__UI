-- Remove Backward Compatibility and Complete ID-Based Migration
-- This migration removes all legacy user identification methods and completes 
-- the transition to database ID-only user identification system

-- ===============================
-- SAFETY CHECKS FIRST
-- ===============================

-- Ensure all submissions have user_id before proceeding
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM submissions WHERE user_id IS NULL LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot proceed: Found submissions without user_id. Run migration 0009 first and resolve orphaned submissions.';
    END IF;
    
    RAISE NOTICE 'Safety check passed: All submissions have user_id';
END $$;

-- ===============================
-- REMOVE LEGACY COLUMNS
-- ===============================

-- Remove author_provider_account_id from submissions (no longer needed)
ALTER TABLE submissions DROP COLUMN IF EXISTS author_provider_account_id;

-- Remove provider_account_id from users (OAuth data is in accounts table)
ALTER TABLE users DROP COLUMN IF EXISTS provider_account_id;

-- Log column removal
SELECT 'Removed legacy user identification columns' as cleanup_result;

-- ===============================
-- ENFORCE DATA INTEGRITY
-- ===============================

-- Make user_id NOT NULL (it should be populated by now)
ALTER TABLE submissions ALTER COLUMN user_id SET NOT NULL;

-- Update foreign key constraint to be more restrictive
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS fk_submissions_user_id;
ALTER TABLE submissions 
ADD CONSTRAINT fk_submissions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ===============================
-- CLEAN UP INDEXES
-- ===============================

-- Remove any indexes on dropped columns
DROP INDEX IF EXISTS idx_submissions_author_provider_account_id;
DROP INDEX IF EXISTS idx_users_provider_account_id;

-- Ensure optimal indexes for user_id only
DROP INDEX IF EXISTS idx_submissions_user_id;
CREATE INDEX idx_submissions_user_id ON submissions(user_id);

-- Compound index for user posts by date
CREATE INDEX IF NOT EXISTS idx_submissions_user_date_optimized 
ON submissions(user_id, submission_datetime DESC);

-- ===============================
-- UPDATE MATERIALIZED VIEW
-- ===============================

-- Refresh user_stats view to ensure it uses only user_id
REFRESH MATERIALIZED VIEW IF EXISTS user_stats;

-- ===============================
-- DATABASE COMMENTS
-- ===============================

COMMENT ON TABLE submissions IS 'User submissions - uses only user_id for identification (no legacy columns)';
COMMENT ON COLUMN submissions.user_id IS 'Foreign key to users.id - ONLY user identifier (OAuth provider independence achieved)';

COMMENT ON TABLE users IS 'Users table - OAuth provider data stored separately in accounts table';
COMMENT ON COLUMN users.id IS 'Primary user identifier - stable across all OAuth provider changes';
COMMENT ON COLUMN users.name IS 'Display name synchronized from OAuth providers (for display only)';

-- ===============================
-- VERIFICATION QUERIES
-- ===============================

-- Verify all submissions have user_id
SELECT 
  'Verification - Submissions with user_id: ' || COUNT(*) as user_id_count,
  'Total submissions: ' || (SELECT COUNT(*) FROM submissions) as total_count
FROM submissions 
WHERE user_id IS NOT NULL;

-- Verify foreign key constraint is working
SELECT 
  'Foreign key constraint active: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submissions_user_id' 
    AND table_name = 'submissions'
  ) THEN 'YES' ELSE 'NO' END as constraint_status;

-- Show table structure cleanup
SELECT 
  'Legacy columns removed: ' ||
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' 
    AND column_name IN ('author_provider_account_id')
  ) THEN 'YES' ELSE 'NO' END as cleanup_status;

-- ===============================
-- FINAL VERIFICATION
-- ===============================

-- Count users and their submissions to ensure referential integrity
SELECT 
  u.id as user_id,
  u.name as username,
  COUNT(s.submission_id) as submission_count
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id, u.name
ORDER BY submission_count DESC
LIMIT 10;

-- Success message
SELECT 'Backward compatibility removed - system now uses ONLY database user_id for all operations' as migration_result; 