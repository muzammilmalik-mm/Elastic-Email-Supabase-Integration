# Supabase OAuth App Setup

## Step 1: Create OAuth App

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/org/_/apps

2. **Click "Add application"**

3. **Fill in details:**
   - **Name:** `Elastic Email SMTP Configurator`
   - **Description:** `Automatically configure SMTP settings using Elastic Email`
   - **Callback URL (Development):** `http://localhost:5173/auth/callback`
   - **Callback URL (Production):** `https://yourdomain.com/auth/callback`
   - **Website:** (optional) Your app URL

4. **Click "Create"**

5. **Copy credentials:**
   - **Client ID** (looks like: `7673bde9-be72-4d75-bd5e-b0dba2c49b38`)
   - **Client Secret** (keep this secret!)

6. **Add to `.env`:**
   ```env
   VITE_SUPABASE_OAUTH_CLIENT_ID=your_client_id_here
   # Don't add client_secret to .env - it's server-side only!
   ```

7. **Set secret in Supabase (for Edge Functions):**
   ```bash
   cd d:\SDK\examples
   supabase secrets set SUPABASE_OAUTH_CLIENT_ID=your_client_id
   supabase secrets set SUPABASE_OAUTH_CLIENT_SECRET=your_client_secret
   ```

---

## Step 2: Scopes

The OAuth app will request `all` scope by default, which grants:
- ✅ Read user's organizations
- ✅ List projects
- ✅ Update project settings (SMTP config)
- ✅ Create projects (optional)

---

## Testing

**Development URL:** `http://localhost:5173/auth/callback`
**Make sure this exactly matches** what you entered in the OAuth app!

---

**Next:** Run database migration
