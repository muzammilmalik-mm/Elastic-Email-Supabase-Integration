/**
 * Supabase Management API - SMTP Configuration Test
 * 
 * This script shows you the request/response format when configuring
 * Supabase to use Elastic Email as the SMTP provider via Management API.
 * 
 * Setup:
 * 1. Get your Supabase Access Token from: https://supabase.com/dashboard/account/tokens
 * 2. Get your Project Reference ID from your project settings
 * 3. Set up Elastic Email SMTP credentials
 * 
 * Environment Variables:
 * - SUPABASE_ACCESS_TOKEN: Your personal access token
 * - SUPABASE_PROJECT_REF: Your project reference (e.g., "abcdefghijklmnop")
 * - ELASTIC_EMAIL_SMTP_USERNAME: Your Elastic Email account email
 * - ELASTIC_EMAIL_SMTP_PASSWORD: Your Elastic Email SMTP password
 */

import 'dotenv/config';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ELASTIC_EMAIL_SMTP_USERNAME = process.env.ELASTIC_EMAIL_SMTP_USERNAME;
const ELASTIC_EMAIL_SMTP_PASSWORD = process.env.ELASTIC_EMAIL_SMTP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourapp.com';
const FROM_NAME = process.env.FROM_NAME || 'Your App';

// Elastic Email SMTP Settings
const ELASTIC_EMAIL_SMTP_HOST = 'smtp.elasticemail.com';
const ELASTIC_EMAIL_SMTP_PORT = 2525; // or 25, 587, 465 (SSL)

console.log('═══════════════════════════════════════════════════════════');
console.log('  Supabase Management API - SMTP Configuration Test');
console.log('═══════════════════════════════════════════════════════════\n');

// The request payload for configuring SMTP
const smtpConfig = {
    host: ELASTIC_EMAIL_SMTP_HOST,
    port: ELASTIC_EMAIL_SMTP_PORT,
    user: ELASTIC_EMAIL_SMTP_USERNAME,
    pass: ELASTIC_EMAIL_SMTP_PASSWORD,
    from: FROM_EMAIL,
    from_name: FROM_NAME,
    // Optional settings
    admin_email: FROM_EMAIL,
    sender_name: FROM_NAME
};

console.log('📋 Request Configuration:');
console.log('────────────────────────────────────────────────────────────');
console.log('Endpoint: PUT /v1/projects/{ref}/config/auth');
console.log('Base URL: https://api.supabase.com');
console.log('Project Ref:', PROJECT_REF);
console.log('\n📧 SMTP Settings:');
console.log(JSON.stringify(smtpConfig, null, 2));
console.log('────────────────────────────────────────────────────────────\n');

// Full request example
async function configureSupabaseSMTP() {
    if (!SUPABASE_ACCESS_TOKEN) {
        console.error('❌ Error: SUPABASE_ACCESS_TOKEN not set');
        console.log('\n💡 Get your token from: https://supabase.com/dashboard/account/tokens\n');
        return;
    }

    if (!PROJECT_REF) {
        console.error('❌ Error: SUPABASE_PROJECT_REF not set');
        console.log('\n💡 Find in: Project Settings > General > Reference ID\n');
        return;
    }

    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

    const requestPayload = {
        SMTP_ADMIN_EMAIL: smtpConfig.admin_email,
        SMTP_HOST: smtpConfig.host,
        SMTP_PORT: smtpConfig.port.toString(),
        SMTP_USER: smtpConfig.user,
        SMTP_PASS: smtpConfig.pass,
        SMTP_SENDER_NAME: smtpConfig.sender_name,
        MAILER_AUTOCONFIRM: false, // Set to true to auto-confirm emails
        // Add other auth config as needed
    };

    const headers = {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    };

    console.log('🚀 Sending Request...\n');
    console.log('curl command equivalent:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(`curl -X PUT '${url}' \\`);
    console.log(`  -H 'Authorization: Bearer ${SUPABASE_ACCESS_TOKEN.substring(0, 20)}...' \\`);
    console.log(`  -H 'Content-Type: application/json' \\`);
    console.log(`  -d '${JSON.stringify(requestPayload, null, 2)}'`);
    console.log('────────────────────────────────────────────────────────────\n');

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(requestPayload)
        });

        const responseData = await response.json();

        console.log('📥 Response Details:');
        console.log('────────────────────────────────────────────────────────────');
        console.log('Status Code:', response.status, response.statusText);
        console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        console.log('\n📄 Response Body:');
        console.log(JSON.stringify(responseData, null, 2));
        console.log('────────────────────────────────────────────────────────────\n');

        if (response.ok) {
            console.log('✅ SMTP Configuration Successful!');
            console.log('\n💡 Next Steps:');
            console.log('   1. Test sending an email from Supabase Auth');
            console.log('   2. Check Elastic Email dashboard for delivery');
            console.log('   3. Verify emails are being sent via Elastic Email\n');
        } else {
            console.log('❌ Configuration Failed');
            console.log('Error:', responseData);
            console.log('\n💡 Common Issues:');
            console.log('   - Invalid access token');
            console.log('   - Wrong project reference');
            console.log('   - Invalid SMTP credentials');
            console.log('   - Insufficient permissions\n');
        }

        return responseData;

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        console.log('\nFull error:', error);
    }
}

// Example: Get current SMTP configuration
async function getCurrentSMTPConfig() {
    if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) {
        return;
    }

    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

    console.log('🔍 Fetching Current SMTP Configuration...\n');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        console.log('📥 Current Auth Configuration:');
        console.log('────────────────────────────────────────────────────────────');
        console.log(JSON.stringify(data, null, 2));
        console.log('────────────────────────────────────────────────────────────\n');

        // Extract SMTP-related settings
        if (data) {
            console.log('Current SMTP Settings:');
            console.log('  Host:', data.SMTP_HOST || 'Not configured');
            console.log('  Port:', data.SMTP_PORT || 'Not configured');
            console.log('  User:', data.SMTP_USER || 'Not configured');
            console.log('  From:', data.SMTP_ADMIN_EMAIL || 'Not configured');
            console.log('  Sender:', data.SMTP_SENDER_NAME || 'Not configured');
            console.log();
        }

    } catch (error) {
        console.error('❌ Failed to fetch config:', error.message);
    }
}

// Example: Send test email via Supabase Auth
async function sendTestEmail() {
    console.log('📧 Testing Email Delivery...\n');
    console.log('💡 To test, trigger a Supabase Auth email:');
    console.log('   - Sign up a new user');
    console.log('   - Request password reset');
    console.log('   - Resend confirmation email');
    console.log('\nEmails will now be sent via Elastic Email SMTP!\n');
}

// RequestBin Setup Instructions
function showRequestBinSetup() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Using RequestBin to Inspect Requests');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1. Create a RequestBin:');
    console.log('   → Visit: https://requestbin.com/');
    console.log('   → Click "Create Request Bin"');
    console.log('   → Copy your bin URL (e.g., https://requestbin.com/r/xxxxx)\n');

    console.log('2. Modify the script to send to RequestBin:');
    console.log('   Replace the URL with your RequestBin URL to capture the request\n');

    console.log('3. Example RequestBin Request:');
    const binUrl = 'https://requestbin.com/r/YOUR_BIN_ID';
    console.log(`
const response = await fetch('${binUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + SUPABASE_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(smtpConfig, null, 4)})
});
`);
    console.log('4. Check RequestBin to see the exact request format\n');
    console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the tests
async function main() {
    // Show RequestBin setup
    showRequestBinSetup();

    // Get current config
    await getCurrentSMTPConfig();

    // Configure SMTP
    await configureSupabaseSMTP();

    // Show test instructions
    await sendTestEmail();
}

main();
