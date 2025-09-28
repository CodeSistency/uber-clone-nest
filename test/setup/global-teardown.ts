/**
 * Limpieza global para tests de matching
 * Se ejecuta después de todos los tests
 */

export default async function globalTeardown() {
  console.log('🧹 Ejecutando limpieza global...');

  // Aquí se pueden agregar limpiezas adicionales si son necesarias
  // Por ejemplo: limpiar caché, cerrar conexiones, etc.

  console.log('✅ Limpieza global completada');
}