// Quick test to verify SMTP password generation works
const API_KEY = '8ED513FE70EDBF702CB6D30047F8F7CA7A9BBDEE9B4CD97EAE2C3F7CA64A2FD92C9AE014E3BD1B64F74B29345993DB43';
const email = 'muzammil.malik@elasticemail.com';

async function testSMTPGeneration() {
    try {
        console.log('Testing SMTP credential generation...');

        const response = await fetch('https://api.elasticemail.com/v3/security/accesstokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ElasticEmail-ApiKey': API_KEY,
            },
            body: JSON.stringify({
                TokenName: email,
                AccessLevel: ['SendSmtp'],
                Type: 'SMTPCredential',
                Expires: null,
                RestrictAccessToIPRange: null,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Failed:', errorData);
            return;
        }

        const data = await response.json();
        console.log('✅ Success! SMTP Password Generated:');
        console.log('Token:', data.Token);
        console.log('Name:', data.Name);
        console.log('MaskedToken:', data.MaskedToken);
        console.log('\nFull response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSMTPGeneration();
