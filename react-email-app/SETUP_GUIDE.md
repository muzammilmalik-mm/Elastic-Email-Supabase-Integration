# Setup Instructions - Per-User Email Settings

## Critical Fix Applied

**Problem:** All users' SMTP credentials were being stored to the same hardcoded Supabase project.

**Solution:** Each user's settings now stored in a database table with their own API key.

---

## Setup Steps

### 1. Create Database Table

**Go to Supabase Dashboard → SQL Editor**

Run the SQL from `database-schema.sql`:

```sql
CREATE TABLE user_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  elastic_email_api_key TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  configured_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email settings"
  ON user_email_settings FOR ALL
  USING (auth.uid() = user_id);
```

### 2. Test the Fix

1. **User A:**
   - Sign in with Google
   - Enter their Elastic Email API key
   - See success message

2. **User B (different account):**
   - Sign out User A
   - Sign in with different Google account
   - Enter THEIR Elastic Email API key 
   - See success message

3. **Verify:**
   - Check Supabase database
   - Should see 2 rows in `user_email_settings`
   - Each with different `user_id` and `elastic_email_api_key`

---

## How It Works Now

1. User signs in → App checks database for their settings
2. No settings? → EmailSetup screen (enter API key)
3. API key validated → Saved to database with user_id
4. Dashboard → Loads THEIR API key from database
5. Send email → Uses THEIR API key

**Each user = separate row in database = separate Elastic Email account**

---

## User Flow

```
Login → No settings? → EmailSetup
         ├─ Enter API key
         ├─ Validate with Elastic Email
         ├─ Save to database (user_id + api_key)
         └─ Dashboard

Dashboard:
  - Load user's API key from database
  - Send emails using THEIR key
  - Each user isolated
```

---

**No more shared credentials!** ✅
