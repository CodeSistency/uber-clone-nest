#!/usr/bin/env node

/**
 * Quick Notification System Test
 * Run this script to test the notification system functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'user_2abc123def456ghi789jkl012'; // From seed data

console.log('🧪 Testing Notification System...\n');

// Test functions
async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testSystemStatus() {
  console.log('1️⃣ Testing system status...');
  try {
    const response = await makeRequest('GET', '/api/notifications/test/status');
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Services:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ System status check failed: ${error.message}`);
  }
  console.log('');
}

async function testRideRequestNotification() {
  console.log('2️⃣ Testing ride request notification...');
  try {
    const response = await makeRequest('POST', `/api/notifications/test/ride-request?userId=${TEST_USER_ID}`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📨 Result:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Ride request notification failed: ${error.message}`);
  }
  console.log('');
}

async function testDriverArrivalNotification() {
  console.log('3️⃣ Testing driver arrival notification...');
  try {
    const response = await makeRequest('POST', `/api/notifications/test/driver-arrived?userId=${TEST_USER_ID}`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📨 Result:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Driver arrival notification failed: ${error.message}`);
  }
  console.log('');
}

async function testEmergencyNotification() {
  console.log('4️⃣ Testing emergency notification...');
  try {
    const response = await makeRequest('POST', `/api/notifications/test/emergency?userId=${TEST_USER_ID}`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   🚨 Result:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Emergency notification failed: ${error.message}`);
  }
  console.log('');
}

async function testPromotionalNotification() {
  console.log('5️⃣ Testing promotional notification...');
  try {
    const response = await makeRequest('POST', `/api/notifications/test/promotional?userId=${TEST_USER_ID}`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   🎁 Result:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Promotional notification failed: ${error.message}`);
  }
  console.log('');
}

async function testNotificationHistory() {
  console.log('6️⃣ Testing notification history...');
  try {
    const response = await makeRequest('GET', `/api/notifications/preferences/history?userId=${TEST_USER_ID}&limit=5`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📚 History:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Notification history failed: ${error.message}`);
  }
  console.log('');
}

async function testCustomNotification() {
  console.log('7️⃣ Testing custom notification...');
  try {
    const customNotification = {
      userId: TEST_USER_ID,
      type: 'ride_accepted',
      title: 'Custom Test Notification',
      message: 'This is a custom test notification from the test script',
      data: {
        testId: 'custom-test-123',
        timestamp: new Date().toISOString(),
      },
      channels: ['websocket'], // Only WebSocket to avoid external service requirements
      priority: 'normal',
    };

    const response = await makeRequest('POST', '/api/notifications', customNotification);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📨 Result:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   ❌ Custom notification failed: ${error.message}`);
  }
  console.log('');
}

async function runTests() {
  console.log('🚀 Starting Notification System Tests\n');
  console.log('=' .repeat(50));
  console.log(`Test Server: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('=' .repeat(50));
  console.log('');

  // Make sure server is running
  try {
    await makeRequest('GET', '/health');
    console.log('✅ Server is running and responsive\n');
  } catch (error) {
    console.log('❌ Server is not running or not responsive');
    console.log('Please start the server with: npm run start:dev\n');
    process.exit(1);
  }

  // Run all tests
  await testSystemStatus();
  await testRideRequestNotification();
  await testDriverArrivalNotification();
  await testEmergencyNotification();
  await testPromotionalNotification();
  await testNotificationHistory();
  await testCustomNotification();

  console.log('=' .repeat(50));
  console.log('🎉 Notification System Tests Completed!');
  console.log('=' .repeat(50));
  console.log('');
  console.log('📋 Summary:');
  console.log('• System status check');
  console.log('• Ride request notifications');
  console.log('• Driver arrival notifications');
  console.log('• Emergency notifications');
  console.log('• Promotional notifications');
  console.log('• Notification history retrieval');
  console.log('• Custom notification sending');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('1. Configure Firebase & Twilio (see docs/notification-config.md)');
  console.log('2. Test with real device tokens');
  console.log('3. Monitor notification delivery in production');
  console.log('');
  console.log('📚 Documentation:');
  console.log('• docs/notification-implementation-summary.md');
  console.log('• docs/notification-config.md');
  console.log('• docs/realtime-tracking-guide.md');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
