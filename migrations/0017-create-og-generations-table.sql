-- Migration: Create OG Generations Table
-- Description: Creates a table to store OG image generations with proper indexing
-- Author: System
-- Date: 2025-06-29

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it has wrong structure and recreate properly
DROP TABLE IF EXISTS og_generations CASCADE;

-- Create the og_generations table with correct structure
CREATE TABLE og_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seed VARCHAR(255) NOT NULL,
    quote_text TEXT,
    quote_author VARCHAR(255),
    aspect_ratio VARCHAR(50) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    shape_count INTEGER,
    custom_width INTEGER,
    custom_height INTEGER,
    svg_content TEXT NOT NULL,
    client_ip VARCHAR(45) NOT NULL, -- Supports IPv6
    user_agent TEXT NOT NULL,
    generation_options JSONB, -- Store full generation configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_og_generations_client_ip ON og_generations(client_ip);
CREATE INDEX IF NOT EXISTS idx_og_generations_created_at ON og_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_og_generations_client_created ON og_generations(client_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_og_generations_seed ON og_generations(seed);

-- Create a composite index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_og_generations_rate_limit ON og_generations(client_ip, user_agent, created_at);

-- Add constraints following the established pattern
ALTER TABLE og_generations ADD CONSTRAINT chk_og_generations_dimensions 
CHECK (width > 0 AND height > 0);

ALTER TABLE og_generations ADD CONSTRAINT chk_og_generations_custom_dimensions 
CHECK ((custom_width IS NULL OR custom_width > 0) AND (custom_height IS NULL OR custom_height > 0));

-- Create trigger to automatically update updated_at (function already exists from migration 0005)
CREATE TRIGGER update_og_generations_updated_at 
    BEFORE UPDATE ON og_generations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for recent generations
CREATE INDEX IF NOT EXISTS idx_og_generations_recent 
ON og_generations(client_ip, created_at DESC);

-- Add comments to table and columns
COMMENT ON TABLE og_generations IS 'Stores OG image generations with metadata for retrieval and rate limiting';
COMMENT ON COLUMN og_generations.id IS 'Unique identifier for the generation';
COMMENT ON COLUMN og_generations.seed IS 'Random seed used for generation reproducibility';
COMMENT ON COLUMN og_generations.svg_content IS 'Generated SVG content (compressed)';
COMMENT ON COLUMN og_generations.client_ip IS 'Client IP address for rate limiting';
COMMENT ON COLUMN og_generations.user_agent IS 'Client user agent for rate limiting';
COMMENT ON COLUMN og_generations.generation_options IS 'Full generation configuration as JSON';

-- Success message
SELECT 'OG Generations table created successfully' as result; 