import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

// Mock PrismaService for unit tests
export const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  driver: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  ride: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  rideTier: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  rating: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  wallet: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  promotion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  emergencyContact: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chatMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  driverDocument: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  store: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  deliveryOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  pushToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  notificationPreferences: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
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
