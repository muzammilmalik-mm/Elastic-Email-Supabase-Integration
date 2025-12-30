-- Make elastic_email_api_key nullable since OAuth tokens are stored separately
ALTER TABLE user_email_settings
ALTER COLUMN elastic_email_api_key DROP NOT NULL;
