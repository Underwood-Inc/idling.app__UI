-- Migration: Enable Pro Subscription Plan
-- Description: Activates the Pro subscription plan that was created but disabled
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- ENABLE PRO SUBSCRIPTION PLAN
-- ================================

-- Enable the Pro plan that was created but disabled
UPDATE SUBSCRIPTION_PLANS
SET
    IS_ACTIVE = TRUE
WHERE
    NAME = 'pro';

-- Verify the Pro plan is properly configured
SELECT
    NAME,
    DISPLAY_NAME,
    IS_ACTIVE,
    PRICE_MONTHLY_CENTS,
    PRICE_YEARLY_CENTS,
    PRICE_LIFETIME_CENTS
FROM
    SUBSCRIPTION_PLANS
WHERE
    NAME = 'pro';

-- Success message
SELECT
    'Pro subscription plan enabled successfully' AS RESULT;