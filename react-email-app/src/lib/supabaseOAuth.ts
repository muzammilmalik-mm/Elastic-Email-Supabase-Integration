// src/lib/supabaseOAuth.ts
// Supabase OAuth integration

const SUPABASE_OAUTH_CLIENT_ID = import.meta.env.VITE_SUPABASE_OAUTH_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SUPABASE_OAUTH_REDIRECT_URI;

/**
 * Start Supabase OAuth authorization flow
 * Redirects user to Supabase to authorize access to their organization
 */
export function initiateSupabaseOAuth() {
    const params = new URLSearchParams({
        client_id: SUPABASE_OAUTH_CLIENT_ID,
        response_type: 'code',
        scope: 'all',
        redirect_uri: REDIRECT_URI,
    });

    const authUrl = `https://api.supabase.com/v1/oauth/authorize?${params.toString()}`;

    console.log('Starting Supabase OAuth flow...');
    console.log('Redirect URI:', REDIRECT_URI);

    window.location.href = authUrl;
}

/**
 * Parse authorization code from callback URL
 */
export function getAuthorizationCode(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
}

/**
 * Exchange authorization code for access token
 * This should be called from your backend/Edge Function
 */
export async function exchangeCodeForToken(code: string) {
    // Call your Edge Function that handles token exchange
    const response = await fetch('/api/supabase-oauth-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange authorization code');
    }

    return response.json();
}

/**
 * Fetch user's Supabase projects using the OAuth token
 */
export async function fetchSupabaseProjects(accessToken: string) {
    const response = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Supabase projects');
    }

    return response.json();
}

/**
 * Configure SMTP for a Supabase project
 */
export async function configureProjectSMTP(
    accessToken: string,
    projectRef: string,
    smtpConfig: {
        smtp_host: string;
        smtp_port: string;
        smtp_user: string;
        smtp_pass: string;
        smtp_admin_email: string;
        smtp_sender_name: string;
    }
) {
    const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smtpConfig),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to configure SMTP: ${error}`);
    }

    return response.json();
}
