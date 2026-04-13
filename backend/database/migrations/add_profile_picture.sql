-- MODULE 1: THE SECURE PROFILE SYSTEM - Database Migration
-- Add profile_picture column if it doesn't exist

-- Check if profile_picture column exists, if not add it
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) DEFAULT NULL
AFTER role;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_picture ON users(profile_picture);

-- Update existing users with NULL profile_picture to ensure consistency
UPDATE users SET profile_picture = NULL WHERE profile_picture = '';
