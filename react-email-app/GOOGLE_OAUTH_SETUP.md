# Google OAuth Setup Instructions

## 1. Enable Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. You'll need to configure:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

## 2. Get Google OAuth Credentials

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done
6. Application type: **Web application**
7. Add authorized redirect URI:
   ```
   https://qfyomvwcugkqlbskhzhu.supabase.co/auth/v1/callback
   ```
8. Copy the **Client ID** and **Client Secret**

## 3. Add Credentials to Supabase

1. Go back to Supabase → Authentication → Providers → Google
2. Paste **Client ID**
3. Paste **Client Secret**
4. Click **Save**

## 4. Test Google Login

1. Refresh your app: http://localhost:5173
2. Click "**Continue with Google**" button
3. Select your Google account
4. You'll be logged in!

---

**Note:** The Google button is now visible in your login page. Once you complete the setup above, it will work!
