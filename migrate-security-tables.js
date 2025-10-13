/**
 * Script de migración para las nuevas tablas de seguridad
 * 
 * Este script ejecuta la migración de Prisma para crear las nuevas tablas:
 * - verification_codes
 * - identity_verifications
 * - Campos adicionales en la tabla users
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO MIGRACIÓN DE TABLAS DE SEGURIDAD');
console.log('📅 Fecha:', new Date().toISOString());

/**
 * Función para ejecutar comandos
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Ejecutando: ${command}`);
    
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error ejecutando comando: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️  Warnings: ${stderr}`);
      }
      
      if (stdout) {
        console.log(`📝 Output: ${stdout}`);
      }
      
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Función principal de migración
 */
async function migrateSecurityTables() {
  try {
    console.log('\n📋 PASO 1: Generando migración de Prisma');
    await runCommand('npx prisma migrate dev --name add_security_verification_tables');
    
    console.log('\n📋 PASO 2: Generando cliente de Prisma');
    await runCommand('npx prisma generate');
    
    console.log('\n📋 PASO 3: Verificando estado de la base de datos');
    await runCommand('npx prisma db status');
    
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('\n📊 Nuevas tablas creadas:');
    console.log('   - verification_codes');
    console.log('   - identity_verifications');
    console.log('\n📊 Campos agregados a users:');
    console.log('   - dni_number');
    console.log('   - identity_verified_at');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar: npm run start:dev');
    console.log('   2. Probar endpoints con: node test-security-endpoints.js');
    console.log('   3. Verificar documentación en Swagger: http://localhost:3000/api');
    
  } catch (error) {
    console.error('\n💥 ERROR DURANTE LA MIGRACIÓN:', error.message);
    console.log('\n🔧 SOLUCIONES POSIBLES:');
    console.log('   1. Verificar que PostgreSQL esté ejecutándose');
    console.log('   2. Verificar la configuración de DATABASE_URL en .env');
    console.log('   3. Ejecutar: npx prisma db push (para desarrollo)');
    console.log('   4. Revisar los logs de error arriba');
    
    process.exit(1);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateSecurityTables();
}

module.exports = { migrateSecurityTables };
