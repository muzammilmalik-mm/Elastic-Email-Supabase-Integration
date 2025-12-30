import { ElasticEmailClient } from './client.ts';
import {
    EmailContent,
    EmailRecipient,
    SendEmailResponse,
    TemplateEmailContent,
} from './types.ts';
import { ValidationError } from './errors.ts';

/**
 * Format email recipient for API
 */
function formatRecipient(recipient: EmailRecipient): string {
    if (recipient.name) {
        return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email;
}

/**
 * Format array of recipients for API
 */
function formatRecipients(recipients: EmailRecipient[]): string[] {
    return recipients.map(formatRecipient);
}

/**
 * Send a transactional email
 */
export async function sendEmail(
    client: ElasticEmailClient,
    content: EmailContent
): Promise<SendEmailResponse> {
    // Validate required fields
    if (!content.from?.email) {
        throw new ValidationError('From email is required');
    }

    if (!content.to || content.to.length === 0) {
        throw new ValidationError('At least one recipient is required');
    }

    if (!content.subject) {
        throw new ValidationError('Subject is required');
    }

    if (!content.body?.html && !content.body?.text) {
        throw new ValidationError('Email body (HTML or text) is required');
    }

    // Build request payload
    const payload: any = {
        Recipients: {
            To: formatRecipients(content.to),
        },
        Content: {
            From: formatRecipient(content.from),
            Subject: content.subject,
        },
    };

    // Add optional fields
    if (content.cc && content.cc.length > 0) {
        payload.Recipients.CC = formatRecipients(content.cc);
    }

    if (content.bcc && content.bcc.length > 0) {
        payload.Recipients.BCC = formatRecipients(content.bcc);
    }


    if (content.body?.html) {
        payload.Content.Body = [{
            ContentType: 'HTML',
            Content: content.body.html,
        }];
    } else if (content.body?.text) {
        payload.Content.Body = [{
            ContentType: 'PlainText',
            Content: content.body.text,
        }];
    }

    if (content.replyTo) {
        payload.Content.ReplyTo = formatRecipient(content.replyTo);
    }

    // Add attachments if provided
    if (content.attachments && content.attachments.length > 0) {
        payload.Content.Attachments = content.attachments.map(att => ({
            BinaryContent: att.content,
            Name: att.filename,
            ContentType: att.contentType,
        }));
    }


    // Send request
    const response = await client.post<{ TransactionID: string; MessageID: string }>(
        '/emails/transactional',
        payload
    );

    return {
        transactionId: response.TransactionID,
        messageId: response.MessageID,
    };
}

/**
 * Send an email using a template
 */
export async function sendTemplate(
    client: ElasticEmailClient,
    content: TemplateEmailContent
): Promise<SendEmailResponse> {
    // Validate required fields
    if (!content.from?.email) {
        throw new ValidationError('From email is required');
    }

    if (!content.to || content.to.length === 0) {
        throw new ValidationError('At least one recipient is required');
    }

    if (!content.templateName) {
        throw new ValidationError('Template name is required');
    }

    // Build request payload
    const payload: any = {
        Recipients: {
            To: formatRecipients(content.to),
        },
        Content: {
            From: formatRecipient(content.from),
            TemplateName: content.templateName,
        },
    };

    // Add optional fields
    if (content.cc && content.cc.length > 0) {
        payload.Recipients.CC = formatRecipients(content.cc);
    }

    if (content.bcc && content.bcc.length > 0) {
        payload.Recipients.BCC = formatRecipients(content.bcc);
    }

    if (content.templateData) {
        payload.Content.Merge = content.templateData;
    }

    if (content.replyTo) {
        payload.Content.ReplyTo = formatRecipient(content.replyTo);
    }

    // Send request
    const response = await client.post<{ TransactionID: string; MessageID: string }>(
        '/emails/transactional',
        payload
    );

    return {
        transactionId: response.TransactionID,
        messageId: response.MessageID,
    };
}
