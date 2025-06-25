-- Fix Profile URLs Script
-- This script helps identify and fix any remaining username-based profile URLs
-- that might be stored in the database after the ID-only migration

-- 1. Check for any profile URLs in submission content that use the old format
-- Pattern: /profile/username-123 should become /profile/123
SELECT 
  id,
  content,
  user_id,
  submission_datetime
FROM submissions 
WHERE content ~ '/profile/[a-zA-Z][a-zA-Z0-9-]*-[0-9]+' 
ORDER BY submission_datetime DESC 
LIMIT 10;

-- 2. Check for any profile URLs that don't follow the new ID-only format
-- Pattern: /profile/anything-that-is-not-just-numbers
SELECT 
  id,
  content,
  user_id,
  submission_datetime
FROM submissions 
WHERE content ~ '/profile/[^0-9][^/]*' 
ORDER BY submission_datetime DESC 
LIMIT 10;

-- 3. Update script to fix old-format profile URLs in submission content
-- IMPORTANT: Review the matches above before running this update!
-- This will replace /profile/username-123 with /profile/123

-- Uncomment the following lines ONLY after reviewing the SELECT results above:

/*
UPDATE submissions 
SET content = regexp_replace(
  content, 
  '/profile/[a-zA-Z][a-zA-Z0-9-]*-([0-9]+)', 
  '/profile/\1', 
  'g'
) 
WHERE content ~ '/profile/[a-zA-Z][a-zA-Z0-9-]*-[0-9]+';
*/

-- 4. Check for any remaining non-numeric profile URLs after the fix
-- This should return no results after the update
SELECT 
  id,
  content,
  user_id,
  submission_datetime
FROM submissions 
WHERE content ~ '/profile/[^0-9][^/]*' 
ORDER BY submission_datetime DESC 
LIMIT 5;

-- 5. Verify the fix worked by checking for the new format
SELECT 
  id,
  content,
  user_id,
  submission_datetime
FROM submissions 
WHERE content ~ '/profile/[0-9]+' 
ORDER BY submission_datetime DESC 
LIMIT 5; 