-- Simplify Author Identification System
-- This migration consolidates author identification to use only author_provider_account_id
-- Removes redundant author_provider_id column and associated constraints

-- First, ensure all submissions have author_provider_account_id populated
UPDATE submissions 
SET author_provider_account_id = author_provider_id 
WHERE author_provider_account_id IS NULL AND author_provider_id IS NOT NULL;

-- Drop the foreign key constraint on author_provider_id
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS fk_submissions_author_provider_id;

-- Drop the author_provider_id column (redundant)
ALTER TABLE submissions DROP COLUMN IF EXISTS author_provider_id;

-- Make author_provider_account_id NOT NULL (it's now the single source of truth)
ALTER TABLE submissions ALTER COLUMN author_provider_account_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_submissions_author_provider_account_id_only 
ON submissions(author_provider_account_id);

-- Update table comment
COMMENT ON COLUMN submissions.author_provider_account_id IS 'Single source of truth for post authorship - OAuth provider account ID';

-- Success message
SELECT 'Simplified author identification system - using only author_provider_account_id' as result; 