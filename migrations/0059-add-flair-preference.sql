-- Migration: Add Flair Preference User Setting
-- Description: Adds flair preference field for users to control which subscription decoration is displayed
-- Author: System Wizard 🧙‍♂️
-- Date: 2025-01-28

-- Add flair preference column
ALTER TABLE USERS
    ADD COLUMN IF NOT EXISTS FLAIR_PREFERENCE VARCHAR(
        20
    ) DEFAULT 'auto' CHECK (
        FLAIR_PREFERENCE IN ('auto', 'enterprise-crown', 'premium-galaxy', 'pro-plasma', 'active-glow', 'trial-pulse', 'none')
    );

-- Add index for performance
CREATE INDEX IF NOT EXISTS IDX_USERS_FLAIR_PREFERENCE ON USERS(FLAIR_PREFERENCE);

-- Add comment
COMMENT ON COLUMN USERS.FLAIR_PREFERENCE IS 'User preference for which subscription flair to display (auto for highest tier, specific flair type, or none to disable)';

-- Success message
SELECT
    'Flair preference column added successfully' AS RESULT;