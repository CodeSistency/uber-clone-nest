// Script para probar la funcionalidad del módulo de exchange rates
const axios = require('axios');

async function testDollarApi() {
  try {
    console.log('🧪 Probando API de dólar venezolano...');

    const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
      timeout: 10000,
    });

    console.log('✅ Respuesta de la API:');
    console.log(JSON.stringify(response.data, null, 2));

    // Verificar estructura esperada
    const data = response.data;
    if (data.venta && data.compra) {
      console.log(`💱 Precio de venta: ${data.venta} VES`);
      console.log(`💱 Precio de compra: ${data.compra} VES`);
      console.log(`🏢 Casa: ${data.casa}`);
      console.log(`📅 Fecha actualización: ${data.fechaActualizacion}`);
    } else {
      console.log('⚠️ Estructura de respuesta diferente a la esperada');
    }

  } catch (error) {
    console.error('❌ Error probando la API:', error.message);
  }
}

// Ejecutar prueba
testDollarApi();
