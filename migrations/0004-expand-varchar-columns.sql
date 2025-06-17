-- Migration: Expand VARCHAR columns for better content handling

-- Expand submission_title to TEXT for longer titles
ALTER TABLE submissions 
ALTER COLUMN submission_title TYPE TEXT;

-- Expand submission_name to TEXT for longer content
ALTER TABLE submissions 
ALTER COLUMN submission_name TYPE TEXT;

-- Keep author fields as VARCHAR but expand them
ALTER TABLE submissions 
ALTER COLUMN author_id TYPE VARCHAR(500);

ALTER TABLE submissions 
ALTER COLUMN author TYPE VARCHAR(500); 