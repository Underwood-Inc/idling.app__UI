-- Migration: Fix Quota System Database Functions
-- Description: Adds missing get_user_usage function and ensures all quota functions work correctly
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- ================================
-- CREATE MISSING GET_USER_USAGE FUNCTION
-- ================================

-- This function is called by the quota system but was missing from previous migrations
CREATE OR REPLACE FUNCTION get_user_usage(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_reset_period VARCHAR(20) DEFAULT 'daily'
) RETURNS INTEGER AS $$
DECLARE
    v_usage_count INTEGER := 0;
    v_service_id INTEGER;
    v_feature_id INTEGER;
BEGIN
    -- Get service ID
    SELECT id INTO v_service_id
    FROM subscription_services
    WHERE name = p_service_name;
    
    IF v_service_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get feature ID if specified
    IF p_feature_name IS NOT NULL THEN
        SELECT id INTO v_feature_id
        FROM subscription_features
        WHERE service_id = v_service_id AND name = p_feature_name;
    END IF;
    
    -- Calculate usage based on reset period
    CASE p_reset_period
        WHEN 'hourly' THEN
            -- Get usage from current hour
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM subscription_usage su
            WHERE su.user_id = p_user_id
            AND su.service_id = v_service_id
            AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
            AND su.created_at >= DATE_TRUNC('hour', NOW());
            
        WHEN 'daily' THEN
            -- Get usage from current day
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM subscription_usage su
            WHERE su.user_id = p_user_id
            AND su.service_id = v_service_id
            AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
            AND su.usage_date = CURRENT_DATE;
            
        WHEN 'weekly' THEN
            -- Get usage from current week (Monday to Sunday)
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM subscription_usage su
            WHERE su.user_id = p_user_id
            AND su.service_id = v_service_id
            AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
            AND su.usage_date >= DATE_TRUNC('week', CURRENT_DATE);
            
        WHEN 'monthly' THEN
            -- Get usage from current month
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM subscription_usage su
            WHERE su.user_id = p_user_id
            AND su.service_id = v_service_id
            AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
            AND su.usage_date >= DATE_TRUNC('month', CURRENT_DATE);
            
        ELSE
            -- Default to daily
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM subscription_usage su
            WHERE su.user_id = p_user_id
            AND su.service_id = v_service_id
            AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
            AND su.usage_date = CURRENT_DATE;
    END CASE;
    
    RETURN v_usage_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- ENSURE UPDATE_UPDATED_AT_COLUMN FUNCTION EXISTS
-- ================================

-- This function is referenced in triggers but might be missing
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FIX RECORD_FEATURE_USAGE FUNCTION
-- ================================

-- Ensure the record_feature_usage function works with the correct table structure
CREATE OR REPLACE FUNCTION record_feature_usage(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100) DEFAULT NULL,
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id INTEGER;
    v_service_id INTEGER;
    v_feature_id INTEGER;
BEGIN
    -- Get user's active subscription ID
    SELECT us.id INTO v_subscription_id
    FROM user_subscriptions us
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Get service ID
    SELECT id INTO v_service_id
    FROM subscription_services
    WHERE name = p_service_name;
    
    -- Get feature ID if specified
    IF p_feature_name IS NOT NULL THEN
        SELECT id INTO v_feature_id
        FROM subscription_features
        WHERE service_id = v_service_id AND name = p_feature_name;
    END IF;
    
    IF v_subscription_id IS NULL OR v_service_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Insert or update usage record
    INSERT INTO subscription_usage (
        user_id, subscription_id, service_id, feature_id, usage_date, usage_count, metadata
    ) VALUES (
        p_user_id, v_subscription_id, v_service_id, v_feature_id, CURRENT_DATE, p_usage_count, p_metadata
    )
    ON CONFLICT (user_id, subscription_id, service_id, feature_id, usage_date)
    DO UPDATE SET 
        usage_count = subscription_usage.usage_count + p_usage_count,
        updated_at = NOW(),
        metadata = COALESCE(EXCLUDED.metadata, subscription_usage.metadata);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CREATE COMPREHENSIVE QUOTA CHECK FUNCTION
-- ================================

-- A single function that handles all quota checking logic
CREATE OR REPLACE FUNCTION check_user_quota_comprehensive(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100)
) RETURNS TABLE(
    allowed BOOLEAN,
    quota_limit INTEGER,
    current_usage INTEGER,
    remaining INTEGER,
    is_unlimited BOOLEAN,
    quota_source VARCHAR(20),
    reset_period VARCHAR(20)
) AS $$
DECLARE
    v_override_quota INTEGER;
    v_override_unlimited BOOLEAN;
    v_override_period VARCHAR(20);
    v_subscription_quota INTEGER;
    v_subscription_unlimited BOOLEAN;
    v_current_usage INTEGER := 0;
    v_effective_limit INTEGER;
    v_effective_unlimited BOOLEAN := false;
    v_effective_source VARCHAR(20);
    v_effective_period VARCHAR(20) := 'daily';
BEGIN
    -- 1. Check for user-specific override (highest priority)
    SELECT uqo.quota_limit, uqo.is_unlimited, uqo.reset_period
    INTO v_override_quota, v_override_unlimited, v_override_period
    FROM user_quota_overrides uqo
    WHERE uqo.user_id = p_user_id 
    AND uqo.service_name = p_service_name 
    AND uqo.feature_name = p_feature_name
    AND uqo.is_active = true;
    
    IF FOUND THEN
        v_effective_limit := v_override_quota;
        v_effective_unlimited := v_override_unlimited;
        v_effective_source := 'user_override';
        v_effective_period := v_override_period;
    ELSE
        -- 2. Check subscription plan quota
        SELECT 
            CASE WHEN pfv.feature_value::text = '-1' THEN -1 ELSE (pfv.feature_value::text)::INTEGER END,
            pfv.feature_value::text = '-1'
        INTO v_subscription_quota, v_subscription_unlimited
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN plan_feature_values pfv ON sp.id = pfv.plan_id
        JOIN subscription_features sf ON pfv.feature_id = sf.id
        JOIN subscription_services ss ON sf.service_id = ss.id
        WHERE us.user_id = p_user_id
        AND us.status IN ('active', 'trialing')
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
        AND ss.name = p_service_name
        AND sf.name = p_feature_name
        ORDER BY sp.sort_order DESC
        LIMIT 1;
        
        IF FOUND THEN
            v_effective_limit := v_subscription_quota;
            v_effective_unlimited := v_subscription_unlimited;
            v_effective_source := 'subscription_plan';
            v_effective_period := 'monthly'; -- Subscription plans typically reset monthly
        ELSE
            -- 3. Fallback to system default
            v_effective_limit := 1;
            v_effective_unlimited := false;
            v_effective_source := 'system_default';
            v_effective_period := 'daily';
        END IF;
    END IF;
    
    -- Get current usage
    v_current_usage := get_user_usage(p_user_id, p_service_name, p_feature_name, v_effective_period);
    
    -- Return comprehensive quota information
    RETURN QUERY SELECT 
        (v_effective_unlimited OR v_current_usage < v_effective_limit) as allowed,
        CASE WHEN v_effective_unlimited THEN -1 ELSE v_effective_limit END as quota_limit,
        v_current_usage as current_usage,
        CASE WHEN v_effective_unlimited THEN -1 ELSE GREATEST(0, v_effective_limit - v_current_usage) END as remaining,
        v_effective_unlimited as is_unlimited,
        v_effective_source as quota_source,
        v_effective_period as reset_period;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- CREATE GUEST QUOTA CHECK FUNCTION
-- ================================

-- Comprehensive guest quota checking
CREATE OR REPLACE FUNCTION check_guest_quota_comprehensive(
    p_client_ip VARCHAR(45),
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_machine_fingerprint VARCHAR(32) DEFAULT NULL
) RETURNS TABLE(
    allowed BOOLEAN,
    quota_limit INTEGER,
    current_usage INTEGER,
    remaining INTEGER,
    is_unlimited BOOLEAN,
    quota_source VARCHAR(20),
    reset_period VARCHAR(20)
) AS $$
DECLARE
    v_quota_limit INTEGER;
    v_quota_unlimited BOOLEAN;
    v_reset_period VARCHAR(20);
    v_current_usage INTEGER := 0;
BEGIN
    -- Get global guest quota
    SELECT ggq.quota_limit, ggq.is_unlimited, ggq.reset_period
    INTO v_quota_limit, v_quota_unlimited, v_reset_period
    FROM global_guest_quotas ggq
    WHERE ggq.service_name = p_service_name 
    AND ggq.feature_name = p_feature_name
    AND ggq.is_active = true;
    
    IF NOT FOUND THEN
        -- Fallback to system default
        v_quota_limit := 1;
        v_quota_unlimited := false;
        v_reset_period := 'daily';
    END IF;
    
    -- Get current usage using the existing function
    v_current_usage := get_guest_usage(p_client_ip, p_service_name, p_feature_name, p_machine_fingerprint, v_reset_period);
    
    -- Return comprehensive quota information
    RETURN QUERY SELECT 
        (v_quota_unlimited OR v_current_usage < v_quota_limit) as allowed,
        CASE WHEN v_quota_unlimited THEN -1 ELSE v_quota_limit END as quota_limit,
        v_current_usage as current_usage,
        CASE WHEN v_quota_unlimited THEN -1 ELSE GREATEST(0, v_quota_limit - v_current_usage) END as remaining,
        v_quota_unlimited as is_unlimited,
        CASE WHEN FOUND THEN 'global_guest' ELSE 'system_default' END::VARCHAR(20) as quota_source,
        v_reset_period as reset_period;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Add missing indexes for subscription_usage table queries
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_service_date ON subscription_usage(user_id, service_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_service_feature_date ON subscription_usage(user_id, service_id, feature_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_created_at ON subscription_usage(created_at);

-- ================================
-- VERIFY FUNCTION DEPENDENCIES
-- ================================

-- Ensure all required tables exist with proper structure
DO $$
BEGIN
    -- Check if subscription_usage table has all required columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_usage' AND column_name = 'usage_date'
    ) THEN
        RAISE EXCEPTION 'subscription_usage table missing usage_date column';
    END IF;
    
    -- Check if global_guest_quotas table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'global_guest_quotas'
    ) THEN
        RAISE EXCEPTION 'global_guest_quotas table missing';
    END IF;
    
    -- Check if user_quota_overrides table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_quota_overrides'
    ) THEN
        RAISE EXCEPTION 'user_quota_overrides table missing';
    END IF;
END $$;

-- ================================
-- SUCCESS MESSAGE
-- ================================

SELECT 'Quota system database functions created and verified successfully! 🧙‍♂️✨' as result; 