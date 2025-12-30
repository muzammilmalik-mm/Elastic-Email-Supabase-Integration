import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
    ElasticEmailClient,
    getEmailStatus,
    getEmailActivity,
    ValidationError,
    AuthenticationError,
    EmailStatus
} from 'npm:elastic-email-supabase@1.0.0';

const ELASTIC_EMAIL_API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY');

serve(async (req) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
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

        // Parse query parameters
        const url = new URL(req.url);
        const transactionId = url.searchParams.get('transactionId');
        const limit = url.searchParams.get('limit');
        const status = url.searchParams.get('status');
        const to = url.searchParams.get('to');
        const from = url.searchParams.get('from');

        // Create Elastic Email client
        const client = new ElasticEmailClient({
            apiKey: ELASTIC_EMAIL_API_KEY
        });

        // If transaction ID is provided, get specific email status
        if (transactionId) {
            const statusResult = await getEmailStatus(client, transactionId);

            return new Response(
                JSON.stringify({
                    success: true,
                    status: statusResult
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Otherwise, get email activity
        const activities = await getEmailActivity(client, {
            limit: limit ? parseInt(limit) : 50,
            status: status as EmailStatus | undefined,
            to: to || undefined,
            from: from || undefined
        });

        return new Response(
            JSON.stringify({
                success: true,
                count: activities.length,
                activities
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error checking email status:', error);

        let statusCode = 500;
        let errorMessage = 'Failed to check email status';

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
