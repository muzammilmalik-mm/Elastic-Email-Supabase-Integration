import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
    ElasticEmailClient,
    sendEmail,
    AuthenticationError
} from 'npm:elastic-email-supabase@1.0.0';

const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourapp.com';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'Your App';

/**
 * Welcome Email Edge Function
 * 
 * This function is triggered by a Supabase Database Webhook when a new user signs up.
 * It sends a welcome email to the new user using Elastic Email.
 * 
 * To set up:
 * 1. Deploy this function: supabase functions deploy welcome-email --no-verify-jwt
 * 2. Go to Database > Webhooks in Supabase Dashboard
 * 3. Create a new webhook:
 *    - Table: auth.users
 *    - Events: INSERT
 *    - Type: HTTP Request
 *    - Method: POST
 *    - URL: Your function URL
 */

serve(async (req) => {
    try {
        // Validate API key is configured
        if (!ELASTIC_EMAIL_API_KEY) {
            throw new Error('ELASTIC_EMAIL_API_KEY not configured');
        }

        // Parse the webhook payload
        const { type, table, record, old_record } = await req.json();

        // Validate this is a new user insertion
        if (type !== 'INSERT' || table !== 'users') {
            return new Response(
                JSON.stringify({ error: 'Invalid webhook event' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Extract user information
        const userEmail = record.email;
        const userId = record.id;
        const userName = record.raw_user_meta_data?.name || record.email?.split('@')[0];

        if (!userEmail) {
            throw new Error('User email not found in record');
        }

        // Create Elastic Email client
        const client = new ElasticEmailClient({
            apiKey: ELASTIC_EMAIL_API_KEY
        });

        // Send welcome email
        const result = await sendEmail(client, {
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME
            },
            to: [{
                email: userEmail,
                name: userName
            }],
            subject: `Welcome to ${FROM_NAME}! 🎉`,
            body: {
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to ${FROM_NAME}!</h1>
            <p>Hi ${userName},</p>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>Here are some things you can do to get started:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Explore our features</li>
              <li>Connect with other users</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The ${FROM_NAME} Team</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">User ID: ${userId}</p>
          </div>
        `,
                text: `
Welcome to ${FROM_NAME}!

Hi ${userName},

Thank you for signing up! We're excited to have you on board.

Here are some things you can do to get started:
- Complete your profile
- Explore our features
- Connect with other users

If you have any questions, feel free to reply to this email.

Best regards,
The ${FROM_NAME} Team

User ID: ${userId}
        `
            }
        });

        console.log(`Welcome email sent to ${userEmail}`, {
            transactionId: result.transactionId,
            messageId: result.messageId
        });

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Welcome email sent',
                transactionId: result.transactionId
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error sending welcome email:', error);

        let statusCode = 500;
        let errorMessage = 'Failed to send welcome email';

        if (error instanceof AuthenticationError) {
            statusCode = 401;
            errorMessage = 'Invalid Elastic Email API key';
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                success: false
            }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});
