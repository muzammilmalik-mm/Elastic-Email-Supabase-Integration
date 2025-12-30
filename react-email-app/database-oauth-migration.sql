-- Add OAuth token storage columns
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS supabase_oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS supabase_oauth_expires_at TIMESTAMPTZ;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens 
ON user_email_settings(user_id, supabase_oauth_expires_at);

COMMENT ON COLUMN user_email_settings.supabase_oauth_access_token IS 'OAuth access token for Supabase Management API';
COMMENT ON COLUMN user_email_settings.supabase_oauth_refresh_token IS 'OAuth refresh token for automatic renewal';
COMMENT ON COLUMN user_email_settings.supabase_oauth_expires_at IS 'When the access token expires';
