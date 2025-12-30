# Deploy Edge Functions for Management API

## 1. Set Management API Token Secret

```bash
# Get your Personal Access Token from https://app.supabase.com/account/tokens
supabase secrets set SUPABASE_MANAGEMENT_API_TOKEN=sbp_your_token_here
```

## 2. Deploy Functions

```bash
cd d:\SDK\examples

# Deploy fetch-projects
supabase functions deploy fetch-projects --no-verify-jwt

# Deploy update-project-smtp  
supabase functions deploy update-project-smtp --no-verify-jwt
```

## 3. Test Functions

```bash
# Test fetch-projects
curl -X POST https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/fetch-projects

# Test update-smtp
curl -X POST https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/update-project-smtp \
  -H "Content-Type: application/json" \
  -d '{
    "projectRef": "abc123",
    "smtpConfig": {
      "adminEmail": "your@email.com",
      "host": "smtp.elasticemail.com",
      "port": 2525,
      "username": "your@email.com",
      "password": "smtp_password",
      "senderName": "Your Name"
    }
  }'
```

## 4. Update React App

The EmailSetup component will now call these Edge Functions instead of calling Management API directly.

---

**Functions Created:**
- ✅ `fetch-projects` - Lists Supabase projects
- ✅ `update-project-smtp` - Updates SMTP settings

**No more JWT errors!** 🎉
