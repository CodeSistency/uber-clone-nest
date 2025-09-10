// Script para probar todos los endpoints del admin
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

async function testAllAdminEndpoints() {
  console.log('🧪 Probando TODOS los endpoints del admin...\n');

  let adminToken = '';
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const logResult = (endpoint, success, error = null) => {
    testResults.total++;
    if (success) {
      testResults.passed++;
      console.log(`✅ ${endpoint} - OK`);
    } else {
      testResults.failed++;
      console.log(`❌ ${endpoint} - ERROR: ${error}`);
    }
  };

  try {
    // 1. Probar endpoint de configuración
    console.log('1️⃣ Probando configuración del sistema...');
    const config = await axios.post(`${BASE_URL}/admin/auth/test-login`, {});
    logResult('POST /admin/auth/test-login', true);
    console.log('   📋 JWT:', config.data.jwtConfig);
    console.log('   🗄️  DB:', config.data.testToken.generated ? 'OK' : 'ERROR');

    // 2. Probar login
    console.log('\n2️⃣ Probando login de admin...');
    const login = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    adminToken = login.data.accessToken;
    logResult('POST /admin/auth/login', true);
    console.log('   📋 Token obtenido correctamente');

    // 3. Probar endpoint de test básico
    console.log('\n3️⃣ Probando endpoint de test...');
    const test = await axios.get(`${BASE_URL}/admin/test`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/test', true);
    console.log('   🗄️  Database:', test.data.database);
    console.log('   🔐 JWT:', test.data.jwt);

    // 4. Probar dashboard
    console.log('\n4️⃣ Probando dashboard...');
    const dashboard = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/dashboard/metrics', true);
    console.log('   📊 Usuarios:', dashboard.data.totalUsers);

    // 5. Probar gestión de usuarios
    console.log('\n5️⃣ Probando gestión de usuarios...');
    const users = await axios.get(`${BASE_URL}/admin/users?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/users', true);
    console.log('   👥 Total usuarios:', users.data.pagination.total);

    // 6. Probar gestión de drivers
    console.log('\n6️⃣ Probando gestión de drivers...');
    const drivers = await axios.get(`${BASE_URL}/admin/drivers?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/drivers', true);
    console.log('   🚗 Total drivers:', drivers.data.pagination.total);

    // 7. Probar gestión de rides
    console.log('\n7️⃣ Probando gestión de rides...');
    const rides = await axios.get(`${BASE_URL}/admin/rides?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/rides', true);
    console.log('   🚕 Total rides:', rides.data.pagination.total);

    // 8. Probar gestión de stores
    console.log('\n8️⃣ Probando gestión de stores...');
    const stores = await axios.get(`${BASE_URL}/admin/stores?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/stores', true);
    console.log('   🏪 Total stores:', stores.data.pagination.total);

    // 9. Probar perfil de admin
    console.log('\n9️⃣ Probando perfil de admin...');
    const profile = await axios.get(`${BASE_URL}/admin/profile`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/profile', true);

    // 10. Probar gestión de admins
    console.log('\n🔟 Probando gestión de admins...');
    const admins = await axios.get(`${BASE_URL}/admin/admins`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/admins', true);
    console.log('   👑 Total admins:', admins.data.length);

    // 11. Probar reportes
    console.log('\n1️⃣1️⃣ Probando reportes...');
    const report = await axios.get(`${BASE_URL}/admin/reports/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logResult('GET /admin/reports/users', true);
    console.log('   📈 Reporte generado correctamente');

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADOS FINALES:');
    console.log(`✅ Pasaron: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Fallaron: ${testResults.failed}/${testResults.total}`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ¡TODOS los endpoints están funcionando correctamente!');
    } else {
      console.log(`\n⚠️  ${testResults.failed} endpoints necesitan atención.`);
    }

  } catch (error) {
    console.error('\n❌ Error general en las pruebas:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testAllAdminEndpoints();
