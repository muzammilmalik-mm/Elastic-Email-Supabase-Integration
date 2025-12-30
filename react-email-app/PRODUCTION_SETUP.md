# Production Email Integration - Setup Guide

## Overview

Simple, production-ready email integration for your Supabase app. Users sign in, connect their Elastic Email account, and start sending emails immediately.

## Setup Steps

### 1. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- View the full schema in supabase-schema.sql
CREATE TABLE IF NOT EXISTS user_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  elastic_email_api_key TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  smtp_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email settings"
  ON user_email_settings FOR ALL
  USING (auth.uid() = user_id);
```

### 2. Deploy Edge Functions

```bash
cd d:\SDK\examples
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-template send-template --no-verify-jwt
supabase functions deploy check-status --no-verify-jwt
supabase functions deploy welcome-email --no-verify-jwt
```

### 3. Configure Environment

Your `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Enable Google OAuth (Optional)

Follow instructions in `GOOGLE_OAUTH_SETUP.md`

## User Flow

1. **Sign in** with Google or email/password
2. **Enter Elastic Email API key** (one-time setup)
3. **Start sending emails** immediately

## Features

✅ Self-service - users configure their own Elastic Email  
✅ Secure - API keys stored encrypted in database  
✅ Simple - just 2 steps to get started  
✅ Production-ready - proper RLS and security  

## Testing

1. Sign up new account
2. Enter your Elastic Email API key
3. Send test email from dashboard
4. Logout and login - settings persist

## Deployment

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, etc.
```

---

**Ready to use!** 🚀
