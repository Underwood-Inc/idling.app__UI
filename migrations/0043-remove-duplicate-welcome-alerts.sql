-- ================================
-- REMOVE DUPLICATE WELCOME ALERTS
-- ================================
--
-- This migration removes duplicate "Welcome to the Enhanced Alert System!" alerts
-- that were created by multiple migration scripts (0030 and 0032).
--
-- Author: System Wizard 🧙‍♂️
-- Date: January 28, 2025
-- ================================

-- Remove all duplicate welcome alerts, keeping only the oldest one
WITH DUPLICATE_ALERTS AS (
    SELECT
        ID,
        ROW_NUMBER() OVER ( PARTITION BY TITLE,
        MESSAGE ORDER BY CREATED_AT ASC,
        ID ASC ) AS RN
    FROM
        CUSTOM_ALERTS
    WHERE
        TITLE = 'Welcome to the Enhanced Alert System! 🎉'
        AND MESSAGE = 'We''ve upgraded our notification system to provide better, more targeted alerts.'
) DELETE FROM CUSTOM_ALERTS WHERE ID IN (
    SELECT
        ID
    FROM
        DUPLICATE_ALERTS
    WHERE
        RN > 1
);

-- Clean up any alert dismissals for the deleted alerts
DELETE FROM ALERT_DISMISSALS
WHERE
    ALERT_ID NOT IN (
        SELECT
            ID
        FROM
            CUSTOM_ALERTS
    );

-- Clean up any alert analytics for the deleted alerts
DELETE FROM ALERT_ANALYTICS
WHERE
    ALERT_ID NOT IN (
        SELECT
            ID
        FROM
            CUSTOM_ALERTS
    );

-- Add a unique constraint to prevent this from happening again
CREATE UNIQUE INDEX IF NOT EXISTS IDX_CUSTOM_ALERTS_UNIQUE_SYSTEM_TITLE_MESSAGE
ON CUSTOM_ALERTS (TITLE, MESSAGE)
WHERE CREATED_BY IS NULL;

-- ================================
-- SUCCESS MESSAGE
-- ================================
SELECT
    'Migration 0043: Successfully removed duplicate welcome alerts' AS STATUS;