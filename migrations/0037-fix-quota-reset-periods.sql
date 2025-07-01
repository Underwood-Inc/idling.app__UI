-- Migration: Fix Quota Reset Periods
-- Description: Updates user quota overrides to use correct reset periods based on feature names
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-29

-- Fix user quota overrides with incorrect reset periods
UPDATE user_quota_overrides 
SET reset_period = 'daily', updated_at = NOW()
WHERE service_name = 'og_generator' 
  AND feature_name = 'daily_generations' 
  AND reset_period != 'daily';

-- Fix any other daily features that might have wrong reset periods
UPDATE user_quota_overrides 
SET reset_period = 'daily', updated_at = NOW()
WHERE feature_name LIKE '%daily%' 
  AND reset_period != 'daily';

-- Fix weekly features
UPDATE user_quota_overrides 
SET reset_period = 'weekly', updated_at = NOW()
WHERE feature_name LIKE '%weekly%' 
  AND reset_period != 'weekly';

-- Fix monthly features  
UPDATE user_quota_overrides 
SET reset_period = 'monthly', updated_at = NOW()
WHERE feature_name LIKE '%monthly%' 
  AND reset_period != 'monthly';

-- Fix hourly features
UPDATE user_quota_overrides 
SET reset_period = 'hourly', updated_at = NOW()
WHERE feature_name LIKE '%hourly%' 
  AND reset_period != 'hourly';

-- Log the changes
INSERT INTO admin_actions (
  admin_user_id, 
  action_type, 
  action_details, 
  reason, 
  created_at
) VALUES (
  1, -- System user
  'quota_reset_period_fix',
  '{"migration": "0037-fix-quota-reset-periods", "updated_overrides": true}',
  'Fixed reset periods for user quota overrides to match feature naming conventions',
  NOW()
);

-- Success message
SELECT 'Fixed quota reset periods successfully' as result; 