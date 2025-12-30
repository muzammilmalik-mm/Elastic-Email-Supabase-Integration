/**
 * Example OAuth Client for Elastic Email SMTP Credentials
 * 
 * This example demonstrates how to:
 * 1. Initiate OAuth flow with PKCE
 * 2. Exchange authorization code for access token
 * 3. Store Elastic Email API key and SMTP credentials
 * 4. Retrieve and use SMTP credentials to send emails
 * 
 * Usage:
 *   deno run --allow-net --allow-env oauth-client-example.ts
 */

// PKCE Helper Functions
async function generateCodeVerifier(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://your-project.supabase.co';
const CLIENT_ID = '5a214a56-3a13-46d5-a871-a0d62758f1b2';
const CLIENT_SECRET = 'pHWyAql2OauX4datYjRxuWDzD9XGRpD0BYYsmOen3tM';
const REDIRECT_URI = 'http://localhost:8000/callback';
const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY') || 'your-elastic-email-api-key';

async function main() {
    console.log('🔐 OAuth SMTP Credentials Example\n');

    // Step 1: Generate PKCE values
    console.log('1️⃣  Generating PKCE values...');
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log('   ✅ Code verifier generated');
    console.log('   ✅ Code challenge generated\n');

    // Step 2: Build authorization URL
    const state = crypto.randomUUID();
    const authUrl = new URL(`${SUPABASE_URL}/functions/v1/oauth-authorize`);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('scope', 'smtp:write');

    console.log('2️⃣  Authorization URL generated:');
    console.log(`   ${authUrl.toString()}`);
    console.log('\n   📝 In a real application, redirect the user to this URL');
    console.log('   📝 For this demo, we\'ll simulate receiving an authorization code...\n');

    // DEMO: Simulate receiving authorization code
    // In a real app, this would come from the redirect_uri callback
    const authorizationCode = 'SIMULATED_AUTH_CODE_' + crypto.randomUUID();
    console.log(`   🔑 Simulated authorization code: ${authorizationCode.substring(0, 30)}...\n`);

    // In a real scenario, you would need to:
    // 1. Start a local server to listen on the redirect_uri
    // 2. Open the authorization URL in a browser
    // 3. User approves the request
    // 4. Supabase redirects back to your redirect_uri with the code
    // 5. Your server extracts the code and exchanges it for tokens

    console.log('⚠️  This is a demo script. To test the full flow:');
    console.log('   1. Deploy the Edge Functions to Supabase');
    console.log('   2. Set up Supabase Auth (or use Authorization header)');
    console.log('   3. Open the authorization URL in a browser');
    console.log('   4. Complete the OAuth flow');
    console.log('   5. Use the access token with the SMTP endpoints\n');

    // Example: How to exchange code for tokens (after getting real auth code)
    console.log('3️⃣  Token Exchange (Example Code):');
    console.log(`
   const tokenResponse = await fetch(\`\${SUPABASE_URL}/functions/v1/oauth-token\`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           grant_type: 'authorization_code',
           code: authorizationCode,
           redirect_uri: REDIRECT_URI,
           client_id: CLIENT_ID,
           client_secret: CLIENT_SECRET,
           code_verifier: codeVerifier,
       }),
   });
   
   const tokens = await tokenResponse.json();
   // tokens.access_token, tokens.refresh_token
`);

    // Example: How to store SMTP credentials
    console.log('4️⃣  Store SMTP Credentials (Example Code):');
    console.log(`
   const storeResponse = await fetch(\`\${SUPABASE_URL}/functions/v1/smtp-credentials-store\`, {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'Authorization': \`Bearer \${accessToken}\`,
       },
       body: JSON.stringify({
           elastic_email_api_key: '${ELASTIC_EMAIL_API_KEY.substring(0, 20)}...',
           set_as_default: true,
           sender_name: 'My Service',
       }),
   });
`);

    // Example: How to retrieve SMTP credentials
    console.log('5️⃣  Retrieve SMTP Credentials (Example Code):');
    console.log(`
   const getResponse = await fetch(\`\${SUPABASE_URL}/functions/v1/smtp-credentials-get\`, {
       method: 'GET',
       headers: {
           'Authorization': \`Bearer \${accessToken}\`,
       },
   });
   
   const credentials = await getResponse.json();
   // Use credentials.smtp_credentials to send emails
`);

    console.log('\n✅ Example completed!');
    console.log('\n📚 Next Steps:');
    console.log('   1. Deploy Edge Functions: supabase functions deploy oauth-authorize oauth-token smtp-credentials-store smtp-credentials-get');
    console.log('   2. Set secrets: supabase secrets set JWT_SECRET=your-secret-here');
    console.log('   3. Test the OAuth flow with a real browser');
    console.log('   4. Integrate into your application\n');
}

// Run the example
if (import.meta.main) {
    main().catch(console.error);
}
