// Script completo para probar el sistema admin con las nuevas configuraciones JWT
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@uberclone.com',
  password: 'SuperAdmin123!'
};

async function testAdminSystem() {
  console.log('🚀 Probando sistema admin completo...\n');

  try {
    // 1. Probar endpoint de test para verificar configuración
    console.log('1️⃣ Verificando configuración JWT...');
    const testResponse = await axios.post(`${BASE_URL}/admin/auth/test-login`, {});
    console.log('✅ Configuración JWT:', testResponse.data.jwtConfig);

    // 2. Probar login de admin regular
    console.log('\n2️⃣ Probando login de admin regular...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    console.log('✅ Login exitoso!');
    console.log('📋 Token recibido (primeros 50 chars):', loginResponse.data.accessToken.substring(0, 50) + '...');
    console.log('👤 Admin info:', {
      email: loginResponse.data.admin.email,
      role: loginResponse.data.admin.adminRole,
      permissions: loginResponse.data.admin.adminPermissions.length
    });

    const adminToken = loginResponse.data.accessToken;

    // 3. Probar endpoints protegidos
    console.log('\n3️⃣ Probando endpoints protegidos...');

    // Dashboard
    const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Dashboard accesible - Total users:', dashboardResponse.data.totalUsers);

    // Lista de usuarios
    const usersResponse = await axios.get(`${BASE_URL}/admin/users?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Users list accesible - Total usuarios:', usersResponse.data.pagination.total);

    // Lista de drivers
    const driversResponse = await axios.get(`${BASE_URL}/admin/drivers?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Drivers list accesible - Total drivers:', driversResponse.data.pagination.total);

    // 4. Probar login de super admin
    console.log('\n4️⃣ Probando login de super admin...');
    const superLoginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, SUPER_ADMIN_CREDENTIALS);
    console.log('✅ Super admin login exitoso!');
    console.log('👑 Super admin role:', superLoginResponse.data.admin.adminRole);
    console.log('🔑 Total permissions:', superLoginResponse.data.admin.adminPermissions.length);

    const superToken = superLoginResponse.data.accessToken;

    // 5. Probar endpoint que requiere permisos específicos con super admin
    const reportsResponse = await axios.get(`${BASE_URL}/admin/reports/users`, {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    console.log('✅ Reports accesible - Total users:', reportsResponse.data.data.totalUsers);

    console.log('\n🎉 ¡Sistema admin funcionando correctamente!');
    console.log('✅ Todos los tests pasaron exitosamente');

  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);

    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);

      if (error.response.status === 401) {
        console.log('\n💡 Posibles soluciones para error 401:');
        console.log('1. Verificar que la aplicación esté corriendo: npm run start:dev');
        console.log('2. Verificar que la base de datos tenga usuarios admin: npm run db:seed');
        console.log('3. Verificar configuración JWT en .env');
        console.log('4. Verificar que PostgreSQL esté corriendo');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 La aplicación no está corriendo. Ejecuta: npm run start:dev');
    }
  }
}

// Ejecutar tests
testAdminSystem();
