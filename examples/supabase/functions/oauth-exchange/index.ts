import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLIENT_ID = Deno.env.get('OAUTH_CLIENT_ID')
const CLIENT_SECRET = Deno.env.get('OAUTH_CLIENT_SECRET')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('OAuth credentials not configured')
        }

        const { code, codeVerifier, redirectUri } = await req.json()

        if (!code || !codeVerifier || !redirectUri) {
            throw new Error('Missing required parameters')
        }

        // Exchange authorization code for access and refresh tokens
        const response = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Token exchange failed: ${error}`)
        }

        const tokens = await response.json()

        return new Response(JSON.stringify(tokens), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    }
})
