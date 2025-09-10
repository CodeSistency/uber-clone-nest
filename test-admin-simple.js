// Script simple para probar el sistema admin
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

async function testAdminLogin() {
  try {
    console.log('🚀 Probando login de admin...');

    const response = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);

    console.log('✅ Login exitoso!');
    console.log('📋 Token recibido:', response.data.accessToken);
    console.log('👤 Admin info:', response.data.admin);

    // Probar endpoint protegido con el token
    console.log('\n🔐 Probando endpoint protegido...');

    const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
      headers: {
        'Authorization': `Bearer ${response.data.accessToken}`
      }
    });

    console.log('✅ Dashboard accesible!');
    console.log('📊 Métricas obtenidas:', Object.keys(dashboardResponse.data));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n💡 Posibles causas del error 401:');
      console.log('1. La aplicación no está corriendo (npm run start:dev)');
      console.log('2. La base de datos no tiene usuarios admin (npm run db:seed)');
      console.log('3. Las variables de entorno no están configuradas');
    }
  }
}

// Ejecutar prueba
testAdminLogin();
