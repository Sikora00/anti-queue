const fetch = require('node-fetch'); // You might need to install node-fetch if using older node, or use built-in fetch in Node 18+

async function sendEmail(email) {
  try {
    const response = await fetch('http://localhost:3000/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    console.log(`[${response.status}] Sent ${email}:`, data);
  } catch (error) {
    console.error(`Failed to send ${email}:`, error.message);
  }
}

async function run() {
  console.log('Starting verification...');
  
  // 1. Send a few successful emails (hopefully, depending on random failure)
  for (let i = 0; i < 5; i++) {
    await sendEmail(`user${i}@example.com`);
    await new Promise(r => setTimeout(r, 1000)); // Wait a bit between requests
  }

  console.log('--- Burst mode to trigger Circuit Breaker ---');
  // 2. Send a burst of emails to trigger Circuit Breaker
  const promises = [];
  for (let i = 5; i < 25; i++) {
    promises.push(sendEmail(`burst${i}@example.com`));
  }
  await Promise.all(promises);

  console.log('Verification finished. Check server logs for processing details.');
}

run();
