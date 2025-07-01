-- Migration: Fix Quota Functions (Final Working Version)
-- Description: Creates all missing quota system functions with correct syntax
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- Create the get_user_usage function
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
    SELECT id INTO v_service_id FROM subscription_services WHERE name = p_service_name;
    
    IF v_service_id IS NULL THEN
        RETURN 0;
    END IF;
    
    IF p_feature_name IS NOT NULL THEN
        SELECT id INTO v_feature_id FROM subscription_features WHERE service_id = v_service_id AND name = p_feature_name;
        IF v_feature_id IS NULL THEN
            RETURN 0;
        END IF;
    END IF;
    
    IF p_reset_period = 'daily' THEN
        SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
        FROM subscription_usage su
        WHERE su.user_id = p_user_id
        AND su.service_id = v_service_id
        AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
        AND su.usage_date = CURRENT_DATE;
    ELSIF p_reset_period = 'weekly' THEN
        SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
        FROM subscription_usage su
        WHERE su.user_id = p_user_id
        AND su.service_id = v_service_id
        AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
        AND su.usage_date >= DATE_TRUNC('week', CURRENT_DATE);
    ELSIF p_reset_period = 'monthly' THEN
        SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
        FROM subscription_usage su
        WHERE su.user_id = p_user_id
        AND su.service_id = v_service_id
        AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
        AND su.usage_date >= DATE_TRUNC('month', CURRENT_DATE);
    ELSE
        SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
        FROM subscription_usage su
        WHERE su.user_id = p_user_id
        AND su.service_id = v_service_id
        AND (v_feature_id IS NULL OR su.feature_id = v_feature_id)
        AND su.usage_date = CURRENT_DATE;
    END IF;
    
    RETURN v_usage_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix the record_feature_usage function
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
    SELECT us.id INTO v_subscription_id
    FROM user_subscriptions us
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    SELECT id INTO v_service_id FROM subscription_services WHERE name = p_service_name;
    
    IF p_feature_name IS NOT NULL THEN
        SELECT id INTO v_feature_id FROM subscription_features WHERE service_id = v_service_id AND name = p_feature_name;
    END IF;
    
    IF v_subscription_id IS NULL AND v_service_id IS NOT NULL THEN
        INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle)
        VALUES (p_user_id, 1, 'active', 'monthly')
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_subscription_id;
        
        IF v_subscription_id IS NULL THEN
            SELECT us.id INTO v_subscription_id
            FROM user_subscriptions us
            WHERE us.user_id = p_user_id
            ORDER BY us.created_at DESC
            LIMIT 1;
        END IF;
    END IF;
    
    IF v_subscription_id IS NULL OR v_service_id IS NULL THEN
        RETURN false;
    END IF;
    
    INSERT INTO subscription_usage (user_id, subscription_id, service_id, feature_id, usage_date, usage_count, metadata)
    VALUES (p_user_id, v_subscription_id, v_service_id, v_feature_id, CURRENT_DATE, p_usage_count, p_metadata)
    ON CONFLICT (user_id, subscription_id, service_id, feature_id, usage_date)
    DO UPDATE SET 
        usage_count = subscription_usage.usage_count + p_usage_count,
        updated_at = NOW(),
        metadata = COALESCE(EXCLUDED.metadata, subscription_usage.metadata);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Ensure required data exists
INSERT INTO subscription_services (name, display_name, description, category, is_core_service, is_standalone, is_active)
VALUES ('og_generator', 'OG Image Generator', 'Social media card generation service', 'premium', false, true, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO subscription_features (service_id, name, display_name, description, feature_type, default_value)
SELECT ss.id, 'daily_generations', 'Daily Generations', 'Number of images that can be generated per day', 'limit', '1'
FROM subscription_services ss
WHERE ss.name = 'og_generator'
ON CONFLICT (service_id, name) DO NOTHING;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_service_date ON subscription_usage(user_id, service_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_service_feature_date ON subscription_usage(user_id, service_id, feature_id, usage_date); 