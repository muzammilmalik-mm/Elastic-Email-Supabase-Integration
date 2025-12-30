# Elastic Email Integration Guide for Supabase

## Overview

Elastic Email is a powerful email delivery platform that enables you to send transactional emails, marketing campaigns, and track email analytics. Combined with Supabase Edge Functions, you can create a seamless email experience for your users with features such as:

- **Transactional Emails** - Welcome emails, password resets, order confirmations
- **Template Support** - Use pre-built email templates with dynamic data
- **Delivery Tracking** - Monitor email delivery status and engagement
- **Database Webhooks** - Automatically trigger emails based on database events

This guide will walk you through integrating Elastic Email with Supabase using our lightweight TypeScript SDK, optimized for Edge Functions.

You can find the complete SDK and examples on [GitHub](https://github.com/yourusername/elastic-email-supabase-sdk).

## Prerequisites

Before we dive into the code, ensure you have the following ready:

- [Supabase](https://supabase.com/) project created
- [Elastic Email](https://elasticemail.com/) account with API key
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed on your machine

## Step 1: Getting Your Elastic Email API Key

1. Log in to your [Elastic Email account](https://elasticemail.com/account/)
2. Navigate to **Settings > API**
3. Click **Create Additional API Key** (or use an existing one)
4. Copy your API key - you'll need this later
5. (Optional) Set up email templates in the **Templates** section

> [!IMPORTANT]
> Keep your API key secure! Never commit it to version control. We'll store it in Supabase Secrets.

## Step 2: Install the SDK

The Elastic Email Supabase SDK is designed to work seamlessly with both npm/Node.js projects and Deno (Supabase Edge Functions).

### For Edge Functions (Deno)

No installation required! Import directly from npm:

```typescript
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';
```

### For Node.js Projects

```bash
npm install elastic-email-supabase
```

Then import as usual:

```typescript
import { ElasticEmailClient, sendEmail } from 'elastic-email-supabase';
```

## Step 3: Store Your API Key in Supabase Secrets

Supabase Secrets allow you to securely store sensitive configuration like API keys. Set your Elastic Email API key:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-api-key-here
supabase secrets set FROM_EMAIL=noreply@yourapp.com
supabase secrets set FROM_NAME="Your App Name"
```

You can verify your secrets are set:

```bash
supabase secrets list
```

## Step 4: Create Your First Edge Function

Let's create an Edge Function to send transactional emails.

### Create the Function

```bash
supabase functions new send-email
```

### Update the Function Code

Replace the contents of `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  ElasticEmailClient, 
  sendEmail,
  ValidationError,
  AuthenticationError
} from 'npm:elastic-email-supabase@1.0.0';

const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourapp.com';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'Your App';

serve(async (req) => {
  try {
    if (!ELASTIC_EMAIL_API_KEY) {
      throw new Error('ELASTIC_EMAIL_API_KEY not configured');
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !subject || (!html && !text)) {
      throw new ValidationError('Missing required fields');
    }

    const client = new ElasticEmailClient({
      apiKey: ELASTIC_EMAIL_API_KEY
    });

    const result = await sendEmail(client, {
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      body: { html, text }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId: result.transactionId 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error instanceof AuthenticationError ? 401 
                     : error instanceof ValidationError ? 400 
                     : 500;

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: statusCode,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## Step 5: Deploy the Edge Function

Deploy your function to Supabase:

```bash
supabase functions deploy send-email
```

The function is now live! You can call it:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from Supabase!",
    "html": "<h1>Hello!</h1><p>This email was sent from a Supabase Edge Function.</p>"
  }'
```

## Step 6: Sending Welcome Emails with Database Webhooks

One powerful use case is automatically sending welcome emails when users sign up. Let's set this up!

### Create the Welcome Email Function

```bash
supabase functions new welcome-email
```

Update `supabase/functions/welcome-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';

const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL');
const FROM_NAME = Deno.env.get('FROM_NAME');

serve(async (req) => {
  try {
    const { record } = await req.json();
    const userEmail = record.email;
    const userName = record.raw_user_meta_data?.name || 'there';

    const client = new ElasticEmailClient({
      apiKey: ELASTIC_EMAIL_API_KEY!
    });

    await sendEmail(client, {
      from: { email: FROM_EMAIL!, name: FROM_NAME! },
      to: [{ email: userEmail, name: userName }],
      subject: `Welcome to ${FROM_NAME}! 🎉`,
      body: {
        html: `
          <h1>Welcome ${userName}!</h1>
          <p>Thanks for signing up. We're excited to have you on board!</p>
        `
      }
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### Deploy with No JWT Verification

Since this function is called by a webhook (not a user), deploy it without JWT verification:

```bash
supabase functions deploy welcome-email --no-verify-jwt
```

### Set Up the Database Webhook

1. Go to your Supabase Dashboard
2. Navigate to **Database > Webhooks**
3. Click **Create a new hook**
4. Configure the webhook:
   - **Name**: Send Welcome Email
   - **Table**: `auth.users`
   - **Events**: Check **INSERT**
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-project.supabase.co/functions/v1/welcome-email`
5. Click **Confirm**

Now, whenever a new user signs up, they'll automatically receive a welcome email!

## Step 7: Using Email Templates

If you've created templates in Elastic Email, you can use them with the SDK:

```typescript
import { sendTemplate } from 'npm:elastic-email-supabase@1.0.0';

const result = await sendTemplate(client, {
  from: { email: FROM_EMAIL, name: FROM_NAME },
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  templateName: 'welcome-email',
  templateData: {
    userName: 'John',
    confirmationUrl: 'https://yourapp.com/confirm/abc123'
  }
});
```

## Step 8: Tracking Email Status

Check the delivery status of your emails:

```typescript
import { getEmailStatus } from 'npm:elastic-email-supabase@1.0.0';

// Get status of a specific email
const status = await getEmailStatus(client, transactionId);
console.log(status.status); // 'Sent', 'Opened', 'Clicked', etc.

// Get email activity logs
import { getEmailActivity } from 'npm:elastic-email-supabase@1.0.0';

const activities = await getEmailActivity(client, {
  limit: 50,
  status: 'Opened'
});
```

## Testing Locally

You can test your Edge Functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve
```

Your functions are now available at `http://localhost:54321/functions/v1/your-function-name`.

## Common Use Cases

### Password Reset Emails

```typescript
await sendTemplate(client, {
  from: { email: FROM_EMAIL },
  to: [{ email: userEmail }],
  templateName: 'password-reset',
  templateData: {
    resetUrl: `https://yourapp.com/reset/${resetToken}`,
    expiresIn: '1 hour'
  }
});
```

### Order Confirmation

```typescript
await sendEmail(client, {
  from: { email: FROM_EMAIL, name: FROM_NAME },
  to: [{ email: customerEmail }],
  subject: `Order Confirmation #${orderId}`,
  body: {
    html: generateOrderEmailHtml(orderDetails)
  }
});
```

### Email Notifications on Data Changes

Set up webhooks on any table to trigger email notifications when data changes!

## Security Best Practices

> [!CAUTION]
> **Never expose your API key**: Always use Supabase Secrets, never hardcode keys in your functions.

> [!TIP]
> **Use Row Level Security**: Protect your database webhooks by ensuring proper RLS policies are in place.

> [!WARNING]
> **Rate Limiting**: Implement rate limiting on your Edge Functions to prevent abuse and unexpected costs.

## Troubleshooting

### Function deployment fails

Make sure you're logged in:
```bash
supabase login
```

### Emails not sending

1. Check that your API key is valid in Elastic Email dashboard
2. Verify secrets are set: `supabase secrets list`
3. Check function logs: `supabase functions logs send-email`

### Authentication errors

Ensure your Elastic Email API key has the correct permissions in your Elastic Email account settings.

## Resources

- [Elastic Email SDK API Reference](./api-reference.md)
- [More Examples](./examples.md)
- [Best Practices](./best-practices.md)
- [Elastic Email API Documentation](https://elasticemail.com/developers/api-documentation)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
