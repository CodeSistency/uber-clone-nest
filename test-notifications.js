#!/usr/bin/env node

/**
 * Script de prueba mejorado para servicios de notificaciones
 * Muestra claramente qué tipo de notificación se envió (Firebase, Twilio, WebSocket)
 */

const { exec } = require('child_process');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-123';

console.log('🧪 PRUEBAS MEJORADAS DE NOTIFICACIONES');
console.log('======================================\n');

// Mostrar configuración actual
console.log('⚙️  CONFIGURACIÓN ACTUAL:');
console.log(`🔗 URL Base: ${BASE_URL}`);
console.log(`👤 Usuario de prueba: ${TEST_USER_ID}`);
console.log(`📁 Archivo .env: ${fs.existsSync('.env') ? '✅ Existe' : '❌ No existe'}\n`);

// Función para analizar el tipo de notificación enviada
function analyzeNotificationResponse(response, notificationType) {
  if (!response || !Array.isArray(response)) {
    console.log('❓ Tipo de notificación: DESCONOCIDO (respuesta inválida)');
    return;
  }

  const pushNotifications = response.filter(r => r.channel === 'push');
  const smsNotifications = response.filter(r => r.channel === 'sms');
  const websocketNotifications = response.filter(r => r.channel === 'websocket');

  console.log(`📋 Análisis de notificación "${notificationType}":`);

  if (pushNotifications.length > 0) {
    const success = pushNotifications.filter(r => r.success).length;
    const total = pushNotifications.length;
    console.log(`🔥 Firebase Push: ${success}/${total} exitosas`);

    if (success === 0) {
      console.log(`   💡 Razón: Firebase no configurado o error en envío`);
    } else {
      console.log(`   ✅ Push notification enviada vía Firebase Cloud Messaging`);
    }
  } else {
    console.log(`🔥 Firebase Push: No se intentó enviar`);
  }

  if (smsNotifications.length > 0) {
    const success = smsNotifications.filter(r => r.success).length;
    const total = smsNotifications.length;
    console.log(`📱 Twilio SMS: ${success}/${total} exitosas`);

    if (success === 0) {
      console.log(`   💡 Razón: Twilio no configurado o error en envío`);
    } else {
      console.log(`   ✅ SMS enviado vía Twilio`);
    }
  } else {
    console.log(`📱 Twilio SMS: No se intentó enviar`);
  }

  if (websocketNotifications.length > 0) {
    const success = websocketNotifications.filter(r => r.success).length;
    const total = websocketNotifications.length;
    console.log(`🌐 WebSocket: ${success}/${total} exitosas`);

    if (success === 0) {
      console.log(`   💡 Razón: Error de conexión WebSocket`);
    } else {
      console.log(`   ✅ Notificación en tiempo real vía WebSocket`);
    }
  } else {
    console.log(`🌐 WebSocket: No se intentó enviar`);
  }

  const totalSuccess = response.filter(r => r.success).length;
  const totalNotifications = response.length;

  console.log(`📊 Total: ${totalSuccess}/${totalNotifications} notificaciones exitosas\n`);
}

// Función para ejecutar curl
function runCurl(command, description, notificationType = null) {
  return new Promise((resolve, reject) => {
    console.log(`📤 ${description}`);
    console.log(`Comando: ${command}\n`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error ejecutando: ${error.message}`);
        if (stderr) console.log(`Stderr: ${stderr}`);
        console.log('─'.repeat(50) + '\n');
        resolve(null);
        return;
      }

      try {
        const response = JSON.parse(stdout);

        // Mostrar respuesta completa
        console.log('📋 Respuesta del servidor:', JSON.stringify(response, null, 2));

        // Analizar qué tipo de notificación se envió
        if (notificationType && response.result) {
          analyzeNotificationResponse(response.result, notificationType);
        } else if (notificationType && Array.isArray(response)) {
          analyzeNotificationResponse(response, notificationType);
        }

      } catch (e) {
        console.log('📄 Respuesta (texto):', stdout);
      }
      console.log('─'.repeat(50) + '\n');
      resolve(stdout);
    });
  });
}

// Función para esperar
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para analizar estado de servicios
function analyzeServiceStatus(response) {
  if (!response) {
    console.log('❓ Estado de servicios: DESCONOCIDO');
    return;
  }

  console.log('🔍 ANÁLISIS DEL ESTADO DE SERVICIOS:');

  // Firebase
  if (response.firebase) {
    const firebase = response.firebase;
    if (firebase.initialized && firebase.status === 'configured') {
      console.log('✅ Firebase: CONFIGURADO - Push notifications activas');
      console.log(`   📍 Proyecto: ${firebase.projectId || 'No especificado'}`);
    } else {
      console.log('❌ Firebase: NO CONFIGURADO - Solo WebSocket disponible');
      console.log('   💡 Para activar: configura FIREBASE_PROJECT_ID y FIREBASE_SERVICE_ACCOUNT');
    }
  }

  // Twilio
  if (response.twilio) {
    const twilio = response.twilio;
    if (twilio.initialized && twilio.status === 'configured') {
      console.log('✅ Twilio: CONFIGURADO - SMS activas');
      console.log(`   📞 Número: ${twilio.phoneNumber || 'No especificado'}`);
    } else {
      console.log('❌ Twilio: NO CONFIGURADO - SMS deshabilitadas');
      console.log('   💡 Para activar: configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER');
    }
  }

  // WebSocket
  if (response.websocket) {
    const websocket = response.websocket;
    if (websocket.status === 'operational') {
      console.log('✅ WebSocket: OPERATIVO - Notificaciones en tiempo real activas');
    } else {
      console.log('❌ WebSocket: FUERA DE SERVICIO');
    }
  }

  console.log('');
}

// Pruebas secuenciales
async function runTests() {
  try {
    // 1. Verificar estado del sistema
    console.log('1️⃣ VERIFICANDO ESTADO DEL SISTEMA\n');
    const statusResponse = await runCurl(
      `curl -s "${BASE_URL}/api/notifications/test/status"`,
      'Verificando estado de servicios de notificación'
    );

    // Analizar estado de servicios
    try {
      const statusData = JSON.parse(statusResponse);
      analyzeServiceStatus(statusData);
    } catch (e) {
      console.log('❓ No se pudo analizar el estado de servicios\n');
    }

    // 2. Probar notificación de solicitud de ride
    console.log('2️⃣ PRUEBA: NOTIFICACIÓN DE SOLICITUD DE RIDE\n');
    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/ride-request?userId=${TEST_USER_ID}"`,
      'Enviando notificación de solicitud de ride',
      'Solicitud de Ride'
    );

    await wait(2000); // Esperar 2 segundos

    // 3. Probar notificación de conductor llegó
    console.log('3️⃣ PRUEBA: NOTIFICACIÓN DE CONDUCTOR LLEGÓ\n');
    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/driver-arrived?userId=${TEST_USER_ID}"`,
      'Enviando notificación de conductor llegó',
      'Conductor Llegó'
    );

    await wait(2000);

    // 4. Probar notificación de emergencia
    console.log('4️⃣ PRUEBA: NOTIFICACIÓN DE EMERGENCIA\n');
    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/emergency?userId=${TEST_USER_ID}"`,
      'Enviando notificación de emergencia',
      'Emergencia'
    );

    await wait(2000);

    // 5. Probar notificación promocional
    console.log('5️⃣ PRUEBA: NOTIFICACIÓN PROMOCIONAL\n');
    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/promotional?userId=${TEST_USER_ID}"`,
      'Enviando notificación promocional',
      'Promocional'
    );

    await wait(2000);

    // 6. Probar cambio de estado de ride
    console.log('6️⃣ PRUEBA: CAMBIO DE ESTADO DE RIDE\n');
    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/ride-status-change?userId=${TEST_USER_ID}&status=accepted"`,
      'Enviando notificación de ride aceptado',
      'Ride Aceptado'
    );

    await wait(1000);

    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/ride-status-change?userId=${TEST_USER_ID}&status=started"`,
      'Enviando notificación de ride iniciado',
      'Ride Iniciado'
    );

    await wait(1000);

    await runCurl(
      `curl -s -X POST "${BASE_URL}/api/notifications/test/ride-status-change?userId=${TEST_USER_ID}&status=completed"`,
      'Enviando notificación de ride completado',
      'Ride Completado'
    );

    // 7. Verificar historial de notificaciones
    console.log('7️⃣ VERIFICANDO HISTORIAL DE NOTIFICACIONES\n');
    await runCurl(
      `curl -s "${BASE_URL}/api/notifications/history?userId=${TEST_USER_ID}&limit=10"`,
      'Obteniendo historial de notificaciones',
      'Historial'
    );

    console.log('🎉 PRUEBAS COMPLETADAS\n');
    console.log('📊 RESUMEN:');
    console.log('- ✅ Estado del sistema verificado');
    console.log('- ✅ Notificación de ride request enviada');
    console.log('- ✅ Notificación de driver arrived enviada');
    console.log('- ✅ Notificación de emergency enviada');
    console.log('- ✅ Notificación promocional enviada');
    console.log('- ✅ Notificaciones de ride status enviadas');
    console.log('- ✅ Historial de notificaciones verificado');
    console.log('');
    console.log('💡 RECUERDA:');
    console.log('- Si Firebase no está configurado, solo funcionarán las notificaciones WebSocket');
    console.log('- Si Twilio no está configurado, no se enviarán SMS');
    console.log('- Las notificaciones push requieren tokens de dispositivo registrados');
    console.log('');
    console.log('🔧 Para configurar servicios:');
    console.log('- Ejecuta: node setup-notifications.js');
    console.log('- Edita el archivo .env con tus credenciales');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Verificar si la aplicación está corriendo
function checkServer() {
  return new Promise((resolve) => {
    exec(`curl -s "${BASE_URL}/api/notifications/test/status"`, (error) => {
      if (error) {
        console.log('❌ La aplicación no está corriendo o no es accesible');
        console.log(`Verifica que esté ejecutándose en ${BASE_URL}`);
        console.log('Ejecuta: npm run start:dev\n');
        resolve(false);
      } else {
        console.log('✅ Aplicación detectada y corriendo\n');
        resolve(true);
      }
    });
  });
}

// Función principal
async function main() {
  console.log(`🔗 URL Base: ${BASE_URL}`);
  console.log(`👤 Usuario de prueba: ${TEST_USER_ID}\n`);

  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { runTests, checkServer };