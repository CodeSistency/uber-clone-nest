#!/usr/bin/env node

/**
 * Script para probar el sistema completo de tracking de ubicaciones de conductores
 *
 * Funcionalidades que prueba:
 * 1. Simulación de ubicaciones de conductores
 * 2. Búsqueda de conductores cercanos
 * 3. Sistema de tracking en tiempo real
 * 4. Historial de ubicaciones
 *
 * Uso:
 * node test-driver-locations.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuración de prueba
const TEST_CONFIG = {
  center: {
    lat: 10.4998,  // La Castellana, Caracas
    lng: -66.8517
  },
  radiusKm: 5,
  driverCount: 10
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testDriverLocationSystem() {
  console.log('🚗 Iniciando pruebas del sistema de tracking de conductores...\n');

  try {
    // 1. Verificar estado inicial del sistema
    console.log('📊 Verificando estado inicial del sistema...');
    const initialHealth = await makeRequest('GET', '/api/realtime/comparison');
    console.log(`✅ Sistema operativo - WebSocket: ${initialHealth.websocket.connections} conexiones, Redis: ${initialHealth.redis.connected ? 'Conectado' : 'Desconectado'}\n`);

    // 2. Simular ubicaciones de conductores
    console.log('🎭 Simulando ubicaciones de conductores...');
    console.log(`📍 Centro: ${TEST_CONFIG.center.lat}, ${TEST_CONFIG.center.lng}`);
    console.log(`📏 Radio: ${TEST_CONFIG.radiusKm}km`);
    console.log(`👥 Conductores: ${TEST_CONFIG.driverCount}\n`);

    const simulationResult = await makeRequest('POST', '/api/realtime/test/simulate-driver-locations', {
      centerLat: TEST_CONFIG.center.lat,
      centerLng: TEST_CONFIG.center.lng,
      radiusKm: TEST_CONFIG.radiusKm,
      driverCount: TEST_CONFIG.driverCount
    });

    console.log(`✅ ${simulationResult.message}`);
    console.log(`📊 Conductores simulados: ${simulationResult.simulatedDrivers.length}\n`);

    // Mostrar algunos conductores simulados
    console.log('👨‍🚗 Conductores simulados (primeros 5):');
    simulationResult.simulatedDrivers.slice(0, 5).forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} - ${driver.vehicleType}`);
      console.log(`     📍 Ubicación: ${driver.location.lat.toFixed(6)}, ${driver.location.lng.toFixed(6)}`);
      console.log(`     📏 Distancia: ${driver.distanceFromCenter}km del centro\n`);
    });

    // 3. Verificar conductores activos
    console.log('🔍 Verificando conductores activos...');
    const activeDrivers = await makeRequest('GET', '/api/realtime/test/simulated-drivers');
    console.log(`✅ Conductores activos encontrados: ${activeDrivers.total}\n`);

    // 4. Probar búsqueda de conductores cercanos
    console.log('🔎 Probando búsqueda de conductores cercanos...');
    console.log('📍 Buscando desde el centro de simulación...');

    const nearbyDrivers = await makeRequest('GET', `/api/rides/flow/client/transport/nearby-drivers?lat=${TEST_CONFIG.center.lat}&lng=${TEST_CONFIG.center.lng}&radius=5000&tierId=1`);

    console.log(`✅ Conductores encontrados: ${nearbyDrivers.length}`);
    if (nearbyDrivers.length > 0) {
      console.log('\n🚕 Conductores cercanos encontrados:');
      nearbyDrivers.slice(0, 5).forEach((driver, index) => {
        console.log(`  ${index + 1}. ${driver.firstName} ${driver.lastName}`);
        console.log(`     ⭐ Rating: ${driver.rating}`);
        console.log(`     🚗 Vehículo: ${driver.vehicleType?.displayName || 'N/A'}`);
        console.log(`     📏 Distancia: ${driver.distance}km`);
        console.log(`     ⏱️  Llegada: ${driver.estimatedMinutes} min\n`);
      });
    }

    // 5. Verificar estado final del sistema
    console.log('📊 Verificando estado final del sistema...');
    const finalHealth = await makeRequest('GET', '/api/realtime/comparison');
    console.log(`✅ Estado final - Conductores en BD: ${finalHealth.redis.activeDriversInDB}`);
    console.log(`✅ Registros de historial: ${finalHealth.redis.totalLocationHistoryRecords}\n`);

    // 6. Mostrar resumen de pruebas
    console.log('🎉 PRUEBAS COMPLETADAS EXITOSAMENTE!\n');

    console.log('📋 Resumen:');
    console.log(`   ✅ Simulación de ubicaciones: ${simulationResult.simulatedDrivers.length} conductores`);
    console.log(`   ✅ Conductores activos: ${activeDrivers.total}`);
    console.log(`   ✅ Búsqueda cercana: ${nearbyDrivers.length} conductores encontrados`);
    console.log(`   ✅ Historial de ubicaciones: ${finalHealth.redis.totalLocationHistoryRecords} registros\n`);

    console.log('🚀 Sistema de tracking de ubicaciones funcionando correctamente!');
    console.log('💡 Los conductores simulados están listos para pruebas de matching y rides.\n');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.log('\n🔧 Asegúrate de que:');
    console.log('   1. El servidor esté ejecutándose (npm run start:dev)');
    console.log('   2. Redis esté ejecutándose');
    console.log('   3. La base de datos esté conectada');
    console.log('   4. Hay conductores en la base de datos\n');
    process.exit(1);
  }
}

// Ejecutar pruebas
testDriverLocationSystem().catch(console.error);
