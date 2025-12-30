/**
 * Comprehensive test script for Elastic Email SDK
 * Run with: deno run --allow-net --allow-env --allow-read test-sdk-comprehensive.ts
 */

import { ElasticEmailClient, sendEmail, sendTemplate, getEmailStatus, getEmailActivity } from './elastic-email-supabase-sdk/src/index.ts';

// Load environment variables from .env file
const loadEnv = async () => {
    try {
        const envContent = await Deno.readTextFile('.env');
        envContent.split('\n').forEach((line: string) => {
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
if (!ELASTIC_EMAIL_API_KEY || !FROM_EMAIL || !TEST_RECIPIENT) {
    console.error('❌ Missing required environment variables');
    console.log('\n💡 Create a .env file with:');
    console.log('ELASTIC_EMAIL_API_KEY=your-api-key');
    console.log('FROM_EMAIL=sender@yourdomain.com');
    console.log('TEST_RECIPIENT=test@example.com');
    Deno.exit(1);
}

console.log('═══════════════════════════════════════════════');
console.log('  Elastic Email SDK - Comprehensive Test Suite');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('Configuration:');
console.log(`  From: ${FROM_EMAIL}`);
console.log(`  Test recipient: ${TEST_RECIPIENT}`);
console.log('  API Key: ✓ Set');
console.log('');
console.log('═══════════════════════════════════════════════');
console.log('');

// Create client
const client = new ElasticEmailClient({
    apiKey: ELASTIC_EMAIL_API_KEY
});

let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;
const transactionIds: string[] = [];

// Helper function to run tests
async function runTest(name: string, testFn: () => Promise<void>, canSkip = false) {
    console.log(`📧 ${name}...`);
    try {
        await testFn();
        testsPassed++;
        console.log('');
    } catch (error) {
        if (canSkip && (error as Error).message.includes('Template') || (error as Error).message.includes('not found')) {
            console.log('⚠️  Skipped (expected if no template configured)');
            testsSkipped++;
        } else {
            console.error(`❌ Failed: ${(error as Error).message}`);
            testsFailed++;
        }
        console.log('');
    }
}

// Test 1: Basic email
// await runTest('Test 1: Send basic HTML email', async () => {
//     const result = await sendEmail(client, {
//         from: { email: FROM_EMAIL, name: 'SDK Test Suite' },
//         to: [{ email: TEST_RECIPIENT, name: 'Test Recipient' }],
//         subject: 'Test 1: Basic HTML Email',
//         body: {
//             html: '<h1>Test Email</h1><p>This is a <strong>basic HTML</strong> email from the SDK test suite.</p>',
//             text: 'Test Email\n\nThis is a basic HTML email from the SDK test suite.'
//         }
//     });
//     console.log('✅ Basic email sent successfully!');
//     console.log(`   Transaction ID: ${result.transactionId}`);
//     console.log(`   Message ID: ${result.messageId}`);
//     transactionIds.push(result.transactionId);
// });

// Test 2: Email with CC/BCC
// await runTest('Test 2: Send email with CC/BCC', async () => {
//     const result = await sendEmail(client, {
//         from: { email: FROM_EMAIL, name: 'SDK Test Suite' },
//         to: [{ email: TEST_RECIPIENT }],
//         cc: [{ email: TEST_RECIPIENT, name: 'CC Recipient' }],
//         bcc: [{ email: TEST_RECIPIENT }],
//         subject: 'Test 2: Email with CC/BCC',
//         body: {
//             html: '<h1>CC/BCC Test</h1><p>This email includes CC and BCC recipients.</p>'
//         },
//         replyTo: { email: FROM_EMAIL }
//     });
//     console.log('✅ Email with CC/BCC sent successfully!');
//     console.log(`   Transaction ID: ${result.transactionId}`);
//     transactionIds.push(result.transactionId);
// });

// Test 3: Email with attachment
// await runTest('Test 3: Send email with attachment', async () => {
//     // Create a simple text file as base64
//     const textContent = 'Hello from Elastic Email SDK!\n\nThis is a test attachment.';
//     const base64Content = btoa(textContent);

//     const result = await sendEmail(client, {
//         from: { email: FROM_EMAIL, name: 'SDK Test Suite' },
//         to: [{ email: TEST_RECIPIENT }],
//         subject: 'Test 3: Email with Attachment',
//         body: {
//             html: '<h1>Attachment Test</h1><p>This email includes a text file attachment.</p>'
//         },
//         attachments: [{
//             filename: 'test-document.txt',
//             content: base64Content,
//             contentType: 'text/plain'
//         }]
//     });
//     console.log('✅ Email with attachment sent successfully!');
//     console.log(`   Transaction ID: ${result.transactionId}`);
//     console.log(`   Attachment: test-document.txt`);
//     transactionIds.push(result.transactionId);
// });

// Test 4: Template email (may skip if no template)
await runTest('Test 4: Send template email', async () => {
    try {
        const result = await sendTemplate(client, {
            from: { email: FROM_EMAIL },
            to: [{ email: TEST_RECIPIENT }],
            templateName: 'Hello - new employee Template 2025-40-14 12:40:00', // Update with your template name
            templateData: {
                userName: 'Test User',
                year: new Date().getFullYear().toString()
            }
        });
        console.log('✅ Template email sent successfully!');
        console.log(`   Transaction ID: ${result.transactionId}`);
        transactionIds.push(result.transactionId);
    } catch (error) {
        // Skip if template doesn't exist
        if ((error as any).statusCode === 404) {
            throw new Error('Template not found (expected if not configured)');
        }
        throw error;
    }
}, true);

// Test 5: Get email status
if (transactionIds.length > 0) {
    await runTest('Test 5: Get email status', async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for API
        const txId = transactionIds[0];
        try {
            const status = await getEmailStatus(client, txId);
            console.log('✅ Email status retrieved successfully!');
            console.log(`   Status: ${status.status}`);
            console.log(`   Recipient: ${status.recipient}`);
            console.log(`   Date: ${status.date}`);
        } catch (error) {
            // Status might not be immediately available
            if ((error as any).statusCode === 404) {
                console.log(`⚠️  Status not yet available (transaction: ${txId})`);
                console.log('   This is normal - status may take a few seconds to appear');
            } else {
                throw error;
            }
        }
    });
}

// Test 6: Get email activity
await runTest('Test 6: Get email activity logs', async () => {
    const activities = await getEmailActivity(client, {
        limit: 10
    });
    console.log('✅ Email activity retrieved successfully!');
    console.log(`   Recent emails: ${activities.length}`);
    if (activities.length > 0) {
        console.log(`   Latest: "${activities[0].subject}" to ${activities[0].to}`);
    }
});

// Test 7: Error handling
await runTest('Test 7: Error handling (invalid request)', async () => {
    try {
        // Test missing required field
        await sendEmail(client, {
            from: { email: FROM_EMAIL },
            to: [],  // Empty recipients should fail
            subject: 'Test',
            body: { html: '<p>Test</p>' }
        });
        throw new Error('Should have thrown validation error for empty recipients');
    } catch (error) {
        if ((error as any).name === 'ValidationError') {
            console.log('✅ Correctly caught validation error!');
            console.log(`   Error: ${(error as Error).message}`);
        } else {
            throw new Error(`Expected ValidationError but got: ${(error as Error).message}`);
        }
    }
});

// Final summary
console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  Test Summary');
console.log('═══════════════════════════════════════════════');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`⚠️  Skipped: ${testsSkipped}`);
console.log('');

if (testsFailed === 0) {
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - Check your inbox at:', TEST_RECIPIENT);
    console.log('   - Verify emails in Elastic Email dashboard');
    console.log('   - Test the Edge Functions in examples/');
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    Deno.exit(1);
}
