import axios from 'axios';

async function testMarketing() {
    const emails = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
        'test4@example.com',
        'test5@example.com',
    ];

    console.log('Starting Marketing Module Test (Per-Message TTL)...');
    console.log('Sending 5 emails to trigger random failures and retries.');

    for (const email of emails) {
        try {
            await axios.post('http://localhost:3000/marketing', { email });
            console.log(`[SENT] Request for ${email} sent.`);
        } catch (error) {
            console.error(`[ERROR] Failed to send request for ${email}:`, error.message);
        }
    }

    console.log('\nCheck the application logs to see:');
    console.log('1. Random failures.');
    console.log('2. Retries with different delays (1s - 10s).');
    console.log('3. "Head-of-Line Blocking" if a short delay is blocked by a long delay.');
}

testMarketing();
