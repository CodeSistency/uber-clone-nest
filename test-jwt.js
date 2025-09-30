// Script de prueba para verificar JWT_SECRET
require('dotenv').config();

console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_SECRET starts with:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'N/A');

// Verificar si podemos crear JWT
try {
  const jwt = require('jsonwebtoken');
  const testPayload = { userId: 1, email: 'test@example.com' };
  const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'fallback-secret-key');
  console.log('✅ JWT Token generado correctamente');
  console.log('Token preview:', token.substring(0, 50) + '...');

  // Verificar el token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
  console.log('✅ JWT Token verificado correctamente');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Error con JWT:', error.message);
}
