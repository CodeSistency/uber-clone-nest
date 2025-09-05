import { RidesService } from './rides.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  setupUnitTestModule,
  mockPrismaService,
  testUtils,
} from '../../test/setup/unit-setup';
import { CreateRideDto } from './dto/create-ride.dto';
import { AcceptRideDto } from './dto/accept-ride.dto';
import { RateRideDto } from './dto/rate-ride.dto';
import { TestingModule } from '@nestjs/testing';

describe('RidesService (Unit)', () => {
  let service: RidesService;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await setupUnitTestModule({
      providers: [
        RidesService,
        {
          provide: NotificationsService,
          useValue: {
            notifyNearbyDrivers: jest.fn(),
            notifyRideStatusUpdate: jest.fn(),
          },
        },
      ],
    });

    service = module.get<RidesService>(RidesService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    testUtils.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRide', () => {
    it('should create a ride successfully', async () => {
      const createRideDto: CreateRideDto = {
        origin_address: '123 Main St',
        destination_address: '456 Oak Ave',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'pending',
        driver_id: 1,
        user_id: 1,
        tier_id: 1,
      };

      const expectedRide = {
        rideId: 1,
        ...createRideDto,
        originAddress: createRideDto.origin_address,
        destinationAddress: createRideDto.destination_address,
        originLatitude: createRideDto.origin_latitude,
        originLongitude: createRideDto.origin_longitude,
        destinationLatitude: createRideDto.destination_latitude,
        destinationLongitude: createRideDto.destination_longitude,
        rideTime: createRideDto.ride_time,
        farePrice: createRideDto.fare_price,
        paymentStatus: createRideDto.payment_status,
        driverId: createRideDto.driver_id,
        userId: createRideDto.user_id,
        tierId: createRideDto.tier_id,
        createdAt: new Date(),
      };

      mockPrismaService.ride.create.mockResolvedValue(expectedRide);
      const notifySpy = jest
        .spyOn(notificationsService, 'notifyNearbyDrivers')
        .mockResolvedValue();

      const result = await service.createRide(createRideDto);

      expect(result).toEqual(expectedRide);
      expect(mockPrismaService.ride.create).toHaveBeenCalledWith({
        data: {
          originAddress: createRideDto.origin_address,
          destinationAddress: createRideDto.destination_address,
          originLatitude: createRideDto.origin_latitude,
          originLongitude: createRideDto.origin_longitude,
          destinationLatitude: createRideDto.destination_latitude,
          destinationLongitude: createRideDto.destination_longitude,
          rideTime: createRideDto.ride_time,
          farePrice: createRideDto.fare_price,
          paymentStatus: createRideDto.payment_status,
          driverId: createRideDto.driver_id,
          userId: createRideDto.user_id,
          tierId: createRideDto.tier_id,
        },
        include: {
          tier: true,
          user: true,
        },
      });
      expect(notifySpy).toHaveBeenCalledWith(1, {
        lat: createRideDto.origin_latitude,
        lng: createRideDto.origin_longitude,
      });
    });

    it('should handle notification failure gracefully', async () => {
      const createRideDto: CreateRideDto = {
        origin_address: '123 Main St',
        destination_address: '456 Oak Ave',
        origin_latitude: 40.7128,
        origin_longitude: -74.006,
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        ride_time: 25,
        fare_price: 15.75,
        payment_status: 'pending',
        user_id: 1,
        tier_id: 1,
      };

      const expectedRide = {
        rideId: 1,
        ...createRideDto,
        originAddress: createRideDto.origin_address,
        destinationAddress: createRideDto.destination_address,
        originLatitude: createRideDto.origin_latitude,
        originLongitude: createRideDto.origin_longitude,
        destinationLatitude: createRideDto.destination_latitude,
        destinationLongitude: createRideDto.destination_longitude,
        rideTime: createRideDto.ride_time,
        farePrice: createRideDto.fare_price,
        paymentStatus: createRideDto.payment_status,
        userId: createRideDto.user_id,
        tierId: createRideDto.tier_id,
        createdAt: new Date(),
      };

      mockPrismaService.ride.create.mockResolvedValue(expectedRide);
      const notifySpy = jest
        .spyOn(notificationsService, 'notifyNearbyDrivers')
        .mockRejectedValue(new Error('Notification failed'));

      const result = await service.createRide(createRideDto);

      expect(result).toEqual(expectedRide);
      expect(notifySpy).toHaveBeenCalled();
    });
  });

  describe('getFareEstimate', () => {
    it('should calculate fare estimate correctly', async () => {
      const tierId = 1;
      const minutes = 20;
      const miles = 5;

      const mockTier = {
        id: tierId,
        name: 'Economy',
        baseFare: 2.5,
        perMinuteRate: 0.25,
        perMileRate: 1.25,
      };

      mockPrismaService.rideTier.findUnique.mockResolvedValue(mockTier);

      const result = await service.getFareEstimate(tierId, minutes, miles);

      expect(result).toEqual({
        tier: 'Economy',
        baseFare: 2.5,
        perMinuteRate: 0.25,
        perMileRate: 1.25,
        estimatedMinutes: minutes,
        estimatedMiles: miles,
        totalFare: 13.75, // 2.5 + (20 * 0.25) + (5 * 1.25) = 13.75
      });
    });

    it('should throw error when tier not found', async () => {
      mockPrismaService.rideTier.findUnique.mockResolvedValue(null);

      await expect(service.getFareEstimate(999, 20, 5)).rejects.toThrow(
        'Ride tier not found',
      );
    });
  });

  describe('acceptRide', () => {
    it('should accept ride successfully', async () => {
      const rideId = 1;
      const acceptRideDto: AcceptRideDto = { driverId: 2 };

      const mockRide = {
        rideId,
        userId: 'user_test123',
        driverId: null,
        originAddress: '123 Main St',
        destinationAddress: '456 Oak Ave',
      };

      const mockDriver = {
        firstName: 'John',
        lastName: 'Driver',
        carModel: 'Toyota Camry',
        licensePlate: 'ABC-123',
      };

      const mockUpdatedRide = {
        ...mockRide,
        driverId: 2,
        driver: mockDriver,
        tier: { name: 'Economy' },
        user: { name: 'Test User' },
      };

      mockPrismaService.ride.findUnique.mockResolvedValue(mockRide);
      mockPrismaService.ride.update.mockResolvedValue(mockUpdatedRide);
      const notifySpy = jest
        .spyOn(notificationsService, 'notifyRideStatusUpdate')
        .mockResolvedValue();

      const result = await service.acceptRide(rideId, acceptRideDto);

      expect(result).toEqual(mockUpdatedRide);
      expect(mockPrismaService.ride.update).toHaveBeenCalledWith({
        where: { rideId },
        data: { driverId: 2 },
        include: {
          driver: true,
          tier: true,
          user: true,
        },
      });
      expect(notifySpy).toHaveBeenCalledWith(
        rideId,
        'user_test123',
        2,
        'accepted',
        {
          driverName: 'John Driver',
          vehicleInfo: 'Toyota Camry - ABC-123',
        },
      );
    });

    it('should throw error when ride not found', async () => {
      mockPrismaService.ride.findUnique.mockResolvedValue(null);

      await expect(service.acceptRide(999, { driverId: 1 })).rejects.toThrow(
        'Ride not found',
      );
    });

    it('should throw error when ride already accepted', async () => {
      const mockRide = {
        rideId: 1,
        driverId: 2, // Already has a driver
      };

      mockPrismaService.ride.findUnique.mockResolvedValue(mockRide);

      await expect(service.acceptRide(1, { driverId: 3 })).rejects.toThrow(
        'Ride was already accepted by another driver',
      );
    });
  });

  describe('rateRide', () => {
    it('should rate ride successfully', async () => {
      const rideId = 1;
      const rateRideDto: RateRideDto = {
        ratedByUserId: 1,
        ratedUserId: 2,
        ratingValue: 5,
        comment: 'Great ride!',
      };

      const mockRating = {
        id: 1,
        ...rateRideDto,
        rideId,
        createdAt: new Date(),
      };

      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const result = await service.rateRide(rideId, rateRideDto);

      expect(result).toEqual(mockRating);
      expect(mockPrismaService.rating.create).toHaveBeenCalledWith({
        data: {
          rideId,
          ratedByUserId: rateRideDto.ratedByUserId,
          ratedUserId: rateRideDto.ratedUserId,
          ratingValue: rateRideDto.ratingValue,
          comment: rateRideDto.comment,
        },
      });
    });
  });

  describe('getUserRidesHistory', () => {
    it('should return user rides history', async () => {
      const userId = 1;
      const mockRides = [
        testUtils.createMockRide({ rideId: 1 }),
        testUtils.createMockRide({ rideId: 2 }),
      ];

      mockPrismaService.ride.findMany.mockResolvedValue(mockRides);

      const result = await service.getUserRidesHistory(userId);

      expect(result).toEqual(mockRides);
      expect(mockPrismaService.ride.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          driver: true,
          tier: true,
          ratings: true,
          messages: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
