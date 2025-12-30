import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
    ElasticEmailClient,
    sendEmail,
    ValidationError,
    AuthenticationError
} from 'npm:elastic-email-supabase@1.0.0';

const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourapp.com';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'Your App';

serve(async (req) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Validate API key is configured
        if (!ELASTIC_EMAIL_API_KEY) {
            throw new Error('ELASTIC_EMAIL_API_KEY not configured');
        }

        // Parse request body
        const { to, subject, html, text, cc, bcc, replyTo } = await req.json();

        // Validate required fields
        if (!to || !subject || (!html && !text)) {
            throw new ValidationError(
                'Missing required fields: to, subject, and either html or text are required'
            );
        }

        // Create Elastic Email client
        const client = new ElasticEmailClient({
            apiKey: ELASTIC_EMAIL_API_KEY
        });

        // Prepare recipients
        const recipients = Array.isArray(to) ? to : [to];
        const toRecipients = recipients.map((email: string | { email: string; name?: string }) =>
            typeof email === 'string' ? { email } : email
        );

        // Send email
        const result = await sendEmail(client, {
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME
            },
            to: toRecipients,
            cc: cc ? (Array.isArray(cc) ? cc : [cc]).map((email: string) => ({ email })) : undefined,
            bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]).map((email: string) => ({ email })) : undefined,
            subject,
            body: {
                html,
                text
            },
            replyTo: replyTo ? { email: replyTo } : undefined
        });

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                transactionId: result.transactionId,
                messageId: result.messageId
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error sending email:', error);

        let statusCode = 500;
        let errorMessage = 'Failed to send email';

        if (error instanceof AuthenticationError) {
            statusCode = 401;
            errorMessage = 'Invalid Elastic Email API key';
        } else if (error instanceof ValidationError) {
            statusCode = 400;
            errorMessage = error.message;
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
