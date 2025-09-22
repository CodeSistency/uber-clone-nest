// Script de prueba para verificar el endpoint GET /rides/flow/client/transport/tiers
const axios = require('axios');

async function testTiersEndpoint() {
  try {
    console.log('🧪 Probando endpoint GET /rides/flow/client/transport/tiers...');

    const response = await axios.get('http://localhost:3000/rides/flow/client/transport/tiers');

    console.log('✅ Endpoint responde correctamente');
    console.log('📊 Datos recibidos:', JSON.stringify(response.data, null, 2));

    // Validar estructura
    const { data } = response.data;
    if (!Array.isArray(data)) {
      throw new Error('La respuesta no contiene un array en data');
    }

    if (data.length === 0) {
      throw new Error('No se encontraron tiers');
    }

    // Validar primer tier
    const firstTier = data[0];
    const requiredFields = ['id', 'name', 'baseFare', 'perMinuteRate', 'perMileRate'];

    for (const field of requiredFields) {
      if (!(field in firstTier)) {
        throw new Error(`El tier no tiene el campo requerido: ${field}`);
      }
    }

    console.log('✅ Estructura de datos correcta');
    console.log(`📈 Se encontraron ${data.length} tiers disponibles`);

    // Mostrar tiers encontrados
    data.forEach((tier, index) => {
      console.log(`${index + 1}. ${tier.name} (ID: ${tier.id}) - Base: $${tier.baseFare}`);
    });

  } catch (error) {
    console.error('❌ Error al probar el endpoint:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testTiersEndpoint();
}

module.exports = { testTiersEndpoint };
