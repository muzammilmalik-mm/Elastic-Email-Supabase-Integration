-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- OAuth Sessions Table
CREATE TABLE oauth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ NOT NULL,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMTP Settings Table with Encryption
CREATE TABLE smtp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    elastic_email_api_key TEXT, -- Encrypted using pgsodium
    smtp_username TEXT,
    smtp_password TEXT, -- Encrypted using pgsodium
    smtp_server TEXT DEFAULT 'smtp.elasticemail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_tls_enabled BOOLEAN DEFAULT TRUE,
    sender_email TEXT,
    sender_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Sender Configuration Table
CREATE TABLE default_sender_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    smtp_settings_id UUID NOT NULL REFERENCES smtp_settings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authorization Codes Table (temporary storage for OAuth flow)
CREATE TABLE authorization_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    code_challenge TEXT,
    code_challenge_method TEXT,
    scope TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_oauth_sessions_user_id ON oauth_sessions(user_id);
CREATE INDEX idx_oauth_sessions_access_token ON oauth_sessions(access_token);
CREATE INDEX idx_oauth_sessions_refresh_token ON oauth_sessions(refresh_token);
CREATE INDEX idx_smtp_settings_user_id ON smtp_settings(user_id);
CREATE INDEX idx_default_sender_user_id ON default_sender_config(user_id);
CREATE INDEX idx_authorization_codes_code ON authorization_codes(code);
CREATE INDEX idx_authorization_codes_user_id ON authorization_codes(user_id);

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_sender_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_codes ENABLE ROW LEVEL SECURITY;

-- OAuth Sessions Policies
CREATE POLICY "Users can view their own OAuth sessions"
    ON oauth_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth sessions"
    ON oauth_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth sessions"
    ON oauth_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth sessions"
    ON oauth_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- SMTP Settings Policies
CREATE POLICY "Users can view their own SMTP settings"
    ON smtp_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SMTP settings"
    ON smtp_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMTP settings"
    ON smtp_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SMTP settings"
    ON smtp_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Default Sender Config Policies
CREATE POLICY "Users can view their own default sender config"
    ON default_sender_config FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own default sender config"
    ON default_sender_config FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own default sender config"
    ON default_sender_config FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own default sender config"
    ON default_sender_config FOR DELETE
    USING (auth.uid() = user_id);

-- Authorization Codes Policies
CREATE POLICY "Users can view their own authorization codes"
    ON authorization_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own authorization codes"
    ON authorization_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own authorization codes"
    ON authorization_codes FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_oauth_sessions_updated_at
    BEFORE UPDATE ON oauth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smtp_settings_updated_at
    BEFORE UPDATE ON smtp_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_default_sender_config_updated_at
    BEFORE UPDATE ON default_sender_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired authorization codes
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM authorization_codes
    WHERE expires_at < NOW() OR used = TRUE AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired OAuth sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_sessions
    WHERE expires_at < NOW() AND refresh_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE oauth_sessions IS 'Stores active OAuth sessions with access and refresh tokens';
COMMENT ON TABLE smtp_settings IS 'Stores encrypted Elastic Email API keys and SMTP credentials';
COMMENT ON TABLE default_sender_config IS 'Tracks default sender settings per user';
COMMENT ON TABLE authorization_codes IS 'Temporary storage for OAuth authorization codes during the flow';
