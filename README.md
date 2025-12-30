# Elastic Email Supabase Integration

Complete SDK and documentation for integrating Elastic Email with Supabase Edge Functions.

## 📦 What's Included

This repository contains:

- **TypeScript SDK** (`/elastic-email-supabase-sdk`) - Lightweight SDK optimized for Supabase Edge Functions
- **Example Edge Functions** (`/examples`) - Ready-to-deploy examples for common use cases
- **Comprehensive Documentation** (`/docs`) - Step-by-step guides, API reference, and best practices

## 🚀 Quick Start

### 1. Install the SDK

For Supabase Edge Functions (Deno):
```typescript
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';
```

For Node.js projects:
```bash
npm install elastic-email-supabase
```

### 2. Set Up Your API Key

Store your Elastic Email API key in Supabase Secrets:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-api-key-here
supabase secrets set FROM_EMAIL=noreply@yourapp.com
supabase secrets set FROM_NAME="Your App"
```

### 3. Send Your First Email

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';

serve(async (req) => {
  const client = new ElasticEmailClient({
    apiKey: Deno.env.get('ELASTIC_EMAIL_API_KEY')!
  });

  const result = await sendEmail(client, {
    from: { email: 'hello@yourapp.com', name: 'Your App' },
    to: [{ email: 'user@example.com' }],
    subject: 'Welcome!',
    body: {
      html: '<h1>Welcome to our app!</h1>'
    }
  });

  return new Response(JSON.stringify({ success: true, ...result }));
});
```

## 📚 Documentation

- **[Integration Guide](./docs/integration-guide.md)** - Complete step-by-step tutorial
- **[API Reference](./docs/api-reference.md)** - Full API documentation
- **[Examples](./docs/examples.md)** - Common use cases and patterns
- **[Best Practices](./docs/best-practices.md)** - Security, performance, and deliverability tips

## 💡 Features

- ✅ **Send Transactional Emails** - Simple API for sending emails
- ✅ **Template Support** - Use your Elastic Email templates
- ✅ **Status Tracking** - Monitor delivery status and engagement
- ✅ **Error Handling** - Comprehensive error types for robust applications
- ✅ **TypeScript** - Full type safety and IntelliSense
- ✅ **Edge Functions Ready** - Optimized for Supabase Edge Runtime
- ✅ **Database Webhooks** - Automated email triggers

## 📋 Examples

### Send Welcome Email

```typescript
await sendEmail(client, {
  from: { email: 'welcome@yourapp.com', name: 'Your App' },
  to: [{ email: userEmail, name: userName }],
  subject: 'Welcome to Your App! 🎉',
  body: {
    html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>'
  }
});
```

### Use Email Template

```typescript
await sendTemplate(client, {
  from: { email: 'hello@yourapp.com' },
  to: [{ email: 'user@example.com' }],
  templateName: 'welcome-email',
  templateData: {
    userName: 'John',
    confirmUrl: 'https://yourapp.com/confirm/abc123'
  }
});
```

### Check Email Status

```typescript
const status = await getEmailStatus(client, transactionId);
console.log('Email status:', status.status); // 'Sent', 'Opened', etc.
```

See [more examples](./docs/examples.md) →

## 🔧 Example Edge Functions

The `/examples` directory contains ready-to-deploy Edge Functions:

- **send-email** - Send transactional emails
- **send-template** - Send emails using templates
- **check-status** - Check email delivery status
- **welcome-email** - Automatically send welcome emails on user signup

Deploy an example:

```bash
cd examples
supabase functions deploy send-email
```

## 🏗️ Project Structure

```
.
├── elastic-email-supabase-sdk/    # SDK package
│   ├── src/
│   │   ├── index.ts              # Main entry point
│   │   ├── client.ts             # HTTP client
│   │   ├── email.ts              # Email functions
│   │   ├── status.ts             # Status tracking
│   │   ├── types.ts              # TypeScript types
│   │   └── errors.ts             # Error classes
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── examples/                      # Example Edge Functions
│   ├── supabase/functions/
│   │   ├── send-email/
│   │   ├── send-template/
│   │   ├── check-status/
│   │   └── welcome-email/
│   ├── deno.json
│   └── README.md
│
├── docs/                          # Documentation
│   ├── integration-guide.md      # Step-by-step tutorial
│   ├── api-reference.md          # API documentation
│   ├── examples.md               # Use case examples
│   └── best-practices.md         # Best practices guide
│
├── LICENSE
├── .gitignore
└── README.md
```

## 🛡️ Security Best Practices

> **Never commit API keys to version control**

Always use Supabase Secrets:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-key
```

See [Security Best Practices](./docs/best-practices.md#security) for more →

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Resources

- [Elastic Email API Documentation](https://elasticemail.com/developers/api-documentation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)

## 💬 Support

- 📖 [Read the Documentation](./docs/integration-guide.md)
- 💡 [Browse Examples](./docs/examples.md)
- 🐛 [Report Issues](https://github.com/yourusername/elastic-email-supabase-sdk/issues)

---

**Built with ❤️ for the Supabase community**
