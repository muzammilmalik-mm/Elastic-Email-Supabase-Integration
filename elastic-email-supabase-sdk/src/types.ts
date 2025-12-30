/**
 * Elastic Email API Configuration
 */
export interface ElasticEmailConfig {
    apiKey: string;
    baseUrl?: string;
}

/**
 * Email recipient
 */
export interface EmailRecipient {
    email: string;
    name?: string;
}

/**
 * Email content
 */
export interface EmailContent {
    from: EmailRecipient;
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    body?: EmailBody;
    replyTo?: EmailRecipient;
    attachments?: EmailAttachment[];
}

/**
 * Email body content with HTML and plain text options
 */
export interface EmailBody {
    html?: string;
    text?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
    /** File name with extension (e.g., 'document.pdf') */
    filename: string;
    /** Base64-encoded file content */
    content: string;
    /** MIME type (e.g., 'application/pdf', 'image/png') */
    contentType: string;
}

/**
 * Template email request
 */
export interface TemplateEmailContent {
    from: EmailRecipient;
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    templateName: string;
    templateData?: Record<string, any>;
    replyTo?: EmailRecipient;
}

/**
 * Email send response
 */
export interface SendEmailResponse {
    transactionId: string;
    messageId: string;
}

/**
 * Email status types
 */
export enum EmailStatus {
    ReadyToSend = 'ReadyToSend',
    InProgress = 'InProgress',
    Sent = 'Sent',
    Opened = 'Opened',
    Clicked = 'Clicked',
    Bounced = 'Bounced',
    Unsubscribed = 'Unsubscribed',
    AbuseReport = 'AbuseReport',
    Failed = 'Failed'
}

/**
 * Email status response
 */
export interface EmailStatusResponse {
    status: EmailStatus;
    date: string;
    recipient: string;
    messageId: string;
    transactionId: string;
}

/**
 * Email activity log entry
 */
export interface EmailActivity {
    transactionId: string;
    messageId: string;
    to: string;
    from: string;
    subject: string;
    status: EmailStatus;
    date: string;
    channel: string;
}

/**
 * Email activity query options
 */
export interface EmailActivityOptions {
    status?: EmailStatus | EmailStatus[];
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
    error: string;
    message?: string;
    details?: any;
}
