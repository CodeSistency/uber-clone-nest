require('dotenv').config();

console.log('🔍 CHECKING FIREBASE ENVIRONMENT VARIABLES\n');

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

console.log('FIREBASE_PROJECT_ID:', projectId || '❌ NOT SET');
console.log('FIREBASE_SERVICE_ACCOUNT:', serviceAccount ? '✅ SET' : '❌ NOT SET');

if (serviceAccount) {
  console.log('\n📊 SERVICE ACCOUNT ANALYSIS:');
  console.log('- Length:', serviceAccount.length);
  console.log('- Starts with "{":', serviceAccount.trim().startsWith('{'));
  console.log('- Ends with "}":', serviceAccount.trim().endsWith('}'));
  console.log('- Contains "type":', serviceAccount.includes('"type"'));
  console.log('- Contains "private_key":', serviceAccount.includes('"private_key"'));

  console.log('\n📄 FIRST 200 CHARACTERS:');
  console.log(serviceAccount.substring(0, 200));

  if (serviceAccount.length > 200) {
    console.log('\n📄 LAST 200 CHARACTERS:');
    console.log(serviceAccount.substring(serviceAccount.length - 200));
  }

  console.log('\n🔍 RAW VALUE:');
  console.log(`"${serviceAccount}"`);

  // Try to parse
  try {
    const parsed = JSON.parse(serviceAccount);
    console.log('\n✅ JSON PARSING: SUCCESS');
    console.log('- Has type:', !!parsed.type);
    console.log('- Has project_id:', !!parsed.project_id);
    console.log('- Has private_key:', !!parsed.private_key);
    console.log('- Has client_email:', !!parsed.client_email);
  } catch (error) {
    console.log('\n❌ JSON PARSING: FAILED');
    console.log('Error:', error.message);
  }
}

console.log('\n📋 HOW TO FIX:');
console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
console.log('2. Click "Generate new private key"');
console.log('3. Download the JSON file');
console.log('4. Copy the ENTIRE content of the JSON file');
console.log('5. Set FIREBASE_SERVICE_ACCOUNT environment variable with the full JSON');
console.log('6. Restart your application');

console.log('\n💡 EXAMPLE (do not use this, use your real JSON):');
console.log('FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}');
