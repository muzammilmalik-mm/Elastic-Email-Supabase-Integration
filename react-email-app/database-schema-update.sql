-- Update user_email_settings table to include project info
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_project_ref TEXT,
ADD COLUMN IF NOT EXISTS supabase_project_name TEXT,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT 'smtp.elasticemail.com',
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 2525;

-- Add unique constraint for user + project combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_project 
ON user_email_settings(user_id, supabase_project_ref);

-- Update RLS policy
DROP POLICY IF EXISTS "Users manage own email settings" ON user_email_settings;

CREATE POLICY "Users manage own email settings"
  ON user_email_settings
  FOR ALL
  USING (auth.uid() = user_id);
