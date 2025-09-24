// Script para probar el endpoint de driver después de la corrección
const axios = require('axios');

async function testDriverEndpoint() {
  try {
    console.log('🔍 Probando endpoint /flow/driver/transport/pending-requests...\n');
    
    // Login como maria.driver
    console.log('1. 🔐 Iniciando sesión como maria.driver...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'maria.driver@example.com',
      password: 'Driver123!'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login exitoso, token obtenido\n');
    
    // Probar el endpoint de pending-requests
    console.log('2. 📋 Consultando solicitudes pendientes...');
    const pendingResponse = await axios.get('http://localhost:3000/rides/flow/driver/transport/pending-requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Endpoint responde correctamente');
    console.log('📊 Respuesta:', JSON.stringify(pendingResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDriverEndpoint();
