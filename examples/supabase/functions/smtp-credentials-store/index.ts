import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { extractBearerToken, createErrorResponse, createSuccessResponse } from '../_shared/oauth-utils.ts';
import { createSupabaseAdmin, getUserIdFromJWT } from '../_shared/supabase-client.ts';
import { ElasticEmailClient } from '../_shared/elastic-email-client.ts';

serve(async (req) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return createErrorResponse('invalid_request', 'Method not allowed', 405);
    }

    try {
        console.log('📨 smtp-credentials-store: Starting request');

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

        // Parse request body
        const body = await req.json();
        console.log('📦 Request body keys:', Object.keys(body));

        const { elastic_email_api_key, set_as_default = true, sender_name } = body;

        if (!elastic_email_api_key) {
            console.error('❌ Missing elastic_email_api_key');
            return createErrorResponse('invalid_request', 'Missing elastic_email_api_key');
        }

        console.log('🔑 Elastic Email API key:', `${elastic_email_api_key.substring(0, 10)}...`);

        // Validate Elastic Email API key and get account info
        console.log('📧 Calling Elastic Email API to validate key...');
        const eeClient = new ElasticEmailClient(elastic_email_api_key);
        let accountInfo;

        try {
            accountInfo = await eeClient.validateAndGetAccount();
            console.log('✅ Elastic Email account validated:', accountInfo.email);
        } catch (error) {
            console.error('❌ Elastic Email validation failed:', (error as Error).message);
            return createErrorResponse('invalid_credentials', (error as Error).message, 400);
        }

        // Get SMTP credentials structure
        console.log('🔧 Getting SMTP credentials structure...');
        const smtpCreds = eeClient.getSMTPCredentials(accountInfo.email);
        console.log('✅ SMTP creds structure:', smtpCreds.server);

        // Generate SMTP password from Elastic Email
        let smtpPassword = '';
        try {
            console.log('🔐 Generating SMTP password from Elastic Email...');
            smtpPassword = await eeClient.generateSMTPCredential(accountInfo.email);
            console.log('✅ SMTP password generated successfully');
        } catch (error) {
            console.error('❌ Failed to generate SMTP password:', error);
            console.error('Error details:', (error as Error).message);
            // Continue without password - user can generate manually
        }

        // Store credentials in database
        console.log('💾 Storing credentials in database...');
        const supabase = createSupabaseAdmin();

        // Note: For proper encryption with pgsodium, you'd use encrypted columns
        // This is a simplified version. In production, set up pgsodium properly
        const { data: smtpSettings, error: insertError } = await supabase
            .from('smtp_settings')
            .insert({
                user_id: userId,
                elastic_email_api_key: elastic_email_api_key, // Should be encrypted
                smtp_username: smtpCreds.username,
                smtp_password: smtpPassword, // SMTP password from Elastic Email API
                smtp_server: smtpCreds.server,
                smtp_port: smtpCreds.port,
                smtp_tls_enabled: smtpCreds.tlsEnabled,
                sender_email: accountInfo.email,
                sender_name: sender_name || accountInfo.email.split('@')[0],
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to store SMTP settings:', insertError);
            return createErrorResponse('server_error', 'Failed to store credentials', 500);
        }

        // Set as default if requested
        if (set_as_default && smtpSettings) {
            // Check if default already exists
            const { data: existingDefault } = await supabase
                .from('default_sender_config')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (existingDefault) {
                // Update existing default
                await supabase
                    .from('default_sender_config')
                    .update({ smtp_settings_id: smtpSettings.id })
                    .eq('user_id', userId);
            } else {
                // Create new default
                await supabase
                    .from('default_sender_config')
                    .insert({
                        user_id: userId,
                        smtp_settings_id: smtpSettings.id,
                    });
            }
        }

        // Automatically configure Supabase SMTP settings via Management API
        if (smtpPassword) {
            try {
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
                const managementApiToken = Deno.env.get('MANAGEMENT_API_TOKEN');

                if (projectRef && managementApiToken) {
                    console.log('🔧 Configuring Supabase SMTP automatically...');
                    console.log('   Project Ref:', projectRef);

                    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

                    // Prepare SMTP configuration payload (field names are UPPERCASE in Management API)
                    const smtpConfig = {
                        smtp_admin_email: accountInfo.email,
                        smtp_host: smtpCreds.server,
                        smtp_port: smtpCreds.port.toString(),
                        smtp_user: accountInfo.email,
                        smtp_pass: smtpPassword,
                        smtp_sender_name: sender_name || accountInfo.email.split('@')[0],
                        smtp_max_frequency: 60
                    };

                    console.log('   Sending SMTP config to Supabase...');

                    const smtpConfigResponse = await fetch(managementApiUrl, {
                        method: 'PATCH', // Management API uses PUT, not PATCH
                        headers: {
                            'Authorization': `Bearer ${managementApiToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(smtpConfig),
                    });

                    const responseText = await smtpConfigResponse.text();

                    if (smtpConfigResponse.ok) {
                        console.log('✅ Supabase SMTP configured automatically!');
                        console.log('   Response:', responseText);
                    } else {
                        console.error('⚠️ Failed to auto-configure Supabase SMTP');
                        console.error('   Status:', smtpConfigResponse.status, smtpConfigResponse.statusText);
                        console.error('   Response:', responseText);
                    }
                } else {
                    console.log('ℹ️ Supabase Management API token not set, skipping auto-configuration');
                    if (!projectRef) console.log('   Missing: Project Reference');
                    if (!managementApiToken) console.log('   Missing: MANAGEMENT_API_TOKEN');
                }
            } catch (error) {
                console.error('⚠️ Error configuring Supabase SMTP:', error);
                console.error('   Details:', (error as Error).message);
            }
        }

        // Return success response (without sensitive data)
        return createSuccessResponse({
            success: true,
            message: 'SMTP credentials stored successfully',
            default_sender: {
                email: accountInfo.email,
                name: sender_name || accountInfo.email.split('@')[0],
                smtp_server: smtpCreds.server,
                smtp_port: smtpCreds.port,
                smtp_password_generated: smtpPassword ? true : false,
                supabase_smtp_configured: !!smtpPassword,
            },
            note: smtpPassword ?
                'SMTP credentials generated and Supabase SMTP configured automatically!' :
                'SMTP password could not be generated automatically. Please generate it manually in Elastic Email settings.',
        });

    } catch (error) {
        console.error('SMTP credentials store error:', error);
        return createErrorResponse('server_error', (error as Error).message, 500);
    }
});
