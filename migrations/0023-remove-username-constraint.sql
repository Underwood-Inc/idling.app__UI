-- Migration: Remove username constraint and keep profile system working with existing data

-- Remove the problematic username column entirely
-- The profile system already works with name/email from NextAuth
ALTER TABLE users DROP COLUMN IF EXISTS username CASCADE;

-- Keep the useful profile fields that don't cause conflicts
-- These are optional fields that enhance profiles but aren't required
-- bio, location, profile_public, created_at columns should already exist

-- Ensure profile_public has a default for existing users
UPDATE users 
SET profile_public = true 
WHERE profile_public IS NULL;

-- The profile system will use:
-- 1. name (from OAuth providers)
-- 2. email (as fallback identifier)  
-- 3. id (as ultimate fallback)

-- This approach aligns with the original intent:
-- "ensure when a user logs in their user data is created/updated 
-- so that the user profile page always works"

COMMENT ON TABLE users IS 'NextAuth users table with optional profile enhancements';
COMMENT ON COLUMN users.bio IS 'Optional user bio/description';
COMMENT ON COLUMN users.location IS 'Optional user location';
COMMENT ON COLUMN users.profile_public IS 'Whether profile is publicly visible (default true)'; 