import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Ride, Rating } from '@prisma/client';
import { CreateRideDto } from './dto/create-ride.dto';
import { ScheduleRideDto } from './dto/schedule-ride.dto';
import { AcceptRideDto } from './dto/accept-ride.dto';
import { RateRideDto } from './dto/rate-ride.dto';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createRide(createRideDto: CreateRideDto): Promise<Ride> {
    const {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
      payment_status,
      driver_id,
      user_id,
      tier_id,
    } = createRideDto;

    const ride = await this.prisma.ride.create({
      data: {
        originAddress: origin_address,
        destinationAddress: destination_address,
        originLatitude: origin_latitude,
        originLongitude: origin_longitude,
        destinationLatitude: destination_latitude,
        destinationLongitude: destination_longitude,
        rideTime: ride_time,
        farePrice: fare_price,
        paymentStatus: payment_status,
        driverId: driver_id,
        userId: user_id,
        tierId: tier_id,
      },
      include: {
        tier: true,
        user: true,
      },
    });

    // Notify nearby drivers about the new ride
    try {
      await this.notificationsService.notifyNearbyDrivers(ride.rideId, {
        lat: origin_latitude,
        lng: origin_longitude,
      });
      this.logger.log(`Notified drivers about new ride ${ride.rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify drivers about ride ${ride.rideId}:`,
        error,
      );
    }

    return ride;
  }

  async getUserRidesHistory(userId: string): Promise<Ride[]> {
    return this.prisma.ride.findMany({
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
  }

  async scheduleRide(scheduleRideDto: ScheduleRideDto): Promise<Ride> {
    const {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      tier_id,
      scheduled_for,
      user_id,
    } = scheduleRideDto;

    return this.prisma.ride.create({
      data: {
        originAddress: origin_address,
        destinationAddress: destination_address,
        originLatitude: origin_latitude,
        originLongitude: origin_longitude,
        destinationLatitude: destination_latitude,
        destinationLongitude: destination_longitude,
        rideTime: ride_time,
        farePrice: 0, // Will be calculated later
        paymentStatus: 'pending',
        userId: user_id,
        tierId: tier_id,
        scheduledFor: new Date(scheduled_for),
      },
    });
  }

  async getFareEstimate(
    tierId: number,
    minutes: number,
    miles: number,
  ): Promise<any> {
    const tier = await this.prisma.rideTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new Error('Ride tier not found');
    }

    const baseFare = Number(tier.baseFare);
    const perMinuteRate = Number(tier.perMinuteRate);
    const perMileRate = Number(tier.perMileRate);

    const totalFare = baseFare + minutes * perMinuteRate + miles * perMileRate;

    return {
      tier: tier.name,
      baseFare,
      perMinuteRate,
      perMileRate,
      estimatedMinutes: minutes,
      estimatedMiles: miles,
      totalFare: Math.round(totalFare * 100) / 100,
    };
  }

  async acceptRide(
    rideId: number,
    acceptRideDto: AcceptRideDto,
  ): Promise<Ride> {
    const { driverId } = acceptRideDto;

    // Check if ride exists and is available
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        tier: true,
        user: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.driverId) {
      throw new Error('Ride was already accepted by another driver');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        driverId,
      },
      include: {
        driver: true,
        tier: true,
        user: true,
      },
    });

    // Notify the passenger that the ride was accepted
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        ride.userId,
        driverId,
        'accepted',
        {
          driverName:
            updatedRide.driver?.firstName + ' ' + updatedRide.driver?.lastName,
          vehicleInfo: `${updatedRide.driver?.carModel} - ${updatedRide.driver?.licensePlate}`,
        },
      );
      this.logger.log(`Notified passenger about accepted ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about accepted ride ${rideId}:`,
        error,
      );
    }

    return updatedRide;
  }

  async rateRide(rideId: number, rateRideDto: RateRideDto): Promise<Rating> {
    const { ratedByClerkId, ratedClerkId, ratingValue, comment } = rateRideDto;

    return this.prisma.rating.create({
      data: {
        rideId,
        ratedByClerkId,
        ratedClerkId,
        ratingValue,
        comment,
      },
    });
  }

  async findRideById(rideId: number): Promise<Ride | null> {
    return this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        tier: true,
        ratings: true,
        messages: true,
      },
    });
  }

  // New methods for ride status management with notifications

  async startRide(rideId: number): Promise<Ride> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (!ride.driverId) {
      throw new Error('Ride must be accepted by a driver before starting');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        // You might want to add a status field or use existing fields
      },
      include: {
        driver: true,
        user: true,
      },
    });

    // Notify passenger that ride has started
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        ride.userId,
        ride.driverId,
        'in_progress',
        {
          destination: ride.destinationAddress,
        },
      );
      this.logger.log(`Notified passenger about started ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about started ride ${rideId}:`,
        error,
      );
    }

    return updatedRide;
  }

  async driverArrived(rideId: number): Promise<Ride> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        // You might want to add a driver_arrived_at field
      },
      include: {
        driver: true,
        user: true,
      },
    });

    // Notify passenger that driver has arrived
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        ride.userId,
        ride.driverId,
        'arrived',
        {
          driverName: ride.driver?.firstName + ' ' + ride.driver?.lastName,
          vehicleInfo: `${ride.driver?.carModel} - ${ride.driver?.licensePlate}`,
        },
      );
      this.logger.log(
        `Notified passenger about driver arrival for ride ${rideId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about driver arrival for ride ${rideId}:`,
        error,
      );
    }

    return updatedRide;
  }

  async completeRide(rideId: number): Promise<Ride> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        // You might want to add completion fields
      },
      include: {
        driver: true,
        user: true,
      },
    });

    // Notify passenger that ride is completed
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        ride.userId,
        ride.driverId,
        'completed',
        {
          fare: ride.farePrice,
        },
      );
      this.logger.log(`Notified passenger about completed ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about completed ride ${rideId}:`,
        error,
      );
    }

    return updatedRide;
  }

  async cancelRide(rideId: number, reason?: string): Promise<Ride> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        // You might want to add cancellation fields
      },
      include: {
        driver: true,
        user: true,
      },
    });

    // Notify affected parties about cancellation
    try {
      // Notify passenger
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        ride.userId,
        ride.driverId,
        'cancelled',
        {
          reason: reason || 'Ride was cancelled',
        },
      );

      // If there was a driver assigned, notify them too
      if (ride.driverId && ride.driverId.toString() !== ride.userId) {
        await this.notificationsService.notifyRideStatusUpdate(
          rideId,
          ride.driverId.toString(),
          null,
          'cancelled',
          {
            reason: reason || 'Ride was cancelled',
          },
        );
      }

      this.logger.log(`Notified parties about cancelled ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify parties about cancelled ride ${rideId}:`,
        error,
      );
    }

    return updatedRide;
  }
}
