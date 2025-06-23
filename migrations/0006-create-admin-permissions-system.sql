-- Create admin and permissions system
-- Migration: 0006-create-admin-permissions-system.sql

-- Table for permission definitions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'admin.emoji.approve', 'admin.users.timeout'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- e.g., 'admin', 'moderation', 'content'
    is_inheritable BOOLEAN DEFAULT false, -- Can this permission be granted to others
    is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for user roles
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'basic', 'admin', 'moderator'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false, -- Is this the default role for new users
    is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for role permissions (many-to-many)
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id), -- Who granted this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Table for user role assignments
CREATE TABLE user_role_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id), -- Who assigned this role
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Optional expiration
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Table for direct user permissions (overrides)
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL, -- true = granted, false = explicitly denied
    granted_by INTEGER REFERENCES users(id), -- Who granted/denied this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Optional expiration
    reason TEXT, -- Why this permission was granted/denied
    UNIQUE(user_id, permission_id)
);

-- Table for user timeouts/suspensions
CREATE TABLE user_timeouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeout_type VARCHAR(50) NOT NULL, -- 'post_creation', 'comment_creation', 'full_access'
    reason TEXT NOT NULL,
    issued_by INTEGER NOT NULL REFERENCES users(id), -- Administrator who issued timeout
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    revoked_by INTEGER REFERENCES users(id), -- Who revoked the timeout early
    revoked_at TIMESTAMP,
    revoke_reason TEXT
);

-- Add approval fields to custom_emojis table
ALTER TABLE custom_emojis ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE custom_emojis ADD COLUMN reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE custom_emojis ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE custom_emojis ADD COLUMN review_notes TEXT;
ALTER TABLE custom_emojis ADD COLUMN is_globally_available BOOLEAN DEFAULT false; -- Can all users use this emoji

-- Indexes for performance
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_user_roles_name ON user_roles(name);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_active ON user_role_assignments(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(user_id, granted, expires_at);
CREATE INDEX idx_user_timeouts_user_id ON user_timeouts(user_id);
CREATE INDEX idx_user_timeouts_active ON user_timeouts(user_id, is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_custom_emojis_approval_status ON custom_emojis(approval_status);
CREATE INDEX idx_custom_emojis_pending_approval ON custom_emojis(approval_status, created_at) WHERE approval_status = 'pending';

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, category, is_inheritable, is_system) VALUES
-- Admin permissions
('admin.access', 'Admin Access', 'Access to admin dashboard', 'admin', true, true),
('admin.emoji.approve', 'Approve Emojis', 'Approve or reject custom emojis', 'admin', true, true),
('admin.emoji.manage', 'Manage Emojis', 'Full emoji management capabilities', 'admin', true, true),
('admin.users.view', 'View Users', 'View user information and activity', 'admin', true, true),
('admin.users.timeout', 'Timeout Users', 'Issue timeouts and suspensions to users', 'admin', true, true),
('admin.users.manage', 'Manage Users', 'Full user management capabilities', 'admin', true, true),
('admin.permissions.view', 'View Permissions', 'View permission assignments', 'admin', true, true),
('admin.permissions.manage', 'Manage Permissions', 'Grant and revoke permissions', 'admin', false, true),
('admin.roles.view', 'View Roles', 'View role definitions and assignments', 'admin', true, true),
('admin.roles.manage', 'Manage Roles', 'Create and modify user roles', 'admin', false, true),
('admin.posts.moderate', 'Moderate Posts', 'Moderate user posts and content', 'admin', true, true),

-- Content permissions
('content.create.post', 'Create Posts', 'Create new posts', 'content', false, true),
('content.edit.own', 'Edit Own Content', 'Edit own posts and comments', 'content', false, true),
('content.delete.own', 'Delete Own Content', 'Delete own posts and comments', 'content', false, true),
('content.comment', 'Create Comments', 'Create comments on posts', 'content', false, true),

-- Emoji permissions
('emoji.use.standard', 'Use Standard Emojis', 'Use built-in emoji sets', 'emoji', false, true),
('emoji.use.custom', 'Use Custom Emojis', 'Use approved custom emojis', 'emoji', false, true),
('emoji.create.custom', 'Create Custom Emojis', 'Upload custom emojis for approval', 'emoji', false, true),
('emoji.use.own', 'Use Own Emojis', 'Use own custom emojis (even if pending)', 'emoji', false, true);

-- Insert default roles
INSERT INTO user_roles (name, display_name, description, is_default, is_system) VALUES
('basic', 'Basic User', 'Default role for all users with basic permissions', true, true),
('admin', 'Administrator', 'Full administrative access to the system', false, true),
('moderator', 'Moderator', 'Content moderation capabilities', false, true);

-- Assign permissions to basic role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'basic' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own'
);

-- Assign permissions to moderator role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'moderator' 
AND p.name IN (
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'emoji.use.standard',
    'emoji.use.custom',
    'emoji.create.custom',
    'emoji.use.own',
    'admin.access',
    'admin.emoji.approve',
    'admin.users.view',
    'admin.users.timeout',
    'admin.posts.moderate'
);

-- Assign permissions to admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT ur.id, p.id 
FROM user_roles ur, permissions p 
WHERE ur.name = 'admin';

-- Assign basic role to all existing users (only basic role, no others)
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, ur.id
FROM users u, user_roles ur
WHERE ur.name = 'basic'
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = u.id AND ura.role_id = ur.id
);

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_permission_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- Check direct user permissions first (these override role permissions)
    SELECT granted INTO has_permission
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id 
    AND p.name = p_permission_name
    AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP);
    
    -- If found direct permission, return it
    IF FOUND THEN
        RETURN has_permission;
    END IF;
    
    -- Check role-based permissions
    SELECT true INTO has_permission
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ura.user_id = p_user_id
    AND p.name = p_permission_name
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
    LIMIT 1;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user is timed out for specific action
CREATE OR REPLACE FUNCTION user_is_timed_out(
    p_user_id INTEGER,
    p_timeout_type VARCHAR DEFAULT 'post_creation'
) RETURNS TABLE(is_timed_out BOOLEAN, expires_at TIMESTAMP, reason TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_timed_out,
        ut.expires_at,
        ut.reason
    FROM user_timeouts ut
    WHERE ut.user_id = p_user_id
    AND ut.timeout_type = p_timeout_type
    AND ut.is_active = true
    AND ut.expires_at > CURRENT_TIMESTAMP
    ORDER BY ut.expires_at DESC
    LIMIT 1;
    
    -- If no active timeout found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TIMESTAMP, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Triggers for updated_at
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE permissions IS 'System permissions that can be granted to users or roles';
COMMENT ON TABLE user_roles IS 'User roles that group permissions together';
COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE user_role_assignments IS 'Assignment of roles to users';
COMMENT ON TABLE user_permissions IS 'Direct permission grants/denials for users (overrides role permissions)';
COMMENT ON TABLE user_timeouts IS 'User timeouts and suspensions issued by administrators';

COMMENT ON COLUMN permissions.is_inheritable IS 'Whether users with this permission can grant it to others';
COMMENT ON COLUMN user_permissions.granted IS 'true = permission granted, false = permission explicitly denied';
COMMENT ON COLUMN user_timeouts.timeout_type IS 'Type of timeout: post_creation, comment_creation, full_access';
COMMENT ON COLUMN custom_emojis.approval_status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN custom_emojis.is_globally_available IS 'Whether all users can use this emoji (not just creator)'; 