import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as ElasticEmail from 'npm:@elasticemail/elasticemail-client';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('FROM_NAME')!;

// Configure the client
const defaultClient = ElasticEmail.ApiClient.instance;
const apikey = defaultClient.authentications['apikey'];
apikey.apiKey = API_KEY;

const api = new ElasticEmail.EmailsApi();

serve(async (req) => {
    const { to, subject, html } = await req.json();

    const emailData = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [new ElasticEmail.EmailRecipient(to)],
        Content: {
            Body: [ElasticEmail.BodyPart.constructFromObject({
                ContentType: "HTML",
                Content: html
            })],
            Subject: subject,
            From: `${FROM_NAME} <${FROM_EMAIL}>`
        }
    });

    return new Promise((resolve) => {
        api.emailsPost(emailData, (error, data, response) => {
            if (error) {
                resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 }));
            } else {
                // IMPORTANT: The result contains the TransactionID
                resolve(new Response(JSON.stringify({
                    success: true,
                    transactionId: data.TransactionID
                })));
            }
        });
    });
});