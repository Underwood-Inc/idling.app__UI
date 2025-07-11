-- Add Background Settings Migration
-- This migration adds background animation settings for the RetroSpaceBackground component

-- Add background settings columns
ALTER TABLE USERS
    ADD COLUMN IF NOT EXISTS BACKGROUND_MOVEMENT_DIRECTION VARCHAR(
        20
    ) DEFAULT 'forward' CHECK (
        BACKGROUND_MOVEMENT_DIRECTION IN ('static', 'forward', 'backward', 'left', 'right', 'up', 'down')
    );

ALTER TABLE USERS
    ADD COLUMN IF NOT EXISTS BACKGROUND_MOVEMENT_SPEED VARCHAR(
        10
    ) DEFAULT 'normal' CHECK (
        BACKGROUND_MOVEMENT_SPEED IN ('slow', 'normal', 'fast')
    );

ALTER TABLE USERS
    ADD COLUMN IF NOT EXISTS BACKGROUND_ANIMATION_LAYERS JSONB DEFAULT '{"stars": true, "particles": true, "nebula": true, "planets": true, "aurora": true}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS IDX_USERS_BACKGROUND_MOVEMENT_DIRECTION ON USERS(BACKGROUND_MOVEMENT_DIRECTION);

CREATE INDEX IF NOT EXISTS IDX_USERS_BACKGROUND_MOVEMENT_SPEED ON USERS(BACKGROUND_MOVEMENT_SPEED);

CREATE INDEX IF NOT EXISTS IDX_USERS_BACKGROUND_ANIMATION_LAYERS ON USERS USING GIN(BACKGROUND_ANIMATION_LAYERS);

-- Add comments
COMMENT ON COLUMN USERS.BACKGROUND_MOVEMENT_DIRECTION IS 'User preference for background movement direction (static, forward, backward, left, right, up, down)';
COMMENT ON COLUMN USERS.BACKGROUND_MOVEMENT_SPEED IS 'User preference for background movement speed (slow, normal, fast)';
COMMENT ON COLUMN USERS.BACKGROUND_ANIMATION_LAYERS IS 'User preference for which animation layers to show (JSON object with boolean flags)';

-- Success message
SELECT
    'Background settings columns added successfully' AS RESULT;