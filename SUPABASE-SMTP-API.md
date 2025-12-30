# Supabase SMTP Configuration with Elastic Email

## Request Format (Supabase Management API)

### Endpoint
```
PUT https://api.supabase.com/v1/projects/{project-ref}/config/auth
```

### Headers
```json
{
  "Authorization": "Bearer sbp_your_access_token",
  "Content-Type": "application/json"
}
```

### Request Body (Elastic Email SMTP)
```json
{
  "SMTP_ADMIN_EMAIL": "noreply@yourapp.com",
  "SMTP_HOST": "smtp.elasticemail.com",
  "SMTP_PORT": "2525",
  "SMTP_USER": "your-elastic-email-account@example.com",
  "SMTP_PASS": "your-smtp-password",
  "SMTP_SENDER_NAME": "Your App Name",
  "MAILER_AUTOCONFIRM": false
}
```

## Elastic Email SMTP Settings

### Available SMTP Ports
- **25** - Standard SMTP (may be blocked by some ISPs)
- **2525** - Alternative SMTP (recommended)
- **587** - SMTP with STARTTLS
- **465** - SMTP with SSL

### SMTP Credentials
- **Host**: `smtp.elasticemail.com`
- **Username**: Your Elastic Email account email
- **Password**: SMTP password (NOT your account password)

### Getting SMTP Password
1. Log into Elastic Email dashboard
2. Go to **Settings > SMTP & API**
3. Click **Create SMTP credentials** or use existing
4. Copy the SMTP password (different from login password)

## Response Format

### Success Response (200 OK)
```json
{
  "SMTP_ADMIN_EMAIL": "noreply@yourapp.com",
  "SMTP_HOST": "smtp.elasticemail.com",
  "SMTP_PORT": "2525",
  "SMTP_USER": "your-email@example.com",
  "SMTP_SENDER_NAME": "Your App Name",
  "MAILER_AUTOCONFIRM": false,
  "updated_at": "2025-12-15T17:10:00.000Z"
}
```

### Error Response (401 Unauthorized)
```json
{
  "message": "Invalid token",
  "code": "401"
}
```

### Error Response (400 Bad Request)
```json
{
  "message": "Invalid SMTP configuration",
  "code": "400",
  "details": "SMTP connection failed"
}
```

### Error Response (403 Forbidden)
```json
{
  "message": "Insufficient permissions",
  "code": "403"
}
```

## cURL Example

```bash
curl -X PUT 'https://api.supabase.com/v1/projects/your-project-ref/config/auth' \
  -H 'Authorization: Bearer sbp_your_access_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "SMTP_ADMIN_EMAIL": "noreply@yourapp.com",
    "SMTP_HOST": "smtp.elasticemail.com",
    "SMTP_PORT": "2525",
    "SMTP_USER": "your-email@example.com",
    "SMTP_PASS": "your-smtp-password",
    "SMTP_SENDER_NAME": "Your App"
  }'
```

## RequestBin Testing

### Setup
1. Go to https://requestbin.com/
2. Click **Create Request Bin**
3. Copy your bin URL

### Test Request
```bash
curl -X POST 'https://requestbin.com/r/YOUR_BIN_ID' \
  -H 'Authorization: Bearer sbp_your_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "SMTP_HOST": "smtp.elasticemail.com",
    "SMTP_PORT": "2525",
    "SMTP_USER": "test@example.com",
    "SMTP_PASS": "password123"
  }'
```

### What You'll See in RequestBin
- Full request headers
- Request body (JSON payload)
- Timestamp of request
- Request method and URL

## JavaScript Example (Node.js)

```javascript
const response = await fetch(
  'https://api.supabase.com/v1/projects/abcdefg/config/auth',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer sbp_your_token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      SMTP_ADMIN_EMAIL: 'noreply@yourapp.com',
      SMTP_HOST: 'smtp.elasticemail.com',
      SMTP_PORT: '2525',
      SMTP_USER: 'your-email@example.com',
      SMTP_PASS: 'your-smtp-password',
      SMTP_SENDER_NAME: 'Your App'
    })
  }
);

const data = await response.json();
console.log('Response:', data);
```

## Verifying Configuration

### Check Current Config
```bash
curl -X GET 'https://api.supabase.com/v1/projects/your-project-ref/config/auth' \
  -H 'Authorization: Bearer sbp_your_token'
```

### Test Email Delivery
After configuring SMTP:
1. Go to Supabase Dashboard
2. Authentication > Users
3. Invite a new user or trigger password reset
4. Check Elastic Email dashboard for delivery

## Common Issues

### "Invalid SMTP credentials"
- Verify you're using SMTP password, not account password
- Check username is your Elastic Email account email
- Ensure SMTP credentials are created in Elastic Email dashboard

### "Connection timeout"
- Try different SMTP port (2525, 587, or 465)
- Check firewall isn't blocking SMTP
- Verify Elastic Email service is operational

### "Unauthorized"
- Check your Supabase access token is valid
- Ensure you have owner/admin permissions on the project
- Token may be expired - generate a new one

### "Invalid project reference"
- Verify project ref ID is correct (find in project settings)
- Ensure you're using the right Supabase organization

## Testing Script

Run the included test script:

```bash
# Setup
cp .env.example .env
# Edit .env with your credentials

# Install dependencies
npm install dotenv node-fetch

# Run test
node test-supabase-smtp-config.js
```

## Resources

- [Supabase Management API Docs](https://supabase.com/docs/reference/api)
- [Elastic Email SMTP Setup](https://elasticemail.com/blog/smtp-settings/)
- [Elastic Email Dashboard](https://elasticemail.com/account/)
- [RequestBin](https://requestbin.com/)
