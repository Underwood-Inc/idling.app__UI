-- Add ASCII emoji category
-- Migration: 0009-add-ascii-emoji-category.sql

-- Insert the ASCII emoji category that was missing
INSERT INTO emoji_categories (name, display_name, description, sort_order) 
VALUES ('ascii', 'ASCII Art & Text', 'Classic text-based emoticons and ASCII art', 10)
ON CONFLICT (name) DO NOTHING;

-- Update existing categories sort order to make room if needed
-- The ASCII category gets sort_order 10, which should be after the existing categories 