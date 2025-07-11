-- Migration: Fix subscription usage constraint for guest users
-- Description: Drops and recreates subscription_usage table with proper constraints for NULL subscription_id
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-27

-- ================================
-- PROBLEM ANALYSIS
-- ================================
-- The subscription_usage table has a NOT NULL constraint on subscription_id that prevents guest user tracking
-- The unique constraint doesn't match the application's COALESCE(subscription_id, 0) logic
-- Solution: Drop and recreate the table with proper constraints

-- ================================
-- BACKUP EXISTING DATA (if any)
-- ================================
CREATE TEMP TABLE SUBSCRIPTION_USAGE_BACKUP AS
SELECT * FROM SUBSCRIPTION_USAGE;

-- ================================
-- DROP AND RECREATE TABLE
-- ================================
DROP TABLE IF EXISTS SUBSCRIPTION_USAGE CASCADE;

CREATE TABLE SUBSCRIPTION_USAGE (
    ID SERIAL PRIMARY KEY,
    USER_ID INTEGER NOT NULL REFERENCES USERS(ID) ON DELETE CASCADE,
    SUBSCRIPTION_ID INTEGER REFERENCES USER_SUBSCRIPTIONS(ID) ON DELETE CASCADE, -- NULL allowed for guest users
    SERVICE_ID INTEGER NOT NULL REFERENCES SUBSCRIPTION_SERVICES(ID) ON DELETE CASCADE,
    FEATURE_ID INTEGER REFERENCES SUBSCRIPTION_FEATURES(ID) ON DELETE CASCADE,
 
    -- Usage tracking
    USAGE_DATE DATE NOT NULL DEFAULT CURRENT_DATE,
    USAGE_COUNT INTEGER NOT NULL DEFAULT 1,
    USAGE_VALUE JSONB, -- Flexible usage data
    -- Context metadata
    METADATA JSONB, -- IP, user agent, API key, etc.
    -- Timestamps
    CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 
    -- Constraints
    CHECK (USAGE_COUNT >= 0)
);

-- ================================
-- CREATE FUNCTIONAL UNIQUE INDEX
-- ================================
-- This matches the application's COALESCE(subscription_id, 0) logic
CREATE UNIQUE INDEX IDX_SUBSCRIPTION_USAGE_CONFLICT_RESOLUTION
ON SUBSCRIPTION_USAGE (
    USER_ID,
    COALESCE(SUBSCRIPTION_ID, 0),
    SERVICE_ID,
    FEATURE_ID,
    USAGE_DATE
);

-- ================================
-- PERFORMANCE INDEXES
-- ================================
-- Main usage tracking indexes
CREATE INDEX IDX_SUBSCRIPTION_USAGE_USER_DATE ON SUBSCRIPTION_USAGE(USER_ID, USAGE_DATE);

CREATE INDEX IDX_SUBSCRIPTION_USAGE_SERVICE_DATE ON SUBSCRIPTION_USAGE(SERVICE_ID, USAGE_DATE);

CREATE INDEX IDX_SUBSCRIPTION_USAGE_SUBSCRIPTION ON SUBSCRIPTION_USAGE(SUBSCRIPTION_ID) WHERE SUBSCRIPTION_ID IS NOT NULL;

-- Guest usage tracking (NULL subscription_id)
CREATE INDEX IDX_SUBSCRIPTION_USAGE_GUEST_USAGE
ON SUBSCRIPTION_USAGE (USER_ID, SERVICE_ID, FEATURE_ID, USAGE_DATE)
WHERE SUBSCRIPTION_ID IS NULL;

-- Subscription-specific usage queries
CREATE INDEX IDX_SUBSCRIPTION_USAGE_SUBSCRIPTION_SPECIFIC
ON SUBSCRIPTION_USAGE (SUBSCRIPTION_ID, SERVICE_ID, FEATURE_ID, USAGE_DATE)
WHERE SUBSCRIPTION_ID IS NOT NULL;

-- ================================
-- RESTORE DATA (if any existed)
-- ================================
INSERT INTO SUBSCRIPTION_USAGE (
    USER_ID,
    SUBSCRIPTION_ID,
    SERVICE_ID,
    FEATURE_ID,
    USAGE_DATE,
    USAGE_COUNT,
    USAGE_VALUE,
    METADATA,
    CREATED_AT,
    UPDATED_AT
)
    SELECT
        USER_ID,
        SUBSCRIPTION_ID,
        SERVICE_ID,
        FEATURE_ID,
        USAGE_DATE,
        USAGE_COUNT,
        USAGE_VALUE,
        METADATA,
        CREATED_AT,
        UPDATED_AT
    FROM
        SUBSCRIPTION_USAGE_BACKUP
        ON CONFLICT (USER_ID,
        COALESCE(SUBSCRIPTION_ID,
        0),
        SERVICE_ID,
        FEATURE_ID,
        USAGE_DATE) DO UPDATE SET USAGE_COUNT = SUBSCRIPTION_USAGE.USAGE_COUNT + EXCLUDED.USAGE_COUNT,
        UPDATED_AT = NOW();

-- ================================
-- ADD TRIGGERS
-- ================================
CREATE TRIGGER UPDATE_SUBSCRIPTION_USAGE_UPDATED_AT BEFORE
    UPDATE ON SUBSCRIPTION_USAGE FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN();
 
    -- ================================
    -- CLEANUP
    -- ================================
    DROP TABLE SUBSCRIPTION_USAGE_BACKUP;
 
    -- Verification
    SELECT 'Migration 0051 completed successfully - Recreated subscription_usage table with proper guest support' AS STATUS;