-- Migration: Assign Default User Quotas
-- Description: Give all existing users default quota overrides so they can use the system
-- Author: System
-- Date: 2025-01-05

-- ================================
-- ASSIGN DEFAULT USER QUOTAS
-- ================================

-- Give all existing users a default quota for og_generator
INSERT INTO user_quota_overrides (
    user_id, 
    service_name, 
    feature_name, 
    quota_limit, 
    is_unlimited, 
    is_active, 
    reset_period, 
    created_by, 
    reason
)
SELECT 
    u.id,
    'og_generator',
    'daily_generations',
    10, -- Default 10 generations per day for authenticated users
    false,
    true,
    'daily',
    NULL, -- System assignment
    'Default quota assignment for authenticated users'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_quota_overrides uqo 
    WHERE uqo.user_id = u.id 
    AND uqo.service_name = 'og_generator' 
    AND uqo.feature_name = 'daily_generations'
);

-- Give all existing users quota for custom emoji
INSERT INTO user_quota_overrides (
    user_id, 
    service_name, 
    feature_name, 
    quota_limit, 
    is_unlimited, 
    is_active, 
    reset_period, 
    created_by, 
    reason
)
SELECT 
    u.id,
    'custom_emoji',
    'emoji_slots',
    5, -- Default 5 emoji slots for authenticated users
    false,
    true,
    'monthly',
    NULL, -- System assignment
    'Default quota assignment for authenticated users'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_quota_overrides uqo 
    WHERE uqo.user_id = u.id 
    AND uqo.service_name = 'custom_emoji' 
    AND uqo.feature_name = 'emoji_slots'
);

-- ================================
-- CREATE TRIGGER FOR NEW USERS
-- ================================

-- Function to assign default quotas to new users
CREATE OR REPLACE FUNCTION assign_default_user_quotas()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign default OG generator quota
    INSERT INTO user_quota_overrides (
        user_id, service_name, feature_name, quota_limit, 
        is_unlimited, is_active, reset_period, reason
    ) VALUES (
        NEW.id, 'og_generator', 'daily_generations', 10,
        false, true, 'daily', 'Default quota for new user'
    );
    
    -- Assign default custom emoji quota
    INSERT INTO user_quota_overrides (
        user_id, service_name, feature_name, quota_limit, 
        is_unlimited, is_active, reset_period, reason
    ) VALUES (
        NEW.id, 'custom_emoji', 'emoji_slots', 5,
        false, true, 'monthly', 'Default quota for new user'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign quotas to new users
DROP TRIGGER IF EXISTS trigger_assign_default_quotas ON users;
CREATE TRIGGER trigger_assign_default_quotas
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_user_quotas(); 