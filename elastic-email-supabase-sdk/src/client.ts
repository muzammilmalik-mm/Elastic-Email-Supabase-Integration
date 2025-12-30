import { ElasticEmailConfig } from './types.ts';
import { ElasticEmailError, NetworkError, parseApiError } from './errors.ts';

/**
 * Elastic Email API Client
 * Handles HTTP requests to the Elastic Email API v4
 */
export class ElasticEmailClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: ElasticEmailConfig) {
        if (!config.apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://api.elasticemail.com/v4';
    }

    /**
     * Make an authenticated request to the Elastic Email API
     */
    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-ElasticEmail-ApiKey': this.apiKey,
            ...((options.headers as Record<string, string>) || {}),
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Get response body
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');
            const body = isJson ? await response.json() : await response.text();

            // Check for errors
            if (!response.ok) {
                throw parseApiError(response.status, body);
            }

            return body as T;
        } catch (error) {
            // Re-throw our own errors
            if (error instanceof ElasticEmailError) {
                throw error;
            }

            // Wrap network errors
            throw new NetworkError(
                `Failed to make request to ${endpoint}: ${(error as Error).message}`,
                error as Error
            );
        }
    }

    /**
     * Make a GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * Make a POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Make a PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}
