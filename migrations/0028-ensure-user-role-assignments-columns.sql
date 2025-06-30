-- Migration: Ensure user_role_assignments has required columns
-- Description: Adds missing columns to user_role_assignments table if they don't exist
-- Author: System Wizard  
-- Date: 2025-01-27

-- ================================
-- ENSURE REQUIRED COLUMNS EXIST
-- ================================

-- Add is_active column if it doesn't exist
ALTER TABLE user_role_assignments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add other potentially missing columns
ALTER TABLE user_role_assignments 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS removed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;

-- ================================
-- ENSURE PROPER INDEXES
-- ================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active 
ON user_role_assignments(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_expires 
ON user_role_assignments(expires_at) WHERE expires_at IS NOT NULL;

-- ================================
-- UPDATE EXISTING DATA
-- ================================

-- Ensure all existing role assignments are marked as active
UPDATE user_role_assignments 
SET is_active = true 
WHERE is_active IS NULL;

-- ================================
-- ADD TRIGGER FOR UPDATED_AT
-- ================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_role_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS trigger_user_role_assignments_updated_at ON user_role_assignments;
CREATE TRIGGER trigger_user_role_assignments_updated_at
    BEFORE UPDATE ON user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_role_assignments_updated_at();

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON COLUMN user_role_assignments.is_active IS 'Whether this role assignment is currently active';
COMMENT ON COLUMN user_role_assignments.reason IS 'Reason for role assignment (for admin tracking)';
COMMENT ON COLUMN user_role_assignments.updated_at IS 'Timestamp when role assignment was last updated';
COMMENT ON COLUMN user_role_assignments.removed_by IS 'User ID who removed this role assignment';
COMMENT ON COLUMN user_role_assignments.removed_at IS 'Timestamp when role was removed'; 