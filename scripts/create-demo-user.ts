import crypto from 'crypto';

const DEMO_API_KEY = 'demo_' + crypto.randomBytes(32).toString('hex');

async function createDemoApiKey() {
  try {
    // Store the demo API key in a file or database
    // For now, we'll just log it
    console.log('Demo API Key created successfully:');
    console.log(DEMO_API_KEY);
    console.log('\nPlease store this API key securely and provide it to users who need demo access.');

  } catch (error) {
    console.error('Error creating demo API key:', error);
    process.exit(1);
  }
}

createDemoApiKey(); 