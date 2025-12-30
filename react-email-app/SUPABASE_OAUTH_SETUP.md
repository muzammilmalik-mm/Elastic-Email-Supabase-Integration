# Supabase OAuth Application Setup

## Application Details

**Application Name:** EE  
**Website URL:** http://localhost:5173/  
**Authorization Callback URL:** http://localhost:5173/callback  

## Required Permissions

### Auth (Read and Write) ✅ REQUIRED
- **Purpose:** Configure SMTP settings in user's Supabase project
- **API Endpoint:** `PATCH /v1/projects/{ref}/config/auth`
- **What it allows:** Update auth configuration including SMTP credentials

### Projects (Read) ✅ REQUIRED
- **Purpose:** List user's projects to let them select which one to configure
- **API Endpoint:** `GET /v1/projects`
- **What it allows:** Fetch list of user's Supabase projects

### All Other Scopes
- **Analytics:** ❌ No access
- **Database:** ❌ No access
- **Domains:** ❌ No access
- **Edge Functions:** ❌ No access
- **Environment:** ❌ No access
- **Organizations:** ❌ No access
- **REST:** ❌ No access
- **Secrets:** ❌ No access
- **Storage:** ❌ No access

## What Users Will See

When users click "Authorize" on your app, they'll see:

```
Authorize API access for EE

Permissions:
✓ Read and Write access to auth configurations and SSO providers
✓ Read access to projects and project metadata

Organization: [User's Org]
```

## After Registration

You'll receive:
1. **Client ID** - Use in authorization URL
2. **Client Secret** - Use for token exchange (keep secret!)

## Next Steps

1. Register the application with these settings
2. Save the Client ID and Client Secret
3. Implement OAuth flow in your React app
4. Test the authorization flow
5. Exchange auth code for access token
6. Use token to configure SMTP

## Production Setup

When ready for production:
1. Update Website URL to your production domain
2. Add production callback URL: `https://yourdomain.com/callback`
3. Both localhost and production URLs can coexist
