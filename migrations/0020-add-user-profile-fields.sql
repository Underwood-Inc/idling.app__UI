-- Migration: Add user profile fields

-- Add bio field for user descriptions
ALTER TABLE users 
ADD COLUMN bio TEXT;

-- Add location field for user location
ALTER TABLE users 
ADD COLUMN location VARCHAR(255);

-- Add created_at field for user join date tracking
ALTER TABLE users 
ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Add username field for display names (different from auth name)
ALTER TABLE users 
ADD COLUMN username VARCHAR(50) UNIQUE;

-- Add avatar_seed field for consistent avatar generation
ALTER TABLE users 
ADD COLUMN avatar_seed VARCHAR(255);

-- Add profile visibility settings
ALTER TABLE users 
ADD COLUMN profile_public BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_location ON users(location) WHERE location IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Update existing users to have usernames based on their names or emails
UPDATE users 
SET username = LOWER(REGEXP_REPLACE(COALESCE(name, split_part(email, '@', 1)), '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL AND (name IS NOT NULL OR email IS NOT NULL);

-- Generate avatar seeds for existing users
UPDATE users 
SET avatar_seed = MD5(COALESCE(email, id::text))
WHERE avatar_seed IS NULL; 