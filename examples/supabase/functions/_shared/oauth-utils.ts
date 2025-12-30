import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

// OAuth Configuration
export const OAUTH_CONFIG = {
    CLIENT_ID: Deno.env.get('OAUTH_CLIENT_ID') || '5a214a56-3a13-46d5-a871-a0d62758f1b2',
    CLIENT_SECRET: Deno.env.get('OAUTH_CLIENT_SECRET') || 'AUu8xiC1sUPMRdpQKOg599gWuA_UTNL4U6lVpbyUvvc',
    ACCESS_TOKEN_LIFETIME: 3600, // 1 hour in seconds
    REFRESH_TOKEN_LIFETIME: 2592000, // 30 days in seconds
    AUTHORIZATION_CODE_LIFETIME: 600, // 10 minutes in seconds
};

// PKCE utilities
export function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    return Array.from(randomArray, (byte) => chars[byte % chars.length]).join('');
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);

    // Convert ArrayBuffer to base64 string
    const hashArray = Array.from(new Uint8Array(hash));
    const hashString = String.fromCharCode(...hashArray);

    return btoa(hashString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export async function verifyCodeChallenge(
    codeVerifier: string,
    codeChallenge: string,
    method: string = 'S256'
): Promise<boolean> {
    if (method === 'plain') {
        return codeVerifier === codeChallenge;
    }

    if (method === 'S256') {
        const computed = await generateCodeChallenge(codeVerifier);
        return computed === codeChallenge;
    }

    return false;
}

// JWT utilities
export async function generateJWT(
    payload: Record<string, any>,
    expiresIn: number = OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME
): Promise<string> {
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'default-secret-change-in-production';
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(jwtSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    const jwt = await create(
        { alg: 'HS256', typ: 'JWT' },
        {
            ...payload,
            exp: getNumericDate(expiresIn),
            iat: getNumericDate(0),
        },
        key
    );

    return jwt;
}

export async function verifyJWT(token: string): Promise<any> {
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'default-secret-change-in-production';
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(jwtSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    try {
        const payload = await verify(token, key);
        return payload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

// Authorization code generation
export function generateAuthorizationCode(): string {
    return generateRandomString(32);
}

// Token generation
export function generateAccessToken(): string {
    return generateRandomString(64);
}

export function generateRefreshToken(): string {
    return generateRandomString(64);
}

// Extract Bearer token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
}

// Validate redirect URI
export function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
    return allowedUris.some(allowed => uri.startsWith(allowed));
}

// Create error response
export function createErrorResponse(
    error: string,
    errorDescription?: string,
    statusCode: number = 400
): Response {
    return new Response(
        JSON.stringify({
            error,
            error_description: errorDescription,
        }),
        {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

// Create success response
export function createSuccessResponse(data: any, statusCode: number = 200): Response {
    return new Response(
        JSON.stringify(data),
        {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
