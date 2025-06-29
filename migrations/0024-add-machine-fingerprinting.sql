-- Migration: Add Machine Fingerprinting for Enhanced Quota Tracking
-- Description: Adds machine fingerprint tracking to og_generations table for better quota enforcement
-- Author: System
-- Date: 2025-01-01

-- Add machine fingerprint columns to og_generations table
ALTER TABLE og_generations 
ADD COLUMN machine_fingerprint VARCHAR(32),
ADD COLUMN fingerprint_data JSONB;

-- Create index for machine fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_og_generations_machine_fingerprint 
ON og_generations(machine_fingerprint);

-- Create composite index for daily quota tracking by machine fingerprint
CREATE INDEX IF NOT EXISTS idx_og_generations_fingerprint_daily 
ON og_generations(machine_fingerprint, created_at);

-- Create composite index for IP + fingerprint tracking (dual enforcement)
CREATE INDEX IF NOT EXISTS idx_og_generations_ip_fingerprint_daily 
ON og_generations(client_ip, machine_fingerprint, created_at);

-- Add comments for new columns
COMMENT ON COLUMN og_generations.machine_fingerprint IS 'Unique machine fingerprint hash for quota enforcement';
COMMENT ON COLUMN og_generations.fingerprint_data IS 'Full fingerprint data (user agent, platform, timezone, etc.)';

-- Success message
SELECT 'Machine fingerprinting columns added successfully' as result; 