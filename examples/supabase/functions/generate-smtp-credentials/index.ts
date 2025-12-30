import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        const { oauth_token, username, sender_email } = await req.json();

        if (!oauth_token) {
            return new Response(
                JSON.stringify({ error: 'OAuth token is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!username) {
            return new Response(
                JSON.stringify({ error: 'Username is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!sender_email) {
            return new Response(
                JSON.stringify({ error: 'Sender email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('🔑 Generating SMTP credentials for:', sender_email);
        console.log('👤 Username:', username);

        const smtpResponse = await fetch('https://api.elasticemail.com/v4/security/smtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ElasticEmail-ApiKey': oauth_token
            },
            body: JSON.stringify({
                Name: username,
                RestrictAccessToIPRange: []
            })
        });

        if (!smtpResponse.ok) {
            const errorText = await smtpResponse.text();
            console.error('❌ Elastic Email API Error:', errorText);

            // Try to parse error as JSON to get the actual error message
            let errorMessage = 'Failed to generate SMTP credentials';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.Error || errorData.error || errorData.message || errorText;
            } catch {
                errorMessage = errorText;
            }

            return new Response(
                JSON.stringify({
                    error: errorMessage,
                    details: errorText
                }),
                {
                    status: smtpResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const smtpData = await smtpResponse.json();
        console.log('SMTP Data:', smtpData);
        // ------------------------------------------------------------------
        // Return formatted credentials
        // ------------------------------------------------------------------
        return new Response(
            JSON.stringify({
                success: true,
                smtp_host: smtpData.Host,
                smtp_port: "2525",
                smtp_user: username,
                smtp_pass: smtpData.Token,
                sender_email: sender_email
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('💥 Error:', error);
        return new Response(
            JSON.stringify({
                error: 'Operation failed',
                message: (error as Error).message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});