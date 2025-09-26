import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

// Mock services for unit tests
export const mockPrismaService = {
  user: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  driver: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  ride: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  country: {
    findUnique: jest.fn().mockResolvedValue({}),
  },
  state: {
    findUnique: jest.fn().mockResolvedValue({}),
  },
  city: {
    findUnique: jest.fn().mockResolvedValue({}),
  },
  serviceZone: {
    findUnique: jest.fn().mockResolvedValue({}),
  },
  rideTier: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  rating: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  wallet: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
  walletTransaction: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  promotion: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  emergencyContact: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  chatMessage: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  driverDocument: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  store: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  product: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  deliveryOrder: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  orderItem: {
    create: jest.fn().mockResolvedValue({}),
  },
  notification: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  pushToken: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  notificationPreferences: {
    findUnique: jest.fn().mockResolvedValue({}),
    upsert: jest.fn().mockResolvedValue({}),
  },
  temporalPricingRule: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  featureFlag: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  aPIKey: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  aPIKeyAudit: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
};

// Mock RedisService for unit tests
export const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
};

// Setup function for unit tests
export async function setupUnitTestModule(
  metadata: any,
): Promise<TestingModule> {
  return Test.createTestingModule({
    ...metadata,
    providers: [
      ...(metadata.providers || []),
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
      {
        provide: RedisService,
        useValue: mockRedisService,
      },
    ],
  }).compile();
}

// Common test utilities
export const testUtils = {
  resetAllMocks: () => {
    // Reset all Prisma service mocks
    Object.values(mockPrismaService).forEach((service) => {
      if (typeof service === 'object') {
        Object.values(service).forEach((method) => {
          if (typeof method === 'function' && method.mockReset) {
            method.mockReset();
          }
        });
      }
    });

    // Reset Redis service mocks
    Object.values(mockRedisService).forEach((method) => {
      if (typeof method === 'function' && method.mockReset) {
        method.mockReset();
      }
    });
  },

  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    clerkId: 'user_test123',
    ...overrides,
  }),

  createMockDriver: (overrides = {}) => ({
    id: 1,
    firstName: 'Test',
    lastName: 'Driver',
    email: 'driver@test.com',
    carModel: 'Toyota Camry',
    licensePlate: 'ABC-123',
    carSeats: 4,
    status: 'online',
    ...overrides,
  }),

  createMockRide: (overrides = {}) => ({
    rideId: 1,
    originAddress: '123 Main St',
    destinationAddress: '456 Oak Ave',
    originLatitude: 40.7128,
    originLongitude: -74.006,
    destinationLatitude: 40.7589,
    destinationLongitude: -73.9851,
    rideTime: 25,
    farePrice: 15.75,
    paymentStatus: 'completed',
    userId: 'user_test123',
    ...overrides,
  }),
};
