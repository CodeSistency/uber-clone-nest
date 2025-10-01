import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationManagerService } from './notification-manager.service';
import { NotificationsService } from './notifications.service';
import { ExpoNotificationsService } from './expo-notifications.service';
import { NotificationType, NotificationChannel } from './interfaces/notification.interface';

describe('NotificationManagerService', () => {
  let service: NotificationManagerService;
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
      ],
    }).compile();

    service = module.get<NotificationManagerService>(NotificationManagerService);
    firebaseService = module.get<NotificationsService>(NotificationsService);
    expoService = module.get<ExpoNotificationsService>(ExpoNotificationsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Provider Selection', () => {
    it('should initialize with expo provider when configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');

      // Trigger onModuleInit by creating a new instance
      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      expect(newService.getCurrentProviderType()).toBe('expo');
    });

    it('should initialize with firebase provider by default', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      expect(newService.getCurrentProviderType()).toBe('firebase');
    });

    it('should switch provider dynamically', () => {
      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      newService.switchProvider('expo');
      expect(newService.getCurrentProviderType()).toBe('expo');

      newService.switchProvider('firebase');
      expect(newService.getCurrentProviderType()).toBe('firebase');
    });
  });

  describe('sendNotification', () => {
    it('should delegate to firebase service when firebase is selected', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest.spyOn(firebaseService, 'sendNotification').mockResolvedValue([
        { success: true, channel: NotificationChannel.PUSH, timestamp: new Date() }
      ]);

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test',
        message: 'Test message',
        data: {},
      };

      const result = await newService.sendNotification(payload);

      expect(firebaseService.sendNotification).toHaveBeenCalledWith(payload);
      expect(result).toHaveLength(1);
    });

    it('should delegate to expo service when expo is selected', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');
      jest.spyOn(expoService, 'sendNotification').mockResolvedValue([
        { success: true, channel: NotificationChannel.PUSH, timestamp: new Date() }
      ]);

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test',
        message: 'Test message',
        data: {},
      };

      const result = await newService.sendNotification(payload);

      expect(expoService.sendNotification).toHaveBeenCalledWith(payload);
      expect(result).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest.spyOn(firebaseService, 'sendNotification').mockRejectedValue(new Error('Test error'));

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const payload = {
        userId: '123',
        type: NotificationType.RIDE_REQUEST,
        title: 'Test',
        message: 'Test message',
        data: {},
      };

      await expect(newService.sendNotification(payload)).rejects.toThrow('Test error');
    });
  });

  describe('sendBulkNotifications', () => {
    it('should delegate bulk notifications to selected provider', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');
      jest.spyOn(expoService, 'sendBulkNotifications').mockResolvedValue([
        [{ success: true, channel: NotificationChannel.PUSH, timestamp: new Date() }]
      ]);

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const payloads = [
        {
          userId: '123',
          type: NotificationType.RIDE_REQUEST,
          title: 'Test 1',
          message: 'Message 1',
          data: {},
        },
      ];

      const result = await newService.sendBulkNotifications(payloads);

      expect(expoService.sendBulkNotifications).toHaveBeenCalledWith(payloads);
      expect(result).toHaveLength(1);
    });
  });

  describe('notifyNearbyDrivers', () => {
    it('should delegate driver notifications to selected provider', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest.spyOn(firebaseService, 'notifyNearbyDrivers').mockResolvedValue();

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      await newService.notifyNearbyDrivers(123, { lat: 40.7128, lng: -74.006 });

      expect(firebaseService.notifyNearbyDrivers).toHaveBeenCalledWith(123, { lat: 40.7128, lng: -74.006 });
    });
  });

  describe('findAndAssignNearbyDriver', () => {
    it('should delegate driver assignment to selected provider', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('expo');
      jest.spyOn(expoService, 'findAndAssignNearbyDriver').mockResolvedValue({
        assigned: true,
        driverId: 456,
        availableDrivers: 5,
        notifiedDrivers: 1,
      });

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const result = await newService.findAndAssignNearbyDriver(123, { lat: 40.7128, lng: -74.006 });

      expect(expoService.findAndAssignNearbyDriver).toHaveBeenCalledWith(123, { lat: 40.7128, lng: -74.006 });
      expect(result.assigned).toBe(true);
      expect(result.driverId).toBe(456);
    });
  });

  describe('notifyRideStatusUpdate', () => {
    it('should delegate ride status notifications to selected provider', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('firebase');
      jest.spyOn(firebaseService, 'notifyRideStatusUpdate').mockResolvedValue();

      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      await newService.notifyRideStatusUpdate(123, '456', 789, 'accepted');

      expect(firebaseService.notifyRideStatusUpdate).toHaveBeenCalledWith(123, '456', 789, 'accepted');
    });
  });

  describe('getProviderStatus', () => {
    it('should return provider status information', () => {
      const newService = new NotificationManagerService(
        configService,
        firebaseService,
        expoService,
      );
      newService.onModuleInit();

      const status = newService.getProviderStatus();

      expect(status).toHaveProperty('currentProvider');
      expect(status).toHaveProperty('availableProviders');
      expect(status.availableProviders).toContain('firebase');
      expect(status.availableProviders).toContain('expo');
    });
  });
});




