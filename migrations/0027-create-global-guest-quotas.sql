-- Migration: Create Global Guest Quota System
-- Description: Adds support for global quota settings for guest/anonymous users with feature-level control
-- Author: System
-- Date: 2025-01-01

-- ================================
-- GLOBAL GUEST QUOTAS TABLE
-- ================================

CREATE TABLE global_guest_quotas (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Quota configuration
    quota_limit INTEGER NOT NULL DEFAULT 1,
    is_unlimited BOOLEAN DEFAULT false,
    
    -- Time window configuration
    reset_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (reset_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    -- Admin configuration
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(service_name, feature_name),
    CHECK (quota_limit >= 0 OR is_unlimited = true),
    
    -- Foreign key constraint to ensure service/feature exists
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- ================================
-- GUEST USAGE TRACKING TABLE
-- ================================

CREATE TABLE guest_usage_tracking (
    id SERIAL PRIMARY KEY,
    
    -- Guest identification (IP-based with optional fingerprinting)
    client_ip VARCHAR(45) NOT NULL,
    machine_fingerprint VARCHAR(32),
    user_agent_hash VARCHAR(64), -- Hashed for privacy
    
    -- Service/feature tracking
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Usage data
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 1,
    
    -- Context metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(client_ip, machine_fingerprint, service_name, feature_name, usage_date),
    CHECK (usage_count >= 0),
    
    -- Foreign key constraint
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- ================================
-- USER QUOTA OVERRIDES TABLE
-- ================================

CREATE TABLE user_quota_overrides (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Override configuration
    quota_limit INTEGER,
    is_unlimited BOOLEAN DEFAULT false,
    
    -- Admin tracking
    created_by INTEGER REFERENCES users(id),
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, service_name, feature_name),
    CHECK (quota_limit IS NULL OR quota_limit >= 0 OR is_unlimited = true),
    
    -- Foreign key constraint
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Global guest quotas
CREATE INDEX idx_global_guest_quotas_service ON global_guest_quotas(service_name);
CREATE INDEX idx_global_guest_quotas_feature ON global_guest_quotas(service_name, feature_name);
CREATE INDEX idx_global_guest_quotas_active ON global_guest_quotas(is_active) WHERE is_active = true;

-- Guest usage tracking
CREATE INDEX idx_guest_usage_ip_date ON guest_usage_tracking(client_ip, usage_date);
CREATE INDEX idx_guest_usage_fingerprint_date ON guest_usage_tracking(machine_fingerprint, usage_date) WHERE machine_fingerprint IS NOT NULL;
CREATE INDEX idx_guest_usage_service_date ON guest_usage_tracking(service_name, feature_name, usage_date);
CREATE INDEX idx_guest_usage_cleanup ON guest_usage_tracking(usage_date); -- For cleanup jobs

-- User quota overrides
CREATE INDEX idx_user_quota_overrides_user ON user_quota_overrides(user_id);
CREATE INDEX idx_user_quota_overrides_service ON user_quota_overrides(service_name, feature_name);

-- ================================
-- INSERT DEFAULT GLOBAL GUEST QUOTAS
-- ================================

INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period, description, created_by) VALUES
-- OG Generator - Default guest quota
('og_generator', 'daily_generations', 1, 'daily', 'Default daily generation limit for anonymous users', 1),

-- Custom Emoji - No guest access (requires authentication)
('custom_emoji', 'emoji_slots', 0, 'daily', 'Custom emojis require user account', 1),

-- API Access - Limited guest access
('api_access', 'api_requests', 100, 'hourly', 'API rate limit for anonymous users', 1),

-- Future features can be added here
('content_system', 'daily_posts', 5, 'daily', 'Daily content creation limit for guests', 1);

-- ================================
-- FUNCTIONS FOR QUOTA MANAGEMENT
-- ================================

-- Function to get effective quota for a user (with override support)
CREATE OR REPLACE FUNCTION get_effective_user_quota(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100)
) RETURNS TABLE(
    quota_limit INTEGER,
    is_unlimited BOOLEAN,
    source VARCHAR(20) -- 'override', 'subscription', 'default'
) AS $$
DECLARE
    v_override_quota INTEGER;
    v_override_unlimited BOOLEAN;
    v_subscription_quota INTEGER;
    v_subscription_unlimited BOOLEAN;
BEGIN
    -- Check for user-specific override first
    SELECT uqo.quota_limit, uqo.is_unlimited 
    INTO v_override_quota, v_override_unlimited
    FROM user_quota_overrides uqo
    WHERE uqo.user_id = p_user_id 
    AND uqo.service_name = p_service_name 
    AND uqo.feature_name = p_feature_name;
    
    IF FOUND THEN
        RETURN QUERY SELECT v_override_quota, v_override_unlimited, 'override'::VARCHAR(20);
        RETURN;
    END IF;
    
    -- Fall back to subscription-based quota
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
        RETURN QUERY SELECT v_subscription_quota, v_subscription_unlimited, 'subscription'::VARCHAR(20);
        RETURN;
    END IF;
    
    -- Fall back to default subscription feature value
    SELECT 
        CASE WHEN sf.default_value::text = '-1' THEN -1 ELSE (sf.default_value::text)::INTEGER END,
        sf.default_value::text = '-1'
    INTO v_subscription_quota, v_subscription_unlimited
    FROM subscription_features sf
    JOIN subscription_services ss ON sf.service_id = ss.id
    WHERE ss.name = p_service_name AND sf.name = p_feature_name;
    
    IF FOUND THEN
        RETURN QUERY SELECT v_subscription_quota, v_subscription_unlimited, 'default'::VARCHAR(20);
    ELSE
        -- No quota found
        RETURN QUERY SELECT 0, false, 'none'::VARCHAR(20);
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get guest quota
CREATE OR REPLACE FUNCTION get_guest_quota(
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100)
) RETURNS TABLE(
    quota_limit INTEGER,
    is_unlimited BOOLEAN,
    reset_period VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY 
    SELECT ggq.quota_limit, ggq.is_unlimited, ggq.reset_period
    FROM global_guest_quotas ggq
    WHERE ggq.service_name = p_service_name 
    AND ggq.feature_name = p_feature_name
    AND ggq.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record guest usage
CREATE OR REPLACE FUNCTION record_guest_usage(
    p_client_ip VARCHAR(45),
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_machine_fingerprint VARCHAR(32) DEFAULT NULL,
    p_user_agent_hash VARCHAR(64) DEFAULT NULL,
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update guest usage
    INSERT INTO guest_usage_tracking (
        client_ip, service_name, feature_name, machine_fingerprint, user_agent_hash,
        usage_date, usage_count, metadata
    ) VALUES (
        p_client_ip, p_service_name, p_feature_name, p_machine_fingerprint, p_user_agent_hash,
        CURRENT_DATE, p_usage_count, p_metadata
    )
    ON CONFLICT (client_ip, machine_fingerprint, service_name, feature_name, usage_date)
    DO UPDATE SET 
        usage_count = guest_usage_tracking.usage_count + p_usage_count,
        updated_at = NOW(),
        metadata = COALESCE(p_metadata, guest_usage_tracking.metadata);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get current guest usage
CREATE OR REPLACE FUNCTION get_guest_usage(
    p_client_ip VARCHAR(45),
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_machine_fingerprint VARCHAR(32) DEFAULT NULL,
    p_reset_period VARCHAR(20) DEFAULT 'daily'
) RETURNS INTEGER AS $$
DECLARE
    v_usage_count INTEGER := 0;
    v_date_filter DATE;
BEGIN
    -- Determine date filter based on reset period
    CASE p_reset_period
        WHEN 'hourly' THEN
            -- Get usage from current hour
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM guest_usage_tracking
            WHERE client_ip = p_client_ip
            AND (machine_fingerprint = p_machine_fingerprint OR (machine_fingerprint IS NULL AND p_machine_fingerprint IS NULL))
            AND service_name = p_service_name
            AND feature_name = p_feature_name
            AND created_at >= DATE_TRUNC('hour', NOW());
            
        WHEN 'daily' THEN
            -- Get usage from current day
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM guest_usage_tracking
            WHERE client_ip = p_client_ip
            AND (machine_fingerprint = p_machine_fingerprint OR (machine_fingerprint IS NULL AND p_machine_fingerprint IS NULL))
            AND service_name = p_service_name
            AND feature_name = p_feature_name
            AND usage_date = CURRENT_DATE;
            
        WHEN 'weekly' THEN
            -- Get usage from current week
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM guest_usage_tracking
            WHERE client_ip = p_client_ip
            AND (machine_fingerprint = p_machine_fingerprint OR (machine_fingerprint IS NULL AND p_machine_fingerprint IS NULL))
            AND service_name = p_service_name
            AND feature_name = p_feature_name
            AND usage_date >= DATE_TRUNC('week', CURRENT_DATE);
            
        WHEN 'monthly' THEN
            -- Get usage from current month
            SELECT COALESCE(SUM(usage_count), 0) INTO v_usage_count
            FROM guest_usage_tracking
            WHERE client_ip = p_client_ip
            AND (machine_fingerprint = p_machine_fingerprint OR (machine_fingerprint IS NULL AND p_machine_fingerprint IS NULL))
            AND service_name = p_service_name
            AND feature_name = p_feature_name
            AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);
    END CASE;
    
    RETURN v_usage_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- TRIGGERS
-- ================================

-- Update timestamp triggers
CREATE TRIGGER update_global_guest_quotas_updated_at 
    BEFORE UPDATE ON global_guest_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_usage_tracking_updated_at 
    BEFORE UPDATE ON guest_usage_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quota_overrides_updated_at 
    BEFORE UPDATE ON user_quota_overrides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE global_guest_quotas IS 'Global quota settings for anonymous/guest users with feature-level granularity';
COMMENT ON TABLE guest_usage_tracking IS 'Tracks usage for anonymous users by IP address and optional machine fingerprint';
COMMENT ON TABLE user_quota_overrides IS 'Admin-configured quota overrides for specific users, bypassing subscription limits';

COMMENT ON COLUMN global_guest_quotas.reset_period IS 'Time period for quota reset: hourly, daily, weekly, monthly';
COMMENT ON COLUMN guest_usage_tracking.machine_fingerprint IS 'Optional machine fingerprint for more accurate guest tracking';
COMMENT ON COLUMN guest_usage_tracking.user_agent_hash IS 'Hashed user agent for privacy-preserving tracking';
COMMENT ON COLUMN user_quota_overrides.reason IS 'Admin reason for quota override (required for audit trail)';

-- Success message
SELECT 'Global guest quota system created successfully' as result; 