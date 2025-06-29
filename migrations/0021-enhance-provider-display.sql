-- Migration: Enhance Provider Display for Admin Dashboard
-- Description: Ensures provider information is properly available for admin user management
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- ================================
-- ENSURE PROVIDER COLUMNS EXIST
-- ================================

-- Add provider_name column if it doesn't exist (should already exist from migration 0020)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ================================
-- UPDATE PROVIDER NAMES
-- ================================

-- Update provider_name based on existing provider data for better display
UPDATE accounts 
SET provider_name = CASE 
    WHEN provider = 'google' THEN 'Google'
    WHEN provider = 'github' THEN 'GitHub'
    WHEN provider = 'discord' THEN 'Discord'
    WHEN provider = 'twitter' THEN 'Twitter/X'
    WHEN provider = 'facebook' THEN 'Facebook'
    WHEN provider = 'twitch' THEN 'Twitch'
    WHEN provider = 'apple' THEN 'Apple'
    WHEN provider = 'microsoft' THEN 'Microsoft'
    ELSE INITCAP(provider)
END
WHERE provider_name IS NULL OR provider_name = '';

-- ================================
-- UPDATE PROVIDER EMAIL FROM USERS
-- ================================

-- Update provider_email from users table where missing
UPDATE accounts 
SET provider_email = u.email
FROM users u
WHERE accounts."userId" = u.id 
AND (accounts.provider_email IS NULL OR accounts.provider_email = '')
AND u.email IS NOT NULL;

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Index for provider name lookups
CREATE INDEX IF NOT EXISTS idx_accounts_provider_name 
ON accounts(provider_name);

-- Index for provider email lookups  
CREATE INDEX IF NOT EXISTS idx_accounts_provider_email 
ON accounts(provider_email);

-- Index for last used timestamp
CREATE INDEX IF NOT EXISTS idx_accounts_last_used 
ON accounts(last_used DESC);

-- ================================
-- UPDATE HELPER FUNCTION
-- ================================

-- Ensure the get_user_primary_provider function exists and is up to date
CREATE OR REPLACE FUNCTION get_user_primary_provider(p_user_id INTEGER)
RETURNS TABLE(
    provider_name VARCHAR(255),
    provider_email VARCHAR(255),
    provider_verified BOOLEAN,
    last_used TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.provider_name,
        COALESCE(a.provider_email, u.email) as provider_email,
        COALESCE(a.provider_verified, false) as provider_verified,
        COALESCE(a.last_used, u.created_at) as last_used
    FROM accounts a
    JOIN users u ON a."userId" = u.id
    WHERE a."userId" = p_user_id
    ORDER BY a.last_used DESC NULLS LAST, a.id ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- DATA VERIFICATION
-- ================================

-- Show summary of provider data
SELECT 
    'Provider Summary' as info,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN provider_name IS NOT NULL THEN 1 END) as accounts_with_provider_name,
    COUNT(CASE WHEN provider_email IS NOT NULL THEN 1 END) as accounts_with_provider_email,
    COUNT(DISTINCT provider) as unique_providers,
    STRING_AGG(DISTINCT provider_name, ', ' ORDER BY provider_name) as provider_names
FROM accounts;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON COLUMN accounts.provider_name IS 'Human-readable provider name for admin display (e.g., Google, GitHub, Twitch)';
COMMENT ON COLUMN accounts.provider_email IS 'Email associated with the provider account for admin reference';
COMMENT ON COLUMN accounts.provider_verified IS 'Whether the provider account email is verified';
COMMENT ON COLUMN accounts.last_used IS 'When this provider account was last used for authentication';

-- Success message
SELECT 'Enhanced provider display functionality for admin dashboard - Ready to display login providers! 🧙‍♂️✨' as result; 