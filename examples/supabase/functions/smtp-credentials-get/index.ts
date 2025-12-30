import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { extractBearerToken, createErrorResponse, createSuccessResponse } from '../_shared/oauth-utils.ts';
import { createSupabaseAdmin, getUserIdFromJWT } from '../_shared/supabase-client.ts';

serve(async (req) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return createErrorResponse('invalid_request', 'Method not allowed', 405);
    }

    try {
        console.log('📨 smtp-credentials-get: Starting request');

        // Validate Supabase Auth JWT (user session token)
        const authHeader = req.headers.get('Authorization');
        console.log('🔑 Authorization header present:', !!authHeader);

        const accessToken = extractBearerToken(authHeader);
        console.log('🎫 Access token extracted:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NONE');

        if (!accessToken) {
            console.error('❌ No access token found');
            return createErrorResponse('invalid_token', 'Missing or invalid Authorization header', 401);
        }

        // Get user ID from Supabase Auth JWT
        console.log('🔍 Validating JWT with Supabase...');
        const userId = await getUserIdFromJWT(accessToken);
        console.log('👤 User ID from JWT:', userId || 'NONE');

        if (!userId) {
            console.error('❌ JWT validation failed');
            return createErrorResponse('invalid_token', 'Invalid or expired access token', 401);
        }

        console.log(`✅ User authenticated: ${userId}`);

        // Get default SMTP settings for the user
        const supabase = createSupabaseAdmin();

        const { data: defaultConfig, error: configError } = await supabase
            .from('default_sender_config')
            .select(`
                smtp_settings_id,
                smtp_settings (
                    elastic_email_api_key,
                    smtp_username,
                    smtp_password,
                    smtp_server,
                    smtp_port,
                    smtp_tls_enabled,
                    sender_email,
                    sender_name
                )
            `)
            .eq('user_id', userId)
            .single();

        if (configError || !defaultConfig) {
            return createErrorResponse('not_found', 'No default SMTP settings found. Please configure them first.', 404);
        }

        const settings = defaultConfig.smtp_settings as any;

        // Return SMTP credentials (decrypted from database)
        return createSuccessResponse({
            success: true,
            smtp_credentials: {
                api_key: settings.elastic_email_api_key,
                username: settings.smtp_username,
                password: settings.smtp_password,
                server: settings.smtp_server,
                port: settings.smtp_port,
                tls_enabled: settings.smtp_tls_enabled,
                sender_email: settings.sender_email,
                sender_name: settings.sender_name,
            },
        });

    } catch (error) {
        console.error('SMTP credentials get error:', error);
        return createErrorResponse('server_error', (error as Error).message, 500);
    }
});
