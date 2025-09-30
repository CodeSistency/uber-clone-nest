// Script de diagnóstico para el sistema admin
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function diagnoseAdminSystem() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA ADMIN\n');
  console.log('=====================================\n');

  // 1. Verificar configuración del sistema
  console.log('1️⃣ Verificando configuración del sistema...');
  try {
    const config = await axios.post(`${BASE_URL}/admin/auth/test-login`, {});
    console.log('✅ Sistema responde correctamente');
    console.log('📋 JWT Configurado:', config.data.jwtConfig.secret);
    console.log('🗄️  Base de datos:', config.data.testToken.generated ? 'OK' : 'ERROR');
    console.log('🔐 Token generado:', config.data.testToken.preview);
  } catch (error) {
    console.log('❌ Error en configuración:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return;
  }

  // 2. Verificar login de admin
  console.log('\n2️⃣ Verificando login de admin...');
  try {
    const login = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@uberclone.com',
      password: 'Admin123!'
    });
    console.log('✅ Login exitoso');
    console.log('👤 Admin:', login.data.admin.email);
    console.log('🔑 Rol:', login.data.admin.adminRole);
    console.log('📋 Token generado correctamente');

    const token = login.data.accessToken;

    // 3. Verificar que el token funcione
    console.log('\n3️⃣ Verificando token generado...');

    // Decodificar token para ver su contenido (sin verificar firma)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('📋 Token payload:', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        permissionsCount: payload.permissions?.length || 0
      });
    }

    // 4. Probar endpoint protegido
    console.log('\n4️⃣ Probando endpoint protegido...');
    try {
      const dashboard = await axios.get(`${BASE_URL}/admin/dashboard/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Endpoint funciona correctamente!');
      console.log('📊 Dashboard data:', Object.keys(dashboard.data));
    } catch (endpointError) {
      console.log('❌ Error en endpoint protegido:');
      console.log('   Status:', endpointError.response?.status);
      console.log('   Message:', endpointError.response?.data?.message);

      if (endpointError.response?.status === 403) {
        console.log('\n🔧 Posibles causas del error 403:');
        console.log('1. El usuario admin no existe en la base de datos');
        console.log('2. El usuario admin no tiene permisos REPO RTS_VIEW');
        console.log('3. El JWT_SECRET no coincide entre generación y validación');
        console.log('4. El token está expirado');

        // Intentar verificar permisos
        console.log('\n🔍 Verificando permisos del admin...');
        try {
          const adminInfo = login.data.admin;
          console.log('👤 Admin permissions:', adminInfo.adminPermissions);
          const hasReportsView = adminInfo.adminPermissions?.includes('reports:view');
          console.log('📊 Has reports:view permission:', hasReportsView);
        } catch (permError) {
          console.log('❌ Error verificando permisos');
        }
      }
    }

  } catch (loginError) {
    console.log('❌ Error en login:');
    console.log('   Status:', loginError.response?.status);
    console.log('   Message:', loginError.response?.data?.message);

    if (loginError.response?.status === 401) {
      console.log('\n🔧 Posibles causas del error 401 en login:');
      console.log('1. Credenciales incorrectas');
      console.log('2. Usuario admin no existe en BD');
      console.log('3. Usuario admin no está activo');
      console.log('4. JWT_SECRET no configurado correctamente');
    }
  }

  console.log('\n=====================================');
  console.log('🔍 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnoseAdminSystem();
