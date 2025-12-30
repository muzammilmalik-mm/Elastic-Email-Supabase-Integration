# OAuth Setup Page - Quick Start Guide

## 🎉 Your OAuth Setup Page is Live!

**URL**: https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/oauth-setup-page

## 🧪 How to Test

### Step 1: Open the Setup Page
Visit the URL above or open the local HTML file:
```bash
start d:\SDK\examples\oauth-web-interface.html
```

### Step 2: Get Your Elastic Email API Key
1. Go to https://elasticemail.com/account#/settings/new/manage-api
2. Create a new API key
3. Copy it

### Step 3: Complete the Flow
1. **Paste your API key** in the setup page
2. Click **"Continue"** - it will validate your key
3. Click **"Authorize with OAuth"** - you'll be redirected to authorize
4. **Important**: You need to be logged into Supabase for OAuth to work
   - If you see a login page, that's expected
   - For testing, you can pass a Supabase auth token in the URL

### Step 4: Verify It Worked
After completing the flow, check your Supabase database:

**Option A - Dashboard**:
1. Go to https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu/editor
2. Open the `smtp_settings` table
3. You should see your Elastic Email credentials
4. Check `default_sender_config` to see it's set as default

**Option B - API**:
```bash
# Get your access token first (from the OAuth flow)
# Then retrieve credentials:
curl -X GET https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/smtp-credentials-get \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔑 Testing Without Full Auth (Quick Test)

For quick testing, you can modify the `oauth-authorize` endpoint to skip authentication temporarily:

1. The authorization endpoint needs a user session
2. You can create a test user in Supabase Auth
3. Or modify the endpoint to auto-approve for testing

## 📊 What Gets Stored

After completing the flow, this is saved in Supabase:

### `smtp_settings` table:
```
- user_id: (linked to OAuth session)
- elastic_email_api_key: YOUR_API_KEY
- smtp_username: your-email@domain.com
- smtp_server: smtp.elasticemail.com
- smtp_port: 587
- sender_email: your-email@domain.com
- sender_name: YourName
```

### `default_sender_config` table:
```
- user_id: (linked to OAuth session)
- smtp_settings_id: (links to above settings)
```

## 🎯 Integration Example

Once a user completes setup, your app can retrieve their default sender:

```javascript
// Get default SMTP credentials
const response = await fetch(
  'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/smtp-credentials-get',
  {
    headers: {
      'Authorization': `Bearer ${userAccessToken}`
    }
  }
);

const { smtp_credentials } = await response.json();

// Use credentials to send email
await fetch('https://api.elasticemail.com/v4/emails/transactional', {
  method: 'POST',
  headers: {
    'X-ElasticEmail-ApiKey': smtp_credentials.api_key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Recipients: { To: ['user@example.com'] },
    Content: {
      From: smtp_credentials.sender_email,
      FromName: smtp_credentials.sender_name,
      Subject: 'Hello!',
      Body: [{ ContentType: 'HTML', Content: '<h1>Test Email</h1>' }]
    }
  })
});
```

## 🛠️ Troubleshooting

### "Invalid client credentials"
- Make sure the OAuth client ID and secret are set correctly
- Check `supabase secrets list`

### "Missing or invalid Authorization header"
- The OAuth flow requires user authentication
- Set up Supabase Auth or pass a valid JWT token

### "Invalid API key"
- Verify your Elastic Email API key is correct
- Check it has the right permissions in Elastic Email

### Database migration not applied
```bash
cd d:\SDK
supabase db push
```

## 📝 Next Steps

1. **Set up Supabase Auth** - Allow users to sign up/login
2. **Customize the UI** - Edit `oauth-web-interface.html` to match your brand
3. **Add to your app** - Embed the setup page in your application
4. **Test end-to-end** - Complete the full flow with a real user

## 🔗 Links

- **Setup Page**: https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/oauth-setup-page
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu
- **Elastic Email**: https://elasticemail.com/account

---

Need help? Check the [OAuth Integration Guide](file:///d:/SDK/docs/oauth-guide.md)
