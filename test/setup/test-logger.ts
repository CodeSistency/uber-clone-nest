/**
 * Configuración de logging para tests de matching
 * Asegura que los logs se muestren correctamente durante la ejecución
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'development';
process.env.MATCHING_DEBUG = 'true';

// Configurar logging personalizado para tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  originalConsoleLog('🔍 [TEST]', ...args);
};

console.error = (...args) => {
  originalConsoleError('❌ [TEST ERROR]', ...args);
};

console.warn = (...args) => {
  originalConsoleWarn('⚠️ [TEST WARN]', ...args);
};

// Configurar Jest para mostrar logs
beforeAll(() => {
  // Configuración adicional si es necesaria
});

afterAll(() => {
  // Limpiar configuración
});
