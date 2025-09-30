const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 DEBUGGING ENVIRONMENT VARIABLE PARSING');
console.log('========================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log('📁 .env file path:', envPath);
console.log('📁 .env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('\n📄 RAW .ENV FILE CONTENT:');
  console.log('------------------------');

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach((line, index) => {
    if (line.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.log(`${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
      console.log(`   Full length: ${line.length}`);
      console.log(`   Starts with FIREBASE_SERVICE_ACCOUNT: ${line.startsWith('FIREBASE_SERVICE_ACCOUNT')}`);

      // Check if it's multiline
      if (line.includes('{') && !line.includes('}')) {
        console.log('   ⚠️  LINE APPEARS TO BE MULTILINE JSON START');
      }
    } else if (line.trim() && !line.startsWith('#')) {
      console.log(`${index + 1}: ${line.split('=')[0]}=***`);
    }
  });

  console.log('\n🔍 FIREBASE_SERVICE_ACCOUNT ANALYSIS:');
  console.log('------------------------------------');

  const firebaseLine = lines.find(line => line.includes('FIREBASE_SERVICE_ACCOUNT'));
  if (firebaseLine) {
    const parts = firebaseLine.split('=', 2);
    if (parts.length === 2) {
      const value = parts[1];
      console.log('Variable name:', parts[0]);
      console.log('Value length:', value.length);
      console.log('Value starts with:', value.substring(0, 50));
      console.log('Value ends with:', value.substring(Math.max(0, value.length - 50)));
      console.log('Contains {:', value.includes('{'));
      console.log('Contains }:', value.includes('}'));
      console.log('Contains newlines:', value.includes('\n'));

      // Check for quotes
      console.log('Starts with quote:', value.startsWith('"'));
      console.log('Ends with quote:', value.endsWith('"'));

      if (value.startsWith('"') && value.endsWith('"')) {
        const unquoted = value.slice(1, -1);
        console.log('Unquoted length:', unquoted.length);
        console.log('Unquoted contains newlines:', unquoted.includes('\n'));
      }
    }
  }
}

// Test dotenv loading
console.log('\n🔄 TESTING DOTENV LOADING:');
console.log('------------------------');

try {
  require('dotenv').config({ path: envPath });
  console.log('✅ dotenv.config() completed');

  console.log('process.env.FIREBASE_SERVICE_ACCOUNT length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 'undefined');
  console.log('process.env.FIREBASE_SERVICE_ACCOUNT starts with:', process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 50) || 'undefined');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ JSON.parse() succeeded');
    } catch (parseError) {
      console.log('❌ JSON.parse() failed:', parseError.message);
    }
  }
} catch (error) {
  console.log('❌ dotenv.config() failed:', error.message);
}

console.log('\n💡 POSSIBLE ISSUES:');
console.log('1. JSON spans multiple lines in .env file');
console.log('2. Missing quotes around JSON value');
console.log('3. JSON is truncated in .env file');
console.log('4. Special characters in JSON breaking parsing');

console.log('\n📋 RECOMMENDED FIX:');
console.log('1. Check your .env file');
console.log('2. Ensure FIREBASE_SERVICE_ACCOUNT is on a single line');
console.log('3. Ensure the entire JSON is on one line');
console.log('4. Use double quotes around the JSON value');
console.log('5. Example: FIREBASE_SERVICE_ACCOUNT="{\\"type\\":\\"service_account\\",...}"');

console.log('\n🏁 DEBUG COMPLETE');
