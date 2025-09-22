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
    if (!data || typeof data !== 'object') {
      throw new Error('La respuesta no contiene un objeto válido en data');
    }

    // Verificar que tenga las claves esperadas (car, motorcycle, etc.)
    const vehicleTypes = Object.keys(data);
    if (vehicleTypes.length === 0) {
      throw new Error('No se encontraron tipos de vehículo');
    }

    console.log(`📊 Se encontraron ${vehicleTypes.length} tipos de vehículo: ${vehicleTypes.join(', ')}`);

    // Validar cada tipo de vehículo
    for (const vehicleType of vehicleTypes) {
      const tiers = data[vehicleType];

      if (!Array.isArray(tiers)) {
        throw new Error(`Los tiers para ${vehicleType} no son un array`);
      }

      if (tiers.length === 0) {
        console.log(`⚠️  ${vehicleType} no tiene tiers disponibles`);
        continue;
      }

      console.log(`✅ ${vehicleType}: ${tiers.length} tiers disponibles`);

      // Validar primer tier de cada tipo
      const firstTier = tiers[0];
      const requiredFields = ['id', 'name', 'baseFare', 'perMinuteRate', 'perMileRate', 'vehicleTypeId', 'vehicleTypeName'];

      for (const field of requiredFields) {
        if (!(field in firstTier)) {
          throw new Error(`El tier de ${vehicleType} no tiene el campo requerido: ${field}`);
        }
      }
    }

    console.log('✅ Estructura de datos correcta');

    // Calcular total de tiers
    const totalTiers = Object.values(data).reduce((sum, tiers) => sum + tiers.length, 0);
    console.log(`📈 Se encontraron ${totalTiers} tiers disponibles en total`);

    // Mostrar tiers encontrados por tipo de vehículo
    for (const [vehicleType, tiers] of Object.entries(data)) {
      console.log(`\n🚗 ${vehicleType.toUpperCase()}:`);
      tiers.forEach((tier, index) => {
        console.log(`  ${index + 1}. ${tier.name} (ID: ${tier.id}) - Base: $${tier.baseFare} - ${tier.vehicleTypeName}`);
      });
    }

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
