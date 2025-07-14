-- Migration: Seed aspect ratios data into form_options table
-- This migration populates the aspect_ratios category with all the current hardcoded ratios

-- Insert aspect ratio options
INSERT INTO FORM_OPTIONS (
    CATEGORY,
    KEY,
    NAME,
    DESCRIPTION,
    SORT_ORDER,
    CONFIGURATION,
    IS_ACTIVE
) VALUES (
    'aspect_ratios',
    'default',
    'Open Graph (Default)',
    'Standard social media sharing',
    1,
    '{"width": 1200, "height": 630}',
    TRUE
),
(
    'aspect_ratios',
    'square',
    'Square (1:1)',
    'Instagram posts, Facebook posts',
    2,
    '{"width": 1080, "height": 1080}',
    TRUE
),
(
    'aspect_ratios',
    '4-3',
    'Standard (4:3)',
    'Presentations, classic displays',
    3,
    '{"width": 1200, "height": 900}',
    TRUE
),
(
    'aspect_ratios',
    'youtube',
    'YouTube Thumbnail (16:9)',
    'YouTube thumbnails, video content',
    4,
    '{"width": 1280, "height": 720}',
    TRUE
),
(
    'aspect_ratios',
    'facebook-cover',
    'Facebook Cover',
    'Facebook cover photos',
    5,
    '{"width": 1702, "height": 630}',
    TRUE
),
(
    'aspect_ratios',
    'linkedin-banner',
    'LinkedIn Banner',
    'LinkedIn profile banners',
    6,
    '{"width": 1584, "height": 396}',
    TRUE
),
(
    'aspect_ratios',
    'twitter-header',
    'Twitter Header',
    'Twitter profile headers',
    7,
    '{"width": 1500, "height": 500}',
    TRUE
)
 -- Handle conflicts (if data already exists)
ON CONFLICT (
    CATEGORY,
    KEY
) DO UPDATE SET NAME = EXCLUDED.NAME,
DESCRIPTION = EXCLUDED.DESCRIPTION,
SORT_ORDER = EXCLUDED.SORT_ORDER,
CONFIGURATION = EXCLUDED.CONFIGURATION,
IS_ACTIVE = EXCLUDED.IS_ACTIVE,
UPDATED_AT = CURRENT_TIMESTAMP;