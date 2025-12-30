import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const ELASTIC_EMAIL_CLIENT_ID = Deno.env.get('ELASTIC_EMAIL_CLIENT_ID')!;
const ELASTIC_EMAIL_CLIENT_SECRET = Deno.env.get('ELASTIC_EMAIL_CLIENT_SECRET')!;

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

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
        const { code, redirect_uri } = await req.json();

        if (!code || !redirect_uri) {
            return new Response(
                JSON.stringify({ error: 'Missing code or redirect_uri' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Extract just the origin (protocol + host) from the redirect_uri
        const redirectUrl = new URL(redirect_uri);
        const baseRedirectUri = `${redirectUrl.protocol}//${redirectUrl.host}`;

        console.log('Exchanging code with redirect_uri:', baseRedirectUri);

        // Exchange code for token with Elastic Email
        const tokenResponse = await fetch('https://api.elasticemail.com/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: ELASTIC_EMAIL_CLIENT_ID,
                client_secret: ELASTIC_EMAIL_CLIENT_SECRET,
                code: code,
                redirect_uri: baseRedirectUri, // Send just http://localhost:5173
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            return new Response(
                JSON.stringify({ error: 'Failed to exchange code for token', details: errorText }),
                { status: tokenResponse.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const tokenData = await tokenResponse.json();

        // Return the OAuth token to the frontend
        return new Response(
            JSON.stringify({
                success: true,
                access_token: tokenData.access_token,
                token_type: tokenData.token_type,
                expires_in: tokenData.expires_in,
                refresh_token: tokenData.refresh_token,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );

    } catch (error) {
        console.error('OAuth token exchange error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
