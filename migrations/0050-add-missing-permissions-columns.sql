-- Migration: Add missing columns to permissions table
-- This migration adds the columns that the permissions API expects but are missing from the current table

-- Add missing columns to permissions table
ALTER TABLE PERMISSIONS
    ADD COLUMN RISK_LEVEL VARCHAR(
        20
    ) DEFAULT 'low';

ALTER TABLE PERMISSIONS
    ADD COLUMN ARCHIVED_AT TIMESTAMP;

ALTER TABLE PERMISSIONS
    ADD COLUMN ARCHIVED_BY INTEGER;

ALTER TABLE PERMISSIONS
    ADD COLUMN ARCHIVE_REASON TEXT;

ALTER TABLE PERMISSIONS
    ADD COLUMN METADATA JSONB DEFAULT '{}';

ALTER TABLE PERMISSIONS
    ADD COLUMN DEPENDENCIES TEXT[] DEFAULT '{}';

-- Set default values for existing permissions
UPDATE PERMISSIONS
SET
    RISK_LEVEL = 'low'
WHERE
    RISK_LEVEL IS NULL;

-- Set default sort_order values based on category for better organization
UPDATE PERMISSIONS
SET
    SORT_ORDER = 1
WHERE
    CATEGORY = 'admin'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 2
WHERE
    CATEGORY = 'moderation'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 3
WHERE
    CATEGORY = 'content'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 4
WHERE
    CATEGORY = 'community'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 5
WHERE
    CATEGORY = 'emoji'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 6
WHERE
    CATEGORY = 'subscription'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 7
WHERE
    CATEGORY = 'beta'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 8
WHERE
    CATEGORY = 'vip'
    AND SORT_ORDER = 0;

UPDATE PERMISSIONS
SET
    SORT_ORDER = 9
WHERE
    CATEGORY = 'review'
    AND SORT_ORDER = 0;

-- Set default sort_order for any remaining permissions
UPDATE PERMISSIONS
SET
    SORT_ORDER = 10
WHERE
    SORT_ORDER = 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_RISK_LEVEL ON PERMISSIONS(RISK_LEVEL);

CREATE INDEX IF NOT EXISTS IDX_PERMISSIONS_ARCHIVED_AT ON PERMISSIONS(ARCHIVED_AT) WHERE ARCHIVED_AT IS NOT NULL;

-- Simple verification
SELECT
    'Migration 0050 completed successfully - Added missing permissions columns' AS STATUS;