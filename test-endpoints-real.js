/*
  Pure Endpoint Testing for Uber Clone Backend
  - Tests all REST API endpoints systematically
  - Validates responses and error handling
  - Measures response times
  - Generates test reports
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let AUTH_TOKEN = process.env.TEST_JWT || '';

class EndpointTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      responseTimes: [],
      errors: []
    };
    this.testUser = null;
    this.testDriver = null;
    this.testRide = null;
    this.testOrder = null;
  }

  async makeRequest(endpoint, method = 'GET', body = null, description = '') {
    const startTime = Date.now();

    try {
      const url = `${BASE_URL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : undefined
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.results.responseTimes.push(responseTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));

      console.log(`✅ ${method} ${endpoint} - ${responseTime}ms`);
      this.results.passed++;
      this.results.total++;

      return { success: true, data, responseTime };

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`❌ ${method} ${endpoint} - ${responseTime}ms - ${error.message}`);
      this.results.failed++;
      this.results.total++;
      this.results.errors.push({
        endpoint,
        method,
        error: error.message,
        responseTime,
        description
      });

      return { success: false, error: error.message, responseTime };
    }
  }

  async setupTestData() {
    console.log('\n🔧 Setting up test data...');

    // Create test user
    const userResult = await this.makeRequest('/api/auth/register', 'POST', {
      name: 'Test User',
      email: `test_user_${Date.now()}@example.com`,
      password: 'TestPass123!'
    }, 'Create test user');

    if (userResult.success) {
      AUTH_TOKEN = userResult.data.accessToken;
      this.testUser = userResult.data.user;
      console.log('👤 Test user created:', this.testUser?.name);
    }

    // Create test driver
    const driverResult = await this.makeRequest('/api/driver/register', 'POST', {
      firstName: 'Test',
      lastName: 'Driver',
      email: `test_driver_${Date.now()}@example.com`,
      clerkId: `driver_clerk_${Date.now()}`,
      carModel: 'Toyota Corolla',
      licensePlate: 'TEST-123',
      carSeats: 4
    }, 'Create test driver');

    if (driverResult.success) {
      this.testDriver = driverResult.data;
      console.log('👨‍🚗 Test driver created:', this.testDriver?.firstName);
    }
  }

  async testAuthEndpoints() {
    console.log('\n🔐 === TESTING AUTH ENDPOINTS ===');

    // Test login
    await this.makeRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    }, 'User login');

    // Test profile
    await this.makeRequest('/api/auth/profile', 'GET', null, 'Get user profile');

    // Test refresh token
    await this.makeRequest('/api/auth/refresh', 'POST', {
      refreshToken: 'fake-refresh-token'
    }, 'Refresh access token');
  }

  async testRideEndpoints() {
    console.log('\n🚕 === TESTING RIDE ENDPOINTS ===');

    // Create ride
    const rideResult = await this.makeRequest('/api/ride/create', 'POST', {
      origin_address: 'Centro de Caracas',
      destination_address: 'Plaza Venezuela',
      origin_latitude: 10.506,
      origin_longitude: -66.914,
      destination_latitude: 10.500,
      destination_longitude: -66.910,
      ride_time: 25,
      fare_price: 15.99,
      payment_status: 'pending',
      user_id: this.testUser?.id || 1,
      tier_id: 1,
      vehicle_type_id: 1
    }, 'Create ride');

    if (rideResult.success) {
      this.testRide = rideResult.data;
      const rideId = this.testRide.rideId;

      // Get ride details
      await this.makeRequest(`/api/ride/${rideId}`, 'GET', null, 'Get ride details');

      // Get vehicle types
      await this.makeRequest('/api/ride/vehicle-types', 'GET', null, 'Get vehicle types');

      // Get ride requests
      await this.makeRequest('/api/ride/requests?driverLat=10.5&driverLng=-66.9&radius=5', 'GET', null, 'Get ride requests');

      // Accept ride
      await this.makeRequest(`/api/ride/${rideId}/accept`, 'POST', {
        driver_id: this.testDriver?.id || 1
      }, 'Accept ride');

      // Start ride
      await this.makeRequest(`/api/ride/${rideId}/start`, 'POST', {
        driverId: this.testDriver?.id || 1
      }, 'Start ride');

      // Complete ride
      await this.makeRequest(`/api/ride/${rideId}/complete`, 'POST', {
        driverId: this.testDriver?.id || 1,
        finalDistance: 12.5,
        finalTime: 25
      }, 'Complete ride');

      // Rate ride
      await this.makeRequest(`/api/ride/${rideId}/rate`, 'POST', {
        ratedByUserId: this.testUser?.id || 1,
        ratedUserId: this.testDriver?.id || 1,
        ratingValue: 5,
        comment: 'Excelente servicio!'
      }, 'Rate ride');
    }
  }

  async testDriverEndpoints() {
    console.log('\n👨‍🚗 === TESTING DRIVER ENDPOINTS ===');

    // Get all drivers
    await this.makeRequest('/api/driver', 'GET', null, 'Get all drivers');

    // Get driver details
    if (this.testDriver) {
      await this.makeRequest(`/api/driver/${this.testDriver.id}`, 'GET', null, 'Get driver details');

      // Update driver status
      await this.makeRequest(`/api/driver/${this.testDriver.id}/status`, 'PUT', {
        status: 'online'
      }, 'Update driver status');

      // Get driver rides
      await this.makeRequest(`/api/driver/${this.testDriver.id}/rides`, 'GET', null, 'Get driver rides');
    }
  }

  async testStoreEndpoints() {
    console.log('\n🏪 === TESTING STORE ENDPOINTS ===');

    // Get nearby stores
    await this.makeRequest('/stores?lat=10.5&lng=-66.9&radius=5', 'GET', null, 'Get nearby stores');

    // Get store details
    await this.makeRequest('/stores/1', 'GET', null, 'Get store details');
  }

  async testOrderEndpoints() {
    console.log('\n🍕 === TESTING ORDER ENDPOINTS ===');

    // Create order
    const orderResult = await this.makeRequest('/orders', 'POST', {
      storeId: 1,
      items: [
        { productId: 1, quantity: 2, specialInstructions: 'Extra cheese' }
      ],
      deliveryAddress: 'Test Address 123',
      deliveryLatitude: 10.506,
      deliveryLongitude: -66.914
    }, 'Create order');

    if (orderResult.success) {
      this.testOrder = orderResult.data;
      const orderId = this.testOrder.orderId || this.testOrder.id;

      // Get order details
      await this.makeRequest(`/orders/${orderId}`, 'GET', null, 'Get order details');

      // Get user orders
      await this.makeRequest('/orders', 'GET', null, 'Get user orders');

      // Get available orders for drivers
      await this.makeRequest('/orders/driver/available', 'GET', null, 'Get available orders');

      // Accept order
      await this.makeRequest(`/orders/${orderId}/accept`, 'POST', {}, 'Accept order');

      // Mark as picked up
      await this.makeRequest(`/orders/${orderId}/pickup`, 'POST', {}, 'Mark order as picked up');

      // Mark as delivered
      await this.makeRequest(`/orders/${orderId}/deliver`, 'POST', {}, 'Mark order as delivered');
    }
  }

  async testFlowEndpoints() {
    console.log('\n🔄 === TESTING FLOW ENDPOINTS ===');

    // Transport flow
    await this.makeRequest('/rides/flow/client/transport/define-ride', 'POST', {
      originAddress: 'Centro',
      originLat: 10.5,
      originLng: -66.91,
      destinationAddress: 'Plaza',
      destinationLat: 10.49,
      destinationLng: -66.9,
      minutes: 20,
      tierId: 1,
      vehicleTypeId: 1
    }, 'Define transport ride');

    // Delivery flow
    await this.makeRequest('/rides/flow/client/delivery/create-order', 'POST', {
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: 'Test Address',
      deliveryLatitude: 10.5,
      deliveryLongitude: -66.9
    }, 'Create delivery order');
  }

  generateReport() {
    console.log('\n📊 === TEST REPORT ===');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.responseTimes.length > 0) {
      const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
      const minTime = Math.min(...this.results.responseTimes);
      const maxTime = Math.max(...this.results.responseTimes);

      console.log(`\nResponse Times:`);
      console.log(`Average: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`Min: ${minTime}ms`);
      console.log(`Max: ${maxTime}ms`);
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.method} ${error.endpoint} - ${error.error}`);
      });
    }

    return this.results;
  }

  async runAllTests() {
    console.log('🚀 Starting Uber Clone Backend Endpoint Tests');
    console.log('=' .repeat(50));

    try {
      await this.setupTestData();
      await this.testAuthEndpoints();
      await this.testDriverEndpoints();
      await this.testStoreEndpoints();
      await this.testRideEndpoints();
      await this.testOrderEndpoints();
      await this.testFlowEndpoints();

    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      await prisma.$disconnect();
    }

    return this.generateReport();
  }
}

// Export for use
module.exports = EndpointTester;

// Run if called directly
if (require.main === module) {
  const tester = new EndpointTester();
  tester.runAllTests().then(() => {
    console.log('\n🏁 Tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
