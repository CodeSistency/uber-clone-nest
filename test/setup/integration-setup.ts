import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

// Test database utilities
export class TestDatabaseManager {
  constructor(private prisma: PrismaService) {}

  async cleanDatabase(): Promise<void> {
    // Clean in order to respect foreign key constraints
    await this.prisma.chatMessage.deleteMany();
    await this.prisma.rating.deleteMany();
    await this.prisma.emergencyContact.deleteMany();
    await this.prisma.orderItem.deleteMany();
    await this.prisma.deliveryOrder.deleteMany();
    await this.prisma.ride.deleteMany();
    await this.prisma.driverDocument.deleteMany();
    await this.prisma.driver.deleteMany();
    await this.prisma.product.deleteMany();
    await this.prisma.store.deleteMany();
    await this.prisma.walletTransaction.deleteMany();
    await this.prisma.wallet.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.pushToken.deleteMany();
    await this.prisma.notificationPreferences.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.promotion.deleteMany();
    await this.prisma.rideTier.deleteMany();
  }

  async seedTestData(): Promise<void> {
    // Create test ride tiers
    await this.prisma.rideTier.createMany({
      data: [
        {
          name: 'Economy',
          baseFare: 2.5,
          perMinuteRate: 0.25,
          perKmRate: 80,
        },
        {
          name: 'Premium',
          baseFare: 5.0,
          perMinuteRate: 0.5,
          perKmRate: 200,
        },
      ],
    });

    // Create test user
    await this.prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    // Create vehicle type first
    const vehicleType = await this.prisma.vehicleType.create({
      data: {
        name: 'car',
        displayName: 'Carro',
      },
    });

    // Create test driver
    const driver = await this.prisma.driver.create({
      data: {
        firstName: 'Test',
        lastName: 'Driver',
        status: 'ONLINE' as any,
        carSeats: 4,
      },
    });

    // Create vehicle for the driver
    await this.prisma.vehicle.create({
      data: {
        driverId: driver.id,
        vehicleTypeId: vehicleType.id,
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        licensePlate: 'ABC-123',
        seatingCapacity: 4,
      },
    });
  }
}

// Setup function for integration tests
export async function setupIntegrationTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  dbManager: TestDatabaseManager;
  request: (method: string, url: string) => request.Test;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = app.get(PrismaService);
  const dbManager = new TestDatabaseManager(prisma);

  // Clean and seed database
  await dbManager.cleanDatabase();
  await dbManager.seedTestData();

  await app.init();

  return {
    app,
    prisma,
    dbManager,
    request: (method: string, url: string) =>
      request(app.getHttpServer())[method.toLowerCase()](url),
  };
}

// Common test data factories
export const testDataFactory = {
  createUser: (overrides = {}) => ({
    name: 'Integration Test User',
    email: `integration${Date.now()}@example.com`,
    clerkId: `user_integration_${Date.now()}`,
    ...overrides,
  }),

  createDriver: (overrides = {}) => ({
    firstName: 'Integration',
    lastName: 'Driver',
    email: `driver${Date.now()}@test.com`,
    carModel: 'Honda Civic',
    licensePlate: `TEST-${Date.now().toString().slice(-4)}`,
    carSeats: 4,
    status: 'online',
    ...overrides,
  }),

  createRide: (overrides = {}) => ({
    originAddress: '123 Test St, Test City',
    destinationAddress: '456 Test Ave, Test City',
    originLatitude: 40.7128,
    originLongitude: -74.006,
    destinationLatitude: 40.7589,
    destinationLongitude: -73.9851,
    rideTime: 20,
    farePrice: 12.5,
    paymentStatus: 'pending',
    userId: 'user_integration_123',
    tierId: 1,
    ...overrides,
  }),

  createWalletTransaction: (walletId: number, overrides = {}) => ({
    walletId,
    amount: 50.0,
    transactionType: 'credit',
    description: 'Test transaction',
    ...overrides,
  }),
};
