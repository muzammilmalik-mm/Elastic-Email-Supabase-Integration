# Quick Fix for OAuth Testing

The 401 error is because Supabase Edge Functions require JWT verification by default.

## Solution: Disable JWT Verification for oauth-authorize

You have two options:

### Option 1: Update Function to Skip JWT Verification (Recommended for Testing)

Supabase Edge Functions check for JWT by default. To make the oauth-authorize function publicly accessible, you need to set the `verify_jwt` option to false.

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu/functions
2. Click on `oauth-authorize`
3. Look for "Settings" or "Configuration"
4. Find "Verify JWT" toggle and **turn it OFF**
5. Save changes

### Option 2: Use th Supabase Anon Key (Temporary Workaround)

If you can't disable JWT verification, modify the HTML to send the anon key:

1. Get your anon key from: https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu/settings/api
2. In the browser console when the error happens, run:
   ```javascript
   // Replace with your actual anon key
   const ANON_KEY = 'your-anon-key-here'
   
   // This will retry the request with the anon key
   fetch(window.location.href, {
       headers: {
           'Authorization': 'Bearer ' + ANON_KEY,
           'apikey': ANON_KEY
       }
   })
   ```

### Option 3: Test Locally with Supabase CLI

Run the functions locally where JWT verification is optional:

```bash
supabase start
supabase functions serve
```

Then test at `http://localhost:54321/functions/v1/oauth-authorize`

## Best Solution

The **correct fix** is to disable JWT verification for the `oauth-authorize` endpoint in Supabase settings since:
- OAuth authorization endpoints must be publicly accessible
- Users aren't authenticated yet when they hit this endpoint
- This is standard OAuth 2.0 behavior

Let me know if you need help finding the JWT verification toggle in the Supabase dashboard!
