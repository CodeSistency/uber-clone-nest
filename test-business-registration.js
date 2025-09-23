// Test script for business user registration endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testBusinessRegistration() {
  try {
    console.log('🧪 Testing Business User Registration Endpoint');
    console.log('=' .repeat(50));

    const testData = {
      name: 'John Business',
      email: 'business.test@example.com',
      password: 'Business123!',
      phone: '+1234567890'
    };

    console.log('📤 Sending registration request...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${API_BASE_URL}/admin/auth/register`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Access Token:', response.data.accessToken ? '✅ Present' : '❌ Missing');
    console.log('Refresh Token:', response.data.refreshToken ? '✅ Present' : '❌ Missing');
    console.log('User Info:', JSON.stringify({
      id: response.data.admin.id,
      name: response.data.admin.name,
      email: response.data.admin.email,
      role: response.data.admin.adminRole,
      permissions: response.data.admin.adminPermissions
    }, null, 2));
    console.log('Expires In:', response.data.expiresIn, 'seconds');

    // Test using the access token for authentication
    console.log('\n🔄 Testing authentication with the new token...');
    try {
      const authResponse = await axios.get(`${API_BASE_URL}/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${response.data.accessToken}`
        }
      });
      console.log('✅ Token authentication successful!');
      console.log('Authenticated User:', authResponse.data.name);
    } catch (error) {
      console.log('❌ Token authentication failed:', error.response?.data || error.message);
    }

    // Test duplicate email
    console.log('\n🔄 Testing duplicate email...');
    try {
      await axios.post(`${API_BASE_URL}/admin/auth/register`, testData);
      console.log('❌ Should have failed with duplicate email');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected duplicate email');
        console.log('Error:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.log('\n❌ Registration failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Test invalid data
async function testInvalidData() {
  try {
    console.log('\n🧪 Testing Invalid Data');
    console.log('=' .repeat(30));

    const invalidData = {
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: not an email
      password: '123' // Invalid: too short
    };

    console.log('📤 Sending invalid registration request...');
    await axios.post(`${API_BASE_URL}/admin/auth/register`, invalidData);
    console.log('❌ Should have failed with validation errors');

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid data');
      console.log('Validation errors:', error.response.data);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Run tests
async function runTests() {
  try {
    await testBusinessRegistration();
    await testInvalidData();
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { testBusinessRegistration, testInvalidData };
