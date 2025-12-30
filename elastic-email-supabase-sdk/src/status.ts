import { ElasticEmailClient } from './client.ts';
import {
    EmailStatusResponse,
    EmailActivity,
    EmailActivityOptions,
    EmailStatus,
} from './types.ts';
import { ValidationError } from './errors.ts';

/**
 * Get the status of a specific email by transaction ID
 */
export async function getEmailStatus(
    client: ElasticEmailClient,
    transactionId: string
): Promise<EmailStatusResponse> {
    if (!transactionId) {
        throw new ValidationError('Transaction ID is required');
    }

    // Try the events endpoint which returns more complete data
    const response = await client.get<any>(`/events/${transactionId}`);

    // Handle array response - events might come as array
    const event = Array.isArray(response) ? response[0] : response;

    return {
        status: (event?.Status || event?.EventType || 'Unknown') as EmailStatus,
        date: event?.Date || event?.OccurredOn || new Date().toISOString(),
        recipient: event?.To || event?.Recipient || '',
        messageId: event?.MessageID || transactionId,
        transactionId: transactionId,
    };
}

/**
 * Get email activity logs with optional filtering
 */
export async function getEmailActivity(
    client: ElasticEmailClient,
    options: EmailActivityOptions = {}
): Promise<EmailActivity[]> {
    // Build query parameters
    const params = new URLSearchParams();

    if (options.limit) {
        params.append('limit', options.limit.toString());
    }

    if (options.offset) {
        params.append('offset', options.offset.toString());
    }

    if (options.from) {
        params.append('from', options.from);
    }

    if (options.to) {
        params.append('to', options.to);
    }

    if (options.status) {
        const statuses = Array.isArray(options.status)
            ? options.status
            : [options.status];
        statuses.forEach(status => params.append('status', status));
    }

    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

    const response = await client.get<Array<{
        TransactionID: string;
        MessageID: string;
        To: string;
        From: string;
        Subject: string;
        Status: string;
        Date: string;
        Channel: string;
    }>>(endpoint);

    // Handle both array response and object with Data field
    const data = Array.isArray(response) ? response : (response as any).Data || [];

    return data.map(item => ({
        transactionId: item.TransactionID,
        messageId: item.MessageID,
        to: item.To,
        from: item.From,
        subject: item.Subject,
        status: item.Status as EmailStatus,
        date: item.Date,
        channel: item.Channel,
    }));
}
