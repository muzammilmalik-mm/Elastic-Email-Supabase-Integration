# API Reference

Complete API reference for the Elastic Email Supabase SDK.

## Table of Contents

- [ElasticEmailClient](#elasticemailclient)
- [sendEmail](#sendemail)
- [sendTemplate](#sendtemplate)
- [getEmailStatus](#getemailstatus)
- [getEmailActivity](#getemailactivity)
- [Types](#types)
- [Errors](#errors)

## ElasticEmailClient

The main client class for interacting with the Elastic Email API.

### Constructor

```typescript
new ElasticEmailClient(config: ElasticEmailConfig)
```

**Parameters:**

- `config.apiKey` (string, required) - Your Elastic Email API key
- `config.baseUrl` (string, optional) - Custom API base URL (default: `https://api.elasticemail.com/v4`)

**Example:**

```typescript
const client = new ElasticEmailClient({
  apiKey: process.env.ELASTIC_EMAIL_API_KEY!
});
```

---

## sendEmail

Send a transactional email with custom content.

```typescript
async function sendEmail(
  client: ElasticEmailClient,
  content: EmailContent
): Promise<SendEmailResponse>
```

**Parameters:**

- `client` - ElasticEmailClient instance
- `content` - Email configuration object

**EmailContent Interface:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `from` | `EmailRecipient` | Yes | Sender information |
| `to` | `EmailRecipient[]` | Yes | Array of recipients |
| `cc` | `EmailRecipient[]` | No | Carbon copy recipients |
| `bcc` | `EmailRecipient[]` | No | Blind carbon copy recipients |
| `subject` | `string` | Yes | Email subject line |
| `body` | `EmailBody` | Yes | Email body content |
| `replyTo` | `EmailRecipient` | No | Reply-to address |

**EmailRecipient Interface:**

```typescript
interface EmailRecipient {
  email: string;      // Email address
  name?: string;      // Display name (optional)
}
```

**EmailBody Interface:**

```typescript
interface EmailBody {
  html?: string;      // HTML version of email
  text?: string;      // Plain text version
}
```

> [!NOTE]
> At least one of `html` or `text` must be provided.

**Returns:**

```typescript
interface SendEmailResponse {
  transactionId: string;  // Unique transaction ID
  messageId: string;      // Message ID
}
```

**Example:**

```typescript
const result = await sendEmail(client, {
  from: { 
    email: 'sender@example.com',
    name: 'My App'
  },
  to: [
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com' }
  ],
  cc: [{ email: 'manager@example.com' }],
  subject: 'Welcome to our service!',
  body: {
    html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
    text: 'Welcome! Thanks for signing up.'
  },
  replyTo: { email: 'support@example.com' }
});

console.log('Transaction ID:', result.transactionId);
```

**Throws:**

- `ValidationError` - Missing or invalid required fields
- `AuthenticationError` - Invalid API key
- `RateLimitError` - Rate limit exceeded
- `NetworkError` - Network request failed

---

## sendTemplate

Send an email using an Elastic Email template.

```typescript
async function sendTemplate(
  client: ElasticEmailClient,
  content: TemplateEmailContent
): Promise<SendEmailResponse>
```

**Parameters:**

- `client` - ElasticEmailClient instance
- `content` - Template email configuration

**TemplateEmailContent Interface:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `from` | `EmailRecipient` | Yes | Sender information |
| `to` | `EmailRecipient[]` | Yes | Array of recipients |
| `cc` | `EmailRecipient[]` | No | Carbon copy recipients |
| `bcc` | `EmailRecipient[]` | No | Blind carbon copy recipients |
| `templateName` | `string` | Yes | Name of template in Elastic Email |
| `templateData` | `Record<string, any>` | No | Template merge variables |
| `replyTo` | `EmailRecipient` | No | Reply-to address |

**Returns:**

`SendEmailResponse` (same as sendEmail)

**Example:**

```typescript
const result = await sendTemplate(client, {
  from: { email: 'sender@example.com' },
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  templateName: 'welcome-email',
  templateData: {
    firstName: 'John',
    confirmationUrl: 'https://example.com/confirm/abc123',
    year: new Date().getFullYear()
  }
});
```

**Throws:**

Same as `sendEmail`

---

## getEmailStatus

Get the delivery status of a specific email.

```typescript
async function getEmailStatus(
  client: ElasticEmailClient,
  transactionId: string
): Promise<EmailStatusResponse>
```

**Parameters:**

- `client` - ElasticEmailClient instance
- `transactionId` - Transaction ID from send response

**Returns:**

```typescript
interface EmailStatusResponse {
  status: EmailStatus;          // Current status
  date: string;                 // ISO 8601 date string
  recipient: string;            // Recipient email
  messageId: string;            // Message ID
  transactionId: string;        // Transaction ID
}
```

**EmailStatus Enum:**

```typescript
enum EmailStatus {
  ReadyToSend = 'ReadyToSend',
  InProgress = 'InProgress',
  Sent = 'Sent',
  Opened = 'Opened',
  Clicked = 'Clicked',
  Bounced = 'Bounced',
  Unsubscribed = 'Unsubscribed',
  AbuseReport = 'AbuseReport',
  Failed = 'Failed'
}
```

**Example:**

```typescript
const status = await getEmailStatus(client, 'transaction-id-123');

console.log('Status:', status.status);
console.log('Sent to:', status.recipient);
console.log('Date:', status.date);

if (status.status === EmailStatus.Bounced) {
  console.log('Email bounced!');
}
```

**Throws:**

- `ValidationError` - Missing transaction ID
- `AuthenticationError` - Invalid API key
- `ElasticEmailError` - Email not found or other API error

---

## getEmailActivity

Retrieve email activity logs with optional filtering.

```typescript
async function getEmailActivity(
  client: ElasticEmailClient,
  options?: EmailActivityOptions
): Promise<EmailActivity[]>
```

**Parameters:**

- `client` - ElasticEmailClient instance
- `options` - Optional filtering options

**EmailActivityOptions Interface:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `EmailStatus \| EmailStatus[]` | Filter by status |
| `limit` | `number` | Maximum results to return |
| `offset` | `number` | Pagination offset |
| `from` | `string` | Filter by sender email |
| `to` | `string` | Filter by recipient email |

**Returns:**

```typescript
interface EmailActivity {
  transactionId: string;
  messageId: string;
  to: string;
  from: string;
  subject: string;
  status: EmailStatus;
  date: string;
  channel: string;
}
```

**Example:**

```typescript
// Get all opened emails
const opened = await getEmailActivity(client, {
  status: EmailStatus.Opened,
  limit: 100
});

console.log(`${opened.length} emails opened`);

// Get emails to specific recipient
const userEmails = await getEmailActivity(client, {
  to: 'user@example.com',
  limit: 50
});

// Get emails with multiple statuses
const engaged = await getEmailActivity(client, {
  status: [EmailStatus.Opened, EmailStatus.Clicked],
  limit: 100
});
```

---

## Types

### ElasticEmailConfig

```typescript
interface ElasticEmailConfig {
  apiKey: string;
  baseUrl?: string;
}
```

### EmailRecipient

```typescript
interface EmailRecipient {
  email: string;
  name?: string;
}
```

### EmailContent

```typescript
interface EmailContent {
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: EmailBody;
  replyTo?: EmailRecipient;
}
```

### EmailBody

```typescript
interface EmailBody {
  html?: string;
  text?: string;
}
```

### TemplateEmailContent

```typescript
interface TemplateEmailContent {
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  templateName: string;
  templateData?: Record<string, any>;
  replyTo?: EmailRecipient;
}
```

### SendEmailResponse

```typescript
interface SendEmailResponse {
  transactionId: string;
  messageId: string;
}
```

### EmailStatusResponse

```typescript
interface EmailStatusResponse {
  status: EmailStatus;
  date: string;
  recipient: string;
  messageId: string;
  transactionId: string;
}
```

### EmailActivity

```typescript
interface EmailActivity {
  transactionId: string;
  messageId: string;
  to: string;
  from: string;
  subject: string;
  status: EmailStatus;
  date: string;
  channel: string;
}
```

### EmailActivityOptions

```typescript
interface EmailActivityOptions {
  status?: EmailStatus | EmailStatus[];
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}
```

---

## Errors

The SDK provides specific error classes for better error handling.

### ElasticEmailError

Base error class for all SDK errors.

```typescript
class ElasticEmailError extends Error {
  statusCode?: number;
  details?: any;
}
```

### AuthenticationError

Thrown when API key is invalid or missing.

```typescript
class AuthenticationError extends ElasticEmailError {
  // statusCode: 401
}
```

### ValidationError

Thrown when request parameters are invalid.

```typescript
class ValidationError extends ElasticEmailError {
  // statusCode: 400
  details?: any;
}
```

### RateLimitError

Thrown when rate limit is exceeded.

```typescript
class RateLimitError extends ElasticEmailError {
  // statusCode: 429
  retryAfter?: number;  // Seconds to wait before retry
}
```

### NetworkError

Thrown when network request fails.

```typescript
class NetworkError extends ElasticEmailError {
  // No statusCode
}
```

### Error Handling Example

```typescript
import {
  sendEmail,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError
} from 'elastic-email-supabase';

try {
  await sendEmail(client, emailContent);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid email data:', error.details);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit hit, retry after:', error.retryAfter, 'seconds');
    // Implement retry logic
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Retry or handle connectivity issues
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Additional Notes

### TypeScript Support

The SDK is written in TypeScript and provides full type definitions. Your IDE will provide autocomplete and type checking for all functions and interfaces.

### Deno Compatibility

All functions work in Deno/Edge Functions. Import from npm:

```typescript
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';
```

### Error Handling Best Practices

Always wrap SDK calls in try-catch blocks, especially in Edge Functions where proper error responses are critical for debugging.

```typescript
serve(async (req) => {
  try {
    // Your email logic
    const result = await sendEmail(client, content);
    return new Response(JSON.stringify({ success: true, ...result }));
  } catch (error) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.statusCode || 500 }
    );
  }
});
```
