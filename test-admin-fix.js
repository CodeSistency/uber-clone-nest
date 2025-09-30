// Test rápido para verificar que el fix funciona
const axios = require('axios');

async function testFix() {
  const BASE_URL = 'http://localhost:3000';

  console.log('🧪 Probando el fix del admin...\n');

  try {
    // 1. Login
    console.log('1️⃣ Login...');
    const login = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@uberclone.com',
      password: 'Admin123!'
    });
    console.log('✅ Login exitoso');
    const token = login.data.accessToken;

    // 2. Probar endpoint protegido
    console.log('\n2️⃣ Probando /admin/dashboard/metrics...');
    const dashboard = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('🎉 ¡FIX FUNCIONANDO! Dashboard data:', {
      totalUsers: dashboard.data.totalUsers,
      totalDrivers: dashboard.data.totalDrivers
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    console.error('🔍 Status:', error.response?.status);
  }
}

testFix();
