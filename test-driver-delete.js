/**
 * Test script para verificar la funcionalidad de eliminación de conductores
 * Este script verifica que el endpoint DELETE esté funcionando correctamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'your-admin-jwt-token-here'; // Reemplazar con token real

async function testDriverDelete() {
  console.log('🧪 Testing Driver Delete Functionality...\n');

  try {
    // Test 1: Soft delete (default)
    console.log('1️⃣ Testing soft delete...');
    const softDeleteResponse = await axios.delete(`${BASE_URL}/admin/drivers/1`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        reason: 'Test soft delete',
        permanent: false
      }
    });

    console.log('✅ Soft delete response:', softDeleteResponse.data);

    // Test 2: Permanent delete
    console.log('\n2️⃣ Testing permanent delete...');
    const permanentDeleteResponse = await axios.delete(`${BASE_URL}/admin/drivers/2`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        reason: 'Test permanent delete',
        permanent: true
      }
    });

    console.log('✅ Permanent delete response:', permanentDeleteResponse.data);

    // Test 3: Delete with active services (should fail)
    console.log('\n3️⃣ Testing delete with active services (should fail)...');
    try {
      await axios.delete(`${BASE_URL}/admin/drivers/3`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: 'Test with active services',
          permanent: false
        }
      });
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly failed with active services:', error.response?.data?.message || error.message);
    }

    // Test 4: Delete non-existent driver (should fail)
    console.log('\n4️⃣ Testing delete non-existent driver (should fail)...');
    try {
      await axios.delete(`${BASE_URL}/admin/drivers/99999`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: 'Test non-existent driver',
          permanent: false
        }
      });
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly failed for non-existent driver:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  testDriverDelete();
}

module.exports = { testDriverDelete };
