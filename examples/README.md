# Example Supabase Edge Functions for Elastic Email

This directory contains example Edge Functions demonstrating how to use the Elastic Email SDK with Supabase.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Elastic Email account and API key
- Supabase project

## Setup

1. **Set your environment variables**

Create a `.env` file in the `supabase` directory:

```bash
ELASTIC_EMAIL_API_KEY=your-api-key-here
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name
```

2. **Set Supabase Secrets**

For production, store your API key in Supabase Secrets:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-api-key-here
supabase secrets set FROM_EMAIL=noreply@yourapp.com
supabase secrets set FROM_NAME="Your App Name"
```

## Available Functions

### send-email

Send transactional emails with custom HTML and text content.

**Deploy:**
```bash
supabase functions deploy send-email
```

**Usage:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello World",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>",
    "text": "Hello! This is a test email."
  }'
```

### send-template

Send emails using Elastic Email templates.

**Deploy:**
```bash
supabase functions deploy send-template
```

**Usage:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "templateName": "welcome-email",
    "templateData": {
      "userName": "John Doe",
      "confirmUrl": "https://example.com/confirm"
    }
  }'
```

### check-status

Check email delivery status and retrieve activity logs.

**Deploy:**
```bash
supabase functions deploy check-status
```

**Usage:**
```bash
# Get specific email status
curl "https://your-project.supabase.co/functions/v1/check-status?transactionId=abc123"

# Get activity logs
curl "https://your-project.supabase.co/functions/v1/check-status?limit=50&status=Sent"
```

### welcome-email

Automatically send welcome emails when users sign up (webhook-triggered).

**Deploy:**
```bash
supabase functions deploy welcome-email --no-verify-jwt
```

**Setup Database Webhook:**

1. Go to your Supabase Dashboard
2. Navigate to **Database > Webhooks**
3. Click **Create a new hook**
4. Configure:
   - **Table**: `auth.users`
   - **Events**: `INSERT`
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-project.supabase.co/functions/v1/welcome-email`
5. Click **Confirm**

Now, whenever a new user signs up, they'll automatically receive a welcome email!

## Testing Locally

Run functions locally for testing:

```bash
supabase start
supabase functions serve
```

Then test with:

```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

## Error Handling

All functions include comprehensive error handling and will return:

**Success Response:**
```json
{
  "success": true,
  "transactionId": "abc123",
  "messageId": "msg456"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Learn More

- [Elastic Email SDK Documentation](../elastic-email-supabase-sdk/README.md)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Elastic Email API Documentation](https://elasticemail.com/developers/api-documentation)
