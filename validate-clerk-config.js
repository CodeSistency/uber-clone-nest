#!/usr/bin/env node

/**
 * Script para validar la configuración de Clerk
 * Ejecutar con: node validate-clerk-config.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function checkEnvFile() {
  log('\n🔍 Verificando archivo .env...', colors.bold);

  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    logError('Archivo .env no encontrado');
    logWarning('Crea un archivo .env basado en env-config-template.txt');
    return false;
  }

  logSuccess('Archivo .env encontrado');

  // Leer el archivo .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  return envLines;
}

function checkClerkKeys(envLines) {
  log('\n🔑 Verificando claves de Clerk...', colors.bold);

  const requiredKeys = [
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_JWT_PUBLIC_KEY'
  ];

  const optionalKeys = [
    'CLERK_API_URL',
    'CLERK_FRONTEND_API',
    'CLERK_DOMAIN'
  ];

  let missingRequired = [];
  let missingOptional = [];
  let foundKeys = {};

  // Parsear variables de entorno
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    if (key && value && !value.includes('your-') && !value.includes('YOUR_')) {
      foundKeys[key] = value;
    }
  });

  // Verificar claves requeridas
  requiredKeys.forEach(key => {
    if (!foundKeys[key] || foundKeys[key].includes('your-') || foundKeys[key].includes('YOUR_')) {
      missingRequired.push(key);
    } else {
      logSuccess(`${key} configurada`);
    }
  });

  // Verificar claves opcionales
  optionalKeys.forEach(key => {
    if (!foundKeys[key] || foundKeys[key].includes('your-') || foundKeys[key].includes('YOUR_')) {
      missingOptional.push(key);
    } else {
      logSuccess(`${key} configurada`);
    }
  });

  if (missingRequired.length > 0) {
    logError('Claves requeridas faltantes:');
    missingRequired.forEach(key => console.log(`  - ${key}`));
    return false;
  }

  if (missingOptional.length > 0) {
    logWarning('Claves opcionales faltantes:');
    missingOptional.forEach(key => console.log(`  - ${key}`));
  }

  return true;
}

function validateClerkKeys(envLines) {
  log('\n🔍 Validando formato de claves...', colors.bold);

  let isValid = true;

  // Parsear variables de entorno
  const envVars = {};
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key] = value;
    }
  });

  // Validar CLERK_SECRET_KEY
  if (envVars.CLERK_SECRET_KEY) {
    if (envVars.CLERK_SECRET_KEY.startsWith('sk_test_')) {
      logSuccess('CLERK_SECRET_KEY tiene formato correcto (test)');
    } else if (envVars.CLERK_SECRET_KEY.startsWith('sk_live_')) {
      logSuccess('CLERK_SECRET_KEY tiene formato correcto (live)');
    } else {
      logError('CLERK_SECRET_KEY no tiene formato válido (debe comenzar con sk_test_ o sk_live_)');
      isValid = false;
    }
  }

  // Validar CLERK_PUBLISHABLE_KEY
  if (envVars.CLERK_PUBLISHABLE_KEY) {
    if (envVars.CLERK_PUBLISHABLE_KEY.startsWith('pk_test_')) {
      logSuccess('CLERK_PUBLISHABLE_KEY tiene formato correcto (test)');
    } else if (envVars.CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) {
      logSuccess('CLERK_PUBLISHABLE_KEY tiene formato correcto (live)');
    } else {
      logError('CLERK_PUBLISHABLE_KEY no tiene formato válido (debe comenzar con pk_test_ o pk_live_)');
      isValid = false;
    }
  }

  // Validar CLERK_JWT_PUBLIC_KEY
  if (envVars.CLERK_JWT_PUBLIC_KEY) {
    if (envVars.CLERK_JWT_PUBLIC_KEY.includes('-----BEGIN PUBLIC KEY-----') &&
        envVars.CLERK_JWT_PUBLIC_KEY.includes('-----END PUBLIC KEY-----')) {
      logSuccess('CLERK_JWT_PUBLIC_KEY tiene formato correcto');
    } else {
      logError('CLERK_JWT_PUBLIC_KEY no tiene formato válido (debe contener BEGIN PUBLIC KEY y END PUBLIC KEY)');
      isValid = false;
    }
  }

  return isValid;
}

function checkDependencies() {
  log('\n📦 Verificando dependencias...', colors.bold);

  const packagePath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packagePath)) {
    logError('Archivo package.json no encontrado');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (dependencies['@clerk/clerk-sdk-node']) {
    logSuccess('@clerk/clerk-sdk-node está instalado');
  } else {
    logError('@clerk/clerk-sdk-node no está instalado');
    logWarning('Ejecuta: npm install @clerk/clerk-sdk-node');
    return false;
  }

  return true;
}

function showNextSteps() {
  log('\n🚀 Próximos pasos:', colors.bold);
  console.log('1. Ve a https://clerk.com y crea una cuenta');
  console.log('2. Crea una nueva aplicación en Clerk Dashboard');
  console.log('3. Copia las API Keys desde Clerk Dashboard > API Keys');
  console.log('4. Actualiza tu archivo .env con las claves reales');
  console.log('5. Ejecuta este script nuevamente para verificar');
  console.log('');
  console.log('📚 Recursos:');
  console.log('• Guía completa: docs/CLERK-API-KEYS-GUIDE.md');
  console.log('• Documentación: https://clerk.com/docs');
}

function main() {
  log('🔧 Validación de configuración de Clerk', colors.bold);
  log('=====================================', colors.bold);

  try {
    // Verificar archivo .env
    const envLines = checkEnvFile();
    if (!envLines) {
      showNextSteps();
      return;
    }

    // Verificar dependencias
    const depsOk = checkDependencies();

    // Verificar claves de Clerk
    const keysOk = checkClerkKeys(envLines);

    // Validar formato de claves
    const formatOk = validateClerkKeys(envLines);

    // Resultado final
    log('\n📊 Resumen:', colors.bold);
    if (depsOk && keysOk && formatOk) {
      logSuccess('¡Configuración de Clerk completa y válida!');
      log('\n🎉 Puedes comenzar a usar los endpoints de Clerk:');
      console.log('• POST /api/user/clerk/register');
      console.log('• GET /api/user/clerk/me');
      console.log('• PUT /api/user/clerk/me');
    } else {
      logError('Configuración de Clerk incompleta');
      showNextSteps();
    }

  } catch (error) {
    logError(`Error durante la validación: ${error.message}`);
    showNextSteps();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main, checkEnvFile, checkClerkKeys, validateClerkKeys, checkDependencies };
