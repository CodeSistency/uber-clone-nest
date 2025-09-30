import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../services/firebase.service';
import { TwilioService } from '../services/twilio.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPayload,
} from './interfaces/notification.interface';
import { setupUnitTestModule, testUtils } from '../../test/setup/unit-setup';

// Mock services
const mockFirebaseService = {
  sendNotificationToUser: jest.fn(),
};

const mockTwilioService = {
  sendSMS: jest.fn(),
  getSMSTemplate: jest.fn(),
};

// Helper functions for creating consistent mocks
function createMockNotificationPreferences(overrides: Partial<any> = {}) {
  return {
    id: 1,
    userId: 123,
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false,
    rideUpdates: true,
    driverMessages: true,
    promotional: false,
    emergencyAlerts: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockPushToken(overrides: Partial<any> = {}) {
  return {
    id: 1,
    userId: 123,
    token: 'test_token_123',
    deviceType: 'ios',
    deviceId: 'device_123',
    isActive: true,
    lastUsedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: any;

  beforeEach(async () => {
    const module: TestingModule = await setupUnitTestModule({
      providers: [
        NotificationsService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: TwilioService,
          useValue: mockTwilioService,
        },
      ],
    });

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    Object.values(mockFirebaseService).forEach((mock) => {
      if (typeof mock === 'function' && mock.mockReset) {
        mock.mockReset();
      }
    });
    Object.values(mockTwilioService).forEach((mock) => {
      if (typeof mock === 'function' && mock.mockReset) {
        mock.mockReset();
      }
    });
    testUtils.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send push notification successfully', async () => {
      const payload: NotificationPayload = {
        userId: '123', // Use numeric string that can be parsed
        type: NotificationType.RIDE_COMPLETED,
        title: 'Ride Completed',
        message: 'Your ride has been completed successfully',
        data: { rideId: 123 },
        channels: [NotificationChannel.PUSH],
      };

      const mockPreferences = createMockNotificationPreferences({
        userId: 123,
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: false,
      });

      const mockPushTokens = [
        createMockPushToken({ userId: 123, token: 'push_token_123', deviceType: 'ios', isActive: true }),
      ];

      // Mock the save notification to avoid errors
      prismaService.notification.create.mockResolvedValue({} as any);

      prismaService.notificationPreferences.findUnique.mockResolvedValue(
        mockPreferences,
      );
      prismaService.pushToken.findMany.mockResolvedValue(mockPushTokens);
      mockFirebaseService.sendNotificationToUser.mockResolvedValue('batch_sent');

      const result = await service.sendNotification(payload);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        success: true,
        channel: NotificationChannel.PUSH,
        messageId: 'batch_sent',
        timestamp: expect.any(Date),
      });
      expect(mockFirebaseService.sendNotificationToUser).toHaveBeenCalledWith(
        '123',
        [{
          token: 'push_token_123',
          deviceType: 'ios',
          deviceId: 'device_123',
          isActive: true,
        }],
        expect.objectContaining({
          title: 'Ride Completed',
          body: 'Your ride has been completed successfully',
        }),
      );
    });
  });
});
