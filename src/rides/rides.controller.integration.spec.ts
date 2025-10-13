import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  setupIntegrationTestApp,
  testDataFactory,
} from '../../test/setup/integration-setup';
import { RidesModule } from './rides.module';

describe('RidesController (Integration)', () => {
  let app: INestApplication;
  let requestAgent: (method: string, url: string) => request.Test;

  beforeAll(async () => {
    const testSetup = await setupIntegrationTestApp();
    app = testSetup.app;
    requestAgent = testSetup.request;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/ride (POST)', () => {
    it('should create a ride successfully', async () => {
      const createRideDto = {
        origin_address: '123 Test St, Test City',
        destination_address: '456 Test Ave, Test City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'pending',
        user_id: 'user_test123',
        tier_id: 1,
      };

      const response = await requestAgent('POST', '/api/ride/create')
        .send(createRideDto)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        originAddress: createRideDto.origin_address,
        destinationAddress: createRideDto.destination_address,
        rideTime: createRideDto.ride_time,
        farePrice: createRideDto.fare_price,
        paymentStatus: createRideDto.payment_status,
        userId: createRideDto.user_id,
        tierId: createRideDto.tier_id,
      });
      expect(response.body.data).toHaveProperty('rideId');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid data', async () => {
      const invalidRideDto = {
        // Missing required fields
        origin_address: '123 Test St',
      };

      await requestAgent('POST', '/api/ride/create')
        .send(invalidRideDto)
        .expect(400);
    });
  });

  describe('/api/ride/estimate (GET)', () => {
    it('should return fare estimate with basic parameters', async () => {
      const tierId = 1;
      const minutes = 20;
      const kilometers = 5;

      const response = await requestAgent(
        'GET',
        `/api/ride/estimate?tierId=${tierId}&minutes=${minutes}&kilometers=${kilometers}`,
      ).expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tier');
      expect(response.body.data).toHaveProperty('baseFare');
      expect(response.body.data).toHaveProperty('totalFare');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data).toHaveProperty('restrictions');
      expect(typeof response.body.data.totalFare).toBe('number');
      expect(response.body.data.totalFare).toBeGreaterThan(0);
      expect(response.body.data.restrictions.isAllowed).toBe(true);
    });

    it('should return fare estimate with geographic pricing', async () => {
      const tierId = 1;
      const minutes = 20;
      const kilometers = 5;
      const userLat = 10.5061;
      const userLng = -66.9146;

      const response = await requestAgent(
        'GET',
        `/api/ride/estimate?tierId=${tierId}&minutes=${minutes}&kilometers=${kilometers}&userLat=${userLat}&userLng=${userLng}`,
      ).expect(200);

      expect(response.body.data).toHaveProperty('geographic');
      expect(response.body.data.breakdown.geographicMultiplier).toBeDefined();
    });

    it('should return fare estimate with valid promo code', async () => {
      const tierId = 1;
      const minutes = 20;
      const kilometers = 5;
      const promoCode = 'TEST20'; // Assuming this promo exists in test data

      const response = await requestAgent(
        'GET',
        `/api/ride/estimate?tierId=${tierId}&minutes=${minutes}&kilometers=${kilometers}&promoCode=${promoCode}`,
      ).expect(200);

      expect(response.body.data).toHaveProperty('promotion');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data.breakdown.discount).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid promo code gracefully', async () => {
      const tierId = 1;
      const minutes = 20;
      const kilometers = 5;
      const promoCode = 'INVALID';

      const response = await requestAgent(
        'GET',
        `/api/ride/estimate?tierId=${tierId}&minutes=${minutes}&kilometers=${kilometers}&promoCode=${promoCode}`,
      ).expect(200);

      // Should not fail, just ignore invalid promo
      expect(response.body.data).toHaveProperty('totalFare');
      expect(response.body.data.totalFare).toBeGreaterThan(0);
    });

    it('should return 400 for missing required parameters', async () => {
      await requestAgent('GET', '/api/ride/estimate').expect(400);
    });

    it('should return 400 for invalid tierId', async () => {
      await requestAgent(
        'GET',
        '/api/ride/estimate?tierId=999&minutes=20&kilometers=5',
      ).expect(400);
    });

    it('should calculate consistent pricing for define-ride flow', async () => {
      const tierId = 1;
      const minutes = 20;
      const kilometers = 5;
      const userLat = 10.5061;
      const userLng = -66.9146;

      // 1. Get estimate price
      const estimateResponse = await requestAgent(
        'GET',
        `/api/ride/estimate?tierId=${tierId}&minutes=${minutes}&kilometers=${kilometers}&userLat=${userLat}&userLng=${userLng}`,
      ).expect(200);

      const estimatedPrice = estimateResponse.body.data.totalFare;

      // 2. Verify price is calculated (not 0)
      expect(estimatedPrice).toBeGreaterThan(0);
      expect(typeof estimatedPrice).toBe('number');

      // 3. Verify breakdown is present
      expect(estimateResponse.body.data.breakdown).toBeDefined();
      expect(estimateResponse.body.data.breakdown.finalPrice).toBe(
        estimatedPrice,
      );
    });
  });

  describe('/api/ride/:id (GET)', () => {
    it('should return user rides history', async () => {
      // First create a ride
      const createRideDto = {
        origin_address: '123 Test St, Test City',
        destination_address: '456 Test Ave, Test City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'completed',
        user_id: 'user_test123',
        tier_id: 1,
      };

      const createResponse = await requestAgent('POST', '/api/ride/create')
        .send(createRideDto)
        .expect(201);

      const userId = 'user_test123';

      const response = await requestAgent('GET', `/api/ride/${userId}`).expect(
        200,
      );

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check that the created ride is in the history
      const createdRide = response.body.data.find(
        (ride: any) => ride.rideId === createResponse.body.data.rideId,
      );
      expect(createdRide).toBeDefined();
      expect(createdRide.userId).toBe(userId);
    });

    it('should return empty array for user with no rides', async () => {
      const nonExistentUserId = 'user_nonexistent123';

      const response = await requestAgent(
        'GET',
        `/api/ride/${nonExistentUserId}`,
      ).expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('/api/ride/schedule (POST)', () => {
    it('should schedule a ride for future date', async () => {
      const scheduleRideDto = {
        origin_address: '123 Future St, Future City',
        destination_address: '456 Future Ave, Future City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 30,
        tier_id: 1,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        user_id: 'user_test123',
      };

      const response = await requestAgent('POST', '/api/ride/schedule')
        .send(scheduleRideDto)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        originAddress: scheduleRideDto.origin_address,
        destinationAddress: scheduleRideDto.destination_address,
        rideTime: scheduleRideDto.ride_time,
        tierId: scheduleRideDto.tier_id,
        userId: scheduleRideDto.user_id,
        farePrice: 0, // Should be 0 for scheduled rides
        paymentStatus: 'pending',
      });
      expect(response.body.data).toHaveProperty('scheduledFor');
      expect(response.body.data).toHaveProperty('rideId');
    });

    it('should return 400 for past date', async () => {
      const pastScheduleRideDto = {
        origin_address: '123 Past St, Past City',
        destination_address: '456 Past Ave, Past City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 30,
        tier_id: 1,
        scheduled_for: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        user_id: 'user_test123',
      };

      await requestAgent('POST', '/api/ride/schedule')
        .send(pastScheduleRideDto)
        .expect(400);
    });
  });

  describe('/api/ride/:rideId/accept (POST)', () => {
    it('should accept a ride successfully', async () => {
      // First create a ride
      const createRideDto = {
        origin_address: '123 Accept St, Accept City',
        destination_address: '456 Accept Ave, Accept City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'pending',
        user_id: 'user_test123',
        tier_id: 1,
      };

      const createResponse = await requestAgent('POST', '/api/ride/create')
        .send(createRideDto)
        .expect(201);

      const rideId = createResponse.body.data.rideId;
      const acceptRideDto = { driverId: 1 };

      const response = await requestAgent('POST', `/api/ride/${rideId}/accept`)
        .send(acceptRideDto)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.driverId).toBe(acceptRideDto.driverId);
      expect(response.body.data.rideId).toBe(rideId);
    });

    it('should return 404 for non-existent ride', async () => {
      const acceptRideDto = { driverId: 1 };

      await requestAgent('POST', '/api/ride/99999/accept')
        .send(acceptRideDto)
        .expect(404);
    });
  });

  describe('/api/ride/:rideId/rate (POST)', () => {
    it('should rate a ride successfully', async () => {
      // First create and accept a ride
      const createRideDto = {
        origin_address: '123 Rate St, Rate City',
        destination_address: '456 Rate Ave, Rate City',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'completed',
        user_id: 'user_test123',
        tier_id: 1,
      };

      const createResponse = await requestAgent('POST', '/api/ride/create')
        .send(createRideDto)
        .expect(201);

      const rideId = createResponse.body.data.rideId;
      const rateRideDto = {
        ratedByClerkId: 'user_rater123',
        ratedUserId: 'user_rated123',
        ratingValue: 5,
        comment: 'Excellent service!',
      };

      const response = await requestAgent('POST', `/api/ride/${rideId}/rate`)
        .send(rateRideDto)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        rideId,
        ratedByClerkId: rateRideDto.ratedByClerkId,
        ratedUserId: rateRideDto.ratedUserId,
        ratingValue: rateRideDto.ratingValue,
        comment: rateRideDto.comment,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid rating value', async () => {
      const rideId = 1;
      const invalidRateRideDto = {
        ratedByClerkId: 'user_rater123',
        ratedUserId: 'user_rated123',
        ratingValue: 6, // Invalid rating (should be 1-5)
        comment: 'Invalid rating',
      };

      await requestAgent('POST', `/api/ride/${rideId}/rate`)
        .send(invalidRateRideDto)
        .expect(400);
    });
  });
});
