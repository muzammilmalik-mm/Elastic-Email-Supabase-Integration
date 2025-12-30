# OAuth System Deployment Guide

Quick reference for deploying and testing the OAuth SMTP credential management system.

## 🚀 Quick Deployment

### 1. Database Setup

```bash
# Navigate to project root
cd d:/SDK

# Apply database migration
supabase db push
```

### 2. Configure Secrets

```bash
# Set OAuth credentials (already configured from Supabase OAuth app)
supabase secrets set OAUTH_CLIENT_ID=5a214a56-3a13-46d5-a871-a0d62758f1b2
supabase secrets set OAUTH_CLIENT_SECRET=pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM

# Generate and set JWT secret (use output from this command)
openssl rand -base64 32
supabase secrets set JWT_SECRET=<paste-output-here>
```

### 3. Deploy Edge Functions

```bash
# Navigate to examples directory
cd examples

# Deploy all OAuth functions
supabase functions deploy oauth-authorize
supabase functions deploy oauth-token
supabase functions deploy smtp-credentials-store
supabase functions deploy smtp-credentials-get

# Verify deployment
supabase functions list
```

## 🧪 Testing

### Test Authorization Flow

1. Get your Supabase project URL:
   ```bash
   supabase status
   ```

2. Build authorization URL (replace `YOUR_PROJECT_URL`):
   ```
   https://YOUR_PROJECT_URL.supabase.co/functions/v1/oauth-authorize?client_id=5a214a56-3a13-46d5-a871-a0d62758f1b2&redirect_uri=http://localhost:8000/callback&response_type=code&state=test123&code_challenge=SAMPLE_CHALLENGE&code_challenge_method=S256&scope=smtp:write
   ```

3. Open URL in browser (you'll need to be authenticated with Supabase Auth)

### Test with Example Client

```bash
cd examples
deno run --allow-net --allow-env oauth-client-example.ts
```

## 📁 File Structure

```
d:/SDK/
├── supabase/
│   └── migrations/
│       └── 20251215_oauth_smtp_system.sql    # Database schema
│
├── examples/
│   ├── supabase/functions/
│   │   ├── _shared/
│   │   │   ├── oauth-utils.ts                # OAuth & JWT utilities
│   │   │   ├── elastic-email-client.ts       # Elastic Email API client
│   │   │   └── supabase-client.ts            # Supabase helpers
│   │   │
│   │   ├── oauth-authorize/
│   │   │   └── index.ts                      # Authorization endpoint
│   │   │
│   │   ├── oauth-token/
│   │   │   └── index.ts                      # Token exchange endpoint
│   │   │
│   │   ├── smtp-credentials-store/
│   │   │   └── index.ts                      # Store SMTP credentials
│   │   │
│   │   └── smtp-credentials-get/
│   │       └── index.ts                      # Retrieve SMTP credentials
│   │
│   └── oauth-client-example.ts               # Example client implementation
│
├── docs/
│   └── oauth-guide.md                        # Complete integration guide
│
└── .env.example                              # Environment variables template
```

## 🔑 OAuth Credentials

- **Client ID**: `5a214a56-3a13-46d5-a871-a0d62758f1b2`
- **Client Secret**: `pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM`
- **Token Lifetime**: 1 hour (access), 30 days (refresh)

## 📚 Documentation

- **Setup Guide**: [docs/oauth-guide.md](file:///d:/SDK/docs/oauth-guide.md)
- **Implementation Plan**: See artifacts directory
- **Example Client**: [examples/oauth-client-example.ts](file:///d:/SDK/examples/oauth-client-example.ts)

## ⚠️ Important Notes

1. **SMTP Password**: The SMTP password is NOT retrieved from Elastic Email API automatically. Users must:
   - Log in to Elastic Email dashboard
   - Go to Settings → SMTP/API
   - Generate SMTP credentials manually
   - Store the password (shown only once)

2. **Encryption**: For production, properly configure `pgsodium` extension for transparent column encryption on sensitive fields.

3. **Authentication**: The authorization endpoint currently shows a consent page if no user is authenticated. Integrate with Supabase Auth for production use.

## 🔗 Next Steps

1. Set up Supabase Auth for user authentication
2. Configure pgsodium encryption for sensitive database columns
3. Add UI for OAuth consent page
4. Implement SMTP password input endpoint
5. Add audit logging for credential access
6. Set up monitoring and rate limiting

---

For complete documentation, see [OAuth Integration Guide](file:///d:/SDK/docs/oauth-guide.md).
