-- Migration: Create Advanced Subscription System
-- Description: Creates a flexible subscription system supporting multiple services, plans, and payment options
-- Author: System Wizard
-- Date: 2025-01-27

-- ================================
-- SUBSCRIPTION SERVICES TABLE
-- ================================

CREATE TABLE subscription_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'og_generator', 'emoji_system', 'api_access', 'priority_support'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'core', 'premium', 'enterprise', 'addon'
    
    -- Service configuration
    is_core_service BOOLEAN DEFAULT false, -- Core services included in all plans
    is_standalone BOOLEAN DEFAULT false, -- Can be purchased separately
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SUBSCRIPTION PLANS TABLE
-- ================================

CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'enterprise', 'og_unlimited', 'emoji_pro'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'tier', -- 'tier', 'addon', 'bundle'
    
    -- Pricing options
    price_monthly_cents INTEGER, -- NULL for free plans
    price_yearly_cents INTEGER, -- NULL for free plans, annual pricing
    price_lifetime_cents INTEGER, -- NULL if not available, one-time payment
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Plan configuration
    is_default BOOLEAN DEFAULT false, -- Default plan for new users
    is_active BOOLEAN DEFAULT true, -- Available for purchase
    requires_plan_id INTEGER REFERENCES subscription_plans(id), -- Required base plan
    sort_order INTEGER DEFAULT 0,
    
    -- Trial settings
    trial_days INTEGER DEFAULT 0, -- Free trial period
    trial_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (price_monthly_cents IS NULL OR price_monthly_cents >= 0),
    CHECK (price_yearly_cents IS NULL OR price_yearly_cents >= 0),
    CHECK (price_lifetime_cents IS NULL OR price_lifetime_cents >= 0),
    CHECK (trial_days >= 0)
);

-- ================================
-- PLAN SERVICES MAPPING
-- ================================

CREATE TABLE plan_services (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
    
    -- Service limits and configuration
    feature_limits JSONB, -- Flexible JSON for service-specific limits
    is_unlimited BOOLEAN DEFAULT false, -- Override all limits
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(plan_id, service_id)
);

-- ================================
-- SUBSCRIPTION FEATURES TABLE
-- ================================

CREATE TABLE subscription_features (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'daily_generations', 'custom_emoji_slots', 'api_rate_limit'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    feature_type VARCHAR(20) NOT NULL, -- 'limit', 'boolean', 'enum'
    
    -- Feature configuration
    default_value JSONB, -- Default value for this feature
    validation_rules JSONB, -- Validation rules (min, max, allowed_values)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(service_id, name),
    CHECK (feature_type IN ('limit', 'boolean', 'enum', 'json'))
);

-- ================================
-- PLAN FEATURE VALUES
-- ================================

CREATE TABLE plan_feature_values (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_id INTEGER NOT NULL REFERENCES subscription_features(id) ON DELETE CASCADE,
    
    -- Feature value
    feature_value JSONB NOT NULL, -- Flexible JSON value
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(plan_id, feature_id)
);

-- ================================
-- USER SUBSCRIPTIONS TABLE
-- ================================

CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription details
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'pending', 'trialing')),
    billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'trial')),
    
    -- Dates
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for lifetime/free
    trial_ends_at TIMESTAMP WITH TIME ZONE, -- Trial expiration
    cancelled_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    
    -- Billing information (encrypted/hashed for security)
    external_subscription_id VARCHAR(255), -- Stripe/payment processor ID
    external_customer_id VARCHAR(255), -- Customer ID in payment processor
    payment_method_last4 VARCHAR(4), -- Last 4 digits of payment method
    payment_method_type VARCHAR(20), -- 'card', 'paypal', 'bank_transfer', 'crypto'
    
    -- Pricing snapshot (for historical accuracy)
    price_paid_cents INTEGER, -- What they actually paid
    currency_paid VARCHAR(3) DEFAULT 'USD',
    
    -- Admin fields
    assigned_by INTEGER REFERENCES users(id), -- Admin who manually assigned
    assignment_reason TEXT, -- Reason for manual assignment
    
    -- Metadata
    metadata JSONB, -- Additional subscription metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SUBSCRIPTION USAGE TRACKING
-- ================================

CREATE TABLE subscription_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES subscription_features(id) ON DELETE CASCADE,
    
    -- Usage tracking
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 1,
    usage_value JSONB, -- Flexible usage data
    
    -- Context metadata
    metadata JSONB, -- IP, user agent, API key, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, subscription_id, service_id, feature_id, usage_date),
    CHECK (usage_count >= 0)
);

-- ================================
-- PAYMENT TRANSACTIONS TABLE
-- ================================

CREATE TABLE subscription_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL, -- 'payment', 'refund', 'chargeback', 'credit'
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- External references
    external_transaction_id VARCHAR(255), -- Payment processor transaction ID
    external_invoice_id VARCHAR(255), -- Invoice ID
    payment_processor VARCHAR(50), -- 'stripe', 'paypal', 'manual'
    
    -- Transaction metadata
    description TEXT,
    metadata JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (amount_cents != 0),
    CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'credit')),
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Services
CREATE INDEX idx_subscription_services_active ON subscription_services(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_services_category ON subscription_services(category);

-- Plans
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_default ON subscription_plans(is_default) WHERE is_default = true;
CREATE INDEX idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_plans_sort ON subscription_plans(sort_order, name);

-- Plan services
CREATE INDEX idx_plan_services_plan ON plan_services(plan_id);
CREATE INDEX idx_plan_services_service ON plan_services(service_id);

-- Features
CREATE INDEX idx_subscription_features_service ON subscription_features(service_id);
CREATE INDEX idx_subscription_features_type ON subscription_features(feature_type);

-- Plan feature values
CREATE INDEX idx_plan_feature_values_plan ON plan_feature_values(plan_id);
CREATE INDEX idx_plan_feature_values_feature ON plan_feature_values(feature_id);

-- User subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(user_id, status) WHERE status IN ('active', 'trialing');
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_subscriptions_external_id ON user_subscriptions(external_subscription_id) WHERE external_subscription_id IS NOT NULL;
CREATE INDEX idx_user_subscriptions_plan ON user_subscriptions(plan_id);

-- Usage tracking
CREATE INDEX idx_subscription_usage_user_date ON subscription_usage(user_id, usage_date);
CREATE INDEX idx_subscription_usage_service_date ON subscription_usage(service_id, usage_date);
CREATE INDEX idx_subscription_usage_subscription ON subscription_usage(subscription_id);

-- Transactions
CREATE INDEX idx_subscription_transactions_user ON subscription_transactions(user_id);
CREATE INDEX idx_subscription_transactions_subscription ON subscription_transactions(subscription_id);
CREATE INDEX idx_subscription_transactions_external ON subscription_transactions(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_subscription_transactions_status ON subscription_transactions(status);
CREATE INDEX idx_subscription_transactions_processed ON subscription_transactions(processed_at);

-- ================================
-- INSERT SUBSCRIPTION SERVICES
-- ================================

INSERT INTO subscription_services (name, display_name, description, category, is_core_service, is_standalone) VALUES
-- Core Services
('content_system', 'Content System', 'Core content creation and management', 'core', true, false),
('basic_emoji', 'Basic Emoji Access', 'Access to standard emoji sets', 'core', true, false),

-- Premium Services
('og_generator', 'OG Image Generator', 'Generate custom OG images for social media', 'premium', false, true),
('custom_emoji', 'Custom Emoji System', 'Upload and manage custom emojis', 'premium', false, true),
('advanced_controls', 'Advanced Controls', 'Access to advanced generation parameters', 'premium', false, false),

-- Enterprise Services
('api_access', 'API Access', 'Programmatic access to platform features', 'enterprise', false, true),
('priority_support', 'Priority Support', 'Priority customer support and assistance', 'enterprise', false, true),
('white_label', 'White Label Options', 'Custom branding and white-label features', 'enterprise', false, true),
('analytics', 'Advanced Analytics', 'Detailed usage analytics and reporting', 'enterprise', false, true);

-- ================================
-- INSERT SUBSCRIPTION FEATURES
-- ================================

INSERT INTO subscription_features (service_id, name, display_name, description, feature_type, default_value, validation_rules) VALUES
-- OG Generator Features
((SELECT id FROM subscription_services WHERE name = 'og_generator'), 'daily_generations', 'Daily Generations', 'Number of OG images that can be generated per day', 'limit', '1', '{"min": 0, "max": 10000}'),
((SELECT id FROM subscription_services WHERE name = 'og_generator'), 'custom_dimensions', 'Custom Dimensions', 'Allow custom width and height settings', 'boolean', 'false', '{}'),
((SELECT id FROM subscription_services WHERE name = 'og_generator'), 'batch_generation', 'Batch Generation', 'Generate multiple images at once', 'boolean', 'false', '{}'),

-- Custom Emoji Features
((SELECT id FROM subscription_services WHERE name = 'custom_emoji'), 'emoji_slots', 'Emoji Slots', 'Maximum number of custom emojis allowed', 'limit', '5', '{"min": 0, "max": 1000}'),
((SELECT id FROM subscription_services WHERE name = 'custom_emoji'), 'emoji_file_size_mb', 'Max File Size (MB)', 'Maximum file size for emoji uploads', 'limit', '1', '{"min": 0.1, "max": 10}'),
((SELECT id FROM subscription_services WHERE name = 'custom_emoji'), 'animated_emoji', 'Animated Emojis', 'Support for animated GIF emojis', 'boolean', 'false', '{}'),

-- Advanced Controls Features
((SELECT id FROM subscription_services WHERE name = 'advanced_controls'), 'parameter_access', 'Parameter Access', 'Access to advanced generation parameters', 'enum', '"basic"', '{"allowed_values": ["basic", "advanced", "expert"]}'),
((SELECT id FROM subscription_services WHERE name = 'advanced_controls'), 'preset_templates', 'Preset Templates', 'Access to premium preset templates', 'boolean', 'false', '{}'),

-- API Access Features
((SELECT id FROM subscription_services WHERE name = 'api_access'), 'rate_limit_per_hour', 'API Rate Limit (per hour)', 'API requests allowed per hour', 'limit', '100', '{"min": 10, "max": 10000}'),
((SELECT id FROM subscription_services WHERE name = 'api_access'), 'webhook_support', 'Webhook Support', 'Support for webhook notifications', 'boolean', 'false', '{}'),
((SELECT id FROM subscription_services WHERE name = 'api_access'), 'api_key_count', 'API Key Count', 'Number of API keys allowed', 'limit', '1', '{"min": 1, "max": 10}'),

-- Priority Support Features
((SELECT id FROM subscription_services WHERE name = 'priority_support'), 'response_time_hours', 'Response Time (hours)', 'Guaranteed response time for support requests', 'limit', '24', '{"min": 1, "max": 168}'),
((SELECT id FROM subscription_services WHERE name = 'priority_support'), 'dedicated_support', 'Dedicated Support', 'Access to dedicated support representative', 'boolean', 'false', '{}'),

-- White Label Features
((SELECT id FROM subscription_services WHERE name = 'white_label'), 'custom_branding', 'Custom Branding', 'Apply custom branding to generated content', 'boolean', 'false', '{}'),
((SELECT id FROM subscription_services WHERE name = 'white_label'), 'custom_domain', 'Custom Domain', 'Use custom domain for API endpoints', 'boolean', 'false', '{}'),

-- Analytics Features
((SELECT id FROM subscription_services WHERE name = 'analytics'), 'usage_analytics', 'Usage Analytics', 'Detailed usage statistics and reports', 'boolean', 'false', '{}'),
((SELECT id FROM subscription_services WHERE name = 'analytics'), 'export_data', 'Data Export', 'Export usage data and analytics', 'boolean', 'false', '{}');

-- ================================
-- INSERT SUBSCRIPTION PLANS
-- ================================

INSERT INTO subscription_plans (
    name, display_name, description, plan_type,
    price_monthly_cents, price_yearly_cents, price_lifetime_cents,
    is_default, sort_order, trial_days, trial_enabled
) VALUES 
-- Tier Plans
('free', 'Free Tier', 'Perfect for getting started with basic features', 'tier', 
 NULL, NULL, NULL, true, 1, 0, false),

('starter', 'Starter', 'Great for casual users who want more features', 'tier',
 499, 4990, NULL, false, 2, 7, true), -- $4.99/month, $49.90/year, 7-day trial

('pro', 'Pro', 'Unlimited creativity for power users and creators', 'tier',
 999, 9990, 9999, false, 3, 14, true), -- $9.99/month, $99.90/year, $99.99 lifetime, 14-day trial

('enterprise', 'Enterprise', 'Full-featured plan for businesses and teams', 'tier',
 2999, 29990, NULL, false, 4, 30, true), -- $29.99/month, $299.90/year, 30-day trial

-- Addon Plans
('og_unlimited', 'OG Generator Unlimited', 'Unlimited OG image generation addon', 'addon',
 299, 2990, NULL, false, 10, 0, false), -- $2.99/month, $29.90/year

('emoji_pro', 'Custom Emoji Pro', 'Enhanced custom emoji features', 'addon',
 199, 1990, NULL, false, 11, 0, false), -- $1.99/month, $19.90/year

('api_starter', 'API Access Starter', 'Basic API access for developers', 'addon',
 999, 9990, NULL, false, 12, 0, false), -- $9.99/month, $99.90/year

-- Bundle Plans
('creator_bundle', 'Creator Bundle', 'Pro + OG Unlimited + Emoji Pro at a discount', 'bundle',
 1299, 12990, NULL, false, 20, 14, true); -- $12.99/month, $129.90/year (save $2/month)

-- ================================
-- MAP SERVICES TO PLANS
-- ================================

-- Free Plan Services
INSERT INTO plan_services (plan_id, service_id, feature_limits, is_unlimited) VALUES
((SELECT id FROM subscription_plans WHERE name = 'free'), (SELECT id FROM subscription_services WHERE name = 'content_system'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'free'), (SELECT id FROM subscription_services WHERE name = 'basic_emoji'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'free'), (SELECT id FROM subscription_services WHERE name = 'og_generator'), '{"daily_limit": 1}', false),
((SELECT id FROM subscription_plans WHERE name = 'free'), (SELECT id FROM subscription_services WHERE name = 'custom_emoji'), '{"slot_limit": 5}', false);

-- Starter Plan Services
INSERT INTO plan_services (plan_id, service_id, feature_limits, is_unlimited) VALUES
((SELECT id FROM subscription_plans WHERE name = 'starter'), (SELECT id FROM subscription_services WHERE name = 'content_system'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'starter'), (SELECT id FROM subscription_services WHERE name = 'basic_emoji'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'starter'), (SELECT id FROM subscription_services WHERE name = 'og_generator'), '{"daily_limit": 50}', false),
((SELECT id FROM subscription_plans WHERE name = 'starter'), (SELECT id FROM subscription_services WHERE name = 'custom_emoji'), '{"slot_limit": 20}', false),
((SELECT id FROM subscription_plans WHERE name = 'starter'), (SELECT id FROM subscription_services WHERE name = 'advanced_controls'), '{"level": "basic"}', false);

-- Pro Plan Services
INSERT INTO plan_services (plan_id, service_id, feature_limits, is_unlimited) VALUES
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'content_system'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'basic_emoji'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'og_generator'), '{}', true),
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'custom_emoji'), '{"slot_limit": 100}', false),
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'advanced_controls'), '{"level": "advanced"}', false),
((SELECT id FROM subscription_plans WHERE name = 'pro'), (SELECT id FROM subscription_services WHERE name = 'priority_support'), '{"response_time": 12}', false);

-- Enterprise Plan Services
INSERT INTO plan_services (plan_id, service_id, feature_limits, is_unlimited) VALUES
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'content_system'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'basic_emoji'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'og_generator'), '{}', true),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'custom_emoji'), '{}', true),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'advanced_controls'), '{"level": "expert"}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'api_access'), '{"rate_limit": 1000}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'priority_support'), '{"response_time": 2, "dedicated": true}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'white_label'), '{}', false),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), (SELECT id FROM subscription_services WHERE name = 'analytics'), '{}', false);

-- ================================
-- SET PLAN FEATURE VALUES
-- ================================

-- Free Plan Feature Values
INSERT INTO plan_feature_values (plan_id, feature_id, feature_value) VALUES
-- OG Generator
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'daily_generations'), '1'),
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'custom_dimensions'), 'false'),
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'batch_generation'), 'false'),
-- Custom Emoji
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_slots'), '5'),
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_file_size_mb'), '1'),
((SELECT id FROM subscription_plans WHERE name = 'free'), 
 (SELECT id FROM subscription_features WHERE name = 'animated_emoji'), 'false');

-- Pro Plan Feature Values
INSERT INTO plan_feature_values (plan_id, feature_id, feature_value) VALUES
-- OG Generator
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'daily_generations'), '-1'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'custom_dimensions'), 'true'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'batch_generation'), 'true'),
-- Custom Emoji
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_slots'), '100'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_file_size_mb'), '5'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'animated_emoji'), 'true'),
-- Advanced Controls
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'parameter_access'), '"advanced"'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'preset_templates'), 'true'),
-- Priority Support
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'response_time_hours'), '12'),
((SELECT id FROM subscription_plans WHERE name = 'pro'), 
 (SELECT id FROM subscription_features WHERE name = 'dedicated_support'), 'false');

-- Enterprise Plan Feature Values
INSERT INTO plan_feature_values (plan_id, feature_id, feature_value) VALUES
-- OG Generator
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'daily_generations'), '-1'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'custom_dimensions'), 'true'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'batch_generation'), 'true'),
-- Custom Emoji
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_slots'), '-1'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'emoji_file_size_mb'), '10'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'animated_emoji'), 'true'),
-- Advanced Controls
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'parameter_access'), '"expert"'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'preset_templates'), 'true'),
-- API Access
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'rate_limit_per_hour'), '1000'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'webhook_support'), 'true'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'api_key_count'), '5'),
-- Priority Support
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'response_time_hours'), '2'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'dedicated_support'), 'true'),
-- White Label
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'custom_branding'), 'true'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'custom_domain'), 'true'),
-- Analytics
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'usage_analytics'), 'true'),
((SELECT id FROM subscription_plans WHERE name = 'enterprise'), 
 (SELECT id FROM subscription_features WHERE name = 'export_data'), 'true');

-- ================================
-- ASSIGN FREE PLAN TO ALL EXISTING USERS
-- ================================

INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, assignment_reason)
SELECT u.id, p.id, 'active', NULL, 'Migration: Default free plan assignment'
FROM users u, subscription_plans p
WHERE p.name = 'free'
AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us 
    WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
);

-- ================================
-- INTEGRATE WITH EXISTING PERMISSIONS
-- ================================

-- Add subscription-specific permissions
INSERT INTO permissions (name, display_name, description, category, is_system) VALUES
-- OG Generator Permissions
('subscription.og.basic', 'Basic OG Generation', 'Generate OG images with basic options', 'subscription', true),
('subscription.og.advanced', 'Advanced OG Generation', 'Access to advanced OG generation controls', 'subscription', true),
('subscription.og.unlimited', 'Unlimited OG Generation', 'No daily limits on OG image generation', 'subscription', true),
('subscription.og.custom_dimensions', 'Custom Dimensions', 'Use custom width and height settings', 'subscription', true),
('subscription.og.batch', 'Batch Generation', 'Generate multiple images at once', 'subscription', true),

-- Custom Emoji Permissions
('subscription.emoji.basic', 'Basic Custom Emojis', 'Upload limited custom emojis', 'subscription', true),
('subscription.emoji.pro', 'Pro Custom Emojis', 'Upload more custom emojis with larger file sizes', 'subscription', true),
('subscription.emoji.unlimited', 'Unlimited Custom Emojis', 'No limits on custom emoji uploads', 'subscription', true),
('subscription.emoji.animated', 'Animated Emojis', 'Support for animated GIF emojis', 'subscription', true),

-- API Access Permissions
('subscription.api.basic', 'Basic API Access', 'Limited API access for integrations', 'subscription', true),
('subscription.api.advanced', 'Advanced API Access', 'Higher rate limits and webhook support', 'subscription', true),
('subscription.api.enterprise', 'Enterprise API Access', 'Full API access with highest limits', 'subscription', true),

-- Support Permissions
('subscription.support.priority', 'Priority Support', 'Access to priority customer support', 'subscription', true),
('subscription.support.dedicated', 'Dedicated Support', 'Access to dedicated support representative', 'subscription', true),

-- White-label Permissions
('subscription.whitelabel.branding', 'Custom Branding', 'Apply custom branding to content', 'subscription', true),
('subscription.whitelabel.domain', 'Custom Domain', 'Use custom domain for API endpoints', 'subscription', true),

-- Analytics Permissions
('subscription.analytics.usage', 'Usage Analytics', 'Access to detailed usage statistics', 'subscription', true),
('subscription.analytics.export', 'Data Export', 'Export usage data and analytics', 'subscription', true);

-- ================================
-- CREATE ADVANCED HELPER FUNCTIONS
-- ================================

-- Function to get user's active subscription with all details
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id INTEGER)
RETURNS TABLE(
    subscription_id INTEGER,
    plan_name VARCHAR(50),
    plan_display_name VARCHAR(100),
    plan_type VARCHAR(20),
    status VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    services JSONB,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        sp.name,
        sp.display_name,
        sp.plan_type,
        us.status,
        us.expires_at,
        us.trial_ends_at,
        -- Aggregate services
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'name', ss.name,
                    'display_name', ss.display_name,
                    'category', ss.category,
                    'limits', ps.feature_limits,
                    'unlimited', ps.is_unlimited
                )
            )
            FROM plan_services ps
            JOIN subscription_services ss ON ps.service_id = ss.id
            WHERE ps.plan_id = sp.id), 
            '[]'::jsonb
        ) as services,
        -- Aggregate features
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'service', ss.name,
                    'feature', sf.name,
                    'display_name', sf.display_name,
                    'type', sf.feature_type,
                    'value', pfv.feature_value
                )
            )
            FROM plan_feature_values pfv
            JOIN subscription_features sf ON pfv.feature_id = sf.id
            JOIN subscription_services ss ON sf.service_id = ss.id
            WHERE pfv.plan_id = sp.id),
            '[]'::jsonb
        ) as features
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    ORDER BY sp.sort_order DESC -- Highest priority plan
    LIMIT 1;
    
    -- If no active subscription found, return free plan
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            NULL::INTEGER,
            sp.name,
            sp.display_name,
            sp.plan_type,
            'active'::VARCHAR(20),
            NULL::TIMESTAMP WITH TIME ZONE,
            NULL::TIMESTAMP WITH TIME ZONE,
            COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'name', ss.name,
                        'display_name', ss.display_name,
                        'category', ss.category,
                        'limits', ps.feature_limits,
                        'unlimited', ps.is_unlimited
                    )
                )
                FROM plan_services ps
                JOIN subscription_services ss ON ps.service_id = ss.id
                WHERE ps.plan_id = sp.id), 
                '[]'::jsonb
            ) as services,
            COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'service', ss.name,
                        'feature', sf.name,
                        'display_name', sf.display_name,
                        'type', sf.feature_type,
                        'value', pfv.feature_value
                    )
                )
                FROM plan_feature_values pfv
                JOIN subscription_features sf ON pfv.feature_id = sf.id
                JOIN subscription_services ss ON sf.service_id = ss.id
                WHERE pfv.plan_id = sp.id),
                '[]'::jsonb
            ) as features
        FROM subscription_plans sp
        WHERE sp.name = 'free';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check feature access and limits
CREATE OR REPLACE FUNCTION check_user_feature_access(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100)
) RETURNS TABLE(
    has_access BOOLEAN,
    feature_value JSONB,
    current_usage INTEGER,
    limit_reached BOOLEAN
) AS $$
DECLARE
    v_subscription RECORD;
    v_feature_value JSONB;
    v_current_usage INTEGER := 0;
    v_limit INTEGER := 0;
    v_has_access BOOLEAN := false;
    v_limit_reached BOOLEAN := false;
BEGIN
    -- Get user's subscription details
    SELECT * INTO v_subscription FROM get_user_subscription_details(p_user_id);
    
    -- Check if user has access to the service
    SELECT EXISTS(
        SELECT 1 FROM jsonb_array_elements(v_subscription.services) as service
        WHERE service->>'name' = p_service_name
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
        RETURN QUERY SELECT false, NULL::JSONB, 0, true;
        RETURN;
    END IF;
    
    -- Get feature value
    SELECT feature->>'value' INTO v_feature_value
    FROM jsonb_array_elements(v_subscription.features) as feature
    WHERE feature->>'service' = p_service_name
    AND feature->>'feature' = p_feature_name;
    
    -- For limit-type features, check current usage
    IF (SELECT feature->>'type' FROM jsonb_array_elements(v_subscription.features) as feature
        WHERE feature->>'service' = p_service_name AND feature->>'feature' = p_feature_name) = 'limit' THEN
        
        -- Get current usage based on feature type
        CASE p_feature_name
            WHEN 'daily_generations' THEN
                SELECT COALESCE(usage_count, 0) INTO v_current_usage
                FROM subscription_usage su
                JOIN subscription_services ss ON su.service_id = ss.id
                WHERE su.user_id = p_user_id 
                AND ss.name = p_service_name
                AND su.usage_date = CURRENT_DATE;
                
                v_limit := (v_feature_value::text)::INTEGER;
                v_limit_reached := (v_limit > 0 AND v_current_usage >= v_limit);
                
            WHEN 'emoji_slots' THEN
                SELECT COUNT(*) INTO v_current_usage
                FROM custom_emojis 
                WHERE user_id = p_user_id AND is_active = true;
                
                v_limit := (v_feature_value::text)::INTEGER;
                v_limit_reached := (v_limit > 0 AND v_current_usage >= v_limit);
                
            ELSE
                v_limit_reached := false;
        END CASE;
    END IF;
    
    RETURN QUERY SELECT v_has_access, v_feature_value, v_current_usage, v_limit_reached;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record usage with automatic subscription detection
CREATE OR REPLACE FUNCTION record_feature_usage(
    p_user_id INTEGER,
    p_service_name VARCHAR(50),
    p_feature_name VARCHAR(100) DEFAULT NULL,
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id INTEGER;
    v_service_id INTEGER;
    v_feature_id INTEGER;
BEGIN
    -- Get user's active subscription ID
    SELECT subscription_id INTO v_subscription_id
    FROM get_user_subscription_details(p_user_id);
    
    -- Get service ID
    SELECT id INTO v_service_id
    FROM subscription_services
    WHERE name = p_service_name;
    
    -- Get feature ID if specified
    IF p_feature_name IS NOT NULL THEN
        SELECT id INTO v_feature_id
        FROM subscription_features
        WHERE service_id = v_service_id AND name = p_feature_name;
    END IF;
    
    IF v_subscription_id IS NULL OR v_service_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Insert or update usage record
    INSERT INTO subscription_usage (
        user_id, subscription_id, service_id, feature_id, usage_date, usage_count, metadata
    ) VALUES (
        p_user_id, v_subscription_id, v_service_id, v_feature_id, CURRENT_DATE, p_usage_count, p_metadata
    )
    ON CONFLICT (user_id, subscription_id, service_id, feature_id, usage_date)
    DO UPDATE SET 
        usage_count = subscription_usage.usage_count + p_usage_count,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CREATE TRIGGERS
-- ================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_subscription_services_updated_at 
    BEFORE UPDATE ON subscription_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at 
    BEFORE UPDATE ON subscription_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE subscription_services IS 'Defines available subscription services (og_generator, custom_emoji, api_access, etc.)';
COMMENT ON TABLE subscription_plans IS 'Defines subscription plans with pricing and configuration (free, pro, enterprise, addons, bundles)';
COMMENT ON TABLE plan_services IS 'Maps which services are included in each plan with service-specific limits';
COMMENT ON TABLE subscription_features IS 'Defines configurable features within each service';
COMMENT ON TABLE plan_feature_values IS 'Stores the specific feature values/limits for each plan';
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription assignments with billing and status information';
COMMENT ON TABLE subscription_usage IS 'Tracks daily usage against subscription limits for each service/feature';
COMMENT ON TABLE subscription_transactions IS 'Records all payment transactions, refunds, and billing events';

COMMENT ON COLUMN subscription_plans.plan_type IS 'Plan type: tier (full plans), addon (add-on services), bundle (discounted combinations)';
COMMENT ON COLUMN subscription_features.feature_type IS 'Feature type: limit (numeric limits), boolean (on/off), enum (predefined values), json (complex data)';
COMMENT ON COLUMN user_subscriptions.external_subscription_id IS 'Payment processor subscription ID (Stripe, PayPal, etc.)';
COMMENT ON COLUMN subscription_usage.usage_value IS 'Flexible JSON field for complex usage data beyond simple counts';

-- Success message
SELECT 'Advanced subscription system tables created successfully' as result; 