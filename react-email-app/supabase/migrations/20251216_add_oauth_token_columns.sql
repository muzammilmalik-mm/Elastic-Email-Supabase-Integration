-- Add OAuth token columns to user_email_settings table
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS supabase_oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS supabase_oauth_expires_at TIMESTAMPTZ;

-- Add index for faster OAuth token lookups
CREATE INDEX IF NOT EXISTS idx_user_email_settings_oauth_token 
ON user_email_settings(supabase_oauth_access_token);

COMMENT ON COLUMN user_email_settings.supabase_oauth_access_token IS 'OAuth access token for Supabase Management API';
COMMENT ON COLUMN user_email_settings.supabase_oauth_refresh_token IS 'OAuth refresh token for Supabase Management API';
COMMENT ON COLUMN user_email_settings.supabase_oauth_expires_at IS 'Expiration timestamp for OAuth access token';
