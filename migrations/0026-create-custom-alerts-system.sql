-- Migration: Create Custom Alerts System
-- Description: Creates database infrastructure for custom alerts that can be managed through admin dashboard
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- ================================
-- CUSTOM ALERTS TABLE
-- ================================

CREATE TABLE custom_alerts (
    id SERIAL PRIMARY KEY,
    
    -- Alert identification
    title VARCHAR(200) NOT NULL,
    message TEXT,
    details TEXT,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success', 'maintenance', 'custom'
    
    -- Targeting and scheduling
    target_audience VARCHAR(50) NOT NULL DEFAULT 'all', -- 'all', 'authenticated', 'subscribers', 'admins', 'role_based'
    target_roles JSONB, -- Array of role names for role-based targeting
    target_users JSONB, -- Array of user IDs for specific user targeting
    
    -- Display configuration
    priority INTEGER DEFAULT 0, -- Higher numbers show first
    icon VARCHAR(20), -- Emoji or icon identifier
    dismissible BOOLEAN DEFAULT true,
    persistent BOOLEAN DEFAULT false, -- Survives page reloads when dismissed
    
    -- Scheduling
    start_date TIMESTAMP WITH TIME ZONE, -- When to start showing
    end_date TIMESTAMP WITH TIME ZONE, -- When to stop showing
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-dismiss after this time
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false, -- Draft vs published
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional configuration
    actions JSONB, -- Array of action buttons with labels and actions
    metadata JSONB, -- Flexible field for additional configuration
    
    -- Constraints
    CHECK (alert_type IN ('info', 'warning', 'error', 'success', 'maintenance', 'custom')),
    CHECK (target_audience IN ('all', 'authenticated', 'subscribers', 'admins', 'role_based', 'specific_users')),
    CHECK (priority >= -100 AND priority <= 100),
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- ================================
-- ALERT DISMISSALS TRACKING
-- ================================

CREATE TABLE alert_dismissals (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES custom_alerts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(alert_id, user_id)
);

-- ================================
-- ALERT ANALYTICS
-- ================================

CREATE TABLE alert_analytics (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES custom_alerts(id) ON DELETE CASCADE,
    
    -- Metrics
    total_views INTEGER DEFAULT 0,
    total_dismissals INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0, -- Percentage as decimal
    
    -- Time-based metrics
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Constraints
    UNIQUE(alert_id, date)
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Primary query indexes
CREATE INDEX idx_custom_alerts_active_published ON custom_alerts(is_active, is_published) WHERE is_active = true AND is_published = true;
CREATE INDEX idx_custom_alerts_scheduling ON custom_alerts(start_date, end_date, expires_at) WHERE is_published = true;
CREATE INDEX idx_custom_alerts_priority ON custom_alerts(priority DESC) WHERE is_active = true AND is_published = true;
CREATE INDEX idx_custom_alerts_target_audience ON custom_alerts(target_audience) WHERE is_active = true AND is_published = true;
CREATE INDEX idx_custom_alerts_created_by ON custom_alerts(created_by);

-- Dismissal tracking indexes
CREATE INDEX idx_alert_dismissals_alert_id ON alert_dismissals(alert_id);
CREATE INDEX idx_alert_dismissals_user_id ON alert_dismissals(user_id);

-- Analytics indexes
CREATE INDEX idx_alert_analytics_alert_id ON alert_analytics(alert_id);
CREATE INDEX idx_alert_analytics_date ON alert_analytics(date);

-- ================================
-- HELPER FUNCTIONS
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
-- TRIGGERS
-- ================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_alerts_updated_at
    BEFORE UPDATE ON custom_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_alerts_updated_at();

-- ================================
-- INITIAL DATA
-- ================================

-- Insert a welcome alert for demonstration
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
    1 -- Assuming user ID 1 exists (admin)
) ON CONFLICT DO NOTHING;

-- ================================
-- PERMISSIONS INTEGRATION
-- ================================

-- Add permissions for alert management
INSERT INTO permissions (name, display_name, description, category, is_system) VALUES
('admin.alerts.view', 'View Custom Alerts', 'View custom alert configurations and analytics', 'admin', true),
('admin.alerts.create', 'Create Custom Alerts', 'Create new custom alerts', 'admin', true),
('admin.alerts.edit', 'Edit Custom Alerts', 'Edit existing custom alerts', 'admin', true),
('admin.alerts.delete', 'Delete Custom Alerts', 'Delete custom alerts', 'admin', true),
('admin.alerts.publish', 'Publish Custom Alerts', 'Publish/unpublish custom alerts', 'admin', true),
('admin.alerts.analytics', 'View Alert Analytics', 'Access alert performance analytics', 'admin', true)
ON CONFLICT (name) DO NOTHING;

-- Assign alert permissions to admin role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'admin' 
AND p.name LIKE 'admin.alerts.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE custom_alerts IS 'Custom alerts that can be displayed to users based on targeting rules and scheduling';
COMMENT ON TABLE alert_dismissals IS 'Tracks which users have dismissed which alerts';
COMMENT ON TABLE alert_analytics IS 'Analytics data for alert performance tracking';

COMMENT ON COLUMN custom_alerts.target_audience IS 'Who should see this alert: all, authenticated, subscribers, admins, role_based, specific_users';
COMMENT ON COLUMN custom_alerts.target_roles IS 'JSON array of role names for role-based targeting';
COMMENT ON COLUMN custom_alerts.target_users IS 'JSON array of user IDs for specific user targeting';
COMMENT ON COLUMN custom_alerts.priority IS 'Display priority (-100 to 100, higher numbers show first)';
COMMENT ON COLUMN custom_alerts.persistent IS 'Whether dismissal survives page reloads';
COMMENT ON COLUMN custom_alerts.actions IS 'JSON array of action buttons with labels and handlers';
COMMENT ON COLUMN custom_alerts.metadata IS 'Flexible JSON field for additional configuration';

-- Success message
SELECT 'Custom alerts system created successfully! 🎉' as result; 