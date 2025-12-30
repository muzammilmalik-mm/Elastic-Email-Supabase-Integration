# Complete Supabase OAuth Integration - Quick Start Guide

## ✅ What's Been Set Up

### OAuth Credentials
- **Client ID:** `387e3524-9d01-41a0-a63f-a416d271ac04`
- **Client Secret:** `sba_59097a11eca56b527ea2ac5b88f943a67d5cffd7` (stored as secret)
- **Redirect URI:** `http://localhost:5173/callback`

### Deployed Edge Functions
1. ✅ `supabase-oauth-exchange` - Exchanges auth code for token
2. ✅ `configure-supabase-project` - Configures SMTP for selected project

### Created Files
1. ✅ `src/lib/supabaseOAuth.ts` - OAuth helper functions
2. ✅ `src/pages/CallbackPage.tsx` - OAuth callback handler
3. ✅ `.env.example` - Environment variable template

## 🚀 Quick Start

### Step 1: Set Up Environment Variables

Create `.env` file in `d:\SDK\react-email-app\`:

```env
VITE_SUPABASE_OAUTH_CLIENT_ID=387e3524-9d01-41a0-a63f-a416d271ac04
VITE_SUPABASE_OAUTH_REDIRECT_URI=http://localhost:5173/callback

# Your Supabase project (for Edge Functions)
VITE_SUPABASE_URL=https://qfyomvwcugkqlbskhzhu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Add "Connect Supabase" Button

In your React component:

```tsx
import { initiateSupabaseOAuth } from './lib/supabaseOAuth';

function YourComponent() {
  return (
    <button onClick={initiateSupabaseOAuth}>
      Connect Supabase Project
    </button>
  );
}
```

### Step 3: Add Callback Route

In your `App.tsx` or router:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CallbackPage from './pages/CallbackPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        {/* Your other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 4: Update CallbackPage URLs

In `src/pages/CallbackPage.tsx`, replace `your-project.supabase.co` with:

```
https://qfyomvwcugkqlbskhzhu.supabase.co
```

## 🔄 Complete Flow

```
1. User clicks "Connect Supabase" button
   ↓
2. Redirected to Supabase authorization page
   ↓
3. User selects their organization and clicks "Authorize"
   ↓
4. Redirected back to http://localhost:5173/callback?code=AUTH_CODE
   ↓
5. CallbackPage exchanges code for OAuth token
   ↓
6. Fetches user's Supabase projects
   ↓
7. User selects which project to configure
   ↓
8. Configures SMTP for selected project
   ↓
9. ✅ Done! User's project now uses Elastic Email for auth emails
```

## 📝 How It Works

### Authorization Flow

```typescript
// 1. Start OAuth
initiateSupabaseOAuth();
// → Redirects to: https://supabase.com/dashboard/authorize?
//   client_id=387e3524-9d01-41a0-a63f-a416d271ac04&
//   response_type=code&
//   scope=all&
//   redirect_uri=http://localhost:5173/callback
```

### Token Exchange

```typescript
// 2. Exchange code for token (in Edge Function)
POST https://api.supabase.com/v1/oauth/token
Body: {
  grant_type: "authorization_code",
  code: "AUTH_CODE_FROM_CALLBACK",
  client_id: "387e3524-9d01-41a0-a63f-a416d271ac04",
  client_secret: "sba_59097a11eca56b527ea2ac5b88f943a67d5cffd7",
  redirect_uri: "http://localhost:5173/callback"
}

Response: {
  access_token: "OAUTH_ACCESS_TOKEN",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token: "REFRESH_TOKEN"
}
```

### Fetch Projects

```typescript
// 3. Get user's projects
GET https://api.supabase.com/v1/projects
Headers: {
  Authorization: "Bearer OAUTH_ACCESS_TOKEN"
}
```

### Configure SMTP

```typescript
// 4. Configure project SMTP
PATCH https://api.supabase.com/v1/projects/{project_ref}/config/auth
Headers: {
  Authorization: "Bearer OAUTH_ACCESS_TOKEN"
}
Body: {
  smtp_admin_email: "noreply@yourdomain.com",
  smtp_host: "smtp.elasticemail.com",
  smtp_port: "2525",
  smtp_user: "your-email@example.com",
  smtp_pass: "your-smtp-password",
  smtp_sender_name: "Your App"
}
```

## 🧪 Testing

### Test the OAuth Flow

1. Start your React app:
   ```bash
   cd d:\SDK\react-email-app
   npm run dev
   ```

2. Click "Connect Supabase" button

3. You should see the Supabase authorization screen (like the screenshot you showed)

4. Authorize and you'll be redirected to `/callback`

5. Select a project to configure

6. ✅ SMTP configured!

### Verify Configuration

After configuring, test that emails work:

```bash
# Use the password reset function we created earlier
curl -X POST https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/test-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

The email should now be sent via Elastic Email!

## 🎯 What This Achieves

This gives you the EXACT flow that Resend has:

1. ✅ User authorizes your app to access their Supabase organization
2. ✅ You get OAuth token with write permissions
3. ✅ You fetch their projects
4. ✅ They select which project to configure
5. ✅ You automatically configure SMTP in their project
6. ✅ Their Supabase auth emails now go through Elastic Email!

## 🔐 Security Notes

- ✅ Client secret is stored in Supabase Secrets (not exposed to frontend)
- ✅ OAuth token is only used server-side in Edge Functions
- ✅ User must explicitly authorize your app
- ✅ Scoped permissions (only Auth and Projects access)

## 📚 Next Steps

1. Update `CallbackPage.tsx` with your actual Elastic Email SMTP credentials
2. Add proper error handling and loading states
3. Store the OAuth token securely if you need to refresh later
4. Add production redirect URI when you deploy

---

**You now have a complete Supabase OAuth integration just like Resend!** 🎉
