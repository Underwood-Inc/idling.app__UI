-- Migration: Add submission title and URL fields for modern form

-- Add submission_title field (required)
ALTER TABLE submissions 
ADD COLUMN submission_title VARCHAR(255) NOT NULL DEFAULT '';

-- Add submission_url field (optional)
ALTER TABLE submissions 
ADD COLUMN submission_url TEXT;

-- Create index on title for search performance
CREATE INDEX idx_submissions_title ON submissions(submission_title);

-- Create index on URL for duplicate detection
CREATE INDEX idx_submissions_url ON submissions(submission_url) WHERE submission_url IS NOT NULL;

-- Update existing records to have a title (use submission_name as fallback)
UPDATE submissions 
SET submission_title = submission_name 
WHERE submission_title = ''; 