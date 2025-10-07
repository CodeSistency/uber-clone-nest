const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    authToken = response.data.access_token;
    console.log('✅ Token de autenticación obtenido');
    return authToken;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testToggleRideTier() {
  try {
    console.log('\n🧪 Probando toggle-status para ride tiers...');

    // Primero obtener un tier existente
    const getTiersResponse = await axios.get(`${BASE_URL}/admin/pricing/ride-tiers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (getTiersResponse.data.tiers.length === 0) {
      console.log('⚠️  No hay tiers disponibles para probar toggle');
      return;
    }

    const tierId = getTiersResponse.data.tiers[0].id;
    const originalStatus = getTiersResponse.data.tiers[0].isActive;

    console.log(`📊 Tier ID: ${tierId}, Estado original: ${originalStatus}`);

    // Ejecutar toggle
    const toggleResponse = await axios.patch(
      `${BASE_URL}/admin/pricing/ride-tiers/${tierId}/toggle-status`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const newStatus = toggleResponse.data.isActive;
    console.log(`✅ Toggle exitoso. Nuevo estado: ${newStatus}`);

    if (newStatus !== originalStatus) {
      console.log('✅ Estado cambió correctamente');
    } else {
      console.log('⚠️  Estado no cambió (posiblemente no se actualizó)');
    }

  } catch (error) {
    console.error('❌ Error en toggle de ride tier:', error.response?.data || error.message);
  }
}

async function testToggleTemporalRule() {
  try {
    console.log('\n🧪 Probando toggle-status para reglas temporales...');

    // Primero obtener una regla existente
    const getRulesResponse = await axios.get(`${BASE_URL}/admin/pricing/temporal-rules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (getRulesResponse.data.rules.length === 0) {
      console.log('⚠️  No hay reglas temporales disponibles para probar toggle');
      return;
    }

    const ruleId = getRulesResponse.data.rules[0].id;
    const originalStatus = getRulesResponse.data.rules[0].isActive;

    console.log(`📊 Rule ID: ${ruleId}, Estado original: ${originalStatus}`);

    // Ejecutar toggle
    const toggleResponse = await axios.patch(
      `${BASE_URL}/admin/pricing/temporal-rules/${ruleId}/toggle-status`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const newStatus = toggleResponse.data.isActive;
    console.log(`✅ Toggle exitoso. Nuevo estado: ${newStatus}`);

    if (newStatus !== originalStatus) {
      console.log('✅ Estado cambió correctamente');
    } else {
      console.log('⚠️  Estado no cambió (posiblemente no se actualizó)');
    }

  } catch (error) {
    console.error('❌ Error en toggle de regla temporal:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Probando endpoints de toggle para pricing module');

  await getAuthToken();
  await testToggleRideTier();
  await testToggleTemporalRule();

  console.log('\n✨ Pruebas completadas');
}

main().catch(console.error);
