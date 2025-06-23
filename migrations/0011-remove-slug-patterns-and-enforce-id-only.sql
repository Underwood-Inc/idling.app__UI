-- Migration 0011: Remove deprecated slug patterns and enforce ID-only profile URLs
-- This migration cleans up any remaining slug-based profile URLs and adds constraints
-- to prevent their future use, ensuring complete migration to database ID-only system

BEGIN;

-- 1. Update any remaining slug-based profile URLs in submission content
-- Pattern: /profile/username-123 becomes /profile/123
UPDATE submissions 
SET content = regexp_replace(
  content, 
  '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-([0-9]+)(\s|/|$|[^0-9])', 
  '/profile/\1\2', 
  'g'
) 
WHERE content ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+';

-- 2. Update any remaining slug-based profile URLs in user bios
UPDATE users 
SET bio = regexp_replace(
  bio, 
  '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-([0-9]+)(\s|/|$|[^0-9])', 
  '/profile/\1\2', 
  'g'
) 
WHERE bio IS NOT NULL 
AND bio ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+';

-- 3. Create a function to validate profile URLs (ID-only)
CREATE OR REPLACE FUNCTION validate_profile_url(url_text TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow NULL or empty
  IF url_text IS NULL OR url_text = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if any profile URLs in the text are non-numeric
  -- This regex matches /profile/ followed by anything that's not just numbers
  IF url_text ~ '/profile/[^0-9/\s][^/\s]*' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Add check constraints to prevent slug-based URLs in content
ALTER TABLE submissions 
ADD CONSTRAINT submissions_content_no_slug_urls 
CHECK (validate_profile_url(content));

-- 5. Add check constraints to prevent slug-based URLs in user bios
ALTER TABLE users 
ADD CONSTRAINT users_bio_no_slug_urls 
CHECK (validate_profile_url(bio));

-- 6. Create a trigger function to prevent slug URLs in real-time
CREATE OR REPLACE FUNCTION prevent_slug_urls() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check submissions content
  IF TG_TABLE_NAME = 'submissions' THEN
    IF NEW.content IS NOT NULL AND NOT validate_profile_url(NEW.content) THEN
      RAISE EXCEPTION 'Profile URLs must use database IDs only (e.g., /profile/123). Slug-based URLs like /profile/username-123 are not allowed.';
    END IF;
  END IF;
  
  -- Check user bios
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.bio IS NOT NULL AND NOT validate_profile_url(NEW.bio) THEN
      RAISE EXCEPTION 'Profile URLs in bio must use database IDs only (e.g., /profile/123). Slug-based URLs like /profile/username-123 are not allowed.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers to enforce ID-only URLs
DROP TRIGGER IF EXISTS prevent_slug_urls_submissions ON submissions;
CREATE TRIGGER prevent_slug_urls_submissions
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION prevent_slug_urls();

DROP TRIGGER IF EXISTS prevent_slug_urls_users ON users;
CREATE TRIGGER prevent_slug_urls_users
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_slug_urls();

-- 8. Add index to help identify any remaining slug patterns (for monitoring)
CREATE INDEX IF NOT EXISTS idx_submissions_profile_urls 
ON submissions USING gin(to_tsvector('english', content)) 
WHERE content ~ '/profile/';

-- 9. Create a monitoring view to track profile URL patterns
CREATE OR REPLACE VIEW profile_url_patterns AS
SELECT 
  'submissions' as table_name,
  id,
  user_id,
  submission_datetime as created_at,
  regexp_matches(content, '/profile/([^/\s]+)', 'g') as url_patterns,
  CASE 
    WHEN content ~ '/profile/[0-9]+(\s|/|$)' THEN 'valid_id_only'
    WHEN content ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+' THEN 'invalid_slug_pattern'
    WHEN content ~ '/profile/[^0-9/\s]' THEN 'invalid_other'
    ELSE 'unknown'
  END as pattern_type
FROM submissions 
WHERE content ~ '/profile/'

UNION ALL

SELECT 
  'users' as table_name,
  id,
  id as user_id,
  created_at,
  regexp_matches(bio, '/profile/([^/\s]+)', 'g') as url_patterns,
  CASE 
    WHEN bio ~ '/profile/[0-9]+(\s|/|$)' THEN 'valid_id_only'
    WHEN bio ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+' THEN 'invalid_slug_pattern'
    WHEN bio ~ '/profile/[^0-9/\s]' THEN 'invalid_other'
    ELSE 'unknown'
  END as pattern_type
FROM users 
WHERE bio IS NOT NULL AND bio ~ '/profile/';

-- 10. Create a cleanup function for future use
CREATE OR REPLACE FUNCTION cleanup_slug_urls() 
RETURNS TABLE(
  table_name TEXT,
  record_id INTEGER,
  old_content TEXT,
  new_content TEXT,
  changes_made INTEGER
) AS $$
DECLARE
  submission_record RECORD;
  user_record RECORD;
  old_text TEXT;
  new_text TEXT;
  total_changes INTEGER := 0;
BEGIN
  -- Clean up submissions
  FOR submission_record IN 
    SELECT id, content FROM submissions 
    WHERE content ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+'
  LOOP
    old_text := submission_record.content;
    new_text := regexp_replace(
      old_text, 
      '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-([0-9]+)(\s|/|$|[^0-9])', 
      '/profile/\1\2', 
      'g'
    );
    
    IF old_text != new_text THEN
      UPDATE submissions SET content = new_text WHERE id = submission_record.id;
      total_changes := total_changes + 1;
      
      RETURN QUERY SELECT 
        'submissions'::TEXT,
        submission_record.id,
        old_text,
        new_text,
        total_changes;
    END IF;
  END LOOP;
  
  -- Clean up user bios
  FOR user_record IN 
    SELECT id, bio FROM users 
    WHERE bio IS NOT NULL AND bio ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+'
  LOOP
    old_text := user_record.bio;
    new_text := regexp_replace(
      old_text, 
      '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-([0-9]+)(\s|/|$|[^0-9])', 
      '/profile/\1\2', 
      'g'
    );
    
    IF old_text != new_text THEN
      UPDATE users SET bio = new_text WHERE id = user_record.id;
      total_changes := total_changes + 1;
      
      RETURN QUERY SELECT 
        'users'::TEXT,
        user_record.id,
        old_text,
        new_text,
        total_changes;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 11. Log the migration completion
INSERT INTO migrations (name, executed_at) 
VALUES ('0011-remove-slug-patterns-and-enforce-id-only', NOW())
ON CONFLICT (name) DO UPDATE SET executed_at = NOW();

COMMIT;

-- Post-migration verification queries (run these after migration)
/*
-- Check for any remaining invalid profile URLs
SELECT * FROM profile_url_patterns WHERE pattern_type != 'valid_id_only';

-- Test the constraint (this should fail)
-- INSERT INTO submissions (content, user_id) VALUES ('Check out /profile/johndoe-123', 1);

-- Run cleanup function if needed
-- SELECT * FROM cleanup_slug_urls();

-- Monitor profile URL patterns
-- SELECT pattern_type, COUNT(*) FROM profile_url_patterns GROUP BY pattern_type;
*/ 