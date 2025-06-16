-- Migration: Remove submission URL field as it's not needed

-- Drop the URL index first
DROP INDEX IF EXISTS idx_submissions_url;
 
-- Remove submission_url column
ALTER TABLE submissions 
DROP COLUMN IF EXISTS submission_url; 