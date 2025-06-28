-- Migration: 0016-add-submission-data-source-flag.sql
-- Description: Add internal flag to track whether submissions are seeded data or user-created
-- This column is for internal use only and should never be returned in API responses

-- ================================
-- ADD DATA SOURCE COLUMN
-- ================================

-- Add the new column with a default value of 'seeded' for existing records
-- This column will track whether the submission came from seeded data or was user-created
ALTER TABLE submissions 
ADD COLUMN data_source VARCHAR(20) NOT NULL DEFAULT 'seeded' 
CHECK (data_source IN ('seeded', 'user_created'));

-- ================================
-- UPDATE EXISTING RECORDS
-- ================================

-- Update all existing submissions to be marked as seeded data
-- This ensures all current data is properly flagged since it's assumed to be seeded
UPDATE submissions 
SET data_source = 'seeded' 
WHERE data_source IS NULL OR data_source = 'seeded';

-- ================================
-- ADD INDEX FOR PERFORMANCE
-- ================================

-- Add index on data_source for efficient filtering if needed internally
CREATE INDEX IF NOT EXISTS idx_submissions_data_source ON submissions(data_source);

-- ================================
-- ADD DOCUMENTATION
-- ================================

-- Add comment to document the purpose and usage of this column
COMMENT ON COLUMN submissions.data_source IS 'Internal flag to track data origin: seeded (from initial data load) or user_created (from user submissions). FOR INTERNAL USE ONLY - never expose in API responses.';

-- ================================
-- VERIFICATION
-- ================================

-- Verify the migration worked correctly
SELECT 
    data_source,
    COUNT(*) as count,
    'All existing records should be marked as seeded' as note
FROM submissions 
GROUP BY data_source
ORDER BY data_source;

-- Success message
SELECT 'Submission data source flag added successfully - all existing records marked as seeded' as result; 