-- Migration: Add missing columns to user_roles table
-- Description: Adds archived_by and sort_order columns to user_roles table for admin functionality
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-13

-- ================================
-- PROBLEM ANALYSIS
-- ================================
-- The user_roles table is missing archived_by and sort_order columns that are referenced in admin API queries
-- This causes SQL errors when trying to fetch roles with archived_by information and sort_order sorting
-- Solution: Add missing columns with appropriate defaults and constraints

-- ================================
-- ADD MISSING COLUMNS
-- ================================
-- Add archived_by column for tracking who archived a role
ALTER TABLE USER_ROLES
    ADD COLUMN IF NOT EXISTS ARCHIVED_BY INTEGER
        REFERENCES USERS(
            ID
        ) ON DELETE SET NULL;

-- Add sort_order column for consistent sorting
ALTER TABLE USER_ROLES
    ADD COLUMN IF NOT EXISTS SORT_ORDER INTEGER DEFAULT 0 NOT NULL;

-- ================================
-- UPDATE EXISTING RECORDS WITH LOGICAL SORT ORDER
-- ================================
-- Set sort_order for existing roles based on their system/default nature and name
WITH RANKED_ROLES AS (
    SELECT
        ID,
        CASE
            WHEN IS_SYSTEM = TRUE THEN
                1000
            WHEN IS_DEFAULT = TRUE THEN
                2000
            ELSE
                3000
        END + ROW_NUMBER() OVER (ORDER BY NAME) AS NEW_SORT_ORDER
    FROM
        USER_ROLES
) UPDATE USER_ROLES SET SORT_ORDER = RANKED_ROLES.NEW_SORT_ORDER FROM RANKED_ROLES WHERE USER_ROLES.ID = RANKED_ROLES.ID;

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================
-- Index for sorting by sort_order
CREATE INDEX IF NOT EXISTS IDX_USER_ROLES_SORT_ORDER
ON USER_ROLES(SORT_ORDER);

-- Index for archived_by lookups
CREATE INDEX IF NOT EXISTS IDX_USER_ROLES_ARCHIVED_BY
ON USER_ROLES(ARCHIVED_BY)
WHERE ARCHIVED_BY IS NOT NULL;

-- Composite index for active status + sort_order (admin queries)
CREATE INDEX IF NOT EXISTS IDX_USER_ROLES_ACTIVE_SORT_ORDER
ON USER_ROLES(IS_ACTIVE, SORT_ORDER)
WHERE IS_ARCHIVED = FALSE;

-- ================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON COLUMN USER_ROLES.ARCHIVED_BY IS 'User ID who archived this role. NULL if not archived.';
COMMENT ON COLUMN USER_ROLES.SORT_ORDER IS 'Numeric value for sorting roles in admin interfaces. Lower values appear first.';

-- ================================
-- VERIFICATION QUERY
-- ================================
-- Uncomment to verify the migration worked correctly:
-- SELECT id, name, sort_order, archived_by
-- FROM user_roles
-- ORDER BY sort_order, name
-- LIMIT 10;