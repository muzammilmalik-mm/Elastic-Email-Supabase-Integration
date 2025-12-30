import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function useOAuthCallback() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        handleCallback()
    }, [])

    const handleCallback = async () => {
        try {
            const params = new URLSearchParams(window.location.search)
            const code = params.get('code')
            const state = params.get('state')

            if (!code) {
                throw new Error('No authorization code received')
            }

            // Verify state (CSRF protection) - only if we saved one
            const savedState = sessionStorage.getItem('oauth_state')
            if (savedState && state !== savedState) {
                throw new Error('Invalid state parameter')
            }

            // Get PKCE code verifier (optional - only for flows that use PKCE)
            const codeVerifier = sessionStorage.getItem('pkce_verifier')

            // Exchange code for tokens
            const response = await fetch(
                'https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/oauth-token',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        code,
                        ...(codeVerifier && { code_verifier: codeVerifier }), // Only include if available
                        redirect_uri: `${window.location.origin}/auth/callback`,
                        client_id: '5a214a56-3a13-46d5-a871-a0d62758f1b2',
                        client_secret: 'AUu8xiC1sUPMRdpQKOg599gWuA_UTNL4U6lVpbyUvvc'
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Token exchange failed')
            }

            const { access_token, refresh_token, expires_in } = await response.json()

            // Save tokens to database
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Not authenticated')
            }

            const expiresAt = new Date(Date.now() + expires_in * 1000)

            await supabase
                .from('user_email_settings')
                .upsert({
                    user_id: user.id,
                    supabase_oauth_access_token: access_token,
                    supabase_oauth_refresh_token: refresh_token,
                    supabase_oauth_expires_at: expiresAt.toISOString()
                }, {
                    onConflict: 'user_id'
                })

            // Clean up session storage
            sessionStorage.removeItem('pkce_verifier')
            sessionStorage.removeItem('oauth_state')

            // Redirect to email setup
            navigate('/setup')
        } catch (err: any) {
            console.error('OAuth callback error:', err)
            setError(err.message)
            setLoading(false)
        }
    }

    return { loading, error, navigate }
}
