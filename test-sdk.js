/**
 * Local SDK Test Script
 * 
 * This script tests the Elastic Email SDK locally without deploying to Supabase.
 * 
 * Setup:
 * 1. Create a .env file in this directory with:
 *    ELASTIC_EMAIL_API_KEY=your-api-key-here
 *    FROM_EMAIL=your-verified-email@domain.com
 *    TEST_RECIPIENT=test-recipient@email.com
 * 
 * 2. Install dependencies:
 *    npm install dotenv
 * 
 * 3. Run the test:
 *    node test-sdk.js
 */

import 'dotenv/config';
import {
    ElasticEmailClient,
    sendEmail,
    sendTemplate,
    getEmailStatus,
    getEmailActivity,
    EmailStatus
} from './elastic-email-supabase-sdk/src/index.ts';

// Configuration from environment variables
const API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourapp.com';
const TEST_RECIPIENT = process.env.TEST_RECIPIENT || 'test@example.com';

if (!API_KEY) {
    console.error('❌ Error: ELASTIC_EMAIL_API_KEY not set in .env file');
    process.exit(1);
}

// Create client
const client = new ElasticEmailClient({
    apiKey: API_KEY
});

console.log('🚀 Starting Elastic Email SDK Tests...\n');

// Test 1: Send a simple HTML email
async function testSendEmail() {
    console.log('📧 Test 1: Sending HTML email...');

    try {
        const result = await sendEmail(client, {
            from: {
                email: FROM_EMAIL,
                name: 'SDK Test'
            },
            to: [{
                email: TEST_RECIPIENT,
                name: 'Test User'
            }],
            subject: 'Test Email from Elastic Email SDK',
            body: {
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #4CAF50;">✅ SDK Test Successful!</h1>
            <p>This email was sent using the Elastic Email Supabase SDK.</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is a test email from the local SDK test script.
            </p>
          </div>
        `,
                text: `
SDK Test Successful!

This email was sent using the Elastic Email Supabase SDK.
Time: ${new Date().toISOString()}

This is a test email from the local SDK test script.
        `
            }
        });

        console.log('✅ Email sent successfully!');
        console.log('   Transaction ID:', result.transactionId);
        console.log('   Message ID:', result.messageId);
        console.log();

        return result.transactionId;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        if (error.statusCode) {
            console.error('   Status Code:', error.statusCode);
        }
        console.log();
        return null;
    }
}

// Test 2: Send email with CC and BCC
async function testSendEmailWithCcBcc() {
    console.log('📧 Test 2: Sending email with CC/BCC...');

    try {
        const result = await sendEmail(client, {
            from: { email: FROM_EMAIL, name: 'SDK Test' },
            to: [{ email: TEST_RECIPIENT }],
            cc: [{ email: FROM_EMAIL }], // CC to yourself for testing
            subject: 'SDK Test - CC/BCC Example',
            body: {
                html: '<h2>This email has CC recipients</h2>'
            }
        });

        console.log('✅ Email with CC/BCC sent!');
        console.log('   Transaction ID:', result.transactionId);
        console.log();

        return result.transactionId;
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log();
        return null;
    }
}

// Test 3: Send template email (if you have templates set up)
async function testSendTemplate() {
    console.log('📧 Test 3: Sending template email...');
    console.log('   (This will fail if you don\'t have a template named "welcome-email")');

    try {
        const result = await sendTemplate(client, {
            from: { email: FROM_EMAIL },
            to: [{ email: TEST_RECIPIENT }],
            templateName: 'welcome-email', // Change to your template name
            templateData: {
                userName: 'Test User',
                currentYear: new Date().getFullYear()
            }
        });

        console.log('✅ Template email sent!');
        console.log('   Transaction ID:', result.transactionId);
        console.log();

        return result.transactionId;
    } catch (error) {
        console.log('⚠️  Template test skipped:', error.message);
        console.log('   (This is expected if you don\'t have templates configured)');
        console.log();
        return null;
    }
}

// Test 4: Get email status
async function testGetEmailStatus(transactionId) {
    if (!transactionId) {
        console.log('⏭️  Test 4: Skipping status check (no transaction ID)');
        console.log();
        return;
    }

    console.log('🔍 Test 4: Checking email status...');
    console.log('   Waiting 5 seconds for email to process...');

    // Wait a bit for the email to process
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const status = await getEmailStatus(client, transactionId);

        console.log('✅ Status retrieved!');
        console.log('   Status:', status.status);
        console.log('   Recipient:', status.recipient);
        console.log('   Date:', status.date);
        console.log();
    } catch (error) {
        console.error('❌ Error getting status:', error.message);
        console.log();
    }
}

// Test 5: Get email activity
async function testGetEmailActivity() {
    console.log('📊 Test 5: Retrieving email activity...');

    try {
        const activities = await getEmailActivity(client, {
            limit: 10,
            from: FROM_EMAIL
        });

        console.log(`✅ Retrieved ${activities.length} activities`);

        if (activities.length > 0) {
            console.log('\n   Recent emails:');
            activities.slice(0, 3).forEach((activity, index) => {
                console.log(`   ${index + 1}. To: ${activity.to}`);
                console.log(`      Subject: ${activity.subject}`);
                console.log(`      Status: ${activity.status}`);
                console.log(`      Date: ${activity.date}`);
                console.log();
            });
        }

        // Show status breakdown
        const statusCount = {};
        activities.forEach(a => {
            statusCount[a.status] = (statusCount[a.status] || 0) + 1;
        });

        console.log('   Status breakdown:');
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`);
        });
        console.log();
    } catch (error) {
        console.error('❌ Error getting activity:', error.message);
        console.log();
    }
}

// Test 6: Error handling
async function testErrorHandling() {
    console.log('🔧 Test 6: Testing error handling...');

    try {
        // Try to send email without required fields
        await sendEmail(client, {
            from: { email: FROM_EMAIL },
            to: [{ email: TEST_RECIPIENT }],
            subject: '', // Missing subject
            body: {} // Missing body
        });

        console.log('❌ Error handling test failed - should have thrown an error');
    } catch (error) {
        console.log('✅ Error handling works correctly!');
        console.log('   Error caught:', error.message);
        console.log();
    }
}

// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Elastic Email SDK - Local Test Suite');
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('Configuration:');
    console.log('  From:', FROM_EMAIL);
    console.log('  To:', TEST_RECIPIENT);
    console.log('  API Key:', API_KEY ? '✓ Set' : '✗ Not set');
    console.log();
    console.log('═══════════════════════════════════════════════\n');

    let transactionId = null;

    // Run tests sequentially
    transactionId = await testSendEmail();
    await testSendEmailWithCcBcc();
    await testSendTemplate();
    await testGetEmailStatus(transactionId);
    await testGetEmailActivity();
    await testErrorHandling();

    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ All tests completed!');
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('💡 Next steps:');
    console.log('   - Check your email inbox for test messages');
    console.log('   - Review the Elastic Email dashboard for analytics');
    console.log('   - Deploy Edge Functions to Supabase when ready');
    console.log();
}

// Run the tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
