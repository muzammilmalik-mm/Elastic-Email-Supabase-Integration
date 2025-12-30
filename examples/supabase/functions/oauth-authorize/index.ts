import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
    OAUTH_CONFIG,
    generateAuthorizationCode,
    createErrorResponse,
} from '../_shared/oauth-utils.ts';
import { createSupabaseAdmin } from '../_shared/supabase-client.ts';

serve(async (req) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return createErrorResponse('invalid_request', 'Method not allowed', 405);
    }

    try {
        const url = new URL(req.url);
        const params = url.searchParams;

        // Extract OAuth parameters
        const client_id = params.get('client_id');
        const redirect_uri = params.get('redirect_uri');
        const response_type = params.get('response_type');
        const state = params.get('state');
        const code_challenge = params.get('code_challenge');
        const code_challenge_method = params.get('code_challenge_method') || 'S256';
        const scope = params.get('scope') || 'smtp:write';

        // Validate required parameters
        if (!client_id) {
            return createErrorResponse('invalid_request', 'Missing client_id');
        }

        if (!redirect_uri) {
            return createErrorResponse('invalid_request', 'Missing redirect_uri');
        }

        if (response_type !== 'code') {
            return createErrorResponse('unsupported_response_type', 'Only code response type is supported');
        }

        // Validate client_id
        if (client_id !== OAUTH_CONFIG.CLIENT_ID) {
            return createErrorResponse('unauthorized_client', 'Invalid client_id');
        }

        // For testing, allow http://, https://, and file:// URIs
        if (!redirect_uri.startsWith('http://') && !redirect_uri.startsWith('https://') && !redirect_uri.startsWith('file://')) {
            return createErrorResponse('invalid_request', 'Invalid redirect_uri format');
        }

        // PKCE is strongly recommended
        if (!code_challenge) {
            console.warn('No code_challenge provided. PKCE is recommended for security.');
        }

        // Get authenticated user or use demo user for testing
        const authHeader = req.headers.get('Authorization');
        let userId: string | null = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const supabase = createSupabaseAdmin();
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                userId = user.id;
            }
        }

        // For testing: Use demo user if no authentication
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000001'; // Valid UUID for testing
            console.log('⚠️ Using demo user for testing');
        }

        // Generate authorization code
        const code = generateAuthorizationCode();
        const expiresAt = new Date(Date.now() + OAUTH_CONFIG.AUTHORIZATION_CODE_LIFETIME * 1000);

        // Store authorization code in database
        const supabase = createSupabaseAdmin();
        const { error: insertError } = await supabase
            .from('authorization_codes')
            .insert({
                code,
                client_id,
                user_id: userId,
                redirect_uri,
                code_challenge,
                code_challenge_method,
                scope,
                expires_at: expiresAt.toISOString(),
            });

        if (insertError) {
            console.error('Failed to store authorization code:', insertError);
            return createErrorResponse('server_error', 'Failed to generate authorization code', 500);
        }

        // Build redirect URL with authorization code
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', code);
        if (state) {
            redirectUrl.searchParams.set('state', state);
        }

        // Redirect user back to client application
        return new Response(null, {
            status: 302,
            headers: {
                'Location': redirectUrl.toString(),
            },
        });

    } catch (error) {
        console.error('Authorization error:', error);
        return createErrorResponse('server_error', (error as Error).message, 500);
    }
});
