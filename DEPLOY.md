# 🚀 Deploy to Supabase - Quick Guide

Your Edge Function is ready to deploy! It uses the official **@elasticemail/elasticemail-client** package.

## Prerequisites

✅ Supabase account  
✅ Supabase CLI installed  
✅ Elastic Email API key

## Step 1: Login to Supabase

```bash
supabase login
```

## Step 2: Link Your Project

```bash
cd d:\SDK\examples
supabase link --project-ref YOUR-PROJECT-REF
```

**Find your project ref:** https://app.supabase.com/project/_/settings/general

## Step 3: Set Secrets

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY=your-elastic-email-api-key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com  
supabase secrets set FROM_NAME="Your Company Name"
```

## Step 4: Deploy!

```bash
supabase functions deploy send-email
```

## Step 5: Test It

```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Hello from Elastic Email!",
    "html": "<h1>It works!</h1><p>Your Edge Function is live!</p>"
  }'
```

## ✨ Done!

Your Edge Function URL:
```
https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email
```

## Using in Your App

```javascript
// From your frontend or backend
const response = await fetch(
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'customer@example.com',
      subject: 'Welcome!',
      html: '<h1>Welcome to our app!</h1>'
    })
  }
);

const result = await response.json();
console.log(result.transactionId); // Email sent!
```

## Advanced: Send with Attachments

```javascript
const base64Pdf = btoa(pdfContent); // Convert to base64

await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Your Invoice',
    html: '<p>Invoice attached</p>',
    attachments: [{
      filename: 'invoice.pdf',
      content: base64Pdf,
      contentType: 'application/pdf'
    }]
  })
});
```

---

**That's it!** Your Elastic Email integration is live! 🎉
