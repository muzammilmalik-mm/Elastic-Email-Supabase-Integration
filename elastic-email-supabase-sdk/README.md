# Elastic Email SDK for Supabase

A lightweight TypeScript SDK for integrating Elastic Email with Supabase Edge Functions.

## Features

- 🚀 **Optimized for Edge Functions** - Works seamlessly with Deno and Supabase Edge Runtime
- 📧 **Send Transactional Emails** - Simple API for sending emails
- 📝 **Template Support** - Use your Elastic Email templates
- 📊 **Status Tracking** - Check email delivery status and activity logs
- 🛡️ **Error Handling** - Comprehensive error types for robust applications
- 📘 **TypeScript** - Full type safety and IntelliSense support

## Quick Start

### Installation

```bash
npm install elastic-email-supabase
```

For Deno/Edge Functions, import directly from npm:

```typescript
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase';
```

### Basic Usage

```typescript
import { ElasticEmailClient, sendEmail } from 'elastic-email-supabase';

// Create a client
const client = new ElasticEmailClient({
  apiKey: process.env.ELASTIC_EMAIL_API_KEY!
});

// Send an email
const result = await sendEmail(client, {
  from: { 
    email: 'sender@example.com',
    name: 'Your App'
  },
  to: [{ 
    email: 'recipient@example.com',
    name: 'John Doe'
  }],
  subject: 'Welcome to our service!',
  body: {
    html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
    text: 'Welcome! Thanks for signing up.'
  }
});

console.log('Email sent:', result.transactionId);
```

## Core Functions

### Send Email

```typescript
import { sendEmail } from 'elastic-email-supabase';

const result = await sendEmail(client, {
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Hello World',
  body: { html: '<p>Hello!</p>' }
});
```

### Send Template

```typescript
import { sendTemplate } from 'elastic-email-supabase';

const result = await sendTemplate(client, {
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  templateName: 'welcome-email',
  templateData: {
    userName: 'John',
    confirmUrl: 'https://example.com/confirm'
  }
});
```

### Check Email Status

```typescript
import { getEmailStatus } from 'elastic-email-supabase';

const status = await getEmailStatus(client, transactionId);
console.log('Email status:', status.status); // 'Sent', 'Opened', etc.
```

### Get Email Activity

```typescript
import { getEmailActivity } from 'elastic-email-supabase';

const activities = await getEmailActivity(client, {
  limit: 100,
  status: 'Opened'
});
```

## Usage with Supabase Edge Functions

Store your API key in Supabase Secrets:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-api-key-here
```

Example Edge Function:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  ElasticEmailClient, 
  sendEmail 
} from 'npm:elastic-email-supabase';

serve(async (req) => {
  try {
    const { to, subject, message } = await req.json();
    
    const client = new ElasticEmailClient({
      apiKey: Deno.env.get('ELASTIC_EMAIL_API_KEY')!
    });
    
    const result = await sendEmail(client, {
      from: { email: 'noreply@yourapp.com' },
      to: [{ email: to }],
      subject,
      body: { html: message }
    });
    
    return new Response(
      JSON.stringify({ success: true, transactionId: result.transactionId }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import { 
  AuthenticationError, 
  ValidationError, 
  RateLimitError 
} from 'elastic-email-supabase';

try {
  await sendEmail(client, emailContent);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid email data:', error.details);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  }
}
```

## Documentation

For complete documentation, examples, and integration guides, see the [docs](./docs/) directory:

- [Integration Guide](./docs/integration-guide.md) - Step-by-step integration tutorial
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Examples](./docs/examples.md) - Common use cases and patterns
- [Best Practices](./docs/best-practices.md) - Security and optimization tips

## Examples

Check out the [examples](./examples/) directory for:

- Sending transactional emails
- Using email templates
- Checking email status
- Database webhook integration for welcome emails

## License

MIT

## Resources

- [Elastic Email API Documentation](https://elasticemail.com/developers/api-documentation)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
