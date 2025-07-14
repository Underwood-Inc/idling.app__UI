-- Migration: Create form_options table for scalable UI configuration
-- This table stores all form select options and UI configuration values
-- to eliminate hardcoded frontend constants and prevent tech debt

-- Create form_options table
CREATE TABLE IF NOT EXISTS FORM_OPTIONS (
    ID SERIAL PRIMARY KEY,
    CATEGORY VARCHAR(50) NOT NULL, -- e.g., 'aspect_ratios', 'subscription_plans', 'quote_sources'
    KEY VARCHAR(100) NOT NULL, -- e.g., 'facebook-cover', 'default', 'square'
    NAME VARCHAR(255) NOT NULL, -- e.g., 'Facebook Cover', 'Open Graph (Default)'
    DESCRIPTION TEXT, -- e.g., 'Facebook cover photos'
    SORT_ORDER INTEGER DEFAULT 0, -- For ordering in UI
    IS_ACTIVE BOOLEAN DEFAULT TRUE, -- Enable/disable options
    CONFIGURATION JSONB, -- Flexible JSON config (dimensions, settings, etc.)
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS IDX_FORM_OPTIONS_CATEGORY ON FORM_OPTIONS(CATEGORY);

CREATE INDEX IF NOT EXISTS IDX_FORM_OPTIONS_CATEGORY_ACTIVE ON FORM_OPTIONS(CATEGORY, IS_ACTIVE);

CREATE INDEX IF NOT EXISTS IDX_FORM_OPTIONS_KEY ON FORM_OPTIONS(KEY);

CREATE INDEX IF NOT EXISTS IDX_FORM_OPTIONS_SORT_ORDER ON FORM_OPTIONS(SORT_ORDER);

-- Create unique constraint to prevent duplicates
ALTER TABLE FORM_OPTIONS
    ADD CONSTRAINT UNIQUE_CATEGORY_KEY UNIQUE (
        CATEGORY,
        KEY
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_form_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_form_options_updated_at
    BEFORE UPDATE ON form_options
    FOR EACH ROW
    EXECUTE FUNCTION update_form_options_updated_at();

-- Insert aspect ratio configurations
INSERT INTO form_options (category, key, name, description, sort_order, configuration) VALUES
('aspect_ratios', 'default', 'Open Graph (Default)', 'Standard social media sharing', 1, '{"width": 1200, "height": 630, "dimensions": "1200×630", "textMaxWidth": 900, "textStartY": 420, "avatarX": 350, "avatarY": 20, "avatarSize": 500}'),
('aspect_ratios', 'square', 'Square (1:1)', 'Instagram posts, Facebook posts', 2, '{"width": 1080, "height": 1080, "dimensions": "1080×1080", "textMaxWidth": 950, "textStartY": 750, "avatarX": 240, "avatarY": 140, "avatarSize": 550}'),
('aspect_ratios', '4-3', 'Standard (4:3)', 'Presentations, classic displays', 3, '{"width": 1200, "height": 900, "dimensions": "1200×900", "textMaxWidth": 1000, "textStartY": 680, "avatarX": 350, "avatarY": 80, "avatarSize": 520}'),
('aspect_ratios', 'youtube', 'YouTube Thumbnail (16:9)', 'YouTube thumbnails, video content', 4, '{"width": 1280, "height": 720, "dimensions": "1280×720", "textMaxWidth": 1100, "textStartY": 520, "avatarX": 390, "avatarY": 60, "avatarSize": 450}'),
('aspect_ratios', 'facebook-cover', 'Facebook Cover', 'Facebook cover photos', 5, '{"width": 1702, "height": 630, "dimensions": "1702×630", "textMaxWidth": 1000, "textStartY": 450, "avatarX": 650, "avatarY": 40, "avatarSize": 500}'),
('aspect_ratios', 'linkedin-banner', 'LinkedIn Banner', 'LinkedIn profile banners', 6, '{"width": 1584, "height": 396, "dimensions": "1584×396", "textMaxWidth": 1300, "textStartY": 280, "avatarX": 792, "avatarY": 40, "avatarSize": 160}'),
('aspect_ratios', 'twitter-header', 'Twitter Header', 'Twitter profile headers', 7, '{"width": 1500, "height": 500, "dimensions": "1500×500", "textMaxWidth": 1200, "textStartY": 380, "avatarX": 350, "avatarY": 70, "avatarSize": 400}');

-- Insert other form options that could be database-driven
INSERT INTO form_options (category, key, name, description, sort_order, configuration) VALUES
('generator_modes', 'wizard', 'Wizard Mode', 'Guided step-by-step generation (Free)', 1, '{"features": ["guided_steps", "basic_options"], "subscription_required": false}'),
('generator_modes', 'advanced', 'Advanced Mode', 'Full control over all parameters (Pro)', 2, '{"features": ["all_controls", "positioning", "styling"], "subscription_required": true}');

-- Insert watermark positions
INSERT INTO form_options (category, key, name, description, sort_order, configuration) VALUES
('watermark_positions', 'top-left', 'Top Left', 'Position watermark in top-left corner', 1, '{"x": "start", "y": "start"}'),
('watermark_positions', 'top-right', 'Top Right', 'Position watermark in top-right corner', 2, '{"x": "end", "y": "start"}'),
('watermark_positions', 'bottom-left', 'Bottom Left', 'Position watermark in bottom-left corner', 3, '{"x": "start", "y": "end"}'),
('watermark_positions', 'bottom-right', 'Bottom Right', 'Position watermark in bottom-right corner', 4, '{"x": "end", "y": "end"}'),
('watermark_positions', 'center', 'Center', 'Position watermark in center', 5, '{"x": "center", "y": "center"}'),
('watermark_positions', 'repeated', 'Repeated', 'Repeat watermark diagonally across image', 6, '{"pattern": "diagonal", "spacing": 200}');

-- Insert font size options
INSERT INTO form_options (category, key, name, description, sort_order, configuration) VALUES
('font_sizes', 'small', 'Small', 'Smaller text size', 1, '{"multiplier": 0.8, "min_size": 16}'),
('font_sizes', 'medium', 'Medium', 'Default text size', 2, '{"multiplier": 1.0, "min_size": 20}'),
('font_sizes', 'large', 'Large', 'Larger text size', 3, '{"multiplier": 1.2, "min_size": 24}'),
('font_sizes', 'extra_large', 'Extra Large', 'Maximum text size', 4, '{"multiplier": 1.5, "min_size": 28}');

-- Insert theme options (for future use)
INSERT INTO form_options (category, key, name, description, sort_order, configuration) VALUES
('themes', 'dark', 'Dark Theme', 'Dark color scheme', 1, '{"primary": "#8b5cf6", "secondary": "#3b82f6", "background": "#0a0a0a"}'),
('themes', 'light', 'Light Theme', 'Light color scheme', 2, '{"primary": "#6d28d9", "secondary": "#1e40af", "background": "#ffffff"}'),
('themes', 'cosmic', 'Cosmic Theme', 'Space-inspired colors', 3, '{"primary": "#ec4899", "secondary": "#06b6d4", "background": "#0c0a09"}');

-- Create view for easy querying
CREATE OR REPLACE VIEW form_options_by_category AS
SELECT 
    category,
    key,
    name,
    description,
    sort_order,
    configuration,
    is_active,
    updated_at
FROM form_options 
WHERE is_active = TRUE
ORDER BY category, sort_order, name;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON form_options TO app_user;
-- GRANT SELECT ON form_options_by_category TO app_user;