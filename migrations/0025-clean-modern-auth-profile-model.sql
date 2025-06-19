-- Migration: Clean modern authentication and profile model

-- Remove any legacy compatibility columns we don't need
ALTER TABLE users DROP COLUMN IF EXISTS display_name;

-- Ensure clean profile structure for modern NextAuth integration
UPDATE users 
SET profile_public = true 
WHERE profile_public IS NULL;

-- Create clean indexes for modern profile lookups
-- We only care about: providerAccountId (primary), name, email
DROP INDEX IF EXISTS idx_users_display_name;
DROP INDEX IF EXISTS idx_users_name_lower;
DROP INDEX IF EXISTS idx_users_email_prefix;

CREATE INDEX IF NOT EXISTS idx_users_name ON users(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON accounts("providerAccountId");
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON accounts("userId", provider);

-- Modern profile lookup function - providerAccountId first, then name
CREATE OR REPLACE FUNCTION get_user_by_identifier(input_identifier TEXT)
RETURNS TABLE(
    user_id INTEGER,
    user_name TEXT,
    user_email TEXT,
    user_bio TEXT,
    user_location TEXT,
    user_image TEXT,
    user_created_at TIMESTAMPTZ,
    user_profile_public BOOLEAN,
    provider_account_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.bio,
        u.location,
        u.image,
        u.created_at,
        u.profile_public,
        a."providerAccountId"
    FROM users u 
    LEFT JOIN accounts a ON u.id = a."userId"
    WHERE a."providerAccountId" = input_identifier
       OR LOWER(u.name) = LOWER(input_identifier)
    ORDER BY 
        CASE 
            WHEN a."providerAccountId" = input_identifier THEN 1
            WHEN LOWER(u.name) = LOWER(input_identifier) THEN 2
            ELSE 3
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Test the clean lookup
SELECT * FROM get_user_by_identifier('strixun');

-- Clean up any debug functions we don't need
DROP FUNCTION IF EXISTS debug_user_auth_status(TEXT);

-- Modern model documentation:
-- 1. OAuth login creates user record with: id, name, email, image, profile_public=true
-- 2. Account record created with: userId, provider, providerAccountId (stable identifier)  
-- 3. Profile system uses providerAccountId as primary ID
-- 4. Fallback to user.name for profile lookup if needed
-- 5. No legacy compatibility - clean modern NextAuth flow only

COMMENT ON FUNCTION get_user_by_identifier(TEXT) IS 'Modern profile lookup: providerAccountId first, then name';
COMMENT ON INDEX idx_accounts_provider_id IS 'Fast lookup by stable providerAccountId';
COMMENT ON INDEX idx_users_name IS 'Fallback lookup by username';

-- Migration complete: Established clean modern authentication and profile model 