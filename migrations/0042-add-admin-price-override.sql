-- Migration: Add Admin Price Override System
-- Description: Allows admins to override subscription pricing for specific users, enabling ad-hoc trial variants and special pricing
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-27

-- ================================
-- ADD ADMIN PRICE OVERRIDE COLUMNS
-- ================================

-- Add admin price override to user_subscriptions table
ALTER TABLE USER_SUBSCRIPTIONS
    ADD COLUMN ADMIN_PRICE_OVERRIDE_CENTS INTEGER;

ALTER TABLE USER_SUBSCRIPTIONS
    ADD COLUMN ADMIN_PRICE_OVERRIDE_REASON TEXT;

ALTER TABLE USER_SUBSCRIPTIONS
    ADD COLUMN ADMIN_PRICE_OVERRIDE_BY INTEGER
        REFERENCES USERS(
            ID
        );

ALTER TABLE USER_SUBSCRIPTIONS
    ADD COLUMN ADMIN_PRICE_OVERRIDE_AT TIMESTAMP WITH TIME ZONE;

-- ================================
-- ADD CONSTRAINTS AND COMMENTS
-- ================================

-- Price override must be non-negative if set
ALTER TABLE USER_SUBSCRIPTIONS
    ADD CONSTRAINT CHECK_ADMIN_PRICE_OVERRIDE_CENTS CHECK (
        ADMIN_PRICE_OVERRIDE_CENTS IS NULL OR ADMIN_PRICE_OVERRIDE_CENTS >= 0
    );

-- Comment the new columns
COMMENT ON COLUMN USER_SUBSCRIPTIONS.ADMIN_PRICE_OVERRIDE_CENTS IS 'Admin-set custom price in cents, overrides plan pricing when set';
COMMENT ON COLUMN USER_SUBSCRIPTIONS.ADMIN_PRICE_OVERRIDE_REASON IS 'Reason for price override (trial, special discount, etc.)';
COMMENT ON COLUMN USER_SUBSCRIPTIONS.ADMIN_PRICE_OVERRIDE_BY IS 'Admin user who set the price override';
COMMENT ON COLUMN USER_SUBSCRIPTIONS.ADMIN_PRICE_OVERRIDE_AT IS 'When the price override was set';

-- ================================
-- CREATE INDEX FOR PERFORMANCE
-- ================================

-- Index for finding price overrides
CREATE INDEX IDX_USER_SUBSCRIPTIONS_PRICE_OVERRIDE ON USER_SUBSCRIPTIONS(ADMIN_PRICE_OVERRIDE_CENTS) WHERE ADMIN_PRICE_OVERRIDE_CENTS IS NOT NULL;

-- Index for audit trail
CREATE INDEX IDX_USER_SUBSCRIPTIONS_OVERRIDE_ADMIN ON USER_SUBSCRIPTIONS(ADMIN_PRICE_OVERRIDE_BY) WHERE ADMIN_PRICE_OVERRIDE_BY IS NOT NULL;

-- ================================
-- UPDATE EXISTING DATA
-- ================================

-- Set existing free plan subscriptions to have $0 override for consistency
UPDATE USER_SUBSCRIPTIONS
SET
    ADMIN_PRICE_OVERRIDE_CENTS = 0,
    ADMIN_PRICE_OVERRIDE_REASON = 'Free plan - automatic system assignment',
    ADMIN_PRICE_OVERRIDE_AT = NOW(
    ) FROM SUBSCRIPTION_PLANS SP
WHERE
    USER_SUBSCRIPTIONS.PLAN_ID = SP.ID
    AND SP.NAME = 'free'
    AND USER_SUBSCRIPTIONS.ADMIN_PRICE_OVERRIDE_CENTS IS NULL;

-- Success message
SELECT
    'Admin price override system added successfully' AS RESULT;