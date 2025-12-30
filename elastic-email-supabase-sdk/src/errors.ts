/**
 * Base error class for Elastic Email SDK
 */
export class ElasticEmailError extends Error {
    public readonly statusCode?: number;
    public readonly details?: any;

    constructor(message: string, statusCode?: number, details?: any) {
        super(message);
        this.name = 'ElasticEmailError';
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Authentication error - invalid or missing API key
 */
export class AuthenticationError extends ElasticEmailError {
    constructor(message = 'Invalid or missing API key') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Validation error - invalid request parameters
 */
export class ValidationError extends ElasticEmailError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
        this.name = 'ValidationError';
    }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends ElasticEmailError {
    public readonly retryAfter?: number;

    constructor(message = 'Rate limit exceeded', retryAfter?: number) {
        super(message, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Network error - request failed
 */
export class NetworkError extends ElasticEmailError {
    constructor(message: string, originalError?: Error) {
        super(message, undefined, originalError);
        this.name = 'NetworkError';
    }
}

/**
 * Parse API error from response
 */
export function parseApiError(statusCode: number, body: any): ElasticEmailError {
    const message = body?.error || body?.message || 'Unknown API error';

    switch (statusCode) {
        case 401:
        case 403:
            return new AuthenticationError(message);
        case 400:
            return new ValidationError(message, body?.details);
        case 429:
            const retryAfter = body?.retryAfter || body?.retry_after;
            return new RateLimitError(message, retryAfter);
        default:
            return new ElasticEmailError(message, statusCode, body);
    }
}
