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
        const { projectRef, smtpConfig, userToken } = await req.json()

        if (!projectRef || !smtpConfig || !userToken) {
            throw new Error('Missing projectRef, smtpConfig, or userToken')
        }

        // Update SMTP settings via Management API using user's token
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    SMTP_ADMIN_EMAIL: smtpConfig.adminEmail,
                    SMTP_HOST: smtpConfig.host,
                    SMTP_PORT: String(smtpConfig.port),
                    SMTP_USER: smtpConfig.username,
                    SMTP_PASS: smtpConfig.password,
                    SMTP_SENDER_NAME: smtpConfig.senderName
                })
            }
        )

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Management API error: ${error}`)
        }

        const result = await response.json()

        return new Response(JSON.stringify({
            success: true,
            data: result
        }), {
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
