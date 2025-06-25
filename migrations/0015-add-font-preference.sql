-- Add Font Preference User Preference Migration
-- This migration adds font preference field for users

-- Add font preference column
ALTER TABLE users ADD COLUMN IF NOT EXISTS font_preference VARCHAR(10) DEFAULT 'default' CHECK (font_preference IN ('monospace', 'default'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_font_preference ON users(font_preference);

-- Add comment
COMMENT ON COLUMN users.font_preference IS 'User preference for font family (monospace for code font, default for system fonts)';

-- Success message
SELECT 'Font preference column added successfully' as result; 