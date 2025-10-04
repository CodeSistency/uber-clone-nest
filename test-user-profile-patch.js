/**
 * Script de prueba para el endpoint PATCH /api/user/profile
 * 
 * Este script prueba el nuevo endpoint de actualización de perfil de usuario
 * con autenticación JWT.
 */

const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/user/profile`;

// Token de prueba (usar el token generado por el sistema)
const TEST_TOKEN = 'dev-test-token'; // Token de desarrollo

// Headers con autenticación
const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * Función para hacer petición PATCH al endpoint
 */
async function testPatchProfile(profileData) {
  try {
    console.log('\n🚀 Probando PATCH /api/user/profile');
    console.log('📝 Datos a enviar:', JSON.stringify(profileData, null, 2));
    
    const response = await axios.patch(API_ENDPOINT, profileData, { headers });
    
    console.log('✅ Respuesta exitosa:');
    console.log('📊 Status:', response.status);
    console.log('📋 Datos del usuario actualizado:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Error en la petición:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Mensaje:', error.response.data);
    } else {
      console.log('🔧 Error de conexión:', error.message);
    }
    throw error;
  }
}

/**
 * Función para obtener el perfil actual del usuario
 */
async function getCurrentProfile() {
  try {
    console.log('\n👤 Obteniendo perfil actual del usuario...');
    
    const response = await axios.get(`${BASE_URL}/api/user/me`, { headers });
    
    console.log('✅ Perfil actual obtenido:');
    console.log('📋 Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Error al obtener perfil actual:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Mensaje:', error.response.data);
    } else {
      console.log('🔧 Error de conexión:', error.message);
    }
    throw error;
  }
}

/**
 * Función principal de pruebas
 */
async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DEL ENDPOINT PATCH /api/user/profile');
  console.log('=' .repeat(60));
  
  try {
    // 1. Obtener perfil actual
    await getCurrentProfile();
    
    // 2. Prueba 1: Actualización básica (solo nombre y ciudad)
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 1: Actualización básica');
    await testPatchProfile({
      name: 'Juan Carlos Pérez Actualizado',
      city: 'Caracas',
      country: 'Venezuela'
    });
    
    // 3. Prueba 2: Actualización de información personal
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 2: Actualización de información personal');
    await testPatchProfile({
      phone: '+584141234567',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      address: 'Calle 123, Edificio ABC, Apartamento 4B'
    });
    
    // 4. Prueba 3: Actualización de preferencias
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 3: Actualización de preferencias');
    await testPatchProfile({
      preferredLanguage: 'es',
      timezone: 'America/Caracas',
      currency: 'USD'
    });
    
    // 5. Prueba 4: Actualización con imagen de perfil
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 4: Actualización con imagen de perfil');
    await testPatchProfile({
      profileImage: 'https://example.com/profile-updated.jpg',
      state: 'Miranda',
      postalCode: '1010'
    });
    
    // 6. Prueba 5: Actualización mínima (solo un campo)
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 5: Actualización mínima');
    await testPatchProfile({
      city: 'Valencia'
    });
    
    // 7. Prueba 6: Datos inválidos (debería fallar)
    console.log('\n' + '='.repeat(60));
    console.log('📝 PRUEBA 6: Datos inválidos (debería fallar)');
    try {
      await testPatchProfile({
        name: 'A', // Muy corto
        email: 'email-invalido', // Email inválido
        phone: '123', // Formato incorrecto
        gender: 'invalid-gender' // Valor no permitido
      });
    } catch (error) {
      console.log('✅ Error esperado capturado correctamente');
    }
    
    // 8. Obtener perfil final
    console.log('\n' + '='.repeat(60));
    console.log('📝 PERFIL FINAL DESPUÉS DE TODAS LAS ACTUALIZACIONES');
    await getCurrentProfile();
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    
  } catch (error) {
    console.log('\n💥 ERROR EN LAS PRUEBAS:', error.message);
    process.exit(1);
  }
}

/**
 * Función para probar sin autenticación (debería fallar)
 */
async function testWithoutAuth() {
  console.log('\n🔒 PRUEBA DE SEGURIDAD: Sin autenticación (debería fallar)');
  
  try {
    await axios.patch(API_ENDPOINT, { name: 'Test' });
    console.log('❌ ERROR: La petición debería haber fallado sin autenticación');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correcto: Petición rechazada sin autenticación (401)');
    } else {
      console.log('❌ Error inesperado:', error.message);
    }
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  runTests()
    .then(() => testWithoutAuth())
    .then(() => {
      console.log('\n🏁 PRUEBAS FINALIZADAS');
      process.exit(0);
    })
    .catch((error) => {
      console.log('\n💥 ERROR FATAL:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testPatchProfile,
  getCurrentProfile,
  testWithoutAuth
};
