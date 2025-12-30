# Multi-Project SMTP Configuration Setup

## Quick Start

### 1. Update Database Schema

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS supabase_project_ref TEXT,
ADD COLUMN IF NOT EXISTS supabase_project_name TEXT,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT 'smtp.elasticemail.com',
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 2525;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_project 
ON user_email_settings(user_id, supabase_project_ref);
```

### 2. Get Supabase Management API Token

You'll need this to fetch projects and update SMTP settings.

**Option A: Personal Access Token**
1. Go to https://app.supabase.com/account/tokens
2. Create new token
3. Copy token

**Option B: Use User's Session Token** (Recommended)
- Automatically extracted from user's Supabase login session

### 3. Test the Flow

1. **Sign in** with Google
2. **Enter Elastic Email API key**
3. **See your Supabase projects** (fetched automatically)
4. **Select which project** to configure
5.  **SMTP credentials generated** and configured
6. **Success!** Send emails from that project

---

## How It Works

### Flow Diagram

```
Login (Google OAuth)
  ↓
Get Supabase Access Token
  ↓
Enter Elastic Email API Key
  ↓
Fetch Projects from Management API
  ├─ My App (abc123)
  ├─ Staging (xyz789)
  └─ Dev Site (test456)
  ↓
Select "My App"
  ↓
Generate SMTP Credentials (Elastic Email)
  ↓
Update "My App" SMTP Settings (Management API)
  ↓
Dashboard → Send Emails
```

### Technical Details

**Management API Calls:**
1. `GET /v1/projects` - List user's projects
2. `PATCH /v1/projects/{ref}/config/auth` - Update SMTP

**Elastic Email API:**
1. `POST /v4/security/smtp` - Generate SMTP password

**Storage:** Each user-project combination stored in database

---

## Troubleshooting

**Can't fetch projects?**
- Check Supabase session token is valid
- Verify Management API permissions

**SMTP generation fails?**
- Verify Elastic Email API key
- Check Elastic Email account is active

**Management API update fails?**
- User must own the project
- Check project ref is correct

---

**Ready!** Just run the database update SQL and test.
