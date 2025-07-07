-- Migration: Enhanced Permissions System with Archive Functionality
-- Description: Adds archive functionality, audit trails, and enhanced management features
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-27

-- ================================
-- ENHANCE PERMISSIONS TABLE
-- ================================

-- Add archive functionality to permissions
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- Add archive functionality to user_roles
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS role_color VARCHAR(7) DEFAULT '#6366F1', -- Hex color for UI
ADD COLUMN IF NOT EXISTS role_icon VARCHAR(50) DEFAULT 'user';

-- Add audit trail for role_permissions
ALTER TABLE role_permissions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revoked_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS revoke_reason TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add audit trail for user_role_assignments (some columns may already exist)
ALTER TABLE user_role_assignments
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'automatic', 'bulk', 'system'));

-- Add audit trail for user_permissions
ALTER TABLE user_permissions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revoked_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS revoke_reason TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ================================
-- CREATE AUDIT TABLES
-- ================================

-- Permissions audit log
CREATE TABLE IF NOT EXISTS permissions_audit (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'disable', 'archive', 'restore'
    permission_id INTEGER REFERENCES permissions(id),
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles audit log
CREATE TABLE IF NOT EXISTS roles_audit (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'disable', 'archive', 'restore'
    role_id INTEGER REFERENCES user_roles(id),
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permission assignments audit log
CREATE TABLE IF NOT EXISTS permission_assignments_audit (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, -- 'grant', 'revoke', 'update', 'expire'
    assignment_type VARCHAR(50) NOT NULL, -- 'role_permission', 'user_permission', 'role_assignment'
    assignment_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES user_roles(id),
    permission_id INTEGER REFERENCES permissions(id),
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_archived ON permissions(is_archived, archived_at);
CREATE INDEX IF NOT EXISTS idx_permissions_sort_order ON permissions(sort_order, display_name);
CREATE INDEX IF NOT EXISTS idx_permissions_risk_level ON permissions(risk_level);
CREATE INDEX IF NOT EXISTS idx_permissions_active_category ON permissions(category, is_active, is_archived) WHERE is_active = TRUE AND is_archived = FALSE;

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_archived ON user_roles(is_archived, archived_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_sort_order ON user_roles(sort_order, display_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active, is_archived) WHERE is_active = TRUE AND is_archived = FALSE;

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(is_active, revoked_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_updated ON role_permissions(updated_at DESC);

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active, revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_updated ON user_permissions(updated_at DESC);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_permissions_audit_action ON permissions_audit(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_admin ON permissions_audit(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_audit_action ON roles_audit(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_audit_admin ON roles_audit(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_assignments_audit_action ON permission_assignments_audit(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_assignments_audit_admin ON permission_assignments_audit(admin_user_id, created_at DESC);

-- ================================
-- CREATE ENHANCED FUNCTIONS
-- ================================

-- Function to archive a permission (automatically disables it)
CREATE OR REPLACE FUNCTION archive_permission(
    p_permission_id INTEGER,
    p_admin_user_id INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_data JSONB;
BEGIN
    -- Get current data for audit
    SELECT to_jsonb(permissions.*) INTO old_data
    FROM permissions WHERE id = p_permission_id;
    
    -- Archive the permission (this also disables it)
    UPDATE permissions 
    SET 
        is_active = FALSE,
        is_archived = TRUE,
        archived_at = CURRENT_TIMESTAMP,
        archived_by = p_admin_user_id,
        archive_reason = p_reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_permission_id;
    
    -- Log the action
    INSERT INTO permissions_audit (
        action_type, permission_id, admin_user_id, old_data, new_data, reason
    ) VALUES (
        'archive', p_permission_id, p_admin_user_id, old_data, 
        (SELECT to_jsonb(permissions.*) FROM permissions WHERE id = p_permission_id),
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to restore an archived permission
CREATE OR REPLACE FUNCTION restore_permission(
    p_permission_id INTEGER,
    p_admin_user_id INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_data JSONB;
BEGIN
    -- Get current data for audit
    SELECT to_jsonb(permissions.*) INTO old_data
    FROM permissions WHERE id = p_permission_id;
    
    -- Restore the permission (activate and unarchive)
    UPDATE permissions 
    SET 
        is_active = TRUE,
        is_archived = FALSE,
        archived_at = NULL,
        archived_by = NULL,
        archive_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_permission_id;
    
    -- Log the action
    INSERT INTO permissions_audit (
        action_type, permission_id, admin_user_id, old_data, new_data, reason
    ) VALUES (
        'restore', p_permission_id, p_admin_user_id, old_data, 
        (SELECT to_jsonb(permissions.*) FROM permissions WHERE id = p_permission_id),
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to archive a role (automatically disables it)
CREATE OR REPLACE FUNCTION archive_role(
    p_role_id INTEGER,
    p_admin_user_id INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_data JSONB;
BEGIN
    -- Get current data for audit
    SELECT to_jsonb(user_roles.*) INTO old_data
    FROM user_roles WHERE id = p_role_id;
    
    -- Archive the role (this also disables it)
    UPDATE user_roles 
    SET 
        is_active = FALSE,
        is_archived = TRUE,
        archived_at = CURRENT_TIMESTAMP,
        archived_by = p_admin_user_id,
        archive_reason = p_reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_role_id;
    
    -- Disable all user assignments for this role
    UPDATE user_role_assignments 
    SET 
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_admin_user_id,
        removed_at = CURRENT_TIMESTAMP,
        removed_by = p_admin_user_id
    WHERE role_id = p_role_id AND is_active = TRUE;
    
    -- Log the action
    INSERT INTO roles_audit (
        action_type, role_id, admin_user_id, old_data, new_data, reason
    ) VALUES (
        'archive', p_role_id, p_admin_user_id, old_data, 
        (SELECT to_jsonb(user_roles.*) FROM user_roles WHERE id = p_role_id),
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to restore an archived role
CREATE OR REPLACE FUNCTION restore_role(
    p_role_id INTEGER,
    p_admin_user_id INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_data JSONB;
BEGIN
    -- Get current data for audit
    SELECT to_jsonb(user_roles.*) INTO old_data
    FROM user_roles WHERE id = p_role_id;
    
    -- Restore the role (activate and unarchive)
    UPDATE user_roles 
    SET 
        is_active = TRUE,
        is_archived = FALSE,
        archived_at = NULL,
        archived_by = NULL,
        archive_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_role_id;
    
    -- Log the action
    INSERT INTO roles_audit (
        action_type, role_id, admin_user_id, old_data, new_data, reason
    ) VALUES (
        'restore', p_role_id, p_admin_user_id, old_data, 
        (SELECT to_jsonb(user_roles.*) FROM user_roles WHERE id = p_role_id),
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive permissions overview
CREATE OR REPLACE FUNCTION get_permissions_overview()
RETURNS TABLE(
    total_permissions INTEGER,
    active_permissions INTEGER,
    disabled_permissions INTEGER,
    archived_permissions INTEGER,
    total_roles INTEGER,
    active_roles INTEGER,
    disabled_roles INTEGER,
    archived_roles INTEGER,
    total_user_assignments INTEGER,
    active_user_assignments INTEGER,
    recent_changes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM permissions) as total_permissions,
        (SELECT COUNT(*)::INTEGER FROM permissions WHERE is_active = TRUE AND is_archived = FALSE) as active_permissions,
        (SELECT COUNT(*)::INTEGER FROM permissions WHERE is_active = FALSE AND is_archived = FALSE) as disabled_permissions,
        (SELECT COUNT(*)::INTEGER FROM permissions WHERE is_archived = TRUE) as archived_permissions,
        (SELECT COUNT(*)::INTEGER FROM user_roles) as total_roles,
        (SELECT COUNT(*)::INTEGER FROM user_roles WHERE is_active = TRUE AND is_archived = FALSE) as active_roles,
        (SELECT COUNT(*)::INTEGER FROM user_roles WHERE is_active = FALSE AND is_archived = FALSE) as disabled_roles,
        (SELECT COUNT(*)::INTEGER FROM user_roles WHERE is_archived = TRUE) as archived_roles,
        (SELECT COUNT(*)::INTEGER FROM user_role_assignments) as total_user_assignments,
        (SELECT COUNT(*)::INTEGER FROM user_role_assignments WHERE is_active = TRUE) as active_user_assignments,
        (SELECT COUNT(*)::INTEGER FROM permissions_audit WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as recent_changes;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================
-- UPDATE EXISTING DATA
-- ================================

-- Set sort orders for existing permissions by category
UPDATE permissions SET sort_order = 
    CASE category 
        WHEN 'admin' THEN 1
        WHEN 'moderation' THEN 2
        WHEN 'content' THEN 3
        WHEN 'community' THEN 4
        WHEN 'emoji' THEN 5
        WHEN 'subscription' THEN 6
        WHEN 'beta' THEN 7
        WHEN 'vip' THEN 8
        WHEN 'review' THEN 9
        ELSE 10
    END;

-- Set sort orders for existing roles by importance
UPDATE user_roles SET sort_order = 
    CASE name 
        WHEN 'admin' THEN 1
        WHEN 'moderator' THEN 2
        WHEN 'content_reviewer' THEN 3
        WHEN 'community_manager' THEN 4
        WHEN 'content_creator' THEN 5
        WHEN 'vip_user' THEN 6
        WHEN 'beta_tester' THEN 7
        WHEN 'basic' THEN 8
        ELSE 9
    END;

-- Set colors for existing roles
UPDATE user_roles SET role_color = 
    CASE name 
        WHEN 'admin' THEN '#EF4444'         -- Red for admin
        WHEN 'moderator' THEN '#F59E0B'     -- Orange for moderator
        WHEN 'content_reviewer' THEN '#8B5CF6'  -- Purple for content reviewer
        WHEN 'community_manager' THEN '#06B6D4'  -- Cyan for community manager
        WHEN 'content_creator' THEN '#10B981'    -- Green for content creator
        WHEN 'vip_user' THEN '#F59E0B'      -- Gold for VIP
        WHEN 'beta_tester' THEN '#6366F1'   -- Indigo for beta tester
        WHEN 'basic' THEN '#6B7280'         -- Gray for basic
        ELSE '#6366F1'
    END;

-- Set icons for existing roles
UPDATE user_roles SET role_icon = 
    CASE name 
        WHEN 'admin' THEN 'crown'
        WHEN 'moderator' THEN 'shield'
        WHEN 'content_reviewer' THEN 'eye'
        WHEN 'community_manager' THEN 'users'
        WHEN 'content_creator' THEN 'pen'
        WHEN 'vip_user' THEN 'star'
        WHEN 'beta_tester' THEN 'flask'
        WHEN 'basic' THEN 'user'
        ELSE 'user'
    END;

-- Set risk levels for existing permissions
UPDATE permissions SET risk_level = 
    CASE 
        WHEN name LIKE '%manage%' OR name LIKE '%delete%' THEN 'high'
        WHEN name LIKE '%admin%' OR name LIKE '%moderate%' THEN 'medium'
        WHEN name LIKE '%create%' OR name LIKE '%edit%' THEN 'low'
        WHEN name LIKE '%view%' OR name LIKE '%use%' THEN 'low'
        ELSE 'low'
    END;

-- ================================
-- CREATE TRIGGERS FOR AUDIT
-- ================================

-- Trigger function for permissions audit
CREATE OR REPLACE FUNCTION audit_permissions_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only audit updates, not inserts
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO permissions_audit (
            action_type, permission_id, admin_user_id, old_data, new_data, reason
        ) VALUES (
            'update', NEW.id, COALESCE(NEW.updated_by, OLD.updated_by, 1), 
            to_jsonb(OLD.*), to_jsonb(NEW.*), 'Automated audit'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function for roles audit
CREATE OR REPLACE FUNCTION audit_roles_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only audit updates, not inserts
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO roles_audit (
            action_type, role_id, admin_user_id, old_data, new_data, reason
        ) VALUES (
            'update', NEW.id, COALESCE(NEW.updated_by, OLD.updated_by, 1), 
            to_jsonb(OLD.*), to_jsonb(NEW.*), 'Automated audit'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_audit_permissions ON permissions;
CREATE TRIGGER trigger_audit_permissions
    AFTER UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION audit_permissions_changes();

DROP TRIGGER IF EXISTS trigger_audit_roles ON user_roles;
CREATE TRIGGER trigger_audit_roles
    AFTER UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION audit_roles_changes();

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON COLUMN permissions.is_archived IS 'Whether this permission is archived (archived permissions are automatically disabled)';
COMMENT ON COLUMN permissions.archived_at IS 'When this permission was archived';
COMMENT ON COLUMN permissions.archived_by IS 'Admin user who archived this permission';
COMMENT ON COLUMN permissions.archive_reason IS 'Reason for archiving this permission';
COMMENT ON COLUMN permissions.risk_level IS 'Risk level for this permission: low, medium, high, critical';
COMMENT ON COLUMN permissions.dependencies IS 'Array of permission names this permission depends on';
COMMENT ON COLUMN permissions.metadata IS 'Additional metadata for this permission';

COMMENT ON COLUMN user_roles.is_archived IS 'Whether this role is archived (archived roles are automatically disabled)';
COMMENT ON COLUMN user_roles.archived_at IS 'When this role was archived';
COMMENT ON COLUMN user_roles.archived_by IS 'Admin user who archived this role';
COMMENT ON COLUMN user_roles.archive_reason IS 'Reason for archiving this role';
COMMENT ON COLUMN user_roles.role_color IS 'Hex color code for UI display';
COMMENT ON COLUMN user_roles.role_icon IS 'Icon identifier for UI display';
COMMENT ON COLUMN user_roles.metadata IS 'Additional metadata for this role';

COMMENT ON TABLE permissions_audit IS 'Audit log for all permission changes';
COMMENT ON TABLE roles_audit IS 'Audit log for all role changes';
COMMENT ON TABLE permission_assignments_audit IS 'Audit log for all permission assignment changes';

COMMENT ON FUNCTION archive_permission IS 'Archive a permission (automatically disables it and logs the action)';
COMMENT ON FUNCTION restore_permission IS 'Restore an archived permission (activates it and logs the action)';
COMMENT ON FUNCTION archive_role IS 'Archive a role (automatically disables it and all user assignments)';
COMMENT ON FUNCTION restore_role IS 'Restore an archived role (activates it but does not restore user assignments)';
COMMENT ON FUNCTION get_permissions_overview IS 'Get comprehensive overview of permissions and roles system'; 