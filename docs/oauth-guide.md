# OAuth Integration Guide for Elastic Email SMTP Credentials

Complete guide for integrating OAuth 2.0 authentication to manage Elastic Email SMTP credentials in your Supabase application.

## Overview

This OAuth system allows services to:
1. Authorize via Supabase OAuth (using the provided OAuth app)
2. Securely store Elastic Email API keys
3. Generate and retrieve SMTP credentials as default sender settings
4. Use credentials to send emails via Elastic Email

## Prerequisites

- Active Supabase project
- Elastic Email account with API key
- Supabase CLI installed
- Basic understanding of OAuth 2.0 flow

## Setup Instructions

### 1. Database Configuration

Deploy the database migration to create required tables:

```bash
# Push migration to Supabase
supabase db push

# Or apply manually
supabase db reset
```

This creates:
- `oauth_sessions` - OAuth access/refresh tokens
- `smtp_settings` - Encrypted SMTP credentials
- `default_sender_config` - Default sender settings per user
- `authorization_codes` - Temporary authorization codes

### 2. Configure Environment Variables

Set the required secrets in Supabase:

```bash
# OAuth Configuration
supabase secrets set OAUTH_CLIENT_ID=5a214a56-3a13-46d5-a871-a0d62758f1b2
supabase secrets set OAUTH_CLIENT_SECRET=pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM
supabase secrets set JWT_SECRET=your-very-secure-random-secret-change-this

# Optional: Set default SMTP config
supabase secrets set SMTP_SERVER=smtp.elasticemail.com
supabase secrets set SMTP_PORT=587
```

> **Security Note**: The `JWT_SECRET` should be a long, random string. Generate one using:
> ```bash
> openssl rand -base64 32
> ```

### 3. Deploy Edge Functions

Deploy all OAuth-related Edge Functions:

```bash
cd examples

# Deploy all functions at once
supabase functions deploy oauth-authorize
supabase functions deploy oauth-token
supabase functions deploy smtp-credentials-store
supabase functions deploy smtp-credentials-get
```

Verify deployment:

```bash
supabase functions list
```

## OAuth Flow

### Step 1: Initiate Authorization

Generate PKCE values (code verifier and code challenge):

```typescript
import { crypto } from "https://deno.land/std/crypto/mod.ts";

// Generate code verifier (random string)
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
```

Build authorization URL:

```typescript
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
const state = crypto.randomUUID();

const authUrl = new URL('https://your-project.supabase.co/functions/v1/oauth-authorize');
authUrl.searchParams.set('client_id', '5a214a56-3a13-46d5-a871-a0d62758f1b2');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('scope', 'smtp:write');

// Redirect user to authUrl
window.location.href = authUrl.toString();
```

### Step 2: Handle Callback

After user authorizes, they'll be redirected to your `redirect_uri` with a code:

```
https://yourapp.com/callback?code=AUTH_CODE_HERE&state=STATE_VALUE
```

Extract the authorization code from URL parameters.

### Step 3: Exchange Code for Tokens

Exchange the authorization code for access and refresh tokens:

```typescript
const tokenResponse = await fetch('https://your-project.supabase.co/functions/v1/oauth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: 'https://yourapp.com/callback',
        client_id: '5a214a56-3a13-46d5-a871-a0d62758f1b2',
        client_secret: 'pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM',
        code_verifier: codeVerifier, // From Step 1
    }),
});

const tokens = await tokenResponse.json();
// tokens.access_token - Use for API calls
// tokens.refresh_token - Use to get new access token when expired
// tokens.expires_in - Seconds until access token expires
```

### Step 4: Store SMTP Credentials

Use the access token to store Elastic Email credentials:

```typescript
const storeResponse = await fetch('https://your-project.supabase.co/functions/v1/smtp-credentials-store', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify({
        elastic_email_api_key: 'YOUR_ELASTIC_EMAIL_API_KEY',
        set_as_default: true,
        sender_name: 'My Application',
    }),
});

const result = await storeResponse.json();
console.log('Stored credentials:', result.default_sender);
```

### Step 5: Retrieve SMTP Credentials

Retrieve stored credentials when needed:

```typescript
const getResponse = await fetch('https://your-project.supabase.co/functions/v1/smtp-credentials-get', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
    },
});

const credentials = await getResponse.json();
// credentials.smtp_credentials contains all SMTP settings
```

### Step 6: Refresh Access Token

When access token expires, use refresh token to get a new one:

```typescript
const refreshResponse = await fetch('https://your-project.supabase.co/functions/v1/oauth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: '5a214a56-3a13-46d5-a871-a0d62758f1b2',
        client_secret: 'pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM',
    }),
});

const newTokens = await refreshResponse.json();
// newTokens.access_token - New access token
```

## Security Best Practices

### 1. PKCE is Mandatory in Production
Always use PKCE (Proof Key for Code Exchange) to prevent authorization code interception attacks.

### 2. Validate State Parameter
Always validate the `state` parameter in the callback matches what you sent to prevent CSRF attacks.

### 3. Use HTTPS
Never use HTTP for OAuth flows. Always use HTTPS in production.

### 4. Secure Token Storage
- Store access tokens securely (encrypted storage, HTTP-only cookies)
- Never expose tokens in URLs or client-side JavaScript
- Implement token rotation

### 5. Environment Variables
Never hardcode secrets. Always use environment variables or Supabase Secrets.

### 6. SMTP Password Management
The SMTP password must be generated separately in Elastic Email dashboard:
1. Log in to Elastic Email
2. Go to Settings → SMTP/API
3. Generate SMTP credentials
4. Store the password securely (it won't be shown again)

## Troubleshooting

### Invalid Client Credentials
**Error**: `invalid_client`

**Solution**: Verify `client_id` and `client_secret` match the values in Supabase Secrets.

### Authorization Code Expired
**Error**: `invalid_grant - Authorization code has expired`

**Solution**: Authorization codes expire in 10 minutes. Exchange them immediately after receiving.

### Invalid Code Verifier
**Error**: `invalid_grant - Invalid code_verifier`

**Solution**: Ensure you're using the same `code_verifier` that was used to generate `code_challenge`.

### Missing SMTP Password
**Issue**: SMTP password is empty when retrieving credentials

**Solution**: Generate SMTP password in Elastic Email dashboard and update it manually in the database or create a new endpoint to accept it.

## Example Integration

See [oauth-client-example.ts](file:///d:/SDK/examples/oauth-client-example.ts) for a complete working example.

## API Reference

### POST /oauth-authorize
Initiates OAuth authorization flow.

**Query Parameters**:
- `client_id` - OAuth client ID
- `redirect_uri` - Where to redirect after authorization
- `response_type` - Must be `code`
- `state` - Random string for CSRF protection
- `code_challenge` - PKCE code challenge
- `code_challenge_method` - Should be `S256`
- `scope` - Requested permissions (e.g., `smtp:write`)

### POST /oauth-token
Exchanges authorization code for tokens or refreshes access token.

**Request Body**:
```json
{
    "grant_type": "authorization_code",
    "code": "authorization_code",
    "redirect_uri": "callback_url",
    "client_id": "client_id",
    "client_secret": "client_secret",
    "code_verifier": "pkce_verifier"
}
```

### POST /smtp-credentials-store
Stores Elastic Email credentials.

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
    "elastic_email_api_key": "api_key",
    "set_as_default": true,
    "sender_name": "Sender Name"
}
```

### GET /smtp-credentials-get
Retrieves stored SMTP credentials.

**Headers**: `Authorization: Bearer {access_token}`

## Next Steps

- Implement proper user authentication flow
- Add UI for OAuth consent page
- Set up encryption for sensitive database fields
- Implement audit logging
- Add rate limiting
- Create admin dashboard for managing credentials

---

**Need Help?** Check the [implementation plan](file:///C:/Users/PC/.gemini/antigravity/brain/5d7f6f2b-47f3-4494-a782-f9a8ab74b517/implementation_plan.md) for more details.
