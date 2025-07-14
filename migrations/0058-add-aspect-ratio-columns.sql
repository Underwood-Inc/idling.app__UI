-- Migration: Add proper width and height columns for aspect ratios
-- This completely removes JSON storage and creates proper relational structure

-- Add width and height columns to form_options table
ALTER TABLE FORM_OPTIONS
    ADD COLUMN IF NOT EXISTS WIDTH INTEGER, ADD COLUMN IF NOT EXISTS HEIGHT INTEGER;

-- Update existing aspect ratio records to use proper columns and clear JSON
UPDATE FORM_OPTIONS
SET
    WIDTH = CAST(
        CONFIGURATION->>'width' AS INTEGER
    ),
    HEIGHT = CAST(
        CONFIGURATION->>'height' AS INTEGER
    ),
    CONFIGURATION = NULL
WHERE
    CATEGORY = 'aspect_ratios'
    AND CONFIGURATION IS NOT NULL
    AND CONFIGURATION->>'width' IS NOT NULL
    AND CONFIGURATION->>'height' IS NOT NULL;

-- Insert any missing aspect ratios with proper columns (NO JSON)
INSERT INTO FORM_OPTIONS (
    CATEGORY,
    KEY,
    NAME,
    DESCRIPTION,
    SORT_ORDER,
    WIDTH,
    HEIGHT,
    IS_ACTIVE
) VALUES (
    'aspect_ratios',
    'default',
    'Open Graph (Default)',
    'Standard social media sharing',
    1,
    1200,
    630,
    TRUE
),
(
    'aspect_ratios',
    'square',
    'Square (1:1)',
    'Instagram posts, Facebook posts',
    2,
    1080,
    1080,
    TRUE
),
(
    'aspect_ratios',
    '4-3',
    'Standard (4:3)',
    'Presentations, classic displays',
    3,
    1200,
    900,
    TRUE
),
(
    'aspect_ratios',
    'youtube',
    'YouTube Thumbnail (16:9)',
    'YouTube thumbnails, video content',
    4,
    1280,
    720,
    TRUE
),
(
    'aspect_ratios',
    'facebook-cover',
    'Facebook Cover',
    'Facebook cover photos',
    5,
    1702,
    630,
    TRUE
),
(
    'aspect_ratios',
    'linkedin-banner',
    'LinkedIn Banner',
    'LinkedIn profile banners',
    6,
    1584,
    396,
    TRUE
),
(
    'aspect_ratios',
    'twitter-header',
    'Twitter Header',
    'Twitter profile headers',
    7,
    1500,
    500,
    TRUE
) ON CONFLICT (
    CATEGORY,
    KEY
) DO UPDATE SET WIDTH = EXCLUDED.WIDTH,
HEIGHT = EXCLUDED.HEIGHT,
NAME = EXCLUDED.NAME,
DESCRIPTION = EXCLUDED.DESCRIPTION,
SORT_ORDER = EXCLUDED.SORT_ORDER,
IS_ACTIVE = EXCLUDED.IS_ACTIVE,
CONFIGURATION = NULL,
UPDATED_AT = CURRENT_TIMESTAMP;

-- Verify the data was migrated correctly
-- SELECT key, name, width, height, configuration FROM form_options WHERE category = 'aspect_ratios' ORDER BY sort_order;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS IDX_FORM_OPTIONS_ASPECT_RATIOS ON FORM_OPTIONS(CATEGORY, WIDTH, HEIGHT) WHERE CATEGORY = 'aspect_ratios';