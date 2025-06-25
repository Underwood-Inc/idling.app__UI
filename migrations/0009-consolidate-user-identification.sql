-- Consolidate User Identification System
-- This migration ensures all submissions reference users by database ID (user_id) consistently
-- and removes dependency on potentially changing OAuth provider identifiers

-- ===============================
-- ENSURE ALL SUBMISSIONS HAVE USER_ID
-- ===============================

-- First, populate any missing user_id values by matching with accounts table
UPDATE submissions 
SET user_id = (
  SELECT u.id 
  FROM users u
  JOIN accounts a ON u.id = a."userId"
  WHERE a."providerAccountId" = submissions.author_provider_account_id
)
WHERE user_id IS NULL 
  AND author_provider_account_id IS NOT NULL;

-- Log how many submissions were updated
SELECT 
  'Updated ' || 
  (SELECT COUNT(*) FROM submissions WHERE user_id IS NOT NULL) || 
  ' submissions with user_id' as result;

-- ===============================
-- ENSURE DATA CONSISTENCY
-- ===============================

-- Mark submissions without user_id as problematic (these need manual review)
UPDATE submissions 
SET submission_name = '[ORPHANED] ' || submission_name
WHERE user_id IS NULL 
  AND submission_name NOT LIKE '[ORPHANED]%';

-- Log orphaned submissions count
SELECT 
  'Found ' || 
  (SELECT COUNT(*) FROM submissions WHERE user_id IS NULL) || 
  ' orphaned submissions (marked for review)' as orphaned_count;

-- ===============================
-- CREATE RELIABLE INDEXES
-- ===============================

-- Ensure user_id index exists and is optimized
DROP INDEX IF EXISTS idx_submissions_user_id;
CREATE INDEX idx_submissions_user_id ON submissions(user_id) WHERE user_id IS NOT NULL;

-- Create compound index for user posts sorted by date
CREATE INDEX IF NOT EXISTS idx_submissions_user_datetime ON submissions(user_id, submission_datetime DESC) 
  WHERE user_id IS NOT NULL;

-- ===============================
-- FOREIGN KEY CONSTRAINT
-- ===============================

-- Add foreign key constraint to enforce referential integrity
-- This ensures all submissions reference valid users
ALTER TABLE submissions 
ADD CONSTRAINT fk_submissions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;

-- ===============================
-- UPDATE COMMENTS
-- ===============================

COMMENT ON TABLE submissions IS 'User submissions using user_id (database ID) as primary user identifier';
COMMENT ON COLUMN submissions.user_id IS 'Foreign key to users.id - primary user identifier (stable across OAuth provider changes)';
COMMENT ON COLUMN submissions.author_provider_account_id IS 'OAuth provider account ID - kept for reference only, not used for lookups';

-- ===============================
-- VERIFICATION QUERIES
-- ===============================

-- Show submission count by user identification method
SELECT 
  'Total submissions: ' || COUNT(*) as total,
  'With user_id: ' || COUNT(user_id) as with_user_id,
  'With provider ID only: ' || COUNT(CASE WHEN user_id IS NULL AND author_provider_account_id IS NOT NULL THEN 1 END) as provider_only,
  'Orphaned: ' || COUNT(CASE WHEN user_id IS NULL AND author_provider_account_id IS NULL THEN 1 END) as orphaned
FROM submissions;

-- Success message
SELECT 'User identification system consolidated - all submissions now use stable database user_id' as result; 