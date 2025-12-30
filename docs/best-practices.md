# Best Practices

Guidelines for using Elastic Email with Supabase securely, efficiently, and reliably.

## Table of Contents

- [Security](#security)
- [Performance](#performance)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Email Deliverability](#email-deliverability)
- [Testing](#testing)
- [Monitoring](#monitoring)

---

## Security

### Store API Keys Securely

> [!CAUTION]
> **Never hardcode API keys** in your code or commit them to version control.

**✅ Do this:**

```typescript
const client = new ElasticEmailClient({
  apiKey: Deno.env.get('ELASTIC_EMAIL_API_KEY')!
});
```

**❌ Don't do this:**

```typescript
const client = new ElasticEmailClient({
  apiKey: 'your-actual-api-key-here'  // NEVER do this!
});
```

### Use Supabase Secrets

Store all sensitive configuration in Supabase Secrets:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-key
supabase secrets set FROM_EMAIL=noreply@yourapp.com
supabase secrets set FROM_NAME="Your App"
```

### Validate User Input

Always validate and sanitize user-provided data before using it in emails:

```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// In your Edge Function
const { to, subject, message } = await req.json();

if (!validateEmail(to)) {
  return new Response(
    JSON.stringify({ error: 'Invalid email address' }),
    { status: 400 }
  );
}

// Sanitize subject to prevent injection
const sanitizedSubject = subject.replace(/[<>]/g, '');
```

### Implement Authentication

Protect your Edge Functions with proper authentication:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Verify JWT token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // User is authenticated, proceed with email sending
  // ...
});
```

### Use HTTPS Only

Ensure all webhook URLs and API endpoints use HTTPS to protect data in transit.

---

## Performance

### Batch Operations Wisely

When sending multiple emails, batch them appropriately:

```typescript
async function sendBulkEmails(recipients: string[], message: string) {
  const BATCH_SIZE = 50;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second
  
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    
    // Send batch in parallel
    await Promise.allSettled(
      batch.map(email => sendEmail(client, {
        from: { email: FROM_EMAIL },
        to: [{ email }],
        subject: 'Newsletter',
        body: { html: message }
      }))
    );
    
    // Wait between batches to avoid rate limits
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
}
```

### Use Edge Functions Efficiently

Edge Functions have execution time limits. For large operations, consider:

```typescript
// ✅ Trigger async processing
serve(async (req) => {
  const { recipients } = await req.json();
  
  // Queue the bulk send operation
  await supabase
    .from('email_queue')
    .insert({ recipients, status: 'pending' });
  
  // Return immediately
  return new Response(
    JSON.stringify({ queued: recipients.length }),
    { status: 202 } // Accepted
  );
});

// Process queue in a separate scheduled function or worker
```

### Cache Template Data

If using templates, cache frequently accessed data:

```typescript
// Cache template data for 5 minutes
const templateCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000;

async function getTemplateData(userId: string) {
  const cached = templateCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchUserData(userId);
  templateCache.set(userId, { data, timestamp: Date.now() });
  return data;
}
```

---

## Error Handling

### Implement Comprehensive Error Handling

Always catch and handle errors appropriately:

```typescript
import {
  ElasticEmailError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError
} from 'elastic-email-supabase';

serve(async (req) => {
  try {
    const result = await sendEmail(client, emailContent);
    
    return new Response(
      JSON.stringify({ success: true, transactionId: result.transactionId }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Email sending failed:', error);
    
    if (error instanceof AuthenticationError) {
      // Log for admin, don't expose to user
      console.error('API key invalid or expired');
      return new Response(
        JSON.stringify({ error: 'Email service unavailable' }),
        { status: 503 }
      );
    }
    
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400 }
      );
    }
    
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: error.retryAfter 
        }),
        { status: 429 }
      );
    }
    
    if (error instanceof NetworkError) {
      // Retry logic could go here
      return new Response(
        JSON.stringify({ error: 'Network error, please try again' }),
        { status: 503 }
      );
    }
    
    // Generic error
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
});
```

### Log Errors Properly

```typescript
function logError(error: Error, context: Record<string, any>) {
  console.error({
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Optionally send to error tracking service
  // await sendToSentry(error, context);
}
```

### Implement Retry Logic

For transient failures, implement exponential backoff:

```typescript
async function sendEmailWithRetry(
  client: ElasticEmailClient,
  content: EmailContent,
  maxRetries = 3
) {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendEmail(client, content);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation or authentication errors
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

---

## Rate Limiting

### Respect API Rate Limits

Elastic Email has rate limits. Implement your own rate limiting:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

// Usage
const limiter = new RateLimiter(100, 60000); // 100 requests per minute

serve(async (req) => {
  if (!await limiter.checkLimit()) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429 }
    );
  }
  
  // Proceed with email sending
});
```

### Implement Queuing

For high-volume operations, use a queue:

```typescript
// Add to database queue
async function queueEmail(emailData: any) {
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      recipient: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  
  return data;
}

// Process queue (separate function, could be scheduled)
async function processEmailQueue() {
  const { data: emails } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10);
  
  for (const email of emails || []) {
    try {
      await sendEmail(client, email);
      
      await supabase
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('id', email.id);
        
    } catch (error) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error: error.message })
        .eq('id', email.id);
    }
  }
}
```

---

## Email Deliverability

### Use Verified Domains

Always send from verified domains in Elastic Email to improve deliverability.

### Implement Proper Email Headers

```typescript
const result = await sendEmail(client, {
  from: { 
    email: 'noreply@yourapp.com',
    name: 'Your App'  // Always include sender name
  },
  to: [{ email: recipient.email, name: recipient.name }],
  subject: 'Clear, descriptive subject',
  body: {
    html: htmlContent,
    text: textContent  // Always provide text fallback
  },
  replyTo: { email: 'support@yourapp.com' }  // Set reply-to
});
```

### Avoid Spam Triggers

> [!WARNING]
> **Avoid these common spam triggers:**

- Excessive exclamation marks!!!
- ALL CAPS SUBJECT LINES
- Words like "FREE", "ACT NOW", "CLICK HERE"
- Too many links
- Images without alt text
- No unsubscribe link in marketing emails

### Include Unsubscribe Links

For marketing emails, always include an unsubscribe link:

```typescript
const htmlContent = `
  <div>
    ${emailBody}
    
    <hr style="margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      You're receiving this because you signed up for our newsletter.
      <a href="https://yourapp.com/unsubscribe/${recipientId}">Unsubscribe</a>
    </p>
  </div>
`;
```

### Monitor Bounce Rates

Track bounced emails and remove invalid addresses:

```typescript
async function checkAndRemoveBounces() {
  const bounced = await getEmailActivity(client, {
    status: EmailStatus.Bounced,
    limit: 1000
  });
  
  for (const email of bounced) {
    // Remove from your mailing list
    await supabase
      .from('users')
      .update({ email_bounced: true, marketing_emails: false })
      .eq('email', email.to);
  }
}
```

---

## Testing

### Test Locally First

Always test Edge Functions locally before deploying:

```bash
supabase start
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "html": "<p>Test</p>"}'
```

### Use Test Email Addresses

During development, use test addresses:

```typescript
const TO_EMAIL = Deno.env.get('ENVIRONMENT') === 'production'
  ? userEmail
  : 'test@example.com';
```

### Mock in Unit Tests

```typescript
// Mock the SDK for unit tests
jest.mock('elastic-email-supabase', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    transactionId: 'test-transaction-id',
    messageId: 'test-message-id'
  })
}));
```

### Test Error Scenarios

Test how your function handles errors:

```typescript
// Test invalid email
// Test missing API key
// Test rate limiting
// Test network failures
```

---

## Monitoring

### Log Important Events

```typescript
// Log successful sends
console.log('Email sent', {
  transactionId: result.transactionId,
  recipient: to,
  subject: subject,
  timestamp: new Date().toISOString()
});

// Log errors
console.error('Email failed', {
  error: error.message,
  recipient: to,
  timestamp: new Date().toISOString()
});
```

### Track Email Metrics

Store email metrics for monitoring:

```typescript
async function trackEmailSent(emailData: any, result: SendEmailResponse) {
  await supabase.from('email_metrics').insert({
    transaction_id: result.transactionId,
    recipient: emailData.to[0].email,
    subject: emailData.subject,
    status: 'sent',
    sent_at: new Date().toISOString()
  });
}
```

### Monitor Function Logs

Regularly check your function logs:

```bash
supabase functions logs send-email --tail
```

### Set Up Alerts

Monitor for:
- High error rates
- Unusual spike in emails
- Authentication failures
- Rate limit hits

### Track Deliverability

Periodically check email deliverability:

```typescript
async function getDeliverabilityStats() {
  const activity = await getEmailActivity(client, {
    limit: 1000
  });
  
  const stats = {
    total: activity.length,
    sent: activity.filter(a => a.status === EmailStatus.Sent).length,
    bounced: activity.filter(a => a.status === EmailStatus.Bounced).length,
    opened: activity.filter(a => a.status === EmailStatus.Opened).length
  };
  
  return {
    ...stats,
    bounceRate: (stats.bounced / stats.total * 100).toFixed(2) + '%',
    openRate: (stats.opened / stats.sent * 100).toFixed(2) + '%'
  };
}
```

---

## Summary Checklist

**Security:**
- [ ] API keys stored in Supabase Secrets
- [ ] User input validated and sanitized
- [ ] Edge Functions protected with authentication
- [ ] HTTPS used for all endpoints

**Performance:**
- [ ] Batch operations implemented
- [ ] Appropriate caching strategy
- [ ] Queue for high-volume operations

**Error Handling:**
- [ ] Comprehensive try-catch blocks
- [ ] Specific error types handled
- [ ] Retry logic for transient failures
- [ ] Errors logged with context

**Deliverability:**
- [ ] Verified sender domains
- [ ] Text and HTML versions provided
- [ ] Unsubscribe links in marketing emails
- [ ] Bounce tracking implemented

**Testing:**
- [ ] Tested locally before deployment
- [ ] Error scenarios tested
- [ ] Test email addresses used in development

**Monitoring:**
- [ ] Important events logged
- [ ] Metrics tracked in database
- [ ] Function logs monitored
- [ ] Alerts set up for anomalies

---

For more information:
- [Integration Guide](./integration-guide.md)
- [API Reference](./api-reference.md)
- [Examples](./examples.md)
