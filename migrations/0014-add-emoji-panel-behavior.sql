-- Add Emoji Panel Behavior User Preference Migration
-- This migration adds emoji panel behavior preference field

-- Add emoji panel behavior column
ALTER TABLE users ADD COLUMN IF NOT EXISTS emoji_panel_behavior VARCHAR(20) DEFAULT 'close_after_select' CHECK (emoji_panel_behavior IN ('close_after_select', 'stay_open'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_emoji_panel_behavior ON users(emoji_panel_behavior);

-- Add comment
COMMENT ON COLUMN users.emoji_panel_behavior IS 'User preference for emoji panel behavior after selection (close_after_select or stay_open)';

-- Success message
SELECT 'Emoji panel behavior preference column added successfully' as result; 