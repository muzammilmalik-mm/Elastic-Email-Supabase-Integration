import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { oauth_token } = await req.json();

        if (!oauth_token) {
            return new Response(
                JSON.stringify({ error: 'OAuth token is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('📧 Fetching domains from Elastic Email using OAuth token...');

        const domainsResponse = await fetch('https://api.elasticemail.com/v4/domains', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-ElasticEmail-ApiKey': oauth_token
            }
        });

        if (!domainsResponse.ok) {
            const errorText = await domainsResponse.text();
            throw new Error(`Failed to fetch domains: ${errorText}`);
        }

        const domains = await domainsResponse.json();
        console.log(`✅ Fetched ${domains.length} domains`);

        return new Response(
            JSON.stringify({
                success: true,
                domains: domains
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('❌ Error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
