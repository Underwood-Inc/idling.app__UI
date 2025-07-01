-- Migration: Fix All Quota System Issues
-- Description: Comprehensive fix for all quota system database issues - can be run repeatedly
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- FIX CUSTOM ALERTS SYSTEM
-- ================================

-- Create custom_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'info',
    target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
    target_roles JSONB,
    target_users JSONB,
    priority INTEGER NOT NULL DEFAULT 50,
    icon VARCHAR(20),
    dismissible BOOLEAN DEFAULT true,
    persistent BOOLEAN DEFAULT false,
    actions JSONB,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (priority >= 0 AND priority <= 100),
    CHECK (target_audience IN ('all', 'authenticated', 'subscribers', 'admins', 'role_based', 'specific_users'))
);

-- Create indexes for custom_alerts
CREATE INDEX IF NOT EXISTS idx_custom_alerts_active_published ON custom_alerts(is_active, is_published) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_scheduling ON custom_alerts(start_date, end_date, expires_at) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_priority ON custom_alerts(priority DESC) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_target_audience ON custom_alerts(target_audience) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_custom_alerts_created_by ON custom_alerts(created_by);

-- Make created_by nullable in custom_alerts table for system records (safe to run even if already nullable)
ALTER TABLE custom_alerts 
ALTER COLUMN created_by DROP NOT NULL;

-- Create missing alert tables if they don't exist
CREATE TABLE IF NOT EXISTS alert_dismissals (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES custom_alerts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alert_id, user_id)
);

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

-- Create indexes for alert tables
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_alert_id ON alert_dismissals(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_user_id ON alert_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_alert_id ON alert_analytics(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_date ON alert_analytics(date);

-- Insert the welcome alert with NULL created_by (system record)
INSERT INTO custom_alerts (
    title, message, details, alert_type, target_audience, priority,
    icon, dismissible, persistent, is_active, is_published, created_by
) VALUES (
    'Welcome to the Enhanced Alert System! 🎉',
    'We''ve upgraded our notification system to provide better, more targeted alerts.',
    'You can now dismiss alerts, and administrators can create custom notifications for different user groups.',
    'info',
    'all',
    10,
    '🎉',
    true,
    false,
    true,
    true,
    NULL -- System-created record, no specific user
) ON CONFLICT DO NOTHING;

-- ================================
-- CREATE QUOTA SYSTEM TABLES
-- ================================

-- Create global guest quotas table
CREATE TABLE IF NOT EXISTS global_guest_quotas (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    quota_limit INTEGER NOT NULL DEFAULT 1,
    is_unlimited BOOLEAN DEFAULT false,
    reset_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (reset_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_name, feature_name),
    CHECK (quota_limit >= 0 OR is_unlimited = true),
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- Create guest usage tracking table
CREATE TABLE IF NOT EXISTS guest_usage_tracking (
    id SERIAL PRIMARY KEY,
    client_ip VARCHAR(45) NOT NULL,
    machine_fingerprint VARCHAR(32),
    user_agent_hash VARCHAR(64),
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_ip, machine_fingerprint, service_name, feature_name, usage_date),
    CHECK (usage_count >= 0),
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- Create user quota overrides table
CREATE TABLE IF NOT EXISTS user_quota_overrides (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    quota_limit INTEGER,
    is_unlimited BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    reset_period VARCHAR(20) DEFAULT 'monthly',
    created_by INTEGER REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_name, feature_name),
    CHECK (quota_limit IS NULL OR quota_limit >= 0 OR is_unlimited = true),
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

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
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_active ON user_quota_overrides(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_lookup ON user_quota_overrides(user_id, service_name, feature_name, is_active) WHERE is_active = true;

-- ================================
-- CREATE UPDATE TRIGGERS
-- ================================

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_global_guest_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_guest_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_quota_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers to ensure they exist
DROP TRIGGER IF EXISTS trigger_global_guest_quotas_updated_at ON global_guest_quotas;
CREATE TRIGGER trigger_global_guest_quotas_updated_at
    BEFORE UPDATE ON global_guest_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_global_guest_quotas_updated_at();

DROP TRIGGER IF EXISTS trigger_guest_usage_tracking_updated_at ON guest_usage_tracking;
CREATE TRIGGER trigger_guest_usage_tracking_updated_at
    BEFORE UPDATE ON guest_usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_usage_tracking_updated_at();

DROP TRIGGER IF EXISTS trigger_user_quota_overrides_updated_at ON user_quota_overrides;
CREATE TRIGGER trigger_user_quota_overrides_updated_at
    BEFORE UPDATE ON user_quota_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_user_quota_overrides_updated_at();

-- ================================
-- CREATE ALERT SYSTEM FUNCTIONS
-- ================================

-- Function to get active alerts for a specific user
CREATE OR REPLACE FUNCTION get_active_alerts_for_user(p_user_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    title VARCHAR(200),
    message TEXT,
    details TEXT,
    alert_type VARCHAR(50),
    priority INTEGER,
    icon VARCHAR(20),
    dismissible BOOLEAN,
    persistent BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE,
    actions JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.title,
        ca.message,
        ca.details,
        ca.alert_type,
        ca.priority,
        ca.icon,
        ca.dismissible,
        ca.persistent,
        ca.expires_at,
        ca.actions,
        ca.metadata
    FROM custom_alerts ca
    LEFT JOIN alert_dismissals ad ON ca.id = ad.alert_id AND ad.user_id = p_user_id
    WHERE ca.is_active = true
        AND ca.is_published = true
        AND (ca.start_date IS NULL OR ca.start_date <= NOW())
        AND (ca.end_date IS NULL OR ca.end_date >= NOW())
        AND (ca.expires_at IS NULL OR ca.expires_at >= NOW())
        AND ad.id IS NULL -- Not dismissed by this user
        AND (
            ca.target_audience = 'all'
            OR (ca.target_audience = 'authenticated' AND p_user_id IS NOT NULL)
            OR (ca.target_audience = 'subscribers' AND EXISTS (
                SELECT 1 FROM user_subscriptions us 
                WHERE us.user_id = p_user_id AND us.status IN ('active', 'trialing')
            ))
            OR (ca.target_audience = 'admins' AND EXISTS (
                SELECT 1 FROM user_role_assignments ura
                JOIN user_roles ur ON ura.role_id = ur.id
                WHERE ura.user_id = p_user_id 
                    AND ura.is_active = true 
                    AND ur.name IN ('admin', 'moderator')
            ))
            OR (ca.target_audience = 'role_based' AND EXISTS (
                SELECT 1 FROM user_role_assignments ura
                JOIN user_roles ur ON ura.role_id = ur.id
                WHERE ura.user_id = p_user_id 
                    AND ura.is_active = true 
                    AND ur.name = ANY(SELECT jsonb_array_elements_text(ca.target_roles))
            ))
            OR (ca.target_audience = 'specific_users' AND p_user_id = ANY(
                SELECT (jsonb_array_elements(ca.target_users))::text::integer
            ))
        )
    ORDER BY ca.priority DESC, ca.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to dismiss an alert for a user
CREATE OR REPLACE FUNCTION dismiss_alert_for_user(p_alert_id INTEGER, p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    alert_exists BOOLEAN;
BEGIN
    -- Check if alert exists and is dismissible
    SELECT EXISTS (
        SELECT 1 FROM custom_alerts 
        WHERE id = p_alert_id AND dismissible = true
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
        RETURN false;
    END IF;
    
    -- Insert dismissal record
    INSERT INTO alert_dismissals (alert_id, user_id)
    VALUES (p_alert_id, p_user_id)
    ON CONFLICT (alert_id, user_id) DO NOTHING;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to update alert analytics
CREATE OR REPLACE FUNCTION update_alert_analytics(
    p_alert_id INTEGER,
    p_action VARCHAR(20) -- 'view', 'dismiss', 'click'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO alert_analytics (alert_id, date, total_views, total_dismissals, unique_viewers)
    VALUES (p_alert_id, CURRENT_DATE, 
        CASE WHEN p_action = 'view' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'dismiss' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'view' THEN 1 ELSE 0 END
    )
    ON CONFLICT (alert_id, date) 
    DO UPDATE SET
        total_views = alert_analytics.total_views + CASE WHEN p_action = 'view' THEN 1 ELSE 0 END,
        total_dismissals = alert_analytics.total_dismissals + CASE WHEN p_action = 'dismiss' THEN 1 ELSE 0 END,
        unique_viewers = alert_analytics.unique_viewers + CASE WHEN p_action = 'view' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- INSERT DEFAULT DATA
-- ================================

-- Insert default global guest quotas with NULL created_by (system records)
INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period, description, created_by) VALUES
-- OG Generator - Default guest quota
('og_generator', 'daily_generations', 1, 'daily', 'Default daily generation limit for anonymous users', NULL),

-- Custom Emoji - No guest access (requires authentication)
('custom_emoji', 'emoji_slots', 0, 'daily', 'Custom emojis require user account', NULL),

-- API Access - Limited guest access
('api_access', 'api_requests', 100, 'hourly', 'API rate limit for anonymous users', NULL),

-- Future features can be added here
('content_system', 'daily_posts', 5, 'daily', 'Daily content creation limit for guests', NULL)
ON CONFLICT (service_name, feature_name) DO NOTHING;

-- ================================
-- SUCCESS MESSAGE
-- ================================

SELECT 'Fixed all quota system issues - tables, functions, and data created successfully' as result; 