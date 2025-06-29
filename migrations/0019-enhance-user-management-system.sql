-- Migration: Enhance User Management System
-- Description: Adds additional roles and ensures compatibility with the new admin user management interface
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- ADD ADDITIONAL USER ROLES
-- ================================

-- Insert additional roles for testing and management
INSERT INTO user_roles (name, display_name, description, is_default, is_system) VALUES
('content_creator', 'Content Creator', 'Enhanced content creation capabilities with additional features', false, false),
('community_manager', 'Community Manager', 'Community management and user engagement capabilities', false, false),
('beta_tester', 'Beta Tester', 'Access to beta features and testing capabilities', false, false),
('vip_user', 'VIP User', 'Premium user with enhanced privileges', false, false),
('content_reviewer', 'Content Reviewer', 'Review and moderate user-generated content', false, false)
ON CONFLICT (name) DO NOTHING;

-- ================================
-- ADD ENHANCED PERMISSIONS
-- ================================

-- Insert additional permissions for enhanced user management
INSERT INTO permissions (name, display_name, description, category, is_inheritable, is_system) VALUES
-- Enhanced content permissions
('content.create.advanced', 'Advanced Content Creation', 'Create content with advanced features', 'content', false, true),
('content.schedule', 'Schedule Content', 'Schedule content for future publication', 'content', false, true),
('content.analytics', 'Content Analytics', 'View detailed content performance analytics', 'content', false, true),

-- Community management permissions
('community.manage.events', 'Manage Events', 'Create and manage community events', 'community', true, true),
('community.manage.announcements', 'Manage Announcements', 'Create and manage community announcements', 'community', true, true),
('community.moderate.discussions', 'Moderate Discussions', 'Moderate community discussions and threads', 'community', true, true),

-- Beta testing permissions
('beta.access.features', 'Beta Feature Access', 'Access to beta and experimental features', 'beta', false, true),
('beta.provide.feedback', 'Provide Beta Feedback', 'Provide feedback on beta features', 'beta', false, true),

-- VIP user permissions
('vip.priority.support', 'Priority Support Access', 'Access to priority customer support', 'vip', false, true),
('vip.exclusive.features', 'Exclusive Features', 'Access to VIP-only features', 'vip', false, true),
('vip.early.access', 'Early Access', 'Early access to new features', 'vip', false, true),

-- Content review permissions
('review.content.pending', 'Review Pending Content', 'Review and approve pending content', 'review', true, true),
('review.content.reported', 'Review Reported Content', 'Review content reported by users', 'review', true, true)

ON CONFLICT (name) DO NOTHING;

-- ================================
-- ASSIGN PERMISSIONS TO NEW ROLES
-- ================================

-- Content Creator role permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'content_creator' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'content.create.advanced',
    'content.schedule',
    'content.analytics',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Community Manager role permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'community_manager' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'content.create.advanced',
    'community.manage.events',
    'community.manage.announcements',
    'community.moderate.discussions',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Beta Tester role permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'beta_tester' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'beta.access.features',
    'beta.provide.feedback',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- VIP User role permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'vip_user' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'content.create.advanced',
    'content.analytics',
    'vip.priority.support',
    'vip.exclusive.features',
    'vip.early.access',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Content Reviewer role permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'content_reviewer' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'review.content.pending',
    'review.content.reported',
    'admin.access',
    'admin.posts.moderate',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ================================
-- ENHANCE USER MANAGEMENT TABLES
-- ================================

-- Add additional columns to user_role_assignments for better tracking
ALTER TABLE user_role_assignments 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS removed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;

-- Add additional columns to user_subscriptions for better admin management
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ================================
-- CREATE ENHANCED INDEXES
-- ================================

-- Indexes for better performance in admin queries
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_expires 
ON user_role_assignments(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_reason 
ON user_role_assignments(user_id, is_active) WHERE reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_admin_notes 
ON user_subscriptions(user_id) WHERE admin_notes IS NOT NULL;

-- ================================
-- UPDATE TRIGGERS
-- ================================

-- Add trigger for user_role_assignments updated_at
CREATE OR REPLACE FUNCTION update_user_role_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_role_assignments_updated_at ON user_role_assignments;
CREATE TRIGGER trigger_user_role_assignments_updated_at
    BEFORE UPDATE ON user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_role_assignments_updated_at();

-- ================================
-- ENHANCED HELPER FUNCTIONS
-- ================================

-- Function to get user management summary for admin dashboard
CREATE OR REPLACE FUNCTION get_user_management_summary()
RETURNS TABLE(
    total_users INTEGER,
    active_users INTEGER,
    users_with_roles INTEGER,
    users_with_subscriptions INTEGER,
    active_timeouts INTEGER,
    pending_role_assignments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM users) as total_users,
        (SELECT COUNT(*)::INTEGER FROM users WHERE created_at > CURRENT_DATE - INTERVAL '30 days') as active_users,
        (SELECT COUNT(DISTINCT user_id)::INTEGER FROM user_role_assignments WHERE is_active = true) as users_with_roles,
        (SELECT COUNT(DISTINCT user_id)::INTEGER FROM user_subscriptions WHERE status IN ('active', 'trialing')) as users_with_subscriptions,
        (SELECT COUNT(*)::INTEGER FROM user_timeouts WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP) as active_timeouts,
        (SELECT COUNT(*)::INTEGER FROM user_role_assignments WHERE expires_at IS NOT NULL AND expires_at > CURRENT_TIMESTAMP) as pending_role_assignments;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get detailed user info for admin interface
CREATE OR REPLACE FUNCTION get_admin_user_details(p_user_id INTEGER)
RETURNS TABLE(
    user_id INTEGER,
    name TEXT,
    email TEXT,
    image TEXT,
    created_at TIMESTAMP,
    profile_public BOOLEAN,
    bio TEXT,
    location TEXT,
    roles JSONB,
    subscriptions JSONB,
    timeouts JSONB,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name::TEXT,
        u.email::TEXT,
        u.image::TEXT,
        u.created_at,
        u.profile_public,
        u.bio::TEXT,
        u.location::TEXT,
        -- Aggregate roles
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ura.id,
                    'role_name', ur.name,
                    'display_name', ur.display_name,
                    'assigned_at', ura.assigned_at,
                    'expires_at', ura.expires_at,
                    'is_active', ura.is_active,
                    'assigned_by_name', assigned_by.name,
                    'reason', ura.reason
                )
            )
            FROM user_role_assignments ura
            JOIN user_roles ur ON ura.role_id = ur.id
            LEFT JOIN users assigned_by ON ura.assigned_by = assigned_by.id
            WHERE ura.user_id = u.id),
            '[]'::jsonb
        ) as roles,
        -- Aggregate subscriptions
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', us.id,
                    'plan_name', sp.name,
                    'plan_display_name', sp.display_name,
                    'status', us.status,
                    'billing_cycle', us.billing_cycle,
                    'expires_at', us.expires_at,
                    'assigned_by_name', assigned_by_sub.name,
                    'notes', us.notes
                )
            )
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            LEFT JOIN users assigned_by_sub ON us.assigned_by = assigned_by_sub.id
            WHERE us.user_id = u.id),
            '[]'::jsonb
        ) as subscriptions,
        -- Aggregate timeouts
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ut.id,
                    'timeout_type', ut.timeout_type,
                    'reason', ut.reason,
                    'expires_at', ut.expires_at,
                    'is_active', ut.is_active,
                    'issued_by_name', issued_by.name
                )
            )
            FROM user_timeouts ut
            LEFT JOIN users issued_by ON ut.issued_by = issued_by.id
            WHERE ut.user_id = u.id),
            '[]'::jsonb
        ) as timeouts,
        -- Aggregate permissions
        COALESCE(
            (SELECT jsonb_agg(DISTINCT
                jsonb_build_object(
                    'name', p.name,
                    'display_name', p.display_name,
                    'category', p.category,
                    'source', CASE 
                        WHEN up.user_id IS NOT NULL THEN 'direct'
                        ELSE 'role'
                    END
                )
            )
            FROM permissions p
            LEFT JOIN role_permissions rp ON p.id = rp.permission_id
            LEFT JOIN user_role_assignments ura ON rp.role_id = ura.role_id 
                AND ura.user_id = u.id 
                AND ura.is_active = true
                AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
            LEFT JOIN user_permissions up ON p.id = up.permission_id 
                AND up.user_id = u.id
                AND up.granted = true
                AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
            WHERE (ura.user_id IS NOT NULL OR up.user_id IS NOT NULL)),
            '[]'::jsonb
        ) as permissions
    FROM users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON FUNCTION get_user_management_summary() IS 'Returns summary statistics for the admin user management dashboard';
COMMENT ON FUNCTION get_admin_user_details(INTEGER) IS 'Returns comprehensive user details for admin interface including roles, subscriptions, timeouts, and permissions';

COMMENT ON COLUMN user_role_assignments.reason IS 'Reason for role assignment (for admin tracking)';
COMMENT ON COLUMN user_role_assignments.removed_by IS 'User ID who removed this role assignment';
COMMENT ON COLUMN user_role_assignments.removed_at IS 'Timestamp when role was removed';

COMMENT ON COLUMN user_subscriptions.notes IS 'General notes about the subscription';
COMMENT ON COLUMN user_subscriptions.admin_notes IS 'Admin-only notes about the subscription'; 