import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        const { userToken } = await req.json()

        if (!userToken) {
            throw new Error('User Supabase token required')
        }

        // Fetch projects from Supabase Management API using user's token
        const response = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Management API error: ${error}`)
        }

        const projects = await response.json()

        return new Response(JSON.stringify(projects), {
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
