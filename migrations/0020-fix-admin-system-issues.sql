-- Migration: Fix Admin System Issues
-- Description: Fixes missing created_at column in user_timeouts and ensures all admin system fields are properly set up
-- Author: System Wizard
-- Date: 2025-01-29

-- ================================
-- FIX USER_TIMEOUTS TABLE
-- ================================

-- Add missing created_at column to user_timeouts table
ALTER TABLE user_timeouts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have created_at = issued_at for consistency
UPDATE user_timeouts 
SET created_at = issued_at 
WHERE created_at IS NULL;

-- ================================
-- ENHANCE USERS TABLE FOR ADMIN SYSTEM
-- ================================

-- Add additional columns for better admin management
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ================================
-- ENHANCE ACCOUNTS TABLE FOR PROVIDER TRACKING
-- ================================

-- Add additional provider information for admin visibility
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update provider_name based on existing provider data
UPDATE accounts 
SET provider_name = CASE 
    WHEN provider = 'google' THEN 'Google'
    WHEN provider = 'github' THEN 'GitHub'
    WHEN provider = 'discord' THEN 'Discord'
    WHEN provider = 'twitter' THEN 'Twitter/X'
    WHEN provider = 'facebook' THEN 'Facebook'
    ELSE INITCAP(provider)
END
WHERE provider_name IS NULL;

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_user_timeouts_created_at 
ON user_timeouts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_last_login 
ON users(last_login DESC) WHERE last_login IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active) WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_accounts_provider_name 
ON accounts(provider_name);

CREATE INDEX IF NOT EXISTS idx_accounts_last_used 
ON accounts(last_used DESC);

-- ================================
-- CREATE ADMIN HELPER FUNCTIONS
-- ================================

-- Function to get user's primary auth provider
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
        a.provider_email,
        a.provider_verified,
        a.last_used
    FROM accounts a
    WHERE a."userId" = p_user_id
    ORDER BY a.last_used DESC NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's role summary
CREATE OR REPLACE FUNCTION get_user_role_summary(p_user_id INTEGER)
RETURNS TABLE(
    role_count INTEGER,
    role_names TEXT,
    has_admin BOOLEAN,
    has_moderator BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as role_count,
        STRING_AGG(ur.display_name, ', ' ORDER BY ur.display_name) as role_names,
        BOOL_OR(ur.name = 'admin') as has_admin,
        BOOL_OR(ur.name = 'moderator') as has_moderator
    FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = p_user_id 
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's subscription summary
CREATE OR REPLACE FUNCTION get_user_subscription_summary(p_user_id INTEGER)
RETURNS TABLE(
    subscription_count INTEGER,
    active_subscriptions INTEGER,
    subscription_names TEXT,
    has_active_subscription BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as subscription_count,
        COUNT(CASE WHEN us.status = 'active' THEN 1 END)::INTEGER as active_subscriptions,
        STRING_AGG(
            CASE WHEN us.status = 'active' THEN sp.name ELSE NULL END, 
            ', ' ORDER BY sp.name
        ) as subscription_names,
        BOOL_OR(us.status = 'active') as has_active_subscription
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id 
    AND (us.expires_at IS NULL OR us.expires_at > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's timeout status
CREATE OR REPLACE FUNCTION get_user_timeout_status(p_user_id INTEGER)
RETURNS TABLE(
    is_timed_out BOOLEAN,
    timeout_count INTEGER,
    active_timeout_reason TEXT,
    timeout_expires TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        BOOL_OR(ut.is_active AND ut.expires_at > CURRENT_TIMESTAMP) as is_timed_out,
        COUNT(*)::INTEGER as timeout_count,
        STRING_AGG(
            CASE WHEN ut.is_active AND ut.expires_at > CURRENT_TIMESTAMP 
            THEN ut.reason ELSE NULL END, 
            '; '
        ) as active_timeout_reason,
        MAX(CASE WHEN ut.is_active AND ut.expires_at > CURRENT_TIMESTAMP 
            THEN ut.expires_at ELSE NULL END) as timeout_expires
    FROM user_timeouts ut
    WHERE ut.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- UPDATE TRIGGERS
-- ================================

-- Trigger to update last_used on accounts when accessed
CREATE OR REPLACE FUNCTION update_account_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to accounts table
DROP TRIGGER IF EXISTS trigger_account_last_used ON accounts;
CREATE TRIGGER trigger_account_last_used
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_account_last_used();

-- ================================
-- DATA INTEGRITY CHECKS
-- ================================

-- Ensure all users have at least the basic role
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
SELECT 
    u.id, 
    ur.id, 
    CURRENT_TIMESTAMP, 
    true
FROM users u
CROSS JOIN user_roles ur
WHERE ur.name = 'basic'
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = u.id AND ura.role_id = ur.id
);

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON COLUMN user_timeouts.created_at IS 'When the timeout record was created (fixed missing column)';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp for admin tracking';
COMMENT ON COLUMN users.login_count IS 'Total number of logins for admin analytics';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active (for admin management)';
COMMENT ON COLUMN users.admin_notes IS 'Administrative notes about the user';
COMMENT ON COLUMN accounts.provider_name IS 'Human-readable provider name for admin display';
COMMENT ON COLUMN accounts.provider_email IS 'Email associated with the provider account';
COMMENT ON COLUMN accounts.provider_verified IS 'Whether the provider account is verified';
COMMENT ON COLUMN accounts.last_used IS 'When this provider account was last used for login';

COMMENT ON FUNCTION get_user_primary_provider(INTEGER) IS 'Returns the primary authentication provider for a user';
COMMENT ON FUNCTION get_user_role_summary(INTEGER) IS 'Returns a summary of user roles for admin display';
COMMENT ON FUNCTION get_user_subscription_summary(INTEGER) IS 'Returns a summary of user subscriptions for admin display';
COMMENT ON FUNCTION get_user_timeout_status(INTEGER) IS 'Returns current timeout status for a user';

-- Success message
SELECT 'Admin system database issues fixed successfully' as result; 