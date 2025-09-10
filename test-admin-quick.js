// Prueba rápida del sistema admin
const axios = require('axios');

async function quickTest() {
  const BASE_URL = 'http://localhost:3000';

  console.log('🧪 Test rápido del sistema admin...\n');

  try {
    // 1. Verificar configuración
    console.log('1️⃣ Verificando configuración...');
    const config = await axios.post(`${BASE_URL}/admin/auth/test-login`, {});
    console.log('✅ JWT Config:', config.data.jwtConfig);
    console.log('✅ Test Token:', config.data.testToken.generated ? 'Generado' : 'Error');

    // 2. Intentar login
    console.log('\n2️⃣ Intentando login...');
    const login = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@uberclone.com',
      password: 'Admin123!'
    });

    console.log('✅ Login exitoso!');
    console.log('📋 Token generado correctamente');

    // 3. Probar endpoint protegido
    console.log('\n3️⃣ Probando endpoint protegido...');
    const dashboard = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${login.data.accessToken}` }
    });

    console.log('✅ Dashboard funcionando!');
    console.log('📊 Usuarios totales:', dashboard.data.totalUsers);

    console.log('\n🎉 ¡Todo funcionando correctamente!');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);

    if (error.response?.status === 401) {
      console.log('\n🔧 Pasos para solucionar:');
      console.log('1. npm run start:dev (asegurarse que la app esté corriendo)');
      console.log('2. npm run db:seed (crear usuarios admin)');
      console.log('3. Verificar .env tiene JWT_SECRET configurado');
    }
  }
}

quickTest();
