-- Add User Preferences Migration
-- This migration adds user preference fields for app-wide settings

-- Add user preference columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS spacing_theme VARCHAR(10) DEFAULT 'cozy' CHECK (spacing_theme IN ('cozy', 'compact'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS pagination_mode VARCHAR(20) DEFAULT 'traditional' CHECK (pagination_mode IN ('traditional', 'infinite'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_spacing_theme ON users(spacing_theme);
CREATE INDEX IF NOT EXISTS idx_users_pagination_mode ON users(pagination_mode);

-- Add comments
COMMENT ON COLUMN users.spacing_theme IS 'User preference for app-wide spacing theme (cozy or compact)';
COMMENT ON COLUMN users.pagination_mode IS 'User preference for app-wide pagination mode (traditional or infinite)';

-- Success message
SELECT 'User preferences columns added successfully' as result; 