/**
 * Configuración global para tests de matching
 * Se ejecuta antes de todos los tests
 */

export default async function globalSetup() {
  console.log('🚀 Iniciando setup global para tests de matching...');

  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.MATCHING_DEBUG = 'true';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  console.log('✅ Variables de entorno configuradas');
  console.log('✅ Setup global completado');
}
