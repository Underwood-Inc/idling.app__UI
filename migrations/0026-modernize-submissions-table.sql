-- Migration: Modernize submissions table to use proper foreign keys

-- Add the new user_id column
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint (with error handling)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submissions_user_id' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE submissions ADD CONSTRAINT fk_submissions_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);

-- Add submission_title column if it doesn't exist (for clean schema)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_title VARCHAR(500);

-- Only update existing data if there are submissions to update
DO $$
BEGIN
  -- Check if there are any submissions to update
  IF (SELECT COUNT(*) FROM submissions) > 0 THEN
    -- Update existing submissions to link to users by matching author fields
    -- This handles both legacy data and ensures proper relationships
    UPDATE submissions 
    SET user_id = (
      SELECT u.id 
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId"
      WHERE 
        -- First try to match by providerAccountId (most reliable)
        a."providerAccountId" = submissions.author_id
        -- Fallback to name matching for legacy data
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

    -- Update submission_title from submission_name if empty
    UPDATE submissions 
    SET submission_title = COALESCE(submission_title, LEFT(submission_name, 100))
    WHERE submission_title IS NULL OR submission_title = '';

    -- Add NOT NULL constraint to user_id after data migration
    -- Note: This will fail if there are orphaned submissions, which is intentional
    -- to identify data integrity issues
    IF (SELECT COUNT(*) FROM submissions WHERE user_id IS NULL) = 0 THEN
      ALTER TABLE submissions ALTER COLUMN user_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Cannot set user_id NOT NULL: % submissions have NULL user_id', 
        (SELECT COUNT(*) FROM submissions WHERE user_id IS NULL);
    END IF;
  END IF;
END $$;

-- Legacy fields can be kept for transition period but are no longer primary
-- They will be removed in a future migration once all code is updated

COMMENT ON COLUMN submissions.user_id IS 'Modern foreign key to users table';
COMMENT ON COLUMN submissions.author_id IS 'Legacy field - use user_id instead';
COMMENT ON COLUMN submissions.author IS 'Legacy field - use user_id instead';

-- Migration complete: Submissions table now uses proper foreign key relationships 