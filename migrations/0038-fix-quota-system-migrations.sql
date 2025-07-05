-- Migration: Fix Failed Quota System Migrations
-- Description: Resolves foreign key constraint issues in migrations 0026 and 0027
-- Author: System
-- Date: 2025-01-29

-- ================================
-- DROP EXISTING FUNCTIONS TO AVOID CONFLICTS
-- ================================

-- Drop functions with CASCADE to handle dependencies and all possible signatures
DROP FUNCTION IF EXISTS get_effective_user_quota CASCADE;
DROP FUNCTION IF EXISTS get_guest_quota CASCADE;
DROP FUNCTION IF EXISTS record_guest_usage CASCADE;
DROP FUNCTION IF EXISTS get_guest_usage CASCADE;

-- Also drop any potential variations with different parameter types
DROP FUNCTION IF EXISTS get_effective_user_quota(INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_guest_quota(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_guest_usage(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_guest_usage(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- ================================
-- FIX MIGRATION 0026: Custom Alerts System
-- ================================

-- First, ensure we have the custom_alerts table structure
CREATE TABLE IF NOT EXISTS custom_alerts (
    id SERIAL PRIMARY KEY,
    
    -- Alert identification
    title VARCHAR(200) NOT NULL,
    message TEXT,
    details TEXT,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'info',
    
    -- Targeting and scheduling
    target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
    target_roles JSONB,
    target_users JSONB,
    
    -- Display configuration
    priority INTEGER DEFAULT 0,
    icon VARCHAR(20),
    dismissible BOOLEAN DEFAULT true,
    persistent BOOLEAN DEFAULT false,
    
    -- Scheduling
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional configuration
    actions JSONB,
    metadata JSONB,
    
    -- Constraints
    CHECK (alert_type IN ('info', 'warning', 'error', 'success', 'maintenance', 'custom')),
    CHECK (target_audience IN ('all', 'authenticated', 'subscribers', 'admins', 'role_based', 'specific_users')),
    CHECK (priority >= -100 AND priority <= 100),
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- Create alert dismissals table
CREATE TABLE IF NOT EXISTS alert_dismissals (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES custom_alerts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(alert_id, user_id)
);

-- Create alert analytics table
CREATE TABLE IF NOT EXISTS alert_analytics (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES custom_alerts(id) ON DELETE CASCADE,
    
    total_views INTEGER DEFAULT 0,
    total_dismissals INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0,
    
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    UNIQUE(alert_id, date)
);

-- ================================
-- FIX MIGRATION 0027: Global Guest Quotas
-- ================================

-- Create global guest quotas table
CREATE TABLE IF NOT EXISTS global_guest_quotas (
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

-- Create guest usage tracking table
CREATE TABLE IF NOT EXISTS guest_usage_tracking (
    id SERIAL PRIMARY KEY,
    
    -- Guest identification
    client_ip VARCHAR(45) NOT NULL,
    machine_fingerprint VARCHAR(32),
    user_agent_hash VARCHAR(64),
    
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

-- Create user quota overrides table
CREATE TABLE IF NOT EXISTS user_quota_overrides (
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
-- CREATE INDEXES
-- ================================

-- Custom alerts indexes
CREATE INDEX IF NOT EXISTS idx_custom_alerts_active_published ON custom_alerts(is_active, is_published) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_scheduling ON custom_alerts(start_date, end_date, expires_at) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_priority ON custom_alerts(priority DESC) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_target_audience ON custom_alerts(target_audience) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_created_by ON custom_alerts(created_by);

-- Alert dismissals indexes
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_alert_id ON alert_dismissals(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_user_id ON alert_dismissals(user_id);

-- Alert analytics indexes
CREATE INDEX IF NOT EXISTS idx_alert_analytics_alert_id ON alert_analytics(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_date ON alert_analytics(date);

-- Global guest quotas indexes
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_service ON global_guest_quotas(service_name);
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_feature ON global_guest_quotas(service_name, feature_name);
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_active ON global_guest_quotas(is_active) WHERE is_active = true;

-- Guest usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_guest_usage_ip_date ON guest_usage_tracking(client_ip, usage_date);
CREATE INDEX IF NOT EXISTS idx_guest_usage_fingerprint_date ON guest_usage_tracking(machine_fingerprint, usage_date) WHERE machine_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guest_usage_service_date ON guest_usage_tracking(service_name, feature_name, usage_date);
CREATE INDEX IF NOT EXISTS idx_guest_usage_cleanup ON guest_usage_tracking(usage_date);

-- User quota overrides indexes
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_user ON user_quota_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_service ON user_quota_overrides(service_name, feature_name);

-- ================================
-- INSERT DEFAULT GLOBAL GUEST QUOTAS (WITHOUT CREATED_BY)
-- ================================

INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period, description) 
VALUES
('og_generator', 'daily_generations', 1, 'daily', 'Default daily generation limit for anonymous users'),
('custom_emoji', 'emoji_slots', 0, 'daily', 'Custom emojis require user account'),
('api_access', 'api_requests', 100, 'hourly', 'API rate limit for anonymous users'),
('content_system', 'daily_posts', 5, 'daily', 'Daily content creation limit for guests')
ON CONFLICT (service_name, feature_name) DO NOTHING;

-- ================================
-- CREATE QUOTA MANAGEMENT FUNCTIONS
-- ================================

-- Function to get effective quota for a user
CREATE OR REPLACE FUNCTION get_effective_user_quota(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100)
) RETURNS TABLE(
    quota_limit INTEGER,
    is_unlimited BOOLEAN,
    source VARCHAR(20)
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
    WHERE ss.name = p_service_name
    AND sf.name = p_feature_name
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT v_subscription_quota, v_subscription_unlimited, 'default'::VARCHAR(20);
        RETURN;
    END IF;
    
    -- Ultimate fallback
    RETURN QUERY SELECT 1, false, 'system'::VARCHAR(20);
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
    AND ggq.is_active = true
    LIMIT 1;
    
    -- If no specific quota found, return default
    IF NOT FOUND THEN
        RETURN QUERY SELECT 1, false, 'daily'::VARCHAR(20);
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record guest usage
CREATE OR REPLACE FUNCTION record_guest_usage(
    p_client_ip VARCHAR(45),
    p_machine_fingerprint VARCHAR(32),
    p_user_agent_hash VARCHAR(64),
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_new_usage_count INTEGER;
BEGIN
    INSERT INTO guest_usage_tracking (
        client_ip, machine_fingerprint, user_agent_hash,
        service_name, feature_name, usage_count, metadata
    ) VALUES (
        p_client_ip, p_machine_fingerprint, p_user_agent_hash,
        p_service_name, p_feature_name, p_usage_count, p_metadata
    )
    ON CONFLICT (client_ip, machine_fingerprint, service_name, feature_name, usage_date)
    DO UPDATE SET 
        usage_count = guest_usage_tracking.usage_count + p_usage_count,
        updated_at = NOW(),
        metadata = COALESCE(p_metadata, guest_usage_tracking.metadata)
    RETURNING usage_count INTO v_new_usage_count;
    
    RETURN v_new_usage_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get guest usage
CREATE OR REPLACE FUNCTION get_guest_usage(
    p_client_ip VARCHAR(45),
    p_machine_fingerprint VARCHAR(32),
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100),
    p_reset_period VARCHAR(20) DEFAULT 'daily'
) RETURNS INTEGER AS $$
DECLARE
    v_usage_count INTEGER := 0;
    v_start_date DATE;
BEGIN
    -- Calculate start date based on reset period
    CASE p_reset_period
        WHEN 'hourly' THEN
            v_start_date := CURRENT_DATE;
        WHEN 'daily' THEN
            v_start_date := CURRENT_DATE;
        WHEN 'weekly' THEN
            v_start_date := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'monthly' THEN
            v_start_date := CURRENT_DATE - INTERVAL '30 days';
        ELSE
            v_start_date := CURRENT_DATE;
    END CASE;
    
    SELECT COALESCE(SUM(gut.usage_count), 0)
    INTO v_usage_count
    FROM guest_usage_tracking gut
    WHERE gut.client_ip = p_client_ip
    AND (p_machine_fingerprint IS NULL OR gut.machine_fingerprint = p_machine_fingerprint)
    AND gut.service_name = p_service_name
    AND gut.feature_name = p_feature_name
    AND gut.usage_date >= v_start_date;
    
    RETURN v_usage_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- CREATE TRIGGERS
-- ================================

-- Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_global_guest_quotas_updated_at') THEN
        CREATE TRIGGER update_global_guest_quotas_updated_at 
            BEFORE UPDATE ON global_guest_quotas 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_guest_usage_tracking_updated_at') THEN
        CREATE TRIGGER update_guest_usage_tracking_updated_at 
            BEFORE UPDATE ON guest_usage_tracking 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_quota_overrides_updated_at') THEN
        CREATE TRIGGER update_user_quota_overrides_updated_at 
            BEFORE UPDATE ON user_quota_overrides 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_alerts_updated_at') THEN
        CREATE TRIGGER update_custom_alerts_updated_at 
            BEFORE UPDATE ON custom_alerts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;