-- Simple fix for missing permissions system columns
-- Migration: 0042-fix-permissions-columns.sql

-- Add missing columns to permissions table
ALTER TABLE PERMISSIONS
    ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE;

ALTER TABLE PERMISSIONS
    ADD COLUMN IF NOT EXISTS IS_ARCHIVED BOOLEAN DEFAULT FALSE;

-- Add missing columns to user_roles table
ALTER TABLE USER_ROLES
    ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE;

ALTER TABLE USER_ROLES
    ADD COLUMN IF NOT EXISTS IS_ARCHIVED BOOLEAN DEFAULT FALSE;

-- Add missing columns to role_permissions table
ALTER TABLE ROLE_PERMISSIONS
    ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE;

-- Add missing columns to user_permissions table
ALTER TABLE USER_PERMISSIONS
    ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE;

-- Ensure essential permissions exist
INSERT INTO PERMISSIONS (
    NAME,
    DISPLAY_NAME,
    DESCRIPTION,
    CATEGORY,
    IS_SYSTEM
) VALUES (
    'admin.permissions.view',
    'View Permissions',
    'View permission assignments',
    'admin',
    TRUE
),
(
    'admin.roles.view',
    'View Roles',
    'View role definitions and assignments',
    'admin',
    TRUE
) ON CONFLICT (
    NAME
) DO NOTHING;

-- Ensure first user has admin role
INSERT INTO USER_ROLE_ASSIGNMENTS (
    USER_ID,
    ROLE_ID,
    ASSIGNED_BY,
    ASSIGNED_AT
)
    SELECT
        1,
        UR.ID,
        1,
        CURRENT_TIMESTAMP
    FROM
        USER_ROLES UR
    WHERE
        UR.NAME = 'admin'
        AND EXISTS (
            SELECT
                1
            FROM
                USERS
            WHERE
                ID = 1
        )
        ON CONFLICT (USER_ID, ROLE_ID) DO NOTHING;

-- Success message
SELECT
    'Permissions system columns fixed' AS RESULT;