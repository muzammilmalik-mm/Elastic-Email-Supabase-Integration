/**
 * Simple test script for Elastic Email SDK
 * Run with: deno run --allow-net --allow-env test-sdk.ts
 */

import { ElasticEmailClient, sendEmail } from './elastic-email-supabase-sdk/src/index.ts';

// Load environment variables from .env file
const loadEnv = async () => {
    try {
        const envContent = await Deno.readTextFile('.env');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=').trim();
                Deno.env.set(key.trim(), value);
            }
        });
    } catch (error) {
        console.log('⚠️  No .env file found, using environment variables directly');
    }
};

await loadEnv();

// Get configuration
const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL');
const TEST_RECIPIENT = Deno.env.get('TEST_RECIPIENT');

// Validate configuration
if (!ELASTIC_EMAIL_API_KEY) {
    console.error('❌ ELASTIC_EMAIL_API_KEY not found in .env file');
    console.log('\n💡 Create a .env file with:');
    console.log('ELASTIC_EMAIL_API_KEY=your-api-key');
    console.log('FROM_EMAIL=sender@yourdomain.com');
    console.log('TEST_RECIPIENT=test@example.com');
    Deno.exit(1);
}

if (!FROM_EMAIL || !TEST_RECIPIENT) {
    console.error('❌ FROM_EMAIL or TEST_RECIPIENT not configured');
    Deno.exit(1);
}

console.log('✅ Configuration loaded');
console.log(`   From: ${FROM_EMAIL}`);
console.log(`   Test recipient: ${TEST_RECIPIENT}`);
console.log('');

// Test 1: Create client
console.log('🧪 Test 1: Creating Elastic Email client...');
try {
    const client = new ElasticEmailClient({
        apiKey: ELASTIC_EMAIL_API_KEY
    });
    console.log('✅ Client created successfully\n');

    // Test 2: Send a simple email
    console.log('🧪 Test 2: Sending test email...');
    const result = await sendEmail(client, {
        from: {
            email: FROM_EMAIL,
            name: 'SDK Test'
        },
        to: [{
            email: TEST_RECIPIENT,
            name: 'Test Recipient'
        }],
        subject: 'Test Email from Elastic Email SDK',
        body: {
            html: '<h1>Hello!</h1><p>This is a test email from the Elastic Email Supabase SDK.</p>',
            text: 'Hello! This is a test email from the Elastic Email Supabase SDK.'
        }
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log('');
    console.log('🎉 All tests passed!');
    console.log('');
    console.log('💡 Check your email at:', TEST_RECIPIENT);

} catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    console.error('');
    console.error('📋 Error Details:');
    console.error('   Type:', (error as any).constructor.name);
    if ((error as any).statusCode) {
        console.error('   Status Code:', (error as any).statusCode);
    }
    if ((error as any).details) {
        console.error('   Details:', JSON.stringify((error as any).details, null, 2));
    }
    console.error('');
    console.error('💡 Common fixes:');
    console.error('   - Verify your API key is correct and active');
    console.error('   - Ensure FROM_EMAIL is verified in Elastic Email dashboard');
    console.error('   - Check you have "Send Email" permission on the API key');
    console.error('   - Visit: https://elasticemail.com/account#/settings/new/manage-api');
    Deno.exit(1);
}
