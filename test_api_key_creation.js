const axios = require('axios');

async function loginAndCreateAPIKey() {
  try {
    console.log('1. Logging in as admin...');

    const loginResponse = await axios.post('http://localhost:3000/admin/auth/login', {
      email: 'superadmin@uberclone.com',
      password: 'SuperAdmin123!'
    });

    const accessToken = loginResponse.data.data.access_token;
    console.log('✅ Login successful, got access token');

    console.log('2. Testing API key creation endpoint...');

    const apiKeyData = {
      name: "Stripe Production Secret Key",
      service: "stripe",
      environment: "production",
      keyType: "secret",
      keyValue: "sk_live_1234567890abcdef",
      description: "Primary Stripe secret key for production payments",
      expiresAt: "2024-12-31T23:59:59Z",
      rotationPolicy: "auto_90d",
      isPrimary: true,
      accessLevel: "write",
      rateLimit: 100,
      tags: ["production", "critical"]
    };

    console.log('Sending request to create API key...');
    const response = await axios.post('http://localhost:3000/admin/config/api-keys', apiKeyData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ SUCCESS: API key created successfully!');
    console.log('Response:', {
      id: response.data.data.id,
      name: response.data.data.name,
      service: response.data.data.service,
      environment: response.data.data.environment,
      keyType: response.data.data.keyType,
      isActive: response.data.data.isActive,
      isPrimary: response.data.data.isPrimary,
      createdAt: response.data.data.createdAt
    });

  } catch (error) {
    console.log('❌ FAILED: API key creation failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

loginAndCreateAPIKey();
