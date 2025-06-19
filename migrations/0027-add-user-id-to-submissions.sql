-- Migration: Add user_id column to submissions table

-- Add the new user_id column
ALTER TABLE submissions ADD COLUMN user_id INTEGER;

-- Create index for performance
CREATE INDEX idx_submissions_user_id ON submissions(user_id);

-- Update existing submissions to link to users by matching author fields
UPDATE submissions 
SET user_id = (
  SELECT u.id 
  FROM users u 
  LEFT JOIN accounts a ON u.id = a."userId"
  WHERE 
    a."providerAccountId" = submissions.author_id
    OR LOWER(u.name) = LOWER(submissions.author)
  ORDER BY 
    CASE 
      WHEN a."providerAccountId" = submissions.author_id THEN 1
      WHEN LOWER(u.name) = LOWER(submissions.author) THEN 2
      ELSE 3
    END
  LIMIT 1
)
WHERE user_id IS NULL;

-- Add submission_title column if it doesn't exist
ALTER TABLE submissions ADD COLUMN submission_title VARCHAR(500);

-- Update submission_title from submission_name if empty
UPDATE submissions 
SET submission_title = COALESCE(submission_title, LEFT(submission_name, 100))
WHERE submission_title IS NULL OR submission_title = ''; 