-- Migration: Create Missing Alert Functions
-- Description: Creates the missing database functions for the alert system that failed in migration 0026
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- ALERT HELPER FUNCTIONS
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
-- SUCCESS MESSAGE
-- ================================

SELECT 'Created missing alert system functions successfully' as result; 