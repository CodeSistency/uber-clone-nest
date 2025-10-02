import { Test, TestingModule } from '@nestjs/testing';
import { ExpoNotificationsService } from './expo-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../services/twilio.service';
import {
  NotificationType,
  NotificationChannel,
} from './interfaces/notification.interface';

// Mock de Expo
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest
      .fn()
      .mockReturnValue([[{ to: 'ExponentPushToken[test]', title: 'Test' }]]),
    sendPushNotificationsAsync: jest
      .fn()
      .mockResolvedValue([{ status: 'ok', id: 'test-receipt-id' }]),
  })),
  ExpoPushToken: jest.fn(),
}));

describe('ExpoNotificationsService', () => {
  let service: ExpoNotificationsService;
  let prismaService: PrismaService;
  let twilioService: TwilioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpoNotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notificationPreferences: {
              findUnique: jest.fn(),
            },
            pushToken: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: TwilioService,
          useValue: {
            sendSMS: jest.fn(),
            getSMSTemplate: jest.fn().mockReturnValue('Test SMS message'),
          },
        },
      ],
    }).compile();

    service = module.get<ExpoNotificationsService>(ExpoNotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    twilioService = module.get<TwilioService>(TwilioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send push notification successfully', async () => {
      // Mock data
      const mockPreferences = {
        pushEnabled: true,
        smsEnabled: false,
      };

      const mockTokens = ['ExponentPushToken[test-token]'];

      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue(mockPreferences as any);
      jest
        .spyOn(prismaService.pushToken, 'findMany')
        .mockResolvedValue([{ token: mockTokens[0] }] as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test Notification',
        message: 'Test message',
        data: { rideId: 1 },
        channels: [NotificationChannel.PUSH],
        priority: 'high' as const,
      };

      const result = await service.sendNotification(payload);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].channel).toBe(NotificationChannel.PUSH);
    });

    it('should send SMS notification for critical alerts', async () => {
      const mockPreferences = {
        pushEnabled: false,
        smsEnabled: true,
      };

      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue(mockPreferences as any);
      jest.spyOn(prismaService.pushToken, 'findMany').mockResolvedValue([]);
      jest
        .spyOn(twilioService, 'sendSMS')
        .mockResolvedValue({ sid: 'test-sid' } as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      const payload = {
        userId: '123',
        type: NotificationType.EMERGENCY_TRIGGERED,
        title: 'Emergency Alert',
        message: 'Emergency message',
        data: {},
        channels: [NotificationChannel.SMS],
      };

      const result = await service.sendNotification(payload);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].channel).toBe(NotificationChannel.SMS);
      expect(twilioService.sendSMS).toHaveBeenCalled();
    });

    it('should handle push notification failure gracefully', async () => {
      const mockPreferences = {
        pushEnabled: true,
        smsEnabled: false,
      };

      // Mock Expo to throw error
      const mockExpo = (await import('expo-server-sdk')).Expo;
      jest
        .spyOn(mockExpo.prototype, 'sendPushNotificationsAsync')
        .mockRejectedValue(new Error('Push failed'));

      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue(mockPreferences as any);
      jest
        .spyOn(prismaService.pushToken, 'findMany')
        .mockResolvedValue([{ token: 'ExponentPushToken[test]' }] as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test Notification',
        message: 'Test message',
        data: {},
      };

      const result = await service.sendNotification(payload);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(false);
      expect(result[0].channel).toBe(NotificationChannel.PUSH);
      expect(result[0].error).toBe('Push failed');
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications', async () => {
      const payloads = [
        {
          userId: '123',
          type: NotificationType.RIDE_REQUEST,
          title: 'Test 1',
          message: 'Message 1',
          data: {},
        },
        {
          userId: '456',
          type: NotificationType.RIDE_ACCEPTED,
          title: 'Test 2',
          message: 'Message 2',
          data: {},
        },
      ];

      // Mock all dependencies
      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue({ pushEnabled: true, smsEnabled: false } as any);
      jest
        .spyOn(prismaService.pushToken, 'findMany')
        .mockResolvedValue([{ token: 'ExponentPushToken[test]' }] as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      const result = await service.sendBulkNotifications(payloads);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toHaveLength(1);
    });
  });

  describe('notifyNearbyDrivers', () => {
    it('should notify nearby drivers about ride', async () => {
      const mockDrivers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          vehicles: [{ vehicleType: { displayName: 'Car' } }],
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          vehicles: [{ vehicleType: { displayName: 'Car' } }],
        },
      ];

      jest
        .spyOn(prismaService.driver, 'findMany')
        .mockResolvedValue(mockDrivers as any);
      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue({ pushEnabled: true } as any);
      jest
        .spyOn(prismaService.pushToken, 'findMany')
        .mockResolvedValue([{ token: 'ExponentPushToken[test]' }] as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      await service.notifyNearbyDrivers(123, { lat: 40.7128, lng: -74.006 });

      // Verify that bulk notifications were sent
      expect(prismaService.driver.findMany).toHaveBeenCalled();
    });
  });

  describe('findAndAssignNearbyDriver', () => {
    it('should find and assign nearby driver', async () => {
      const mockDrivers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          vehicles: [{ vehicleType: { displayName: 'Car' } }],
          distance: 2.5,
        },
      ];

      jest
        .spyOn(prismaService.driver, 'findMany')
        .mockResolvedValue(mockDrivers as any);
      jest
        .spyOn(prismaService.ride, 'findUnique')
        .mockResolvedValue({ driverId: null } as any);
      jest
        .spyOn(prismaService.driver, 'findUnique')
        .mockResolvedValue({ status: 'online' } as any);
      jest.spyOn(prismaService.ride, 'update').mockResolvedValue({} as any);

      const result = await service.findAndAssignNearbyDriver(123, {
        lat: 40.7128,
        lng: -74.006,
      });

      expect(result.assigned).toBe(true);
      expect(result.driverId).toBe(1);
    });

    it('should return false when no drivers available', async () => {
      jest.spyOn(prismaService.driver, 'findMany').mockResolvedValue([]);

      const result = await service.findAndAssignNearbyDriver(123, {
        lat: 40.7128,
        lng: -74.006,
      });

      expect(result.assigned).toBe(false);
      expect(result.availableDrivers).toBe(0);
    });
  });

  describe('notifyRideStatusUpdate', () => {
    it('should send ride status notification', async () => {
      jest
        .spyOn(prismaService.notificationPreferences, 'findUnique')
        .mockResolvedValue({ pushEnabled: true } as any);
      jest
        .spyOn(prismaService.pushToken, 'findMany')
        .mockResolvedValue([{ token: 'ExponentPushToken[test]' }] as any);
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue({} as any);

      await service.notifyRideStatusUpdate(123, '456', 789, 'accepted');

      // Verify notification was created
      expect(prismaService.notification.create).toHaveBeenCalled();
    });
  });
});
