-- Remove author_provider_account_id column from submissions table
-- This column was used for OAuth provider account ID lookups, but we now use user_id exclusively

-- Step 1: Drop the index first
DROP INDEX IF EXISTS idx_submissions_author_provider_account_id;

-- Step 2: Remove the column
ALTER TABLE submissions DROP COLUMN IF EXISTS author_provider_account_id;

-- Step 3: Add comment for documentation
COMMENT ON TABLE submissions IS 'User submissions/posts using internal user_id for all operations';
COMMENT ON COLUMN submissions.user_id IS 'Foreign key to users.id (internal database ID - primary identifier for all app operations)';

-- Success message
SELECT 'Removed author_provider_account_id column - now using user_id exclusively' as result; 