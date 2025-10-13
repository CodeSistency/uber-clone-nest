// Script para probar todos los endpoints de pricing organizados
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@uberclone.com',
  password: 'Admin123!'
};

async function testPricingEndpoints() {
  try {
    console.log('🚀 Obteniendo token de admin...');

    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.access_token;

    console.log('✅ Token obtenido exitosamente');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📋 ENDPOINTS DE RIDE TIERS (/admin/pricing/ride-tiers)');
    console.log('='.repeat(60));

    // Test 1: Listar ride tiers
    console.log('\n🧪 GET /admin/pricing/ride-tiers');
    try {
      const listResponse = await axios.get(`${BASE_URL}/admin/pricing/ride-tiers`, { headers });
      console.log('✅ Listar ride tiers funciona');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Obtener tipos de vehículo
    console.log('\n🧪 POST /admin/pricing/ride-tiers/vehicle-types');
    try {
      const vehicleTypesResponse = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/vehicle-types`, {}, { headers });
      console.log('✅ Obtener vehicle types funciona');
      console.log(`📊 Encontrados: ${vehicleTypesResponse.data.data.count} tipos`);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Validar pricing
    console.log('\n🧪 POST /admin/pricing/ride-tiers/validate-pricing');
    try {
      const validateData = {
        tier: {
          name: 'Test Tier',
          baseFare: '300',
          perMinuteRate: '20',
          perKmRate: '100'
        },
        compareWithTierId: 1
      };

      const validateResponse = await axios.post(`${BASE_URL}/admin/pricing/ride-tiers/validate-pricing`, validateData, { headers });
      console.log('✅ Validar pricing funciona');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 4: Resumen de pricing
    console.log('\n🧪 GET /admin/pricing/ride-tiers/summary/overview');
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/admin/pricing/ride-tiers/summary/overview`, { headers });
      console.log('✅ Resumen de pricing funciona');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n📋 ENDPOINTS DE TEMPORAL RULES (/admin/pricing/temporal-rules)');
    console.log('='.repeat(60));

    // Test 5: Listar reglas temporales
    console.log('\n🧪 GET /admin/pricing/temporal-rules');
    try {
      const rulesResponse = await axios.get(`${BASE_URL}/admin/pricing/temporal-rules`, { headers });
      console.log('✅ Listar reglas temporales funciona');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 6: Resumen de reglas temporales
    console.log('\n🧪 GET /admin/pricing/temporal-rules/summary/overview');
    try {
      const rulesSummaryResponse = await axios.get(`${BASE_URL}/admin/pricing/temporal-rules/summary/overview`, { headers });
      console.log('✅ Resumen de reglas temporales funciona');
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

// Ejecutar prueba
testPricingEndpoints();
