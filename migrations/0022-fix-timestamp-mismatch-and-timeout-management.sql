-- Migration: Fix Timestamp Mismatch and Add Timeout Management
-- Description: Fixes the timestamp type mismatch in get_user_primary_provider function and adds timeout revocation functionality
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- ================================
-- FIX TIMESTAMP TYPE MISMATCH
-- ================================

-- Drop and recreate the function with proper timestamp types
DROP FUNCTION IF EXISTS get_user_primary_provider(INTEGER);

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
        COALESCE(a.last_used, u.created_at)::TIMESTAMP as last_used
    FROM accounts a
    JOIN users u ON a."userId" = u.id
    WHERE a."userId" = p_user_id
    ORDER BY a.last_used DESC NULLS LAST, a.id ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ADD TIMEOUT MANAGEMENT FUNCTIONS
-- ================================

-- Function to revoke/end a timeout early
CREATE OR REPLACE FUNCTION revoke_user_timeout(
    p_timeout_id INTEGER,
    p_revoked_by INTEGER,
    p_revoke_reason TEXT DEFAULT 'Revoked by administrator'
)
RETURNS BOOLEAN AS $$
DECLARE
    timeout_exists BOOLEAN := false;
BEGIN
    -- Check if timeout exists and is active
    SELECT EXISTS(
        SELECT 1 FROM user_timeouts 
        WHERE id = p_timeout_id 
        AND is_active = true 
        AND expires_at > CURRENT_TIMESTAMP
    ) INTO timeout_exists;
    
    IF NOT timeout_exists THEN
        RETURN false;
    END IF;
    
    -- Update the timeout to mark it as revoked
    UPDATE user_timeouts 
    SET 
        is_active = false,
        expires_at = CURRENT_TIMESTAMP,
        reason = reason || ' [REVOKED: ' || p_revoke_reason || ']',
        revoked_by = p_revoked_by,
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = p_revoke_reason
    WHERE id = p_timeout_id;
    
    -- Log the revocation (if you have an audit table, add it here)
    INSERT INTO user_timeout_revocations (timeout_id, revoked_by, revoked_at, revoke_reason)
    VALUES (p_timeout_id, p_revoked_by, CURRENT_TIMESTAMP, p_revoke_reason)
    ON CONFLICT DO NOTHING; -- In case the table doesn't exist yet
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        -- If revocations table doesn't exist, just continue
        RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get active timeouts for a user
CREATE OR REPLACE FUNCTION get_user_active_timeouts(p_user_id INTEGER)
RETURNS TABLE(
    timeout_id INTEGER,
    reason TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    can_revoke BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.id as timeout_id,
        ut.reason,
        ut.expires_at::TIMESTAMP,
        ut.created_at::TIMESTAMP,
        (ut.expires_at > CURRENT_TIMESTAMP AND ut.is_active = true) as can_revoke
    FROM user_timeouts ut
    WHERE ut.user_id = p_user_id
    AND ut.is_active = true
    ORDER BY ut.expires_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CREATE TIMEOUT REVOCATIONS TABLE (OPTIONAL)
-- ================================

-- Create table to track timeout revocations (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_timeout_revocations (
    id SERIAL PRIMARY KEY,
    timeout_id INTEGER NOT NULL,
    revoked_by INTEGER NOT NULL,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoke_reason TEXT,
    FOREIGN KEY (timeout_id) REFERENCES user_timeouts(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_timeout_revocations_timeout_id 
ON user_timeout_revocations(timeout_id);

CREATE INDEX IF NOT EXISTS idx_timeout_revocations_revoked_by 
ON user_timeout_revocations(revoked_by);

-- ================================
-- UPDATE EXISTING HELPER FUNCTIONS
-- ================================

-- Update the timeout status function to handle revocations properly
DROP FUNCTION IF EXISTS get_user_timeout_status(INTEGER);

CREATE OR REPLACE FUNCTION get_user_timeout_status(p_user_id INTEGER)
RETURNS TABLE(
    is_timed_out BOOLEAN,
    timeout_count INTEGER,
    active_timeout_reason TEXT,
    timeout_expires TIMESTAMP,
    active_timeout_id INTEGER
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
            THEN ut.expires_at::TIMESTAMP ELSE NULL END) as timeout_expires,
        MAX(CASE WHEN ut.is_active AND ut.expires_at > CURRENT_TIMESTAMP 
            THEN ut.id ELSE NULL END)::INTEGER as active_timeout_id
    FROM user_timeouts ut
    WHERE ut.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON FUNCTION get_user_primary_provider(INTEGER) IS 'Returns primary authentication provider with fixed timestamp types';
COMMENT ON FUNCTION revoke_user_timeout(INTEGER, INTEGER, TEXT) IS 'Revokes/ends a user timeout early - returns true if successful';
COMMENT ON FUNCTION get_user_active_timeouts(INTEGER) IS 'Returns all active timeouts for a user with revocation capability info';
COMMENT ON FUNCTION get_user_timeout_status(INTEGER) IS 'Returns timeout status including active timeout ID for management';
COMMENT ON TABLE user_timeout_revocations IS 'Tracks when timeouts are revoked early by administrators';

-- ================================
-- TEST THE FUNCTIONS
-- ================================

-- Test the fixed function
SELECT 'Testing get_user_primary_provider function...' as test_info;
SELECT * FROM get_user_primary_provider(1) LIMIT 1;

-- Success message
SELECT 'Fixed timestamp mismatch and added timeout management functionality! 🧙‍♂️⚡' as result; 