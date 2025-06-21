-- Fix Missing Author Provider Account IDs
-- This migration populates the author_provider_account_id field for existing submissions
-- that have NULL values by looking up the provider account ID from the accounts table

-- Update submissions that have NULL author_provider_account_id
-- by joining with users and accounts tables to get the correct provider account ID
UPDATE submissions 
SET author_provider_account_id = a."providerAccountId"
FROM users u 
JOIN accounts a ON u.id = a."userId"
WHERE submissions.user_id = u.id 
  AND submissions.author_provider_account_id IS NULL;

-- Verify the update worked
SELECT 
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN author_provider_account_id IS NULL THEN 1 END) as null_provider_ids,
  COUNT(CASE WHEN author_provider_account_id IS NOT NULL THEN 1 END) as populated_provider_ids
FROM submissions;

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_submissions_author_provider_account_id 
ON submissions(author_provider_account_id);

-- Success message
SELECT 'Fixed missing author_provider_account_id values in submissions table' as result; 