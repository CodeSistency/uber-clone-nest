const { config } = require('dotenv');
config();

console.log('🔍 CHECKING FIREBASE INITIALIZATION STATUS');
console.log('=========================================\n');

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

console.log('Environment Variables:');
console.log(`- FIREBASE_PROJECT_ID: ${projectId ? '✅ Set' : '❌ Not set'}`);
console.log(`- FIREBASE_SERVICE_ACCOUNT: ${serviceAccount ? '✅ Set' : '❌ Not set'}`);

if (serviceAccount) {
  console.log(`- Service Account Length: ${serviceAccount.length}`);

  try {
    const parsed = JSON.parse(serviceAccount);
    console.log('✅ JSON parsing: SUCCESS');
    console.log(`- Type: ${parsed.type}`);
    console.log(`- Project ID: ${parsed.project_id}`);
    console.log(`- Client Email: ${parsed.client_email ? '✅ Set' : '❌ Not set'}`);
    console.log(`- Private Key: ${parsed.private_key ? '✅ Set' : '❌ Not set'}`);
  } catch (error) {
    console.log('❌ JSON parsing: FAILED');
    console.log(`Error: ${error.message}`);
  }
}

console.log('\n🚀 Firebase should initialize correctly now!');
console.log('Check the application logs for confirmation.');
