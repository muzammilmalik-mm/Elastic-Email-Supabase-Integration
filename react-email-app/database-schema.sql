-- Drop existing table if any
DROP TABLE IF EXISTS user_email_settings CASCADE;

-- Create user email settings table
CREATE TABLE user_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  elastic_email_api_key TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  configured_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own settings
CREATE POLICY "Users manage own email settings"
  ON user_email_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_email_settings_user_id ON user_email_settings(user_id);

-- Grant access
GRANT ALL ON user_email_settings TO authenticated;
GRANT ALL ON user_email_settings TO service_role;
