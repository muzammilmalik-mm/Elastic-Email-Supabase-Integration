import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
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
        const { oauth_access_token, project_ref, smtp_config } = await req.json();

        if (!oauth_access_token || !project_ref || !smtp_config) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`🔧 Configuring SMTP for project: ${project_ref}`);

        // Configure SMTP settings using OAuth token
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${project_ref}/config/auth`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${oauth_access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    smtp_admin_email: smtp_config.smtp_admin_email,
                    smtp_host: "smtp.elasticemail.com",
                    smtp_port: smtp_config.smtp_port,
                    smtp_user: smtp_config.smtp_user,
                    smtp_pass: smtp_config.smtp_pass,
                    smtp_sender_name: smtp_config.smtp_sender_name,
                    smtp_max_frequency: smtp_config.smtp_max_frequency || 60,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ SMTP configuration failed:', error);
            return new Response(
                JSON.stringify({
                    error: 'Failed to configure SMTP',
                    details: error
                }),
                {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const result = await response.json();
        console.log('✅ SMTP configuration successful!');

        return new Response(
            JSON.stringify({
                success: true,
                message: 'SMTP configured successfully',
                config: result,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('💥 Error configuring SMTP:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
