import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
    OAUTH_CONFIG,
    verifyCodeChallenge,
    generateAccessToken,
    generateRefreshToken,
    createErrorResponse,
    createSuccessResponse
} from '../_shared/oauth-utils.ts';
import { createSupabaseAdmin } from '../_shared/supabase-client.ts';

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return createErrorResponse('invalid_request', 'Method not allowed', 405);
    }

    try {
        // Parse request body (can be JSON or form-urlencoded)
        const contentType = req.headers.get('content-type') || '';
        let body: any = {};

        if (contentType.includes('application/json')) {
            body = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const text = await req.text();
            const params = new URLSearchParams(text);
            body = Object.fromEntries(params.entries());
        } else {
            return createErrorResponse('invalid_request', 'Unsupported content type');
        }

        const {
            grant_type,
            code,
            redirect_uri,
            client_id,
            client_secret,
            code_verifier,
            refresh_token,
        } = body;

        // Validate client credentials
        if (client_id !== OAUTH_CONFIG.CLIENT_ID || client_secret !== OAUTH_CONFIG.CLIENT_SECRET) {
            return createErrorResponse('invalid_client', 'Invalid client credentials', 401);
        }

        const supabase = createSupabaseAdmin();

        // Handle different grant types
        if (grant_type === 'authorization_code') {
            // Validate required parameters
            if (!code || !redirect_uri) {
                return createErrorResponse('invalid_request', 'Missing code or redirect_uri');
            }

            // Retrieve authorization code from database
            const { data: authCode, error: fetchError } = await supabase
                .from('authorization_codes')
                .select('*')
                .eq('code', code)
                .eq('client_id', client_id)
                .eq('used', false)
                .single();

            if (fetchError || !authCode) {
                return createErrorResponse('invalid_grant', 'Invalid or expired authorization code');
            }

            // Check if code has expired
            if (new Date(authCode.expires_at) < new Date()) {
                return createErrorResponse('invalid_grant', 'Authorization code has expired');
            }

            // Validate redirect_uri matches
            if (authCode.redirect_uri !== redirect_uri) {
                return createErrorResponse('invalid_grant', 'Redirect URI mismatch');
            }

            // Verify PKCE if code_challenge was provided
            if (authCode.code_challenge) {
                if (!code_verifier) {
                    return createErrorResponse('invalid_request', 'code_verifier is required');
                }

                const isValid = await verifyCodeChallenge(
                    code_verifier,
                    authCode.code_challenge,
                    authCode.code_challenge_method
                );

                if (!isValid) {
                    return createErrorResponse('invalid_grant', 'Invalid code_verifier');
                }
            }

            // Mark authorization code as used
            await supabase
                .from('authorization_codes')
                .update({ used: true })
                .eq('code', code);

            // Generate access and refresh tokens
            const accessToken = generateAccessToken();
            const refreshTokenValue = generateRefreshToken();
            const expiresAt = new Date(Date.now() + OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME * 1000);
            const refreshExpiresAt = new Date(Date.now() + OAUTH_CONFIG.REFRESH_TOKEN_LIFETIME * 1000);

            // Store session in database
            const { error: sessionError } = await supabase
                .from('oauth_sessions')
                .insert({
                    user_id: authCode.user_id,
                    client_id,
                    access_token: accessToken,
                    refresh_token: refreshTokenValue,
                    token_type: 'Bearer',
                    expires_at: expiresAt.toISOString(),
                    refresh_expires_at: refreshExpiresAt.toISOString(),
                    scope: authCode.scope,
                });

            if (sessionError) {
                console.error('Failed to create session:', sessionError);
                return createErrorResponse('server_error', 'Failed to create session', 500);
            }

            // Return tokens
            return createSuccessResponse({
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
                refresh_token: refreshTokenValue,
                scope: authCode.scope,
            });

        } else if (grant_type === 'refresh_token') {
            // Handle refresh token flow
            if (!refresh_token) {
                return createErrorResponse('invalid_request', 'Missing refresh_token');
            }

            // Retrieve session with refresh token
            const { data: session, error: fetchError } = await supabase
                .from('oauth_sessions')
                .select('*')
                .eq('refresh_token', refresh_token)
                .eq('client_id', client_id)
                .single();

            if (fetchError || !session) {
                return createErrorResponse('invalid_grant', 'Invalid refresh token');
            }

            // Check if refresh token has expired
            if (new Date(session.refresh_expires_at) < new Date()) {
                return createErrorResponse('invalid_grant', 'Refresh token has expired');
            }

            // Generate new access token (optionally rotate refresh token)
            const newAccessToken = generateAccessToken();
            const newExpiresAt = new Date(Date.now() + OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME * 1000);

            // Update session with new access token
            const { error: updateError } = await supabase
                .from('oauth_sessions')
                .update({
                    access_token: newAccessToken,
                    expires_at: newExpiresAt.toISOString(),
                })
                .eq('id', session.id);

            if (updateError) {
                console.error('Failed to update session:', updateError);
                return createErrorResponse('server_error', 'Failed to refresh token', 500);
            }

            // Return new access token
            return createSuccessResponse({
                access_token: newAccessToken,
                token_type: 'Bearer',
                expires_in: OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
                refresh_token: refresh_token, // Keep same refresh token
                scope: session.scope,
            });

        } else {
            return createErrorResponse('unsupported_grant_type', 'Only authorization_code and refresh_token grant types are supported');
        }

    } catch (error) {
        console.error('Token exchange error:', error);
        return createErrorResponse('server_error', (error as Error).message, 500);
    }
});
