import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_OAUTH_CLIENT_ID = '493357a3-0356-449d-a187-bcb6019741c1';
const SUPABASE_OAUTH_CLIENT_SECRET = Deno.env.get('OAUTH_CLIENT_SECRET')!;
const REDIRECT_URI = 'http://localhost:5173/supabase/callback';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
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
        const { code } = await req.json();

        if (!code) {
            return new Response(
                JSON.stringify({ error: 'Authorization code is required' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('🔄 Exchanging authorization code for access token...');

        // Exchange authorization code for access token
        // Use application/x-www-form-urlencoded and Basic auth as per OAuth spec
        const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(`${SUPABASE_OAUTH_CLIENT_ID}:${SUPABASE_OAUTH_CLIENT_SECRET}`)}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('❌ Token exchange failed:', error);
            return new Response(
                JSON.stringify({ error: 'Failed to exchange code for token', details: error }),
                {
                    status: tokenResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ Token exchange successful!');

        // Fetch user's projects
        console.log('📋 Fetching Supabase projects...');
        const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        let projects = [];
        if (projectsResponse.ok) {
            projects = await projectsResponse.json();
            console.log(`✅ Found ${projects.length} project(s)`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                access_token: tokenData.access_token,
                token_type: tokenData.token_type,
                expires_in: tokenData.expires_in,
                refresh_token: tokenData.refresh_token,
                projects: projects,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('💥 OAuth exchange error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
