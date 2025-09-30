#!/usr/bin/env node

/**
 * Script de configuración para servicios de notificaciones
 * Ejecuta este script para configurar Firebase y Twilio
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuración de Servicios de Notificaciones');
console.log('==============================================\n');

console.log('📋 PASOS PARA CONFIGURAR FIREBASE:');
console.log('=====================================');
console.log('1. Ve a https://console.firebase.google.com/');
console.log('2. Crea un nuevo proyecto o selecciona uno existente');
console.log('3. Ve a Configuración del Proyecto > Cuentas de Servicio');
console.log('4. Haz clic en "Generar nueva clave privada"');
console.log('5. Descarga el archivo JSON de la clave');
console.log('6. Copia TODO el contenido del JSON\n');

console.log('📋 PASOS PARA CONFIGURAR TWILIO:');
console.log('==================================');
console.log('1. Ve a https://www.twilio.com/console');
console.log('2. Regístrate o inicia sesión');
console.log('3. Ve al Dashboard para obtener tu Account SID y Auth Token');
console.log('4. Ve a Phone Numbers > Buy a Number');
console.log('5. Compra un número con capacidades SMS\n');

console.log('🔧 VARIABLES DE ENTORNO REQUERIDAS:');
console.log('=====================================');

// Crear archivo .env con template
const envTemplate = `# =========================================
# FIREBASE CONFIGURATION
# =========================================

# Firebase Project ID (from Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id

# Firebase Service Account Key (as JSON string)
# Replace the entire value with your downloaded service account JSON
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}

# =========================================
# TWILIO CONFIGURATION
# =========================================

# Twilio Account SID (from Twilio Console Dashboard)
TWILIO_ACCOUNT_SID=your-twilio-account-sid

# Twilio Auth Token (from Twilio Console Dashboard)
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Twilio Phone Number (purchased from Twilio)
TWILIO_PHONE_NUMBER=+1234567890

# =========================================
# DATABASE CONFIGURATION
# =========================================

# Database URL for Prisma
DATABASE_URL="postgresql://username:password@localhost:5432/uber_clone_db?schema=public"

# =========================================
# JWT CONFIGURATION
# =========================================

# JWT Secret for authentication
JWT_SECRET=your-jwt-secret-key-here

# =========================================
# REDIS CONFIGURATION (Optional)
# =========================================

# Redis URL for Pub/Sub and caching
REDIS_URL=redis://localhost:6379

# =========================================
# STRIPE CONFIGURATION (Optional)
# =========================================

# Stripe Secret Key for payments
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# =========================================
# NOTIFICATION SETTINGS (Optional)
# =========================================

# Rate limiting for notifications
NOTIFICATION_RATE_LIMIT_PER_HOUR=100
NOTIFICATION_RATE_LIMIT_PER_MINUTE=10

# Analytics settings
NOTIFICATION_ANALYTICS_ENABLED=true
NOTIFICATION_ANALYTICS_RETENTION_DAYS=30
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  Archivo .env ya existe. No se sobrescribirá.');
  console.log('📝 Edita manualmente el archivo .env con los valores correctos.\n');
} else {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Archivo .env creado con template');
  console.log('📝 Edita el archivo .env con tus credenciales reales.\n');
}

console.log('🧪 PRUEBAS DE CONEXIÓN:');
console.log('=======================');
console.log('Una vez configurado, prueba las conexiones:');
console.log('');
console.log('1. Verificar Firebase:');
console.log('   curl -X POST http://localhost:3000/api/notifications/test/ride-request?userId=test-user');
console.log('');
console.log('2. Verificar Twilio:');
console.log('   curl -X POST http://localhost:3000/api/notifications/test/emergency?userId=test-user');
console.log('');
console.log('3. Verificar estado de servicios:');
console.log('   curl http://localhost:3000/api/notifications/test/status');
console.log('');

console.log('📚 SERVICIOS CONFIGURADOS:');
console.log('==========================');
console.log('✅ Firebase Cloud Messaging - Push Notifications');
console.log('✅ Twilio SMS - Mensajes de texto');
console.log('✅ WebSocket - Notificaciones en tiempo real');
console.log('✅ Redis Pub/Sub - Sistema de mensajería');
console.log('✅ Prisma - Base de datos y persistencia');
console.log('');

console.log('💡 NOTAS IMPORTANTES:');
console.log('=====================');
console.log('• Las notificaciones funcionarán sin Firebase/Twilio (solo WebSocket)');
console.log('• Firebase requiere una cuenta de servicio con permisos de FCM');
console.log('• Twilio requiere créditos para enviar SMS');
console.log('• Mantén las claves seguras y nunca las subas al repositorio');
console.log('• Usa variables de entorno diferentes para desarrollo y producción');
console.log('');

console.log('🎯 PRÓXIMOS PASOS:');
console.log('===================');
console.log('1. Configura tus credenciales en el archivo .env');
console.log('2. Inicia la aplicación: npm run start:dev');
console.log('3. Registra tokens de dispositivos para push notifications');
console.log('4. Prueba el envío de notificaciones');
console.log('5. Configura apps móviles para recibir push notifications');
console.log('');

console.log('🚀 ¡Configuración completada!');
