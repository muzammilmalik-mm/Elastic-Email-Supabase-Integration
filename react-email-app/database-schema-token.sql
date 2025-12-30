-- Add Supabase Personal Access Token storage
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_access_token TEXT;

-- This token is stored per user and reused automatically
-- User provides it once, then all Project Management API calls use it
