-- Migration: Add missing columns to permissions table
-- Description: Adds sort_order and risk_level columns to permissions table for admin functionality
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-13

-- ================================
-- PROBLEM ANALYSIS
-- ================================
-- The permissions table lacks sort_order and risk_level columns that are referenced in admin API queries
-- This causes SQL errors when trying to sort permissions by sort_order and filter by risk_level
-- Solution: Add missing columns with appropriate defaults and indexes

-- ================================
-- ADD MISSING COLUMNS
-- ================================
-- Add sort_order column for consistent sorting
ALTER TABLE PERMISSIONS
    ADD COLUMN IF NOT EXISTS SORT_ORDER INTEGER DEFAULT 0 NOT NULL;

-- Add risk_level column for permission risk classification
ALTER TABLE PERMISSIONS
    ADD COLUMN IF NOT EXISTS RISK_LEVEL VARCHAR(
        20
    ) DEFAULT 'medium' NOT NULL;

-- ================================
-- UPDATE EXISTING RECORDS WITH LOGICAL DEFAULTS
-- ================================
-- Set sort_order and risk_level based on category and name for logical grouping
WITH RANKED_PERMISSIONS AS (
    SELECT
        ID,
        CASE CATEGORY
            WHEN 'system' THEN
                1000
            WHEN 'admin' THEN
                2000
            WHEN 'user' THEN
                3000
            WHEN 'content' THEN
                4000
            WHEN 'moderation' THEN
                5000
            WHEN 'subscription' THEN
                6000
            WHEN 'analytics' THEN
                7000
            WHEN 'api' THEN
                8000
            ELSE
                9000
        END + ROW_NUMBER() OVER (PARTITION BY CATEGORY ORDER BY NAME) AS NEW_SORT_ORDER,
        CASE CATEGORY
            WHEN 'system' THEN
                'critical'
            WHEN 'admin' THEN
                'high'
            WHEN 'moderation' THEN
                'high'
            WHEN 'user' THEN
                'medium'
            WHEN 'content' THEN
                'medium'
            WHEN 'subscription' THEN
                'medium'
            WHEN 'analytics' THEN
                'low'
            WHEN 'api' THEN
                'medium'
            ELSE
                'medium'
        END                                                           AS NEW_RISK_LEVEL
    FROM
        PERMISSIONS
) UPDATE PERMISSIONS SET SORT_ORDER = RANKED_PERMISSIONS.NEW_SORT_ORDER, RISK_LEVEL = RANKED_PERMISSIONS.NEW_RISK_LEVEL FROM RANKED_PERMISSIONS WHERE PERMISSIONS.ID = RANKED_PERMISSIONS.ID;

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================
-- Index for sorting by sort_order
CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_SORT_ORDER
ON PERMISSIONS(SORT_ORDER);

-- Composite index for category + sort_order (common query pattern)
CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_CATEGORY_SORT_ORDER
ON PERMISSIONS(CATEGORY, SORT_ORDER);

-- Composite index for active status + sort_order (admin queries)
CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_ACTIVE_SORT_ORDER
    ON PERMISSIONS(IS_ACTIVE, SORT_ORDER)
    WHERE IS_ARCHIVED = FALSE;

-- Index for risk_level filtering
CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_RISK_LEVEL
    ON PERMISSIONS(RISK_LEVEL);

-- ================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON COLUMN PERMISSIONS.SORT_ORDER IS 'Numeric value for sorting permissions in admin interfaces. Lower values appear first.';
COMMENT ON COLUMN PERMISSIONS.RISK_LEVEL IS 'Risk classification for permission (low, medium, high, critical). Used for admin filtering and security warnings.';

-- ================================
-- VERIFICATION QUERY
-- ================================
-- Uncomment to verify the migration worked correctly:
-- SELECT id, name, category, sort_order, risk_level
-- FROM permissions
-- ORDER BY sort_order, name
-- LIMIT 10;