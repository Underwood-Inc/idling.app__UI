-- Migration: Update Free Tier Daily Generation Limit to 1
-- This migration reduces the free tier daily generation limit from 10 to 1

-- Update the plan feature values for free tier daily generations
UPDATE plan_feature_values 
SET feature_value = '1'
WHERE plan_id = (SELECT id FROM subscription_plans WHERE name = 'free')
  AND feature_id = (SELECT id FROM subscription_features WHERE name = 'daily_generations')
  AND feature_value = '10';

-- Update the subscription features default value
UPDATE subscription_features 
SET default_value = '1'
WHERE name = 'daily_generations' 
  AND service_id = (SELECT id FROM subscription_services WHERE name = 'og_generator')
  AND default_value = '10';

-- Update the plan services feature limits
UPDATE plan_services 
SET feature_limits = '{"daily_limit": 1}'
WHERE plan_id = (SELECT id FROM subscription_plans WHERE name = 'free')
  AND service_id = (SELECT id FROM subscription_services WHERE name = 'og_generator')
  AND feature_limits::text LIKE '%"daily_limit": 10%';

-- Log the migration
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('0023-update-free-tier-daily-limit', NOW())
ON CONFLICT (version) DO NOTHING; 