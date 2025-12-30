// Elastic Email API Client for validating keys and fetching account info

export interface ElasticEmailAccount {
    email: string;
    publicAccountID: string;
    isSubAccount: boolean;
    reputation: number;
}

export interface SMTPCredentials {
    username: string;
    server: string;
    port: number;
    tlsEnabled: boolean;
}

export class ElasticEmailClient {
    private apiKey: string;
    private baseUrl = 'https://api.smtprelay.co';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async validateAndGetAccount(): Promise<ElasticEmailAccount> {
        try {
            // Use v3 API for SMTP Relay
            const response = await fetch(`${this.baseUrl}/v3/account`, {
                headers: {
                    'X-ElasticEmail-ApiKey': this.apiKey,
                },
            });

            if (!response.ok) {
                throw new Error('Invalid Elastic Email API key or account not accessible');
            }

            const data = await response.json();
            return {
                email: data.Profile?.Email || data.Email,
                publicAccountID: data.PublicAccountID || '',
                isSubAccount: data.IsSubAccount || false,
                reputation: data.Reputation || 0,
            };
        } catch (error) {
            throw new Error(`Failed to validate Elastic Email API key: ${(error as Error).message}`);
        }
    }

    getSMTPCredentials(accountEmail: string): SMTPCredentials {
        // Elastic Email SMTP configuration
        // Username is typically the account email
        // Note: SMTP password must be generated separately in Elastic Email dashboard
        // or via their API if they provide such endpoint
        return {
            username: accountEmail,
            server: 'smtp.elasticemail.com',
            port: 587,
            tlsEnabled: true,
        };
    }

    /**
     * Generate SMTP credentials (password) using Elastic Email API
     * Returns the SMTP password token
     */
    async generateSMTPCredential(email: string): Promise<string> {
        try {
            console.log('🔑 Generating SMTP credential for:', email);

            // Use elasticemail.com for SMTP credential generation (not smtprelay.co)
            const requestBody = {
                TokenName: email,
                AccessLevel: ['SendSmtp'],
                Type: 'SMTPCredential',
                Expires: null,
                RestrictAccessToIPRange: null,
            };

            console.log('Request body:', JSON.stringify(requestBody));

            const response = await fetch('https://api.elasticemail.com/v3/security/accesstokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ElasticEmail-ApiKey': this.apiKey,
                },
                body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error response:', errorData);
                throw new Error(`Failed to generate SMTP credentials: ${errorData}`);
            }

            const data = await response.json();
            console.log('✅ API Response received:', { Token: data.Token ? '***' : 'missing', Name: data.Name });

            return data.Token; // This is the SMTP password
        } catch (error) {
            console.error('❌ Exception in generateSMTPCredential:', error);
            throw new Error(`Failed to generate SMTP credential: ${(error as Error).message}`);
        }
    }
}

export async function validateElasticEmailKey(apiKey: string): Promise<{
    valid: boolean;
    account?: ElasticEmailAccount;
    error?: string;
}> {
    try {
        const client = new ElasticEmailClient(apiKey);
        const account = await client.validateAndGetAccount();
        return { valid: true, account };
    } catch (error) {
        return { valid: false, error: (error as Error).message };
    }
}
