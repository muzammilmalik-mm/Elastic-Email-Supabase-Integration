import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Parse request body
        const { email, redirectTo } = await req.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Send password reset email
        console.log(`📧 Sending password reset email to: ${email}`);

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo || 'http://localhost:3000/reset'
        });

        if (error) {
            console.error('❌ Password reset error:', error);
            return new Response(
                JSON.stringify({
                    error: error.message,
                    details: error
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('✅ Password reset email sent successfully!');

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password reset email sent successfully',
                email: email,
                redirectTo: redirectTo || 'http://localhost:3000/reset',
                note: 'Check your email inbox (and spam folder) for the reset link'
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('💥 Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});
