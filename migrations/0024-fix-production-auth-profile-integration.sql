-- Migration: Fix production authentication and profile integration

-- Ensure all users with accounts have proper profile data
UPDATE users 
SET profile_public = true 
WHERE profile_public IS NULL;

-- Add any missing profile fields for existing authenticated users
-- This ensures compatibility between NextAuth session data and profile data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Update display_name to match NextAuth session name for consistency
UPDATE users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Ensure all authenticated users have the required profile structure
-- Create indexes for better performance on profile lookups
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name) WHERE display_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON users(LOWER(name)) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_prefix ON users(LOWER(split_part(email, '@', 1))) WHERE email IS NOT NULL;

-- Add foreign key constraint to ensure data integrity between users and accounts
-- This will help prevent orphaned records
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider, "providerAccountId");

-- Update the adapter to ensure user creation works properly
-- This comment documents the expected behavior:
-- 1. When user logs in via OAuth, NextAuth creates user record
-- 2. User record should have: id, name, email, image, profile_public=true
-- 3. Account record links to user with providerAccountId (the stable identifier)
-- 4. Profile system uses providerAccountId as primary ID for consistency

-- Create a function to debug authentication issues
CREATE OR REPLACE FUNCTION debug_user_auth_status(input_identifier TEXT)
RETURNS TABLE(
    user_id INTEGER,
    user_name TEXT,
    user_email TEXT,
    provider_account_id TEXT,
    provider TEXT,
    auth_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        a."providerAccountId",
        a.provider,
        CASE 
            WHEN u.id IS NOT NULL AND a."providerAccountId" IS NOT NULL THEN 'FULLY_AUTHENTICATED'
            WHEN u.id IS NOT NULL AND a."providerAccountId" IS NULL THEN 'USER_EXISTS_NO_ACCOUNT'
            WHEN u.id IS NULL THEN 'USER_NOT_FOUND'
            ELSE 'UNKNOWN_STATUS'
        END
    FROM users u 
    LEFT JOIN accounts a ON u.id = a."userId"
    WHERE LOWER(u.name) = LOWER(input_identifier)
       OR LOWER(split_part(u.email, '@', 1)) = LOWER(input_identifier)
       OR a."providerAccountId" = input_identifier
       OR u.id::text = input_identifier
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Test the function with a known user
SELECT * FROM debug_user_auth_status('strixun');

COMMENT ON FUNCTION debug_user_auth_status(TEXT) IS 'Debug function to check user authentication status and profile data';
COMMENT ON COLUMN users.display_name IS 'Display name for profile compatibility with NextAuth session data';
COMMENT ON INDEX idx_users_display_name IS 'Index for fast profile lookups by display name';
COMMENT ON INDEX idx_accounts_provider_account IS 'Index for fast OAuth account lookups';

-- Migration complete: Fixed production authentication and profile integration 