import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
    }

    try {
        const { transactionId } = await req.json();
        if (!transactionId) {
            return new Response(JSON.stringify({ success: false, error: 'Transaction ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const response = await fetch(`https://api.elasticemail.com/v4/emails/${transactionId}/status`, {
            method: 'GET',
            headers: { 'X-ElasticEmail-ApiKey': API_KEY }
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 404 || response.status === 400) {
                return new Response(JSON.stringify({ success: false, error: 'Transaction ID does not exist' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
            }
            return new Response(JSON.stringify({ success: false, error: data.Error || 'Failed to fetch status' }), { status: response.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: (err as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
});