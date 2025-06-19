-- Migration: Fix existing users without usernames

-- Update existing users who don't have usernames
-- This fixes users created before the profile system was implemented
UPDATE users 
SET username = CASE 
  WHEN name IS NOT NULL THEN 
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s._\-+@]', '', 'g')
  WHEN email IS NOT NULL THEN 
    REGEXP_REPLACE(split_part(email, '@', 1), '[^a-zA-Z0-9._\-+]', '', 'g')
  ELSE 
    'user_' || id::text
END
WHERE username IS NULL;

-- Ensure profile_public is set for existing users (default to true)
UPDATE users 
SET profile_public = true 
WHERE profile_public IS NULL;

-- Set created_at for users who don't have it (fallback to current timestamp)
UPDATE users 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

-- Migration complete: Fixed existing users without profile fields for compatibility 