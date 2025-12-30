import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to create Supabase admin client (bypasses RLS)
export function createSupabaseAdmin(): SupabaseClient {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    return createClient(supabaseUrl, supabaseServiceKey);
}

// Helper to create Supabase client with user context
export function createSupabaseClient(authToken?: string): SupabaseClient {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const client = createClient(supabaseUrl, supabaseAnonKey);

    // If auth token provided, set it
    if (authToken) {
        client.auth.setSession({
            access_token: authToken,
            refresh_token: '',
        } as any);
    }

    return client;
}

// Validate Supabase Auth JWT and get user ID
export async function getUserIdFromJWT(jwt: string): Promise<string | null> {
    const supabase = createSupabaseAdmin();

    const { data: { user }, error } = await supabase.auth.getUser(jwt);

    if (error || !user) {
        console.error('JWT validation error:', error?.message);
        return null;
    }

    return user.id;
}

// Get user ID from JWT token stored in our oauth_sessions table
export async function getUserIdFromAccessToken(accessToken: string): Promise<string | null> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('oauth_sessions')
        .select('user_id')
        .eq('access_token', accessToken)
        .gte('expires_at', new Date().toISOString())
        .single();

    if (error || !data) {
        return null;
    }

    return data.user_id;
}
