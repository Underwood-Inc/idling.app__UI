-- Migration: Fix user_quota_overrides table
-- Description: Adds missing is_active column to user_quota_overrides table
-- Author: System Wizard  
-- Date: 2025-01-27

-- ================================
-- ADD MISSING COLUMNS
-- ================================

-- Add is_active column to user_quota_overrides
ALTER TABLE user_quota_overrides 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add reset_period column for consistency with other quota tables
ALTER TABLE user_quota_overrides 
ADD COLUMN IF NOT EXISTS reset_period VARCHAR(20) DEFAULT 'monthly';

-- ================================
-- UPDATE EXISTING DATA
-- ================================

-- Ensure all existing quota overrides are marked as active
UPDATE user_quota_overrides 
SET is_active = true 
WHERE is_active IS NULL;

-- Set default reset_period for existing records
UPDATE user_quota_overrides 
SET reset_period = 'monthly' 
WHERE reset_period IS NULL;

-- ================================
-- CREATE INDEXES
-- ================================

-- Create index for active quota overrides
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_active 
ON user_quota_overrides(user_id, is_active) WHERE is_active = true;

-- Create index for service/feature lookups
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_lookup 
ON user_quota_overrides(user_id, service_name, feature_name, is_active) WHERE is_active = true;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON COLUMN user_quota_overrides.is_active IS 'Whether this quota override is currently active';
COMMENT ON COLUMN user_quota_overrides.reset_period IS 'How often the quota resets (hourly, daily, weekly, monthly)'; 