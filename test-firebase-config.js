const { config } = require('dotenv');

// Load environment variables
config();

console.log('🔍 Testing Firebase Configuration...\n');

// Check environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

console.log('FIREBASE_PROJECT_ID:', projectId ? '✅ Set' : '❌ Missing');
console.log('FIREBASE_SERVICE_ACCOUNT:', serviceAccountStr ? '✅ Set' : '❌ Missing');

if (!projectId || !serviceAccountStr) {
  console.log('\n❌ Missing required Firebase environment variables');
  process.exit(1);
}

// Try to parse the service account
let serviceAccountJson;
try {
  serviceAccountJson = JSON.parse(serviceAccountStr);
  console.log('\n✅ Service account JSON parsed successfully');
} catch (error) {
  console.log('\n❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON:', error.message);
  console.log('First 100 characters:', serviceAccountStr.substring(0, 100));
  process.exit(1);
}

// Check required fields
const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
const missingFields = requiredFields.filter(field => !serviceAccountJson[field]);

if (missingFields.length > 0) {
  console.log('\n❌ Missing required fields in service account:', missingFields.join(', '));
  process.exit(1);
}

console.log('\n✅ All required fields present');

// Analyze private key
const privateKey = serviceAccountJson.private_key;
console.log('\n🔑 Private Key Analysis:');
console.log('Length:', privateKey.length);
console.log('Starts with BEGIN:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
console.log('Ends with END:', privateKey.includes('-----END PRIVATE KEY-----'));
console.log('Contains \\\\n (double escaped):', privateKey.includes('\\\\n'));
console.log('Contains \\n (single escaped):', privateKey.includes('\\n'));
console.log('Contains actual newlines:', privateKey.includes('\n'));

console.log('\n📄 First 100 characters of private_key:');
console.log(privateKey.substring(0, 100));

console.log('\n📄 Last 100 characters of private_key:');
console.log(privateKey.substring(privateKey.length - 100));

// Test the processing logic from the service
console.log('\n🔧 Testing processing logic...');

let processedKey = privateKey;

// Remove quotes if present
if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
  processedKey = processedKey.slice(1, -1);
  console.log('Removed surrounding quotes');
}

// Handle escaping
processedKey = processedKey.replace(/\\\\n/g, '\\n');
processedKey = processedKey.replace(/\\n/g, '\n');
processedKey = processedKey.replace(/\\"/g, '"');
processedKey = processedKey.replace(/\\'/g, "'");

console.log('\n✅ Processing complete');
console.log('Processed key length:', processedKey.length);
console.log('Contains actual newlines:', processedKey.includes('\n'));
console.log('Starts with BEGIN:', processedKey.includes('-----BEGIN PRIVATE KEY-----'));
console.log('Ends with END:', processedKey.includes('-----END PRIVATE KEY-----'));

// Try to initialize Firebase with the processed key
console.log('\n🔥 Testing Firebase initialization...');

const testServiceAccount = {
  ...serviceAccountJson,
  private_key: processedKey
};

try {
  const admin = require('firebase-admin');

  const app = admin.initializeApp({
    credential: admin.credential.cert(testServiceAccount),
    projectId: projectId,
  }, 'test-app');

  console.log('✅ Firebase initialized successfully!');
  console.log('Project ID:', app.options.projectId);

  // Clean up
  app.delete().catch(() => {});

} catch (error) {
  console.log('❌ Firebase initialization failed:', error.message);
  if (error.message.includes('Invalid PEM')) {
    console.log('\n💡 PEM Error - this usually means the private key is still malformed');
    console.log('Check that your FIREBASE_SERVICE_ACCOUNT environment variable contains the exact JSON from Firebase Console');
  }
}

console.log('\n🏁 Test completed');
