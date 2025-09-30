const axios = require('axios');

async function testToggleActive() {
  try {
    console.log('Testing API key toggle active endpoint...');

    // First, login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/admin/auth/login', {
      email: 'superadmin@uberclone.com',
      password: 'SuperAdmin123!'
    });

    const accessToken = loginResponse.data.data.access_token;
    console.log('✅ Login successful');

    // Test toggle without body (should toggle current state)
    console.log('2. Testing toggle without body (should toggle current state)...');
    const toggleResponse1 = await axios.post('http://localhost:3000/admin/config/api-keys/2/toggle', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Toggle successful:', {
      id: toggleResponse1.data.data.id,
      name: toggleResponse1.data.data.name,
      isActive: toggleResponse1.data.data.isActive
    });

    // Test toggle with explicit body
    console.log('3. Testing toggle with explicit body...');
    const toggleResponse2 = await axios.post('http://localhost:3000/admin/config/api-keys/2/toggle', {
      active: false
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Toggle with body successful:', {
      id: toggleResponse2.data.data.id,
      name: toggleResponse2.data.data.name,
      isActive: toggleResponse2.data.data.isActive
    });

  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testToggleActive();
