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
  ): Promise<{
    tier: string;
    baseFare: number;
    perMinuteRate: number;
    perMileRate: number;
    estimatedMinutes: number;
    estimatedMiles: number;
    totalFare: number;
  }> {
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

  async cancelRide(
    rideId: number,
    cancelledBy: string,
    reason?: string,
  ): Promise<Ride> {
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

    // Validate cancellation permissions
    if (cancelledBy === 'driver' && ride.driverId) {
      // Driver can only cancel their own rides
      // Additional validation could be added here
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
          cancelledBy,
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
            cancelledBy,
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

  // ========== NUEVOS MÉTODOS CRÍTICOS ==========

  async getRideRequests(
    driverLat: number,
    driverLng: number,
    radius: number = 5,
  ): Promise<any[]> {
    // Calculate bounding box for the search radius
    const earthRadius = 6371; // Earth's radius in kilometers
    const latDelta = (radius / earthRadius) * (180 / Math.PI);
    const lngDelta =
      ((radius / earthRadius) * (180 / Math.PI)) /
      Math.cos((driverLat * Math.PI) / 180);

    const minLat = driverLat - latDelta;
    const maxLat = driverLat + latDelta;
    const minLng = driverLng - lngDelta;
    const maxLng = driverLng + lngDelta;

    // Find rides that are available (no driver assigned) and within the bounding box
    const availableRides = await this.prisma.ride.findMany({
      where: {
        driverId: null, // No driver assigned yet
        originLatitude: {
          gte: minLat,
          lte: maxLat,
        },
        originLongitude: {
          gte: minLng,
          lte: maxLng,
        },
        // Optionally filter by creation time (e.g., rides created in the last 30 minutes)
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      include: {
        tier: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit results for performance
    });

    // Calculate distance for each ride and format response
    const rideRequests = availableRides
      .map((ride) => {
        // Calculate actual distance using Haversine formula
        const distance = this.calculateDistance(
          driverLat,
          driverLng,
          Number(ride.originLatitude),
          Number(ride.originLongitude),
        );

        // Only include rides within the exact radius (not just bounding box)
        if (distance <= radius) {
          return {
            rideId: ride.rideId,
            originAddress: ride.originAddress,
            destinationAddress: ride.destinationAddress,
            originLatitude: Number(ride.originLatitude),
            originLongitude: Number(ride.originLongitude),
            destinationLatitude: Number(ride.destinationLatitude),
            destinationLongitude: Number(ride.destinationLongitude),
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
            estimatedFare: Number(ride.farePrice),
            rideTime: ride.rideTime,
            createdAt: ride.createdAt,
            tier: ride.tier
              ? {
                  name: ride.tier.name,
                  baseFare: Number(ride.tier.baseFare),
                  perMinuteRate: Number(ride.tier.perMinuteRate),
                  perMileRate: Number(ride.tier.perMileRate),
                }
              : null,
            user: ride.user
              ? {
                  name: ride.user.name,
                  clerkId: ride.user.clerkId,
                }
              : null,
          };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries

    this.logger.log(
      `Found ${rideRequests.length} available rides for driver at ${driverLat}, ${driverLng}`,
    );
    return rideRequests;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const earthRadius = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  async startRide(rideId: number, driverId: number): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
        tier: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new Error('Driver not authorized for this ride');
    }

    // Check if ride can be started (must be accepted)
    if (!ride.driverId) {
      throw new Error('Ride must be accepted by a driver before starting');
    }

    const now = new Date();
    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        // Add fields for tracking ride progress if needed
        // For now, we'll just update the timestamp
      },
      include: {
        driver: true,
        user: true,
        tier: true,
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
          driverName: ride.driver?.firstName + ' ' + ride.driver?.lastName,
          vehicleInfo: `${ride.driver?.carModel} - ${ride.driver?.licensePlate}`,
          startedAt: now.toISOString(),
        },
      );
      this.logger.log(`Notified passenger about started ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about started ride ${rideId}:`,
        error,
      );
    }

    return {
      rideId: updatedRide.rideId,
      status: 'in_progress',
      actualStartTime: now.toISOString(),
      driver: {
        id: updatedRide.driver?.id,
        firstName: updatedRide.driver?.firstName,
        lastName: updatedRide.driver?.lastName,
        carModel: updatedRide.driver?.carModel,
        licensePlate: updatedRide.driver?.licensePlate,
      },
      origin: {
        address: updatedRide.originAddress,
        latitude: Number(updatedRide.originLatitude),
        longitude: Number(updatedRide.originLongitude),
      },
      destination: {
        address: updatedRide.destinationAddress,
        latitude: Number(updatedRide.destinationLatitude),
        longitude: Number(updatedRide.destinationLongitude),
      },
    };
  }

  async completeRide(
    rideId: number,
    driverId: number,
    finalDistance?: number,
    finalTime?: number,
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        user: true,
        tier: true,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new Error('Driver not authorized for this ride');
    }

    const now = new Date();
    let finalFare = Number(ride.farePrice);

    // Recalculate fare if final distance/time provided
    if (finalDistance && finalTime && ride.tier) {
      const tier = ride.tier;
      finalFare =
        Number(tier.baseFare) +
        finalTime * Number(tier.perMinuteRate) +
        finalDistance * Number(tier.perMileRate);
    }

    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        farePrice: finalFare,
        // Add completion tracking fields if available in schema
      },
      include: {
        driver: true,
        user: true,
        tier: true,
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
          finalFare: finalFare,
          distance: finalDistance,
          duration: finalTime,
          completedAt: now.toISOString(),
        },
      );
      this.logger.log(`Notified passenger about completed ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify passenger about completed ride ${rideId}:`,
        error,
      );
    }

    return {
      rideId: updatedRide.rideId,
      status: 'completed',
      finalFare: Math.round(finalFare * 100) / 100,
      finalDistance: finalDistance,
      finalTime: finalTime,
      completedAt: now.toISOString(),
      driver: {
        id: updatedRide.driver?.id,
        firstName: updatedRide.driver?.firstName,
        lastName: updatedRide.driver?.lastName,
      },
      earnings: {
        driverEarnings: Math.round(finalFare * 0.8 * 100) / 100, // 80% for driver
        platformFee: Math.round(finalFare * 0.2 * 100) / 100, // 20% for platform
      },
    };
  }
}
