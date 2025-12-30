# Testing the Elastic Email SDK Locally

This guide shows you how to test the SDK on your local machine before deploying to Supabase.

## Quick Start

### 1. Set Up Environment Variables

Copy the example file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
```
ELASTIC_EMAIL_API_KEY=your-actual-api-key
FROM_EMAIL=noreply@yourverifieddomain.com
TEST_RECIPIENT=your-email@example.com
```

### 2. Install Dependencies

```bash
# Install the SDK dependencies
cd elastic-email-supabase-sdk
npm install
cd ..

# Install test script dependencies
npm install dotenv
```

### 3. Run the Test Script

```bash
node test-sdk.js
```

## What the Test Does

The test script will:

1. ✅ **Send a basic HTML email** - Tests core functionality
2. ✅ **Send email with CC/BCC** - Tests recipient options
3. ⚠️ **Send template email** - Tests template functionality (may skip if no template)
4. 🔍 **Check email status** - Verifies delivery tracking
5. 📊 **Get email activity** - Retrieves recent email logs
6. 🔧 **Test error handling** - Validates error responses

## Expected Output

```
═══════════════════════════════════════════════
  Elastic Email SDK - Local Test Suite
═══════════════════════════════════════════════

Configuration:
  From: noreply@yourapp.com
  To: test@example.com
  API Key: ✓ Set

═══════════════════════════════════════════════

📧 Test 1: Sending HTML email...
✅ Email sent successfully!
   Transaction ID: abc123...
   Message ID: msg456...

📧 Test 2: Sending email with CC/BCC...
✅ Email with CC/BCC sent!
   Transaction ID: def789...

... (more tests)

═══════════════════════════════════════════════
  ✅ All tests completed!
═══════════════════════════════════════════════
```

## Troubleshooting

### "Invalid API key" Error

- Verify your API key is correct in `.env`
- Check the key is active in Elastic Email dashboard
- Ensure no extra spaces in the `.env` file

### "Email address not verified" Error

- Your `FROM_EMAIL` must be verified in Elastic Email
- Go to Elastic Email dashboard → Settings → Domains
- Verify your sending domain or email address

### No emails received

- Check your spam folder
- Check Elastic Email dashboard for delivery status
- Verify `TEST_RECIPIENT` email is correct

### Template not found

- This is expected if you haven't created templates yet
- The test will skip this and continue
- Create templates in Elastic Email dashboard to test this feature

## Next Steps

After successful local testing:

1. **Deploy to Supabase**: Use the example Edge Functions
2. **Set Supabase Secrets**: Store your API key securely
3. **Test Edge Functions**: Use the examples in `/examples`

## Manual Testing

You can also test individual functions:

```javascript
import { ElasticEmailClient, sendEmail } from './elastic-email-supabase-sdk/src/index.ts';

const client = new ElasticEmailClient({
  apiKey: 'your-api-key'
});

// Send a quick test email
await sendEmail(client, {
  from: { email: 'test@yourapp.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Quick Test',
  body: { html: '<p>Testing!</p>' }
});
```

## Interactive Testing with Node REPL

```bash
node
```

```javascript
require('dotenv').config();
const { ElasticEmailClient, sendEmail } = require('./elastic-email-supabase-sdk/src/index.ts');

const client = new ElasticEmailClient({
  apiKey: process.env.ELASTIC_EMAIL_API_KEY
});

// Test sending
await sendEmail(client, {
  from: { email: process.env.FROM_EMAIL },
  to: [{ email: process.env.TEST_RECIPIENT }],
  subject: 'Interactive Test',
  body: { html: '<h1>Hello!</h1>' }
});
```

## Testing Edge Functions Locally

To test the Edge Functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions
cd examples
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

## Resources

- [Integration Guide](./docs/integration-guide.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./docs/examples.md)
