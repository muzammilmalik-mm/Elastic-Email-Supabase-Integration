# Test Your Supabase OAuth Integration

## ✅ Setup Complete!

Your Supabase OAuth integration is fully configured and deployed!

### Deployed Components

✅ **Edge Functions:**
- `supabase-oauth-exchange` - Token exchange endpoint
- `configure-supabase-project` - SMTP configuration endpoint

✅ **OAuth Credentials:**
- Client ID: `387e3524-9d01-41a0-a63f-a416d271ac04`
- Client Secret: Stored securely in Supabase Secrets

✅ **Frontend Components:**
- OAuth helper library (`src/lib/supabaseOAuth.ts`)
- Callback page (`src/pages/CallbackPage.tsx`)

## 🧪 Quick Test

### Step 1: Add Test Button

In any React component:

```tsx
import { initiateSupabaseOAuth } from '../lib/supabaseOAuth';

function TestPage() {
  return (
    <div style={{ padding: '50px' }}>
      <h1>Test Supabase OAuth</h1>
      <button 
        onClick={initiateSupabaseOAuth}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#3ECF8E',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔗 Connect Supabase Project
      </button>
    </div>
  );
}
```

### Step 2: Test the Flow

1. Click the button
2. You'll see the Supabase authorization screen
3. Select your organization
4. Click "Authorize EE"
5. Redirected to `/callback`
6. See your projects listed
7. Click a project to configure SMTP

## 📍 Expected Flow

```
Click Button
    ↓
🌐 Redirected to:
https://supabase.com/dashboard/authorize?
  client_id=387e3524-9d01-41a0-a63f-a416d271ac04&
  response_type=code&
  scope=all&
  redirect_uri=http://localhost:5173/callback
    ↓
👤 User Authorizes
    ↓
🔙 Redirect back to:
http://localhost:5173/callback?code=AUTH_CODE_HERE
    ↓
🔄 Exchange code for token (automatic)
    ↓
📋 Show user's projects
    ↓
🎯 User selects project
    ↓
⚙️ Configure SMTP
    ↓
✅ Done!
```

## 🔍 Debug & Verify

### Check Browser Console

You should see:
```
Starting Supabase OAuth flow...
Redirect URI: http://localhost:5173/callback
```

### Check Network Tab

Look for these requests:
1. `GET dashboard/authorize` - OAuth authorization
2. `POST /functions/v1/supabase-oauth-exchange` - Token exchange
3. `POST /functions/v1/configure-supabase-project` - SMTP config

### Check Edge Function Logs

```bash
# View logs in Supabase Dashboard
https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu/functions
```

Or use CLI:
```bash
supabase functions logs supabase-oauth-exchange
supabase functions logs configure-supabase-project
```

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure callback URL is exactly: `http://localhost:5173/callback`
- Check registered OAuth app settings

### "Invalid client_id" Error
- Verify client ID is: `387e3524-9d01-41a0-a63f-a416d271ac04`
- Check OAuth app is published/active

### Token Exchange Fails
- Check Edge Function logs
- Verify `OAUTH_CLIENT_SECRET` is set correctly
- Ensure function is deployed

### No Projects Showing
- Check browser console for errors
- Verify OAuth token has correct permissions
- Check network tab response

## ✨ Production Checklist

Before going live:

- [ ] Update redirect URI to production domain
- [ ] Add production callback to OAuth app settings
- [ ] Update URLs in `CallbackPage.tsx`
- [ ] Add proper error handling
- [ ] Add loading states
- [ ] Store OAuth tokens securely
- [ ] Add token refresh logic
- [ ] Test with real Elastic Email SMTP credentials

## 🎯 Next Steps

1. Test the authorization flow
2. Verify project selection works
3. Add your real Elastic Email SMTP credentials in `CallbackPage.tsx`
4. Test email sending with `test-password-reset` function
5. Verify emails are sent via Elastic Email

## 📚 Documentation

- [Quick Start Guide](./OAUTH_QUICKSTART.md) - Complete setup instructions
- [Supabase OAuth Setup](./SUPABASE_OAUTH_SETUP.md) - OAuth app configuration

---

**Ready to test?** Just add the button and click it! 🚀
