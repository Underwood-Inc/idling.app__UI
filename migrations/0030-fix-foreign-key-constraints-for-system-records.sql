-- Migration: Fix Foreign Key Constraints for System Records
-- Description: Fixes foreign key constraint violations in custom_alerts and global_guest_quotas by making created_by nullable for system records
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- FIX CUSTOM ALERTS TABLE
-- ================================

-- Make created_by nullable in custom_alerts table for system records
ALTER TABLE custom_alerts 
ALTER COLUMN created_by DROP NOT NULL;

-- Insert the welcome alert with NULL created_by (system record)
INSERT INTO custom_alerts (
    title, message, details, alert_type, target_audience, priority,
    icon, dismissible, persistent, is_active, is_published, created_by
) VALUES (
    'Welcome to the Enhanced Alert System! 🎉',
    'We''ve upgraded our notification system to provide better, more targeted alerts.',
    'You can now dismiss alerts, and administrators can create custom notifications for different user groups.',
    'info',
    'all',
    10,
    '🎉',
    true,
    false,
    true,
    true,
    NULL -- System-created record, no specific user
) ON CONFLICT DO NOTHING;

-- ================================
-- CREATE GLOBAL GUEST QUOTAS TABLE
-- ================================

-- Create the table since the original migration failed
CREATE TABLE IF NOT EXISTS global_guest_quotas (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Quota configuration
    quota_limit INTEGER NOT NULL DEFAULT 1,
    is_unlimited BOOLEAN DEFAULT false,
    
    -- Time window configuration
    reset_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (reset_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    -- Admin configuration (nullable for system records)
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(service_name, feature_name),
    CHECK (quota_limit >= 0 OR is_unlimited = true),
    
    -- Foreign key constraint to ensure service/feature exists
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_service ON global_guest_quotas(service_name);
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_feature ON global_guest_quotas(service_name, feature_name);
CREATE INDEX IF NOT EXISTS idx_global_guest_quotas_active ON global_guest_quotas(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_global_guest_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_global_guest_quotas_updated_at ON global_guest_quotas;
CREATE TRIGGER trigger_global_guest_quotas_updated_at
    BEFORE UPDATE ON global_guest_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_global_guest_quotas_updated_at();

-- Insert default global guest quotas with NULL created_by (system records)
INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period, description, created_by) VALUES
-- OG Generator - Default guest quota
('og_generator', 'daily_generations', 1, 'daily', 'Default daily generation limit for anonymous users', NULL),

-- Custom Emoji - No guest access (requires authentication)
('custom_emoji', 'emoji_slots', 0, 'daily', 'Custom emojis require user account', NULL),

-- API Access - Limited guest access
('api_access', 'api_requests', 100, 'hourly', 'API rate limit for anonymous users', NULL),

-- Future features can be added here
('content_system', 'daily_posts', 5, 'daily', 'Daily content creation limit for guests', NULL)
ON CONFLICT (service_name, feature_name) DO NOTHING;

-- ================================
-- CREATE GUEST USAGE TRACKING TABLE
-- ================================

CREATE TABLE IF NOT EXISTS guest_usage_tracking (
    id SERIAL PRIMARY KEY,
    
    -- Guest identification (IP-based with optional fingerprinting)
    client_ip VARCHAR(45) NOT NULL,
    machine_fingerprint VARCHAR(32),
    user_agent_hash VARCHAR(64), -- Hashed for privacy
    
    -- Service/feature tracking
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Usage data
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 1,
    
    -- Context metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(client_ip, machine_fingerprint, service_name, feature_name, usage_date),
    CHECK (usage_count >= 0),
    
    -- Foreign key constraint
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guest_usage_ip_date ON guest_usage_tracking(client_ip, usage_date);
CREATE INDEX IF NOT EXISTS idx_guest_usage_fingerprint_date ON guest_usage_tracking(machine_fingerprint, usage_date) WHERE machine_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guest_usage_service_date ON guest_usage_tracking(service_name, feature_name, usage_date);
CREATE INDEX IF NOT EXISTS idx_guest_usage_cleanup ON guest_usage_tracking(usage_date);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_guest_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guest_usage_tracking_updated_at ON guest_usage_tracking;
CREATE TRIGGER trigger_guest_usage_tracking_updated_at
    BEFORE UPDATE ON guest_usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_usage_tracking_updated_at();

-- ================================
-- CREATE USER QUOTA OVERRIDES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS user_quota_overrides (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    
    -- Override configuration
    quota_limit INTEGER,
    is_unlimited BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    reset_period VARCHAR(20) DEFAULT 'monthly',
    
    -- Admin tracking (nullable for system records)
    created_by INTEGER REFERENCES users(id),
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, service_name, feature_name),
    CHECK (quota_limit IS NULL OR quota_limit >= 0 OR is_unlimited = true),
    
    -- Foreign key constraint
    FOREIGN KEY (service_name) REFERENCES subscription_services(name) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_user ON user_quota_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_service ON user_quota_overrides(service_name, feature_name);
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_active ON user_quota_overrides(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_quota_overrides_lookup ON user_quota_overrides(user_id, service_name, feature_name, is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_quota_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_quota_overrides_updated_at ON user_quota_overrides;
CREATE TRIGGER trigger_user_quota_overrides_updated_at
    BEFORE UPDATE ON user_quota_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_user_quota_overrides_updated_at();

-- ================================
-- SUCCESS MESSAGE
-- ================================

SELECT 'Fixed foreign key constraints and created missing quota tables successfully' as result; 