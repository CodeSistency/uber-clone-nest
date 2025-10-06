import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationManagerService } from './notification-manager.service';
import { NotificationsService } from './notifications.service';
import { ExpoNotificationsService } from './expo-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../services/twilio.service';
import {
  NotificationType,
  NotificationChannel,
} from './interfaces/notification.interface';

describe('NotificationManagerService - Integration Tests', () => {
  let notificationManager: NotificationManagerService;
  let firebaseService: NotificationsService;
  let expoService: ExpoNotificationsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationManagerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
            sendBulkNotifications: jest.fn(),
            notifyNearbyDrivers: jest.fn(),
            findAndAssignNearbyDriver: jest.fn(),
            confirmDriverForRide: jest.fn(),
            notifyRideStatusUpdate: jest.fn(),
          },
        },
        {
          provide: ExpoNotificationsService,
          useValue: {
            sendNotification: jest.fn(),
            sendBulkNotifications: jest.fn(),
            notifyNearbyDrivers: jest.fn(),
            findAndAssignNearbyDriver: jest.fn(),
            confirmDriverForRide: jest.fn(),
            notifyRideStatusUpdate: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: TwilioService,
          useValue: {},
        },
      ],
    }).compile();

    notificationManager = module.get<NotificationManagerService>(
      NotificationManagerService,
    );
    firebaseService = module.get<NotificationsService>(NotificationsService);
    expoService = module.get<ExpoNotificationsService>(
      ExpoNotificationsService,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Provider Switching', () => {
    it('should maintain API consistency when switching providers', async () => {
      // Test with Firebase
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest.spyOn(firebaseService, 'sendNotification').mockResolvedValue([
        {
          success: true,
          channel: NotificationChannel.PUSH,
          timestamp: new Date(),
        },
      ]);

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test Ride',
        message: 'New ride available',
        data: { rideId: 456 },
      };

      const firebaseResult = await manager.sendNotification(payload);

      // Switch to Expo
      jest.spyOn(expoService, 'sendNotification').mockResolvedValue([
        {
          success: true,
          channel: NotificationChannel.PUSH,
          timestamp: new Date(),
        },
      ]);

      manager.switchProvider('expo');
      const expoResult = await manager.sendNotification(payload);

      // Both should return the same structure
      expect(firebaseResult).toHaveLength(1);
      expect(expoResult).toHaveLength(1);
      expect(firebaseResult[0]).toHaveProperty('success');
      expect(expoResult[0]).toHaveProperty('success');
    });

    it('should handle provider failures gracefully', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest
        .spyOn(firebaseService, 'sendNotification')
        .mockRejectedValue(new Error('Firebase down'));

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test Ride',
        message: 'New ride available',
        data: { rideId: 456 },
      };

      await expect(manager.sendNotification(payload)).rejects.toThrow(
        'Firebase down',
      );

      // Switch to Expo should work
      jest.spyOn(expoService, 'sendNotification').mockResolvedValue([
        {
          success: true,
          channel: NotificationChannel.PUSH,
          timestamp: new Date(),
        },
      ]);

      manager.switchProvider('expo');
      const result = await manager.sendNotification(payload);
      expect(result[0].success).toBe(true);
    });
  });

  describe('Ride Flow Integration', () => {
    it('should handle complete ride notification flow', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      // Mock successful driver assignment
      jest.spyOn(expoService, 'findAndAssignNearbyDriver').mockResolvedValue({
        assigned: true,
        driverId: 789,
        availableDrivers: 5,
        notifiedDrivers: 1,
      });

      // Mock successful status notification
      jest.spyOn(expoService, 'notifyRideStatusUpdate').mockResolvedValue();

      // Test ride creation flow
      const assignmentResult = await manager.findAndAssignNearbyDriver(123, {
        lat: 40.7128,
        lng: -74.006,
      });

      expect(assignmentResult.assigned).toBe(true);
      expect(assignmentResult.driverId).toBe(789);

      // Test status update notification
      await manager.notifyRideStatusUpdate(123, '456', 789, 'accepted');

      expect(expoService.findAndAssignNearbyDriver).toHaveBeenCalledWith(123, {
        lat: 40.7128,
        lng: -74.006,
      });
      expect(expoService.notifyRideStatusUpdate).toHaveBeenCalledWith(
        123,
        '456',
        789,
        'accepted',
      );
    });

    it('should handle driver notification bulk operations', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      jest.spyOn(firebaseService, 'notifyNearbyDrivers').mockResolvedValue();

      await manager.notifyNearbyDrivers(123, { lat: 40.7128, lng: -74.006 });

      expect(firebaseService.notifyNearbyDrivers).toHaveBeenCalledWith(123, {
        lat: 40.7128,
        lng: -74.006,
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate provider configuration', () => {
      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );

      // Test default configuration
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      manager.onModuleInit();
      expect(manager.getCurrentProviderType()).toBe('firebase');

      // Test expo configuration
      jest.spyOn(configService, 'get').mockReturnValue('expo');
      manager.switchProvider('expo');
      expect(manager.getCurrentProviderType()).toBe('expo');

      // Test invalid configuration falls back to firebase
      jest.spyOn(configService, 'get').mockReturnValue('invalid');
      const newManager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      newManager.onModuleInit();
      expect(newManager.getCurrentProviderType()).toBe('firebase');
    });

    it('should provide provider status information', () => {
      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      const status = manager.getProviderStatus();

      expect(status).toHaveProperty('currentProvider');
      expect(status).toHaveProperty('availableProviders');
      expect(status.availableProviders).toEqual(['firebase', 'expo']);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle partial notification failures', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      // Mock partial success (push fails, SMS succeeds)
      jest.spyOn(expoService, 'sendNotification').mockResolvedValue([
        {
          success: false,
          channel: NotificationChannel.PUSH,
          error: 'Push failed',
          timestamp: new Date(),
        },
        {
          success: true,
          channel: NotificationChannel.SMS,
          messageId: 'sms123',
          timestamp: new Date(),
        },
      ]);

      const payload = {
        userId: '123',
        type: NotificationType.EMERGENCY_TRIGGERED,
        title: 'Emergency',
        message: 'Emergency alert',
        data: { emergencyId: 456 },
        channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      };

      const result = await manager.sendNotification(payload);

      expect(result).toHaveLength(2);
      expect(
        result.some((r) => r.success && r.channel === NotificationChannel.SMS),
      ).toBe(true);
      expect(
        result.some(
          (r) => !r.success && r.channel === NotificationChannel.PUSH,
        ),
      ).toBe(true);
    });

    it('should maintain service availability during provider issues', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');

      const manager = new NotificationManagerService(
        configService,
        {} as any, // firebaseService
        expoService,
      );
      manager.onModuleInit();

      // Simulate Firebase outage
      jest
        .spyOn(firebaseService, 'sendNotification')
        .mockRejectedValue(new Error('Firebase service unavailable'));

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Ride Request',
        message: 'New ride available',
        data: { rideId: 456 },
      };

      // Should throw error but not crash the service
      await expect(manager.sendNotification(payload)).rejects.toThrow();

      // Service should still be operational for other operations
      const status = manager.getProviderStatus();
      expect(status.currentProvider).toBe('firebase');

      // Should be able to switch providers
      manager.switchProvider('expo');
      expect(manager.getCurrentProviderType()).toBe('expo');
    });
  });
});
