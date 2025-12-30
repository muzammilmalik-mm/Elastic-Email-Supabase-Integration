/**
 * Elastic Email SDK for Supabase Edge Functions
 * 
 * A lightweight TypeScript SDK for integrating Elastic Email with Supabase
 * @module elastic-email-supabase
 */

// Export client
export { ElasticEmailClient } from './client.ts';

// Export email functions
export { sendEmail, sendTemplate } from './email.ts';

// Export status functions
export { getEmailStatus, getEmailActivity } from './status.ts';

// Export types
export type {
    ElasticEmailConfig,
    EmailRecipient,
    EmailContent,
    EmailBody,
    EmailAttachment,
    TemplateEmailContent,
    SendEmailResponse,
    EmailStatusResponse,
    EmailActivity,
    EmailActivityOptions,
    ApiErrorResponse,
} from './types.ts';

// Export enums
export { EmailStatus } from './types.ts';

// Export errors
export {
    ElasticEmailError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    NetworkError,
} from './errors.ts';

/**
 * Create a new Elastic Email client
 * 
 * @example
 * ```typescript
 * import { ElasticEmailClient, sendEmail } from 'elastic-email-supabase';
 * 
 * const client = new ElasticEmailClient({
 *   apiKey: 'your-api-key'
 * });
 * 
 * const result = await sendEmail(client, {
 *   from: { email: 'sender@example.com', name: 'Sender' },
 *   to: [{ email: 'recipient@example.com' }],
 *   subject: 'Hello from Elastic Email',
 *   body: {
 *     html: '<h1>Hello!</h1>'
 *   }
 * });
 * ```
 */
