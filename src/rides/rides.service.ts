import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationManagerService } from '../notifications/notification-manager.service';
import { ReferralsService } from '../referrals/services/referrals.service';
import { ReferralRewardsService } from '../referrals/services/referral-rewards.service';
import { GeographicPricingService } from './services/geographic-pricing.service';
import { PromotionService } from './services/promotion.service';
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
    private notificationManager: NotificationManagerService,
    private referralsService: ReferralsService,
    private referralRewardsService: ReferralRewardsService,
    private geographicPricing: GeographicPricingService,
    private promotionService: PromotionService,
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
      vehicle_type_id,
    } = createRideDto;

    this.logger.log(`🚗 CREANDO RIDE - Inicio del proceso`);
    this.logger.log(
      `📍 Origen: ${origin_address} (${origin_latitude}, ${origin_longitude})`,
    );
    this.logger.log(
      `📍 Destino: ${destination_address} (${destination_latitude}, ${destination_longitude})`,
    );
    this.logger.log(`👤 Usuario ID: ${user_id}`);
    this.logger.log(`⏱️ Tiempo estimado: ${ride_time} minutos`);
    this.logger.log(`💰 Precio: ${fare_price}`);
    this.logger.log(`🚙 Tipo vehículo: ${vehicle_type_id}`);
    this.logger.log(`🏷️ Tier ID: ${tier_id}`);

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
        requestedVehicleTypeId: vehicle_type_id,
      },
      include: {
        tier: true,
        user: true,
        requestedVehicleType: true,
      },
    });

    this.logger.log(`✅ Ride creado exitosamente con ID: ${ride.rideId}`);
    this.logger.log(`🔄 Estado inicial del ride: ${ride.status}`);

    // Notify nearby drivers about the new ride
    try {
      this.logger.log(
        `🔍 Buscando drivers cercanos para ride ${ride.rideId}...`,
      );
      const matchingResult =
        await this.notificationManager.findAndAssignNearbyDriver(ride.rideId, {
          lat: origin_latitude,
          lng: origin_longitude,
        });

      if (matchingResult.assigned) {
        this.logger.log(
          `✅ Driver asignado automáticamente: ${matchingResult.driverId}`,
        );
        this.logger.log(
          `📱 Notificación enviada al driver ${matchingResult.driverId}`,
        );
      } else {
        this.logger.warn(
          `⚠️ No se pudo asignar driver automáticamente. Drivers encontrados: ${matchingResult.availableDrivers}`,
        );
        this.logger.log(
          `📢 Enviando notificaciones push a ${matchingResult.notifiedDrivers} drivers`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error en el proceso de matching para ride ${ride.rideId}:`,
        error,
      );
    }

    return ride;
  }

  async getUserRidesHistory(userId: number): Promise<Ride[]> {
    return this.prisma.ride.findMany({
      where: { userId },
      include: {
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true, status: 'active' },
              take: 1,
              include: { vehicleType: true },
            },
          },
        },
        tier: true,
        requestedVehicleType: true,
        ratings: true,
        messages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAvailableRides() {
    return this.prisma.ride.findMany({
      where: {
        driverId: null,
      },
      include: {
        tier: true,
        requestedVehicleType: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  // Nuevo método para obtener tipos de vehículo disponibles
  async getAvailableVehicleTypes() {
    return this.prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
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
      vehicle_type_id,
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
        requestedVehicleTypeId: vehicle_type_id,
        scheduledFor: new Date(scheduled_for),
      },
    });
  }

  async getFareEstimate(
    tierId: number,
    minutes: number,
    kilometers: number,
  ): Promise<{
    tier: string;
    baseFare: number;
    perMinuteRate: number;
    perKmRate: number;
    estimatedMinutes: number;
    estimatedKilometers: number;
    totalFare: number;
  }> {
    // 1. Validate tier exists
    const tier = await this.prisma.rideTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new BadRequestException('Ride tier not found');
    }

    // Note: Geographic restrictions are handled at ride creation time, not during fare estimation

    // 3. Calculate base price
    const baseFare = Number(tier.baseFare);
    const perMinuteRate = Number(tier.perMinuteRate);
    const perKmRate = Number(tier.perKmRate);

    const totalFare = baseFare + minutes * perMinuteRate + kilometers * perKmRate;

    return {
      tier: tier.name,
      baseFare,
      perMinuteRate,
      perKmRate,
      estimatedMinutes: minutes,
      estimatedKilometers: kilometers,
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
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true, status: 'active' },
              take: 1,
            },
          },
        },
        tier: true,
        user: true,
        vehicle: true,
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
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true, status: 'active' },
              take: 1,
              include: { vehicleType: true },
            },
          },
        },
        tier: true,
        user: true,
        requestedVehicleType: true,
        vehicle: {
          include: { vehicleType: true },
        },
      },
    });

    // Notify the passenger that the ride was accepted
    try {
      await this.notificationManager.notifyRideStatusUpdate(
        rideId,
        ride.userId.toString(),
        driverId,
        'accepted',
        {
          driverName:
            updatedRide.driver?.firstName + ' ' + updatedRide.driver?.lastName,
          vehicleInfo: updatedRide.vehicle
            ? `${updatedRide.vehicle.make} ${updatedRide.vehicle.model} - ${updatedRide.vehicle.licensePlate}`
            : updatedRide.driver?.vehicles?.[0]
              ? `${updatedRide.driver.vehicles[0].make} ${updatedRide.driver.vehicles[0].model} - ${updatedRide.driver.vehicles[0].licensePlate}`
              : 'Vehículo asignado',
          vehicleType:
            updatedRide.vehicle?.vehicleType?.displayName ||
            updatedRide.driver?.vehicles?.[0]?.vehicleType?.displayName ||
            'Vehículo',
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
    const {
      ratedByUserId,
      ratedUserId: ratedUserIdValue,
      ratingValue,
      comment,
    } = rateRideDto;

    return this.prisma.rating.create({
      data: {
        rideId,
        ratedByUserId,
        ratedUserId: ratedUserIdValue,
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
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true, status: 'active' },
              take: 1,
            },
          },
        },
        user: true,
        vehicle: true,
      },
    });

    // Notify passenger that driver has arrived
    try {
      await this.notificationManager.notifyRideStatusUpdate(
        rideId,
        ride.userId.toString(),
        ride.driverId,
        'arrived',
        {
          driverName:
            updatedRide.driver?.firstName + ' ' + updatedRide.driver?.lastName,
          vehicleInfo: updatedRide.vehicle
            ? `${updatedRide.vehicle.make} ${updatedRide.vehicle.model} - ${updatedRide.vehicle.licensePlate}`
            : updatedRide.driver?.vehicles?.[0]
              ? `${updatedRide.driver.vehicles[0].make} ${updatedRide.driver.vehicles[0].model} - ${updatedRide.driver.vehicles[0].licensePlate}`
              : 'Vehículo asignado',
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
      await this.notificationManager.notifyRideStatusUpdate(
        rideId,
        ride.userId.toString(),
        ride.driverId,
        'cancelled',
        {
          reason: reason || 'Ride was cancelled',
          cancelledBy,
        },
      );

      // If there was a driver assigned, notify them too
      if (
        ride.driverId &&
        ride.driverId.toString() !== ride.userId.toString()
      ) {
        await this.notificationManager.notifyRideStatusUpdate(
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
    driverVehicleTypeId?: number,
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

    // Build where clause
    const whereClause: any = {
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
    };

    // If driver vehicle type is provided, filter by valid tier-vehicle combinations
    if (driverVehicleTypeId) {
      // Get all tier IDs that are valid for this vehicle type
      const validCombinations = await this.prisma.tierVehicleType.findMany({
        where: {
          vehicleTypeId: driverVehicleTypeId,
          isActive: true,
        },
        select: {
          tierId: true,
        },
      });

      const validTierIds = validCombinations.map((combo) => combo.tierId);

      // Only show rides that request vehicle types compatible with driver's vehicle
      // OR rides that don't specify a vehicle type (backwards compatibility)
      whereClause.OR = [
        {
          requestedVehicleTypeId: driverVehicleTypeId,
          tierId: {
            in: validTierIds,
          },
        },
        {
          requestedVehicleTypeId: null, // Rides without specific vehicle type
        },
      ];
    }

    // Find rides that are available (no driver assigned) and within the bounding box
    const availableRides = await this.prisma.ride.findMany({
      where: whereClause,
      include: {
        tier: true,
        user: true,
        requestedVehicleType: true, // Include vehicle type info
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
                  perKmRate: Number(ride.tier.perKmRate),
                }
              : null,
            user: ride.user
              ? {
                  name: ride.user.name,
                  userId: ride.user.id,
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
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true, status: 'active' },
              take: 1,
            },
          },
        },
        user: true,
        tier: true,
        vehicle: true,
      },
    });

    // Notify passenger that ride has started
    try {
      await this.notificationManager.notifyRideStatusUpdate(
        rideId,
        ride.userId.toString(),
        ride.driverId,
        'in_progress',
        {
          driverName:
            updatedRide.driver?.firstName + ' ' + updatedRide.driver?.lastName,
          vehicleInfo: updatedRide.vehicle
            ? `${updatedRide.vehicle.make} ${updatedRide.vehicle.model} - ${updatedRide.vehicle.licensePlate}`
            : updatedRide.driver?.vehicles?.[0]
              ? `${updatedRide.driver.vehicles[0].make} ${updatedRide.driver.vehicles[0].model} - ${updatedRide.driver.vehicles[0].licensePlate}`
              : 'Vehículo asignado',
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
        carModel: updatedRide.driver?.vehicles?.[0]
          ? `${updatedRide.driver.vehicles[0].make} ${updatedRide.driver.vehicles[0].model}`
          : 'Unknown',
        licensePlate:
          updatedRide.driver?.vehicles?.[0]?.licensePlate || 'Unknown',
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
        finalDistance * Number(tier.perKmRate);
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
      await this.notificationManager.notifyRideStatusUpdate(
        rideId,
        ride.userId.toString(),
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

    // Process referral conversion if this is the user's first completed ride
    try {
      // ride.userId is Int according to the model, so we can use it directly
      await this.processReferralConversion(ride.userId);
      this.logger.log(
        `Processed referral conversion for user ${ride.userId} after completing ride ${rideId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process referral conversion for ride ${rideId}:`,
        error,
      );
      // Don't throw error - referral processing shouldn't break ride completion
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

  /**
   * Process referral conversion when a user completes their first ride
   * This method identifies pending referrals for the user and converts them
   */
  private async processReferralConversion(userId: number): Promise<void> {
    try {
      // Check if user can be referred (has pending referrals)
      const canBeReferred =
        await this.referralsService.canUserBeReferred(userId);
      if (!canBeReferred) {
        this.logger.debug(
          `User ${userId} cannot be referred (no pending referrals or already referred)`,
        );
        return;
      }

      // Find pending referrals for this user
      const pendingReferrals = await this.referralsService
        .getUserReferrals(userId)
        .then((referrals) => referrals.filter((r) => r.status === 'pending'));

      if (pendingReferrals.length === 0) {
        this.logger.debug(`No pending referrals found for user ${userId}`);
        return;
      }

      // Process each pending referral
      for (const referral of pendingReferrals) {
        try {
          // Validate conversion conditions
          const isValid = await this.validateReferralConversionConditions(
            referral,
            userId,
          );
          if (!isValid) {
            this.logger.debug(
              `Referral ${referral.id} does not meet conversion conditions`,
            );
            continue;
          }

          // Convert the referral
          await this.referralsService.convertReferral(referral.id);

          // Apply rewards
          await this.referralRewardsService.applyReferralRewards(referral.id);

          this.logger.log(
            `Successfully converted referral ${referral.id} for user ${userId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to convert referral ${referral.id} for user ${userId}:`,
            error,
          );
          // Continue processing other referrals even if one fails
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing referral conversion for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Validate conditions for referral conversion
   */
  private async validateReferralConversionConditions(
    referral: any,
    userIdNum: number,
  ): Promise<boolean> {
    try {
      // Condition 1: Check if this is the user's first completed ride
      const completedRides = await this.prisma.ride.count({
        where: {
          userId: userIdNum, // userId is Int in Ride model
          paymentStatus: 'completed',
        },
      });

      if (completedRides !== 1) {
        // Only convert on the FIRST completed ride
        return false;
      }

      // Condition 2: Validate minimum ride value if configured
      const recentRide = await this.prisma.ride.findFirst({
        where: {
          userId: userIdNum, // userId is Int in Ride model
          paymentStatus: 'completed',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentRide) {
        const minRideValue = 15.0; // Configurable minimum ride value
        if (Number(recentRide.farePrice) < minRideValue) {
          this.logger.debug(
            `Ride value ${recentRide.farePrice} below minimum ${minRideValue} for referral ${referral.id}`,
          );
          return false;
        }
      }

      // Condition 3: Check referral code validity period
      const codeValidDays = this.getConfigValue(
        'REFERRAL_CODE_EXPIRY_DAYS',
        365,
      );
      const codeAgeDays = Math.floor(
        (Date.now() - referral.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (codeAgeDays > codeValidDays) {
        this.logger.debug(
          `Referral code expired (${codeAgeDays} > ${codeValidDays} days) for referral ${referral.id}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error validating conversion conditions for referral ${referral.id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Helper method to get configuration values
   * Note: In a real implementation, this would use the AppConfigService
   */
  private getConfigValue(key: string, defaultValue: any): any {
    // This is a simplified version - in production, use AppConfigService
    const envValue = process.env[key];
    if (envValue !== undefined) {
      const numValue = parseFloat(envValue);
      return isNaN(numValue) ? envValue : numValue;
    }
    return defaultValue;
  }
}
