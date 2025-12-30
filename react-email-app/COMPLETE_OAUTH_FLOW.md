# Complete OAuth & SMTP Configuration Flow

## ✅ What's Been Built

Your complete OAuth integration is now ready! Here's how it works:

## 🔄 The Complete Flow

```
1. User clicks "Connect Supabase Project"
   ↓
2. OAuth with Supabase → Get OAuth token
   ↓
3. Save OAuth token to database ✅
   ↓
4. Show list of user's Supabase projects
   ↓
5. User selects a project
   ↓
6. User enters Elastic Email API key
   ↓
7. Generate SMTP credentials (Elastic Email API) ✅
   ↓
8. Configure Supabase SMTP (using OAuth token) ✅
   ↓
9. Save everything to database
   ↓
10. ✅ Done! Redirect to dashboard
```

## 📦 What Gets Saved

### In `user_email_settings` table:

| Column | Value | Purpose |
|--------|-------|---------|
| `supabase_oauth_access_token` | OAuth access token | Use for all Supabase Management API calls |
| `supabase_oauth_refresh_token` | OAuth refresh token | Refresh when access token expires |
| `supabase_oauth_expires_at` | Expiration timestamp | Know when to refresh |
| `elastic_email_api_key` | Elastic Email API key | Use for all Elastic Email API calls |
| `selected_supabase_project_ref` | Project reference (e.g., `qfyomvwcugkqlbskhzhu`) | The configured project |
| `selected_supabase_project_name` | Project name | Display name |

## 🎯 API Usage Pattern

### For Supabase Management API Calls:
```typescript
// Use the saved OAuth token
const { supabase_oauth_access_token } = await getUserSettings();

fetch('https://api.supabase.com/v1/projects/{ref}/...', {
    headers: {
        'Authorization': `Bearer ${supabase_oauth_access_token}`
    }
});
```

### For Elastic Email API Calls:
```typescript
// Use the saved API key
const { elastic_email_api_key } = await getUserSettings();

fetch('https://api.elasticemail.com/v4/...', {
    headers: {
        'X-ElasticEmail-ApiKey': elastic_email_api_key
    }
});
```

## 🛠️ Deployed Edge Functions

### 1. `supabase-oauth-exchange`
- **Purpose:** Exchange OAuth code for tokens
- **Input:** `{ code }`
- **Output:** `{ access_token, refresh_token, expires_in, projects }`
- **Saves:** OAuth tokens to database

### 2. `generate-smtp-credentials`
- **Purpose:** Generate SMTP credentials from Elastic Email
- **Input:** `{ elastic_email_api_key }`
- **Output:** `{ smtp_host, smtp_port, smtp_user, smtp_pass }`
- **Uses:** Elastic Email API key

### 3. `configure-supabase-smtp`
- **Purpose:** Configure SMTP in user's Supabase project
- **Input:** `{ oauth_access_token, project_ref, smtp_config }`
- **Output:** `{ success, message }`
- **Uses:** OAuth access token (not API key!)

## 🎨 UI Flow

### Step 1: OAuth Callback
```
Exchanging authorization code...
Saving authorization...
```

### Step 2: Project Selection
```
Select Your Supabase Project

[Project 1]
Ref: abc123 • Region: us-east-1

[Project 2]
Ref: xyz789 • Region: eu-central-1
```

### Step 3: API Key Input
```
Configure Email for [Project Name]

Elastic Email API Key:
[_________________________]

[Configure SMTP]
```

### Step 4: Configuration
```
Generating SMTP credentials...
Configuring SMTP for project...
✅ SMTP configured successfully!
→ Redirecting to dashboard...
```

## 💾 Database Schema Update Needed

Make sure your `user_email_settings` table has these columns:

```sql
ALTER TABLE user_email_settings
ADD COLUMN IF NOT EXISTS elastic_email_api_key TEXT,
ADD COLUMN IF NOT EXISTS selected_supabase_project_ref TEXT,
ADD COLUMN IF NOT EXISTS selected_supabase_project_name TEXT;
```

## 🧪 To Test

1. Go to your app: http://localhost:5173
2. Click "Connect Supabase Project"
3. Authorize with Supabase
4. Select a project from the list
5. Enter your Elastic Email API key
6. Click "Configure SMTP"
7. ✅ Check your Supabase project → Auth → Email settings

Your SMTP should now be configured with Elastic Email!

---

**Everything is integrated and deployed!** 🎉

**Key Principle:**
- Supabase Management API → Use OAuth token
- Elastic Email API → Use API key
