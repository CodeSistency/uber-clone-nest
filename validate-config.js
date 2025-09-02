#!/usr/bin/env node

/**
 * Script de validación de configuración
 * Verifica que todas las variables de entorno estén correctamente configuradas
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 VALIDACIÓN DE CONFIGURACIÓN\n');

// Función para validar variables de entorno
function validateEnvironment() {
  const issues = [];
  const warnings = [];

  // Verificar existencia del archivo .env
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    issues.push('❌ Archivo .env no encontrado');
    console.log('❌ Archivo .env no encontrado');
    console.log('💡 Copia el archivo .env.template y configúralo:\n');
    console.log('   cp .env.template .env\n');
    return { issues, warnings };
  }

  // Leer archivo .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  console.log('✅ Archivo .env encontrado y cargado\n');

  // ===============================
  // VALIDACIONES CRÍTICAS
  // ===============================
  console.log('🔍 VALIDANDO CONFIGURACIONES CRÍTICAS...\n');

  // Database
  if (!envVars.DATABASE_URL) {
    issues.push('❌ DATABASE_URL es requerido');
  } else if (!envVars.DATABASE_URL.startsWith('postgresql://')) {
    issues.push('❌ DATABASE_URL debe ser una URL de PostgreSQL válida');
  } else {
    console.log('✅ DATABASE_URL configurado correctamente');
  }

  // JWT
  if (!envVars.JWT_SECRET) {
    issues.push('❌ JWT_SECRET es requerido');
  } else if (envVars.JWT_SECRET.length < 32) {
    issues.push('❌ JWT_SECRET debe tener al menos 32 caracteres');
  } else {
    console.log('✅ JWT_SECRET configurado correctamente');
  }

  // ===============================
  // VALIDACIONES OPCIONALES
  // ===============================
  console.log('\n🔍 VALIDANDO CONFIGURACIONES OPCIONALES...\n');

  // Firebase
  const hasFirebase = envVars.FIREBASE_PROJECT_ID && envVars.FIREBASE_SERVICE_ACCOUNT;
  if (!hasFirebase) {
    warnings.push('⚠️  Firebase no configurado - las notificaciones push estarán deshabilitadas');
    console.log('⚠️  Firebase no configurado - las notificaciones push estarán deshabilitadas');
  } else {
    try {
      JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Firebase configurado correctamente');
    } catch (error) {
      issues.push('❌ FIREBASE_SERVICE_ACCOUNT debe ser un JSON válido');
    }
  }

  // Twilio
  const hasTwilio = envVars.TWILIO_ACCOUNT_SID && envVars.TWILIO_AUTH_TOKEN && envVars.TWILIO_PHONE_NUMBER;
  if (!hasTwilio) {
    warnings.push('⚠️  Twilio no configurado - los SMS estarán deshabilitados');
    console.log('⚠️  Twilio no configurado - los SMS estarán deshabilitados');
  } else {
    if (!envVars.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      issues.push('❌ TWILIO_ACCOUNT_SID debe comenzar con "AC"');
    }
    if (!envVars.TWILIO_PHONE_NUMBER.startsWith('+')) {
      issues.push('❌ TWILIO_PHONE_NUMBER debe tener formato internacional (+1234567890)');
    }
    if (hasTwilio) {
      console.log('✅ Twilio configurado correctamente');
    }
  }

  // Stripe
  if (!envVars.STRIPE_SECRET_KEY) {
    warnings.push('⚠️  Stripe no configurado - los pagos estarán deshabilitados');
    console.log('⚠️  Stripe no configurado - los pagos estarán deshabilitados');
  } else {
    if (!envVars.STRIPE_SECRET_KEY.startsWith('sk_')) {
      issues.push('❌ STRIPE_SECRET_KEY debe comenzar con "sk_"');
    } else {
      console.log('✅ Stripe configurado correctamente');
    }
  }

  // Redis
  if (!envVars.REDIS_URL) {
    warnings.push('⚠️  REDIS_URL no configurado - usando valor por defecto');
    console.log('⚠️  REDIS_URL no configurado - usando valor por defecto');
  } else if (!envVars.REDIS_URL.startsWith('redis://')) {
    issues.push('❌ REDIS_URL debe ser una URL de Redis válida');
  } else {
    console.log('✅ Redis configurado correctamente');
  }

  // ===============================
  // RESUMEN
  // ===============================
  console.log('\n📊 RESUMEN DE VALIDACIÓN:\n');

  if (issues.length === 0) {
    console.log('✅ Todas las configuraciones críticas están correctas');
  } else {
    console.log('❌ Se encontraron los siguientes problemas:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Advertencias:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  // Estado general
  const isValid = issues.length === 0;
  console.log(`\n🎯 ESTADO GENERAL: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`);

  if (isValid) {
    console.log('🚀 ¡La configuración está lista para usar!');
    console.log('Ejecuta: npm run start:dev\n');
  } else {
    console.log('🔧 Corrige los problemas antes de continuar\n');
  }

  return { issues, warnings, isValid };
}

// Función para mostrar template de configuración
function showTemplate() {
  console.log('📋 TEMPLATE DE CONFIGURACIÓN RECOMENDADO:\n');

  const template = `# Variables críticas (requeridas)
DATABASE_URL="postgresql://username:password@localhost:5432/uber_clone_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-that-is-at-least-32-characters-long"

# Firebase (opcional - para push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Twilio (opcional - para SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (opcional - para pagos)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Redis (opcional - para cache)
REDIS_URL=redis://localhost:6379
`;

  console.log(template);
}

// Ejecutar validación
const result = validateEnvironment();

// Mostrar template si hay problemas
if (!result.isValid) {
  console.log('=' .repeat(60));
  showTemplate();
}

process.exit(result.isValid ? 0 : 1);
