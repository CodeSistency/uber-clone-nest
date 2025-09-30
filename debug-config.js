const { config } = require('dotenv');

// Load environment variables
config();

console.log('🔧 DEBUGGING CONFIGURATION\n');

console.log('📦 DEPENDENCY VERSIONS:');
try {
  console.log('- Socket.IO:', require('socket.io/package.json').version);
} catch (e) {
  console.log('- Socket.IO: ❌ Not found');
}

try {
  console.log('- @socket.io/redis-adapter:', require('@socket.io/redis-adapter/package.json').version);
} catch (e) {
  console.log('- @socket.io/redis-adapter: ❌ Not found');
}

try {
  console.log('- redis:', require('redis/package.json').version);
} catch (e) {
  console.log('- redis: ❌ Not found');
}

try {
  console.log('- firebase-admin:', require('firebase-admin/package.json').version);
} catch (e) {
  console.log('- firebase-admin: ❌ Not found');
}

console.log('\n🔍 ENVIRONMENT VARIABLES:');

// Critical Firebase vars
console.log('\n🔥 FIREBASE:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Not set');
console.log('- FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? '✅ Set' : '❌ Not set');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  console.log('- Service Account Length:', sa.length);

  try {
    const parsed = JSON.parse(sa);
    console.log('- Service Account JSON: ✅ Valid');
    console.log('- Has private_key:', !!parsed.private_key);
    console.log('- Has client_email:', !!parsed.client_email);
    console.log('- Has project_id:', !!parsed.project_id);

    if (parsed.private_key) {
      const pk = parsed.private_key;
      console.log('- Private Key Length:', pk.length);
      console.log('- Starts with BEGIN:', pk.includes('-----BEGIN PRIVATE KEY-----'));
      console.log('- Ends with END:', pk.includes('-----END PRIVATE KEY-----'));
      console.log('- Contains newlines:', pk.includes('\n'));
      console.log('- Contains \\\\n:', pk.includes('\\\\n'));
      console.log('- Contains \\n:', pk.includes('\\n'));
    }
  } catch (e) {
    console.log('- Service Account JSON: ❌ Invalid -', e.message);
    console.log('- First 200 chars:', sa.substring(0, 200));
  }
}

// Redis vars
console.log('\n🔴 REDIS:');
console.log('- REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
console.log('- REDIS_HOST:', process.env.REDIS_HOST ? '✅ Set' : '❌ Not set');
console.log('- REDIS_PORT:', process.env.REDIS_PORT ? '✅ Set' : '❌ Not set');

// Other critical vars
console.log('\n💳 STRIPE:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');

console.log('\n🔐 JWT:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

console.log('\n🗄️  DATABASE:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

// Test Firebase initialization
console.log('\n🔥 TESTING FIREBASE INITIALIZATION:');
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const admin = require('firebase-admin');
    let serviceAccount;

    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // Apply the same processing as in the service
      if (serviceAccount.private_key) {
        let privateKey = serviceAccount.private_key;

        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }

        privateKey = privateKey.replace(/\\\\n/g, '\\n');
        privateKey = privateKey.replace(/\\n/g, '\n');
        privateKey = privateKey.replace(/\\"/g, '"');
        privateKey = privateKey.replace(/\\'/g, "'");

        serviceAccount.private_key = privateKey;
      }

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }, 'debug-test');

      console.log('✅ Firebase initialized successfully');
      console.log('- Project ID:', app.options.projectId);

      app.delete().catch(() => {});

    } catch (parseError) {
      console.log('❌ Failed to parse service account:', parseError.message);
    }

  } catch (error) {
    console.log('❌ Firebase initialization failed:', error.message);
  }
} else {
  console.log('❌ Missing Firebase configuration');
}

// Test Redis connection
console.log('\n🔴 TESTING REDIS CONNECTION:');
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    const { createClient } = require('redis');

    let redisUrl;
    if (process.env.REDIS_URL) {
      redisUrl = process.env.REDIS_URL;
    } else {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = process.env.REDIS_PORT || 6379;
      redisUrl = `redis://${host}:${port}`;
    }

    console.log('- Redis URL:', redisUrl);

    const client = createClient({ url: redisUrl });

    client.on('error', (err) => {
      console.log('❌ Redis connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    client.on('ready', () => {
      console.log('✅ Redis ready');
      client.quit();
    });

    // Try to connect with timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );

    Promise.race([connectPromise, timeoutPromise])
      .then(() => {
        console.log('✅ Redis connection test completed');
      })
      .catch((error) => {
        console.log('❌ Redis connection failed:', error.message);
      });

  } catch (error) {
    console.log('❌ Redis setup failed:', error.message);
  }
} else {
  console.log('❌ No Redis configuration found');
}

console.log('\n🏁 DEBUG COMPLETE');
