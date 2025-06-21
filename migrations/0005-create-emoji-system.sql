-- Create emoji system tables
-- Migration: 0005-create-emoji-system.sql

-- Table for storing user-specific encryption keys
CREATE TABLE user_encryption_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encryption_key_hash TEXT NOT NULL, -- Hashed version for verification
    key_salt TEXT NOT NULL, -- Salt used for key derivation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Table for application-level encryption keys (for globally accessible content)
CREATE TABLE application_encryption_keys (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'global_emoji_key'
    key_purpose VARCHAR(200) NOT NULL, -- Description of what this key is for
    encryption_key_hash TEXT NOT NULL, -- Hashed version for verification
    key_salt TEXT NOT NULL, -- Salt used for key derivation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(key_name, is_active) -- Only one active key per purpose
);

-- Table for emoji categories
CREATE TABLE emoji_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Windows emojis
CREATE TABLE emojis_windows (
    id SERIAL PRIMARY KEY,
    emoji_id VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'grinning_face'
    unicode_codepoint VARCHAR(50) NOT NULL, -- e.g., 'U+1F600'
    unicode_char TEXT NOT NULL, -- The actual emoji character
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES emoji_categories(id),
    tags TEXT[], -- Array of searchable tags
    aliases TEXT[], -- Alternative names
    keywords TEXT[], -- Additional search keywords
    encrypted_data TEXT, -- Encrypted emoji metadata if needed
    windows_version_min VARCHAR(20), -- Minimum Windows version
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Mac emojis
CREATE TABLE emojis_mac (
    id SERIAL PRIMARY KEY,
    emoji_id VARCHAR(100) NOT NULL UNIQUE,
    unicode_codepoint VARCHAR(50) NOT NULL,
    unicode_char TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES emoji_categories(id),
    tags TEXT[],
    aliases TEXT[],
    keywords TEXT[],
    encrypted_data TEXT,
    macos_version_min VARCHAR(20), -- Minimum macOS version
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for custom user emojis (encrypted images)
CREATE TABLE custom_emojis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES emoji_categories(id),
    tags TEXT[],
    aliases TEXT[],
    encrypted_image_data TEXT NOT NULL, -- Base64 encoded encrypted image
    global_encrypted_image_data TEXT, -- Re-encrypted with global key when approved
    image_format VARCHAR(10) NOT NULL, -- png, jpg, gif, webp
    image_size_bytes INTEGER NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    encryption_type VARCHAR(20) DEFAULT 'personal', -- 'personal' or 'global'
    is_public BOOLEAN DEFAULT false, -- Can other users use this emoji
    is_approved BOOLEAN DEFAULT false, -- Approved by admin for global use
    approved_by INTEGER REFERENCES users(id), -- Admin who approved it
    approved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, emoji_id)
);

-- Table for tracking emoji usage analytics
CREATE TABLE emoji_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emoji_type VARCHAR(20) NOT NULL, -- 'windows', 'mac', 'custom'
    emoji_id VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, emoji_type, emoji_id)
);

-- Indexes for performance
CREATE INDEX idx_user_encryption_keys_user_id ON user_encryption_keys(user_id);
CREATE INDEX idx_application_encryption_keys_name ON application_encryption_keys(key_name);
CREATE INDEX idx_application_encryption_keys_active ON application_encryption_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_emojis_windows_category ON emojis_windows(category_id);
CREATE INDEX idx_emojis_windows_active ON emojis_windows(is_active) WHERE is_active = true;
CREATE INDEX idx_emojis_windows_tags ON emojis_windows USING GIN(tags);
CREATE INDEX idx_emojis_windows_aliases ON emojis_windows USING GIN(aliases);
CREATE INDEX idx_emojis_windows_keywords ON emojis_windows USING GIN(keywords);

CREATE INDEX idx_emojis_mac_category ON emojis_mac(category_id);
CREATE INDEX idx_emojis_mac_active ON emojis_mac(is_active) WHERE is_active = true;
CREATE INDEX idx_emojis_mac_tags ON emojis_mac USING GIN(tags);
CREATE INDEX idx_emojis_mac_aliases ON emojis_mac USING GIN(aliases);
CREATE INDEX idx_emojis_mac_keywords ON emojis_mac USING GIN(keywords);

CREATE INDEX idx_custom_emojis_user_id ON custom_emojis(user_id);
CREATE INDEX idx_custom_emojis_active ON custom_emojis(is_active) WHERE is_active = true;
CREATE INDEX idx_custom_emojis_public ON custom_emojis(is_public) WHERE is_public = true;
CREATE INDEX idx_custom_emojis_approved ON custom_emojis(is_approved) WHERE is_approved = true;
CREATE INDEX idx_custom_emojis_encryption_type ON custom_emojis(encryption_type);
CREATE INDEX idx_custom_emojis_tags ON custom_emojis USING GIN(tags);

CREATE INDEX idx_emoji_usage_user_id ON emoji_usage(user_id);
CREATE INDEX idx_emoji_usage_composite ON emoji_usage(user_id, emoji_type, emoji_id);

-- Insert default emoji categories
INSERT INTO emoji_categories (name, display_name, description, sort_order) VALUES
('faces', 'Faces & Expressions', 'Smileys, emotions, and facial expressions', 1),
('gestures', 'Gestures & Body', 'Hand gestures, body parts, and actions', 2),
('people', 'People & Activities', 'People, professions, and activities', 3),
('animals', 'Animals & Nature', 'Animals, plants, and nature', 4),
('food', 'Food & Drink', 'Food, beverages, and cooking', 5),
('travel', 'Travel & Places', 'Transportation, buildings, and geography', 6),
('objects', 'Objects & Symbols', 'Everyday objects and symbols', 7),
('flags', 'Flags', 'Country and regional flags', 8),
('custom', 'Custom', 'User-created custom emojis', 9);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_encryption_keys_updated_at 
    BEFORE UPDATE ON user_encryption_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_encryption_keys_updated_at 
    BEFORE UPDATE ON application_encryption_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emojis_windows_updated_at 
    BEFORE UPDATE ON emojis_windows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emojis_mac_updated_at 
    BEFORE UPDATE ON emojis_mac 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_emojis_updated_at 
    BEFORE UPDATE ON custom_emojis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data integrity
ALTER TABLE custom_emojis ADD CONSTRAINT check_image_size 
    CHECK (image_size_bytes > 0 AND image_size_bytes <= 1048576); -- Max 1MB

ALTER TABLE custom_emojis ADD CONSTRAINT check_image_dimensions 
    CHECK (image_width > 0 AND image_width <= 512 AND image_height > 0 AND image_height <= 512);

ALTER TABLE custom_emojis ADD CONSTRAINT check_image_format 
    CHECK (image_format IN ('png', 'jpg', 'jpeg', 'gif', 'webp'));

ALTER TABLE custom_emojis ADD CONSTRAINT check_encryption_type 
    CHECK (encryption_type IN ('personal', 'global'));

-- Insert the global emoji encryption key (will be populated by the application)
INSERT INTO application_encryption_keys (key_name, key_purpose, encryption_key_hash, key_salt) 
VALUES (
    'global_emoji_key', 
    'Encryption key for globally accessible approved custom emojis',
    'placeholder_hash_will_be_replaced_by_app',
    'placeholder_salt_will_be_replaced_by_app'
);

-- Comments for documentation
COMMENT ON TABLE user_encryption_keys IS 'Stores per-user encryption keys for emoji data';
COMMENT ON TABLE application_encryption_keys IS 'Stores application-level encryption keys for globally accessible content';
COMMENT ON TABLE emoji_categories IS 'Categories for organizing emojis';
COMMENT ON TABLE emojis_windows IS 'Windows-compatible emojis with Unicode support';
COMMENT ON TABLE emojis_mac IS 'macOS-compatible emojis with Unicode support';
COMMENT ON TABLE custom_emojis IS 'User-uploaded custom emojis with dual encryption support (personal/global)';
COMMENT ON TABLE emoji_usage IS 'Analytics for tracking emoji usage patterns';

COMMENT ON COLUMN user_encryption_keys.encryption_key_hash IS 'Hashed version of encryption key for verification';
COMMENT ON COLUMN user_encryption_keys.key_salt IS 'Salt used for key derivation and verification';
COMMENT ON COLUMN custom_emojis.encrypted_image_data IS 'Base64 encoded encrypted image data (personal key)';
COMMENT ON COLUMN custom_emojis.global_encrypted_image_data IS 'Base64 encoded encrypted image data (global key for approved emojis)';
COMMENT ON COLUMN custom_emojis.encryption_type IS 'Type of encryption used: personal (user key) or global (app key)';
COMMENT ON COLUMN custom_emojis.image_size_bytes IS 'Original image size in bytes (before encryption)';
COMMENT ON COLUMN emoji_usage.emoji_type IS 'Type of emoji: windows, mac, or custom'; 