#!/usr/bin/env node

/**
 * Script de prueba para el módulo de administración
 * Verifica que todos los endpoints funcionen correctamente
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let adminToken = null;

// Credenciales de prueba
const TEST_CREDENTIALS = {
  email: 'superadmin@uberclone.com',
  password: 'SuperAdmin123!'
};

console.log('🚀 Iniciando pruebas del módulo Admin...\n');

// Función para hacer requests HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Función para verificar si el servidor está ejecutándose
async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    });

    if (response.status === 200) {
      console.log('✅ Servidor ejecutándose correctamente\n');
      return true;
    } else {
      console.log('❌ Servidor no responde correctamente');
      console.log('💡 Ejecuta: npm run start:dev\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Servidor no está ejecutándose');
    console.log('💡 Ejecuta: npm run start:dev\n');
    return false;
  }
}

// Prueba 1: Login de admin
async function testAdminLogin() {
  console.log('📝 Prueba 1: Login de administrador');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, TEST_CREDENTIALS);

    if (response.status === 200 && response.data.accessToken) {
      adminToken = response.data.accessToken;
      console.log('✅ Login exitoso');
      console.log(`   Token obtenido: ${adminToken.substring(0, 50)}...`);
      console.log(`   Rol: ${response.data.admin.adminRole}`);
      console.log(`   Permisos: ${response.data.admin.adminPermissions.length} permisos\n`);
      return true;
    } else {
      console.log('❌ Login fallido:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en login:', error.message);
    return false;
  }
}

// Prueba 2: Obtener métricas del dashboard
async function testDashboardMetrics() {
  console.log('📊 Prueba 2: Dashboard - Obtener métricas');

  if (!adminToken) {
    console.log('❌ No hay token disponible\n');
    return false;
  }

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/dashboard/metrics',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log('✅ Dashboard metrics obtenidos exitosamente');
      console.log(`   Usuarios totales: ${response.data.totalUsers || 'N/A'}`);
      console.log(`   Drivers totales: ${response.data.totalDrivers || 'N/A'}`);
      console.log(`   Rides activos: ${response.data.activeRides || 'N/A'}`);
      console.log(`   Revenue total: $${response.data.totalRevenue || 0}\n`);
      return true;
    } else {
      console.log('❌ Error obteniendo métricas:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en dashboard:', error.message);
    return false;
  }
}

// Prueba 3: Listar usuarios
async function testUsersList() {
  console.log('👥 Prueba 3: Gestión de usuarios - Listar usuarios');

  if (!adminToken) {
    console.log('❌ No hay token disponible\n');
    return false;
  }

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/users?page=1&limit=5',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Lista de usuarios obtenida exitosamente');
      console.log(`   Total de usuarios: ${response.data.pagination?.total || 0}`);
      console.log(`   Usuarios en página: ${response.data.data?.length || 0}`);
      if (response.data.data && response.data.data.length > 0) {
        console.log(`   Primer usuario: ${response.data.data[0].name} (${response.data.data[0].email})`);
      }
      console.log('');
      return true;
    } else {
      console.log('❌ Error listando usuarios:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error listando usuarios:', error.message);
    return false;
  }
}

// Prueba 4: Listar drivers
async function testDriversList() {
  console.log('🚗 Prueba 4: Gestión de drivers - Listar drivers');

  if (!adminToken) {
    console.log('❌ No hay token disponible\n');
    return false;
  }

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/drivers?page=1&limit=5',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Lista de drivers obtenida exitosamente');
      console.log(`   Total de drivers: ${response.data.pagination?.total || 0}`);
      console.log(`   Drivers en página: ${response.data.data?.length || 0}`);
      if (response.data.data && response.data.data.length > 0) {
        const driver = response.data.data[0];
        console.log(`   Primer driver: ${driver.firstName} ${driver.lastName} (${driver.status})`);
      }
      console.log('');
      return true;
    } else {
      console.log('❌ Error listando drivers:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error listando drivers:', error.message);
    return false;
  }
}

// Prueba 5: Obtener reportes
async function testReports() {
  console.log('📊 Prueba 5: Sistema de reportes - Reporte de usuarios');

  if (!adminToken) {
    console.log('❌ No hay token disponible\n');
    return false;
  }

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/reports/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Reporte de usuarios generado exitosamente');
      console.log(`   Tipo de reporte: ${response.data.reportType}`);
      console.log(`   Usuarios totales: ${response.data.data?.totalUsers || 0}`);
      console.log(`   Admins totales: ${response.data.data?.totalAdmins || 0}`);
      console.log(`   Crecimiento semanal: ${response.data.data?.userGrowth?.weeklyGrowth || 0}`);
      console.log('');
      return true;
    } else {
      console.log('❌ Error generando reporte:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error generando reporte:', error.message);
    return false;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🔍 Ejecutando pruebas del módulo Admin...\n');

  // Verificar que el servidor esté ejecutándose
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ Las pruebas no pueden continuar sin el servidor ejecutándose.');
    console.log('💡 Ejecuta primero: npm run start:dev');
    process.exit(1);
  }

  const results = [];

  // Ejecutar pruebas en secuencia
  results.push(await testAdminLogin());
  results.push(await testDashboardMetrics());
  results.push(await testUsersList());
  results.push(await testDriversList());
  results.push(await testReports());

  // Resumen final
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('📋 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  console.log(`✅ Pruebas exitosas: ${passed}/${total}`);
  console.log(`❌ Pruebas fallidas: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('🚀 El módulo de administración está funcionando correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    console.log('💡 Asegúrate de que:');
    console.log('   - El servidor esté ejecutándose en http://localhost:3000');
    console.log('   - La base de datos esté conectada');
    console.log('   - Los datos de seed estén cargados');
  }

  console.log('\n📖 Para más información, revisa: src/modules/admin/README.md');
  console.log('🔧 Para desarrollo adicional, consulta: docs/ADMIN-PLAN.md\n');
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
