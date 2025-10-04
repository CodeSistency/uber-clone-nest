/**
 * Script de prueba completo para endpoints de seguridad
 * 
 * Este script prueba todos los nuevos endpoints de verificación de seguridad:
 * - Cambio de email
 * - Cambio de contraseña
 * - Cambio de teléfono
 * - Verificación de identidad
 */

const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/user`;

// Token de prueba (usar el token generado por el sistema)
const TEST_TOKEN = 'dev-test-token'; // Token de desarrollo

// Headers con autenticación
const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json',
};

// Datos de prueba
const testData = {
  newEmail: 'nuevo.email@example.com',
  newPhone: '+584121234567',
  currentPassword: 'MiContraseñaActual123!',
  newPassword: 'MiNuevaContraseña456!',
  dniNumber: '12345678',
  frontPhotoUrl: 'https://storage.example.com/dni/front_12345678.jpg',
  backPhotoUrl: 'https://storage.example.com/dni/back_12345678.jpg',
};

/**
 * Función para hacer peticiones HTTP
 */
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers,
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

/**
 * Función para imprimir resultados
 */
function printResult(testName, result) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  if (result.success) {
    console.log('✅ ÉXITO');
    console.log(`📊 Status: ${result.status}`);
    console.log('📝 Respuesta:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ ERROR');
    console.log(`📊 Status: ${result.status}`);
    console.log('🚨 Error:', JSON.stringify(result.error, null, 2));
  }
}

/**
 * Función para esperar un tiempo
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tests de cambio de email
 */
async function testEmailChange() {
  console.log('\n🚀 INICIANDO TESTS DE CAMBIO DE EMAIL');
  
  // 1. Solicitar cambio de email
  const requestResult = await makeRequest('POST', '/change-email/request', {
    newEmail: testData.newEmail,
    password: testData.currentPassword,
  });
  printResult('Solicitar cambio de email', requestResult);
  
  if (!requestResult.success) {
    console.log('❌ No se puede continuar con el test de email');
    return;
  }
  
  // Simular código de verificación (en producción vendría por email)
  const verificationCode = '123456'; // Código simulado
  
  // 2. Verificar cambio de email
  const verifyResult = await makeRequest('POST', '/change-email/verify', {
    newEmail: testData.newEmail,
    code: verificationCode,
  });
  printResult('Verificar cambio de email', verifyResult);
  
  // 3. Cancelar cambio de email (si hay uno activo)
  const cancelResult = await makeRequest('POST', '/change-email/cancel', {
    confirm: true,
  });
  printResult('Cancelar cambio de email', cancelResult);
}

/**
 * Tests de cambio de contraseña
 */
async function testPasswordChange() {
  console.log('\n🚀 INICIANDO TESTS DE CAMBIO DE CONTRASEÑA');
  
  // 1. Solicitar cambio de contraseña
  const requestResult = await makeRequest('POST', '/change-password/request', {
    currentPassword: testData.currentPassword,
  });
  printResult('Solicitar cambio de contraseña', requestResult);
  
  if (!requestResult.success) {
    console.log('❌ No se puede continuar con el test de contraseña');
    return;
  }
  
  // Simular código de verificación (en producción vendría por email)
  const verificationCode = '123456'; // Código simulado
  
  // 2. Verificar cambio de contraseña
  const verifyResult = await makeRequest('POST', '/change-password/verify', {
    newPassword: testData.newPassword,
    code: verificationCode,
  });
  printResult('Verificar cambio de contraseña', verifyResult);
  
  // 3. Cancelar cambio de contraseña (si hay uno activo)
  const cancelResult = await makeRequest('POST', '/change-password/cancel', {
    confirm: true,
  });
  printResult('Cancelar cambio de contraseña', cancelResult);
}

/**
 * Tests de cambio de teléfono
 */
async function testPhoneChange() {
  console.log('\n🚀 INICIANDO TESTS DE CAMBIO DE TELÉFONO');
  
  // 1. Solicitar cambio de teléfono
  const requestResult = await makeRequest('POST', '/change-phone/request', {
    newPhone: testData.newPhone,
  });
  printResult('Solicitar cambio de teléfono', requestResult);
  
  if (!requestResult.success) {
    console.log('❌ No se puede continuar con el test de teléfono');
    return;
  }
  
  // Simular código de verificación (en producción vendría por SMS)
  const verificationCode = '123456'; // Código simulado
  
  // 2. Verificar cambio de teléfono
  const verifyResult = await makeRequest('POST', '/change-phone/verify', {
    newPhone: testData.newPhone,
    code: verificationCode,
  });
  printResult('Verificar cambio de teléfono', verifyResult);
  
  // 3. Cancelar cambio de teléfono (si hay uno activo)
  const cancelResult = await makeRequest('POST', '/change-phone/cancel', {
    confirm: true,
  });
  printResult('Cancelar cambio de teléfono', cancelResult);
}

/**
 * Tests de verificación de identidad
 */
async function testIdentityVerification() {
  console.log('\n🚀 INICIANDO TESTS DE VERIFICACIÓN DE IDENTIDAD');
  
  // 1. Enviar verificación de identidad
  const submitResult = await makeRequest('POST', '/identity-verification/submit', {
    dniNumber: testData.dniNumber,
    frontPhotoUrl: testData.frontPhotoUrl,
    backPhotoUrl: testData.backPhotoUrl,
  });
  printResult('Enviar verificación de identidad', submitResult);
  
  // 2. Obtener estado de verificación
  const statusResult = await makeRequest('GET', '/identity-verification/status');
  printResult('Obtener estado de verificación', statusResult);
  
  // 3. Obtener verificaciones pendientes (admin)
  const pendingResult = await makeRequest('GET', '/identity-verification/admin/pending');
  printResult('Obtener verificaciones pendientes (admin)', pendingResult);
  
  // 4. Obtener estadísticas (admin)
  const statsResult = await makeRequest('GET', '/identity-verification/admin/stats');
  printResult('Obtener estadísticas (admin)', statsResult);
  
  // 5. Obtener verificaciones por estado (admin)
  const byStatusResult = await makeRequest('GET', '/identity-verification/admin/verifications?status=pending&page=1&limit=10');
  printResult('Obtener verificaciones por estado (admin)', byStatusResult);
}

/**
 * Tests de validación de datos
 */
async function testDataValidation() {
  console.log('\n🚀 INICIANDO TESTS DE VALIDACIÓN DE DATOS');
  
  // Test con email inválido
  const invalidEmailResult = await makeRequest('POST', '/change-email/request', {
    newEmail: 'email-invalido',
    password: testData.currentPassword,
  });
  printResult('Email inválido', invalidEmailResult);
  
  // Test con teléfono inválido
  const invalidPhoneResult = await makeRequest('POST', '/change-phone/request', {
    newPhone: '123', // Teléfono inválido
  });
  printResult('Teléfono inválido', invalidPhoneResult);
  
  // Test con DNI inválido
  const invalidDniResult = await makeRequest('POST', '/identity-verification/submit', {
    dniNumber: '123', // DNI inválido
    frontPhotoUrl: testData.frontPhotoUrl,
    backPhotoUrl: testData.backPhotoUrl,
  });
  printResult('DNI inválido', invalidDniResult);
  
  // Test con contraseña débil
  const weakPasswordResult = await makeRequest('POST', '/change-password/verify', {
    newPassword: '123', // Contraseña débil
    code: '123456',
  });
  printResult('Contraseña débil', weakPasswordResult);
}

/**
 * Tests de rate limiting
 */
async function testRateLimiting() {
  console.log('\n🚀 INICIANDO TESTS DE RATE LIMITING');
  
  // Intentar solicitar múltiples códigos rápidamente
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest('POST', '/change-email/request', {
      newEmail: `test${i}@example.com`,
      password: testData.currentPassword,
    });
    printResult(`Solicitud ${i + 1} de cambio de email`, result);
    
    if (!result.success && result.status === 429) {
      console.log('✅ Rate limiting funcionando correctamente');
      break;
    }
    
    await sleep(1000); // Esperar 1 segundo entre solicitudes
  }
}

/**
 * Función principal
 */
async function runAllTests() {
  console.log('🎯 INICIANDO TESTS COMPLETOS DE ENDPOINTS DE SEGURIDAD');
  console.log('📅 Fecha:', new Date().toISOString());
  console.log('🌐 URL Base:', BASE_URL);
  console.log('🔑 Token:', TEST_TOKEN);
  
  try {
    // Ejecutar todos los tests
    await testEmailChange();
    await sleep(2000);
    
    await testPasswordChange();
    await sleep(2000);
    
    await testPhoneChange();
    await sleep(2000);
    
    await testIdentityVerification();
    await sleep(2000);
    
    await testDataValidation();
    await sleep(2000);
    
    await testRateLimiting();
    
    console.log('\n🎉 TODOS LOS TESTS COMPLETADOS');
    console.log('📊 Revisa los resultados arriba para verificar el funcionamiento');
    
  } catch (error) {
    console.error('\n💥 ERROR DURANTE LA EJECUCIÓN DE TESTS:', error);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testEmailChange,
  testPasswordChange,
  testPhoneChange,
  testIdentityVerification,
  testDataValidation,
  testRateLimiting,
};
