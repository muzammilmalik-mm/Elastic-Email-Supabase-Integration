# Examples

Common use cases and code patterns for the Elastic Email Supabase SDK.

## Table of Contents

- [Basic Email Sending](#basic-email-sending)
- [Welcome Emails](#welcome-emails)
- [Password Reset](#password-reset)
- [Order Confirmations](#order-confirmations)
- [Newsletters](#newsletters)
- [Email Templates](#email-templates)
- [Batch Sending](#batch-sending)
- [Status Tracking](#status-tracking)
- [Database Webhooks](#database-webhooks)

---

## Basic Email Sending

### Simple HTML Email

```typescript
import { ElasticEmailClient, sendEmail } from 'elastic-email-supabase';

const client = new ElasticEmailClient({
  apiKey: process.env.ELASTIC_EMAIL_API_KEY!
});

const result = await sendEmail(client, {
  from: {
    email: 'hello@yourapp.com',
    name: 'Your App'
  },
  to: [{
    email: 'user@example.com',
    name: 'John Doe'
  }],
  subject: 'Hello from Your App',
  body: {
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1>Hello John!</h1>
        <p>This is a test email.</p>
      </div>
    `,
    text: 'Hello John! This is a test email.'
  }
});

console.log('Email sent:', result.transactionId);
```

### Plain Text Email

```typescript
const result = await sendEmail(client, {
  from: { email: 'notifications@yourapp.com' },
  to: [{ email: 'user@example.com' }],
  subject: 'Simple Notification',
  body: {
    text: 'Your report is ready for download.'
  }
});
```

### Email with CC and BCC

```typescript
const result = await sendEmail(client, {
  from: { email: 'team@yourapp.com', name: 'Team' },
  to: [{ email: 'client@example.com', name: 'Client' }],
  cc: [{ email: 'manager@yourapp.com', name: 'Manager' }],
  bcc: [{ email: 'archive@yourapp.com' }],
  subject: 'Project Update',
  body: {
    html: '<p>Here is your weekly project update...</p>'
  }
});
```

---

## Welcome Emails

### Basic Welcome Email

```typescript
async function sendWelcomeEmail(userEmail: string, userName: string) {
  const result = await sendEmail(client, {
    from: { email: 'welcome@yourapp.com', name: 'Your App' },
    to: [{ email: userEmail, name: userName }],
    subject: 'Welcome to Your App! 🎉',
    body: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; 
                     background: #667eea; color: white; text-decoration: none; 
                     border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Your App!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>We're thrilled to have you join our community!</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile</li>
                <li>Explore our features</li>
                <li>Connect with other users</li>
              </ul>
              <a href="https://yourapp.com/getting-started" class="button">
                Get Started
              </a>
              <p>If you have any questions, we're here to help!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Your App!

Hi ${userName}!

We're thrilled to have you join our community!

Get started: https://yourapp.com/getting-started
      `
    }
  });
  
  return result;
}
```

### Welcome Email with Verification

```typescript
async function sendVerificationEmail(
  userEmail: string,
  userName: string,
  verificationToken: string
) {
  const verificationUrl = `https://yourapp.com/verify/${verificationToken}`;
  
  return await sendEmail(client, {
    from: { email: 'noreply@yourapp.com', name: 'Your App' },
    to: [{ email: userEmail, name: userName }],
    subject: 'Please verify your email address',
    body: {
      html: `
        <h2>Welcome ${userName}!</h2>
        <p>Please verify your email address to complete your registration:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 10px 20px; 
                  background: #4CAF50; color: white; text-decoration: none;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p><small>This link expires in 24 hours.</small></p>
      `,
      text: `
Welcome ${userName}!

Please verify your email address: ${verificationUrl}

This link expires in 24 hours.
      `
    }
  });
}
```

---

## Password Reset

```typescript
async function sendPasswordResetEmail(
  userEmail: string,
  resetToken: string
) {
  const resetUrl = `https://yourapp.com/reset-password/${resetToken}`;
  
  const result = await sendEmail(client, {
    from: { email: 'security@yourapp.com', name: 'Your App Security' },
    to: [{ email: userEmail }],
    subject: 'Password Reset Request',
    body: {
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; 
                  background: #f44336; color: white; text-decoration: none; 
                  border-radius: 4px; margin: 15px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          For security reasons, never share this link with anyone.
        </p>
      `,
      text: `
Password Reset Request

We received a request to reset your password.

Reset your password here: ${resetUrl}

If you didn't request this, you can safely ignore this email.

This link expires in 1 hour.
      `
    }
  });
  
  return result;
}
```

---

## Order Confirmations

```typescript
interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerName: string;
  customerEmail: string;
}

async function sendOrderConfirmation(order: Order) {
  const itemsHtml = order.items
    .map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>$${item.price.toFixed(2)}</td>
      </tr>
    `)
    .join('');
  
  return await sendEmail(client, {
    from: { email: 'orders@yourstore.com', name: 'Your Store' },
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Order Confirmation #${order.id}`,
    body: {
      html: `
        <h1>Thank you for your order!</h1>
        <p>Hi ${order.customerName},</p>
        <p>Your order #${order.id} has been confirmed.</p>
        
        <h2>Order Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; border-top: 2px solid #333;">
              <td colspan="2" style="padding: 10px;">Total:</td>
              <td style="padding: 10px;">$${order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>We'll send you another email when your order ships.</p>
        <a href="https://yourstore.com/orders/${order.id}">View Order</a>
      `
    }
  });
}
```

---

## Newsletters

```typescript
async function sendNewsletter(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  content: string
) {
  // Send to each recipient individually for better tracking
  const promises = recipients.map(recipient =>
    sendEmail(client, {
      from: { email: 'newsletter@yourapp.com', name: 'Your App Newsletter' },
      to: [recipient],
      subject,
      body: {
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
              <h1>Your App Newsletter</h1>
            </div>
            <div style="padding: 30px;">
              ${content}
            </div>
            <div style="background: #e9ecef; padding: 20px; text-align: center; font-size: 12px;">
              <a href="https://yourapp.com/unsubscribe/${recipient.email}">Unsubscribe</a>
            </div>
          </div>
        `
      }
    })
  );
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, total: recipients.length };
}
```

---

## Email Templates

### Using Elastic Email Templates

```typescript
import { sendTemplate } from 'elastic-email-supabase';

// Send welcome email using template
const result = await sendTemplate(client, {
  from: { email: 'hello@yourapp.com', name: 'Your App' },
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  templateName: 'welcome-template',
  templateData: {
    firstName: 'John',
    activationUrl: 'https://yourapp.com/activate/abc123',
    supportEmail: 'support@yourapp.com',
    currentYear: new Date().getFullYear()
  }
});
```

### Dynamic Template Data

```typescript
async function sendInvoice(invoice: any) {
  return await sendTemplate(client, {
    from: { email: 'billing@yourapp.com' },
    to: [{ email: invoice.customerEmail }],
    templateName: 'invoice-template',
    templateData: {
      invoiceNumber: invoice.id,
      customerName: invoice.customerName,
      date: invoice.date,
      dueDate: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      paymentUrl: `https://yourapp.com/pay/${invoice.id}`
    }
  });
}
```

---

## Batch Sending

### Send to Multiple Recipients

```typescript
async function sendBulkNotification(
  recipients: string[],
  subject: string,
  message: string
) {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  for (const batch of batches) {
    const promises = batch.map(email => 
      sendEmail(client, {
        from: { email: 'notifications@yourapp.com' },
        to: [{ email }],
        subject,
        body: { html: message }
      })
    );
    
    await Promise.allSettled(promises);
    
    // Add delay between batches to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

## Status Tracking

### Check Email Status

```typescript
import { getEmailStatus, EmailStatus } from 'elastic-email-supabase';

// After sending
const sendResult = await sendEmail(client, emailContent);

// Wait and check status
setTimeout(async () => {
  const status = await getEmailStatus(client, sendResult.transactionId);
  
  if (status.status === EmailStatus.Bounced) {
    console.log('Email bounced, update user record');
  } else if (status.status === EmailStatus.Opened) {
    console.log('User opened the email!');
  }
}, 60000); // Check after 1 minute
```

### Track Campaign Performance

```typescript
import { getEmailActivity } from 'elastic-email-supabase';

async function getCampaignStats(campaignEmails: string[]) {
  const activity = await getEmailActivity(client, {
    from: 'campaign@yourapp.com',
    limit: 1000
  });
  
  const stats = {
    sent: activity.filter(a => a.status === EmailStatus.Sent).length,
    opened: activity.filter(a => a.status === EmailStatus.Opened).length,
    clicked: activity.filter(a => a.status === EmailStatus.Clicked).length,
    bounced: activity.filter(a => a.status === EmailStatus.Bounced).length
  };
  
  return {
    ...stats,
    openRate: (stats.opened / stats.sent * 100).toFixed(2) + '%',
    clickRate: (stats.clicked / stats.sent * 100).toFixed(2) + '%'
  };
}
```

---

## Database Webhooks

### Send Email on New Order

```typescript
// Edge Function: supabase/functions/order-notification/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { ElasticEmailClient, sendEmail } from 'npm:elastic-email-supabase@1.0.0';

serve(async (req) => {
  const { record } = await req.json(); // Webhook payload
  
  const client = new ElasticEmailClient({
    apiKey: Deno.env.get('ELASTIC_EMAIL_API_KEY')!
  });
  
  await sendEmail(client, {
    from: { email: 'orders@yourapp.com' },
    to: [{ email: record.customer_email }],
    subject: `Order #${record.id} Confirmed`,
    body: {
      html: `<p>Your order for $${record.total} has been confirmed!</p>`
    }
  });
  
  return new Response(JSON.stringify({ success: true }));
});
```

### Send Notification on User Update

```typescript
// Webhook on auth.users UPDATE
serve(async (req) => {
  const { record, old_record } = await req.json();
  
  // Check if email was verified
  if (!old_record.email_confirmed_at && record.email_confirmed_at) {
    const client = new ElasticEmailClient({
      apiKey: Deno.env.get('ELASTIC_EMAIL_API_KEY')!
    });
    
    await sendEmail(client, {
      from: { email: 'hello@yourapp.com' },
      to: [{ email: record.email }],
      subject: 'Email Verified Successfully!',
      body: {
        html: '<h1>Thank you for verifying your email!</h1>'
      }
    });
  }
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

For more information, see:
- [Integration Guide](./integration-guide.md)
- [API Reference](./api-reference.md)
- [Best Practices](./best-practices.md)
