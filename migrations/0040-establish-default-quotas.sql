-- Migration: Establish Default Quotas for OG Image Generator
-- Description: Sets up baseline quotas that work with both subscription and override systems
-- Author: System Wizard
-- Date: 2025-01-05

-- ================================
-- ESTABLISH DEFAULT QUOTAS
-- ================================

-- Remove existing quota overrides that conflict with our new architecture
-- We'll rely on subscription plans for base quotas, with overrides only for special cases
DELETE FROM user_quota_overrides 
WHERE service_name = 'og_generator' 
AND feature_name = 'daily_generations'
AND reason = 'Default quota assignment for authenticated users';

-- ================================
-- ENSURE SUBSCRIPTION SYSTEM IS READY
-- ================================

-- Make sure the OG Generator service exists
INSERT INTO subscription_services (name, display_name, description, category, is_core_service, is_standalone, is_active)
VALUES ('og_generator', 'OG Image Generator', 'Generate custom OG images for social media', 'premium', false, true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Make sure the daily_generations feature exists
INSERT INTO subscription_features (service_id, name, display_name, description, feature_type, default_value, validation_rules)
SELECT ss.id, 'daily_generations', 'Daily Generations', 'Number of OG images that can be generated per day', 'limit', '1', '{"min": 0, "max": 10000}'
FROM subscription_services ss
WHERE ss.name = 'og_generator'
ON CONFLICT (service_id, name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_value = EXCLUDED.default_value;

-- ================================
-- ENSURE FREE PLAN EXISTS AND IS PROPERLY CONFIGURED
-- ================================

-- Update free plan to be the default
UPDATE subscription_plans 
SET is_default = true 
WHERE name = 'free';

-- Make sure free plan has OG generator service
INSERT INTO plan_services (plan_id, service_id, feature_limits, is_unlimited)
SELECT sp.id, ss.id, '{"daily_limit": 1}', false
FROM subscription_plans sp, subscription_services ss
WHERE sp.name = 'free' AND ss.name = 'og_generator'
ON CONFLICT (plan_id, service_id) DO UPDATE SET
  feature_limits = EXCLUDED.feature_limits,
  is_unlimited = EXCLUDED.is_unlimited;

-- Make sure free plan has the daily_generations feature value
INSERT INTO plan_feature_values (plan_id, feature_id, feature_value)
SELECT sp.id, sf.id, '1'
FROM subscription_plans sp
JOIN subscription_services ss ON ss.name = 'og_generator'
JOIN subscription_features sf ON sf.service_id = ss.id
WHERE sp.name = 'free' AND sf.name = 'daily_generations'
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  feature_value = EXCLUDED.feature_value;

-- ================================
-- ASSIGN ALL USERS TO FREE PLAN (IF THEY DON'T HAVE A SUBSCRIPTION)
-- ================================

-- Assign free plan to all users who don't have an active subscription
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, assignment_reason)
SELECT u.id, p.id, 'active', NULL, 'Default free plan assignment - quota system baseline'
FROM users u
CROSS JOIN subscription_plans p
WHERE p.name = 'free'
AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us 
    WHERE us.user_id = u.id 
    AND us.status IN ('active', 'trialing')
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
);

-- ================================
-- GUEST QUOTAS (ALREADY CONFIGURED)
-- ================================

-- Ensure guest quota exists and is properly configured
INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period, description, created_by) 
VALUES ('og_generator', 'daily_generations', 1, 'daily', 'Default daily generation limit for anonymous users', NULL)
ON CONFLICT (service_name, feature_name) DO UPDATE SET
  quota_limit = EXCLUDED.quota_limit,
  reset_period = EXCLUDED.reset_period,
  description = EXCLUDED.description;

-- ================================
-- SUMMARY AND VERIFICATION
-- ================================

-- Create a summary of the current quota setup
DO $$
BEGIN
    RAISE NOTICE 'Default Quota Setup Summary:';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Guest Users: 1 generation per day (via global_guest_quotas)';
    RAISE NOTICE 'Authenticated Users: 1 generation per day (via free subscription plan)';
    RAISE NOTICE 'Pro Users: Unlimited generations (via pro subscription plan)';
    RAISE NOTICE 'Override Users: Custom quotas (via user_quota_overrides when needed)';
    RAISE NOTICE '';
    RAISE NOTICE 'Architecture: Agnostic quota system with subscription integration';
    RAISE NOTICE 'When both subscription and override exist, higher quota wins';
END $$;

-- Success message
SELECT 'Default quotas established successfully - agnostic quota system ready' as result; 