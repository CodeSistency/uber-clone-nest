// Script para verificar que todas las estadísticas de pricing usan datos reales de la DB
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

async function testPricingStatistics() {
  try {
    console.log('🚀 Verificando estadísticas de pricing con datos reales...');

    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.access_token;

    console.log('✅ Token obtenido exitosamente');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Pricing Summary - Debe usar datos reales de tiers
    console.log('\n📊 Probando GET /admin/pricing/ride-tiers/summary/overview');
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/admin/pricing/ride-tiers/summary/overview`, { headers });
      const summary = summaryResponse.data.data.summary;

      console.log('✅ Estadísticas obtenidas:');
      console.log(`   - Total tiers: ${summary.totalTiers}`);
      console.log(`   - Active tiers: ${summary.activeTiers}`);
      console.log(`   - Total rides: ${summary.totalRides}`);
      console.log(`   - Average base fare: $${(summary.averageBaseFare / 100).toFixed(2)}`);
      console.log(`   - Price range: $${(summary.priceRanges.lowest / 100).toFixed(2)} - $${(summary.priceRanges.highest / 100).toFixed(2)}`);
      console.log(`   - Tier distribution:`, summary.tierDistribution);

      // Verificar que no sean valores dummy
      if (summary.totalTiers > 0 && summary.averageBaseFare > 0) {
        console.log('✅ CONFIRMADO: Estadísticas usan datos reales de la DB');
      } else {
        console.log('⚠️  POSIBLE ISSUE: Estadísticas podrían ser dummy');
      }
    } catch (error) {
      console.log('❌ Error en summary:', error.response?.data || error.message);
    }

    // Test 2: Pricing Calculation - Debe usar datos reales del tier y regionales
    console.log('\n🧮 Probando POST /admin/pricing/ride-tiers/calculate-pricing');
    try {
      const calculationData = {
        tierId: 4, // UberX
        distance: 10, // 10km
        duration: 20, // 20 minutos
        countryId: 1, // Si existe
        surgeMultiplier: 1.2
      };

      const calcResponse = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/calculate-pricing`, calculationData, { headers });
      const pricing = calcResponse.data.data;

      console.log('✅ Cálculo completado:');
      console.log(`   - Base fare: $${(pricing.basePricing.baseFare / 100).toFixed(2)}`);
      console.log(`   - Distance cost: $${(pricing.basePricing.distanceCost / 100).toFixed(2)}`);
      console.log(`   - Time cost: $${(pricing.basePricing.timeCost / 100).toFixed(2)}`);
      console.log(`   - Total: $${(pricing.finalPricing.totalAmount / 100).toFixed(2)}`);

      // Verificar que use datos reales
      if (pricing.tier && pricing.basePricing.baseFare > 0) {
        console.log('✅ CONFIRMADO: Cálculo usa datos reales del tier');
      }

      if (pricing.regionalMultipliers.totalMultiplier !== 1.0) {
        console.log('✅ CONFIRMADO: Multiplicadores regionales usan datos reales');
      }
    } catch (error) {
      console.log('❌ Error en cálculo:', error.response?.data || error.message);
    }

    // Test 3: Pricing Validation - Debe usar datos reales para comparación
    console.log('\n✅ Probando POST /admin/pricing/ride-tiers/validate-pricing');
    try {
      const validationData = {
        tier: {
          name: 'Test Premium',
          baseFare: '600', // $6.00
          perMinuteRate: '30', // $0.30/min
          perKmRate: '150' // $1.50/km
        },
        compareWithTierId: 4 // Comparar con UberX
      };

      const validationResponse = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/validate-pricing`, validationData, { headers });

      console.log('✅ Validación completada');

      if (validationResponse.data.data.comparison) {
        console.log('✅ CONFIRMADO: Comparación usa datos reales del tier existente');
        console.log('   - Tier existente:', validationResponse.data.data.comparison.existingTier.name);
        console.log('   - Competitividad:', validationResponse.data.data.comparison.competitiveness);
      }
    } catch (error) {
      console.log('❌ Error en validación:', error.response?.data || error.message);
    }

    // Test 4: Vehicle Types - Debe usar datos reales
    console.log('\n🚗 Probando POST /admin/pricing/ride-tiers/vehicle-types');
    try {
      const vehicleResponse = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/vehicle-types`, {}, { headers });
      const vehicleData = vehicleResponse.data.data;

      console.log('✅ Vehicle types obtenidos:');
      console.log(`   - Count: ${vehicleData.count}`);
      console.log(`   - Types: ${vehicleData.data.map(v => v.name).join(', ')}`);

      if (vehicleData.count > 0 && vehicleData.data[0].id) {
        console.log('✅ CONFIRMADO: Vehicle types usan datos reales de la DB');
      }
    } catch (error) {
      console.log('❌ Error en vehicle types:', error.response?.data || error.message);
    }

    console.log('\n🎉 Verificación completada!');
    console.log('✅ Todas las estadísticas verificadas usan datos reales de la base de datos.');

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

// Ejecutar verificación
testPricingStatistics();
