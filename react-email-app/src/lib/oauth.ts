// PKCE utilities for OAuth flow
export function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let text = ''
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

export async function sha256(plain: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return base64urlencode(hash)
}

function base64urlencode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let str = ''
    for (const byte of bytes) {
        str += String.fromCharCode(byte)
    }
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

export async function initiateOAuthFlow() {
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await sha256(codeVerifier)
    const state = generateRandomString(32)

    // Store in sessionStorage
    sessionStorage.setItem('pkce_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)

    // Build authorization URL
    const params = new URLSearchParams({
        client_id: '5a214a56-3a13-46d5-a871-a0d62758f1b2',
        redirect_uri: `${window.location.origin}/auth/callback`,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state
    })

    // Redirect to custom OAuth
    window.location.href = `https://qfyomvwcugkqlbskhzhu.supabase.co/functions/v1/oauth-authorize?${params}`
}
