-- Migration: Correct user profile fields (remove redundant avatar_seed)

-- First, rollback the previous migration's redundant fields
ALTER TABLE users DROP COLUMN IF EXISTS avatar_seed;

-- Keep only the essential profile fields:
-- bio - for user descriptions (already added in 0020)
-- location - for user location (already added in 0020) 
-- username - for display names (already added in 0020)
-- profile_public - for privacy control (already added in 0020)
-- created_at - for join dates (already added in 0020, but users table already has this concept through NextAuth)

-- Fix created_at to not conflict with NextAuth patterns
-- We'll use the existing user creation tracking through the auth system

-- Ensure username is properly constrained
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Update existing users to have usernames if they don't
UPDATE users 
SET username = LOWER(REGEXP_REPLACE(COALESCE(name, split_part(email, '@', 1)), '[^a-zA-Z0-9\s._\-+@]', '', 'g'))
WHERE username IS NULL AND (name IS NOT NULL OR email IS NOT NULL);

-- Make sure username is unique but allow nulls for users who haven't set one
DROP INDEX IF EXISTS idx_users_username;
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;

COMMENT ON COLUMN users.username IS 'User display name/handle - can contain spaces for third-party auth';
COMMENT ON COLUMN users.bio IS 'User profile bio/description';
COMMENT ON COLUMN users.location IS 'User location (city, country, etc.)';
COMMENT ON COLUMN users.profile_public IS 'Whether user profile is publicly visible'; 