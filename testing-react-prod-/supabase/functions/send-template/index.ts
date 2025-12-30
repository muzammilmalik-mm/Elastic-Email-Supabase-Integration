import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as ElasticEmail from 'npm:@elasticemail/elasticemail-client';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('FROM_NAME')!;

const defaultClient = ElasticEmail.ApiClient.instance;
const apikey = defaultClient.authentications['apikey'];
apikey.apiKey = API_KEY;

const api = new ElasticEmail.EmailsApi();

serve(async (req) => {
    const { to, templateName, templateData } = await req.json();

    const templateEmailData = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [new ElasticEmail.EmailRecipient(to)],
        Content: {
            TemplateName: templateName,
            Merge: templateData, // e.g., { name: "User" }
            From: `${FROM_NAME} <${FROM_EMAIL}>`
        }
    });

    return new Promise((resolve) => {
        api.emailsTransactionalPost(templateEmailData, (error, data, response) => {
            if (error) {
                const errorMsg = error.message || error.toString();
                if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('404')) {
                    resolve(new Response(JSON.stringify({ success: false, error: 'Template does not exist' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
                } else {
                    resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
                }
            } else {
                resolve(new Response(JSON.stringify({ success: true, transactionId: data.TransactionID }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
            }
        });
    });
});