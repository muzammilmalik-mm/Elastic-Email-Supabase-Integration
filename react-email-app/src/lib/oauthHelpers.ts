// Helper to refresh OAuth token if needed
import { supabase } from './supabaseClient'

export async function getValidOAuthToken(): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

        const { data } = await supabase
            .from('user_email_settings')
            .select('supabase_oauth_access_token, supabase_oauth_refresh_token, supabase_oauth_expires_at')
            .eq('user_id', user.id)
            .maybeSingle()

        if (!data?.supabase_oauth_access_token) {
            return null
        }

        // Check if token expires in < 5 minutes
        const expiresAt = new Date(data.supabase_oauth_expires_at)
        const now = new Date()
        const fiveMinutes = 5 * 60 * 1000

        if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
            // Refresh the token
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-refresh`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        refreshToken: data.supabase_oauth_refresh_token
                    })
                }
            )

            if (!response.ok) {
                console.error('Token refresh failed')
                return null
            }

            const { access_token, expires_in } = await response.json()

            // Update database
            await supabase
                .from('user_email_settings')
                .update({
                    supabase_oauth_access_token: access_token,
                    supabase_oauth_expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
                })
                .eq('user_id', user.id)

            return access_token
        }

        return data.supabase_oauth_access_token
    } catch (error) {
        console.error('Error getting OAuth token:', error)
        return null
    }
}

export async function hasOAuthToken(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return false

        const { data } = await supabase
            .from('user_email_settings')
            .select('supabase_oauth_access_token')
            .eq('user_id', user.id)
            .maybeSingle()

        return !!data?.supabase_oauth_access_token
    } catch (error) {
        return false
    }
}
