#!/usr/bin/env node

/**
 * Test script to verify Swagger documentation is working correctly
 * Run this script to test if Swagger UI loads and API endpoints are accessible
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SWAGGER_PATH = process.env.SWAGGER_PATH || 'api';

async function testSwagger() {
  console.log('🧪 Testing Swagger Documentation...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📖 Swagger Path: ${SWAGGER_PATH}`);
  console.log('');

  try {
    // Test main application endpoint
    console.log('1️⃣ Testing main application endpoint...');
    const appResponse = await fetch(`${BASE_URL}`);
    console.log(`   Status: ${appResponse.status}`);
    console.log(`   OK: ${appResponse.ok}`);
    console.log('');

    // Test Swagger JSON endpoint
    console.log('2️⃣ Testing Swagger JSON endpoint...');
    const swaggerJsonUrl = `${BASE_URL}/${SWAGGER_PATH}-json`;
    const swaggerJsonResponse = await fetch(swaggerJsonUrl);
    console.log(`   URL: ${swaggerJsonUrl}`);
    console.log(`   Status: ${swaggerJsonResponse.status}`);
    console.log(`   OK: ${swaggerJsonResponse.ok}`);

    if (swaggerJsonResponse.ok) {
      const swaggerData = await swaggerJsonResponse.json();
      console.log(`   Title: ${swaggerData.info?.title || 'N/A'}`);
      console.log(`   Version: ${swaggerData.info?.version || 'N/A'}`);
      console.log(`   Servers: ${swaggerData.servers?.length || 0}`);
      if (swaggerData.servers?.length > 0) {
        swaggerData.servers.forEach((server, index) => {
          console.log(`     Server ${index + 1}: ${server.url} (${server.description || 'No description'})`);
        });
      }
    }
    console.log('');

    // Test Swagger UI endpoint
    console.log('3️⃣ Testing Swagger UI endpoint...');
    const swaggerUiUrl = `${BASE_URL}/${SWAGGER_PATH}`;
    const swaggerUiResponse = await fetch(swaggerUiUrl);
    console.log(`   URL: ${swaggerUiUrl}`);
    console.log(`   Status: ${swaggerUiResponse.status}`);
    console.log(`   OK: ${swaggerUiResponse.ok}`);
    console.log(`   Content-Type: ${swaggerUiResponse.headers.get('content-type')}`);
    console.log('');

    // Test a sample API endpoint
    console.log('4️⃣ Testing sample API endpoint...');
    try {
      const apiResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log(`   URL: ${BASE_URL}/api/auth/profile`);
      console.log(`   Status: ${apiResponse.status}`);
      console.log(`   Expected: 401 (Unauthorized - this is normal without valid token)`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    console.log('');
    console.log('✅ Swagger test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Main app: ${appResponse.ok ? '✅ Working' : '❌ Not working'}`);
    console.log(`   - Swagger JSON: ${swaggerJsonResponse.ok ? '✅ Working' : '❌ Not working'}`);
    console.log(`   - Swagger UI: ${swaggerUiResponse.ok ? '✅ Working' : '❌ Not working'}`);

    if (swaggerJsonResponse.ok) {
      const swaggerData = await swaggerJsonResponse.json();
      const hasProductionServer = swaggerData.servers?.some(server =>
        server.url.includes('https://') || !server.url.includes('localhost')
      );
      console.log(`   - Production server configured: ${hasProductionServer ? '✅ Yes' : '❌ No (only localhost)'}`);
    }

  } catch (error) {
    console.error('❌ Error testing Swagger:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('   1. Make sure the application is running');
    console.log('   2. Check your .env file has correct HOST and DOMAIN values');
    console.log('   3. Verify NODE_ENV is set to "production" for production deployment');
    console.log('   4. Check firewall settings if deployed on VPS');
    console.log('   5. Verify PM2 is configured correctly');
  }
}

// Usage instructions
console.log('🚀 Swagger Test Script for Uber Clone API');
console.log('==========================================');
console.log('');
console.log('Usage:');
console.log('  node test-swagger.js');
console.log('');
console.log('Environment variables:');
console.log('  BASE_URL - Application base URL (default: http://localhost:3000)');
console.log('  SWAGGER_PATH - Swagger path (default: api)');
console.log('');

testSwagger();
