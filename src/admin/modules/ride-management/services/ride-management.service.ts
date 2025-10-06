import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminAuditLog } from '@prisma/client';

export interface RideFilters {
  status?: string[];
  driverId?: number;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  minFare?: number;
  maxFare?: number;
  originAddress?: string;
  destinationAddress?: string;
}

export interface RideListResponse {
  rides: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RideDetails {
  id: number;
  rideId: number;
  originAddress: string;
  destinationAddress: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  rideTime: number;
  farePrice: number;
  paymentStatus: string;
  status: string;
  driverId?: number;
  userId: number;
  tierId?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  driver?: any;
  user?: any;
  tier?: any;
  ratings?: any[];
  messages?: any[];
  locationHistory?: any[];
}

@Injectable()
export class RideManagementService {
  private readonly logger = new Logger(RideManagementService.name);

  constructor(private prisma: PrismaService) {}

  async getRidesWithFilters(
    filters: RideFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<RideListResponse> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.driverId) {
      where.driverId = filters.driverId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.minFare !== undefined || filters.maxFare !== undefined) {
      where.farePrice = {};
      if (filters.minFare !== undefined) {
        where.farePrice.gte = filters.minFare;
      }
      if (filters.maxFare !== undefined) {
        where.farePrice.lte = filters.maxFare;
      }
    }

    if (filters.originAddress) {
      where.originAddress = {
        contains: filters.originAddress,
        mode: 'insensitive',
      };
    }

    if (filters.destinationAddress) {
      where.destinationAddress = {
        contains: filters.destinationAddress,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await this.prisma.ride.count({ where });

    // Get rides with relations
    const rides = await this.prisma.ride.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            averageRating: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
            baseFare: true,
          },
        },
        ratings: {
          select: {
            id: true,
            ratingValue: true,
            comment: true,
            ratedByUserId: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      rides: rides.map((ride) => ({
        ...ride,
        messagesCount: ride._count.messages,
        _count: undefined, // Remove the _count field from response
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getRideDetails(rideId: number): Promise<RideDetails> {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: {
          include: {
            vehicles: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
            baseFare: true,
            perMinuteRate: true,
            perKmRate: true,
          },
        },
        ratings: {
          include: {
            ratedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        locationHistory: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10, // Last 10 location updates
        },
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    return {
      id: ride.rideId,
      rideId: ride.rideId,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      originLatitude: Number(ride.originLatitude),
      originLongitude: Number(ride.originLongitude),
      destinationLatitude: Number(ride.destinationLatitude),
      destinationLongitude: Number(ride.destinationLongitude),
      rideTime: ride.rideTime,
      farePrice: Number(ride.farePrice),
      paymentStatus: ride.paymentStatus,
      status: ride.status,
      driverId: ride.driverId || undefined,
      userId: ride.userId,
      tierId: ride.tierId || undefined,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      driver: ride.driver,
      user: ride.user,
      tier: ride.tier,
      ratings: ride.ratings,
      messages: ride.messages,
      locationHistory: ride.locationHistory,
    };
  }

  async reassignRide(
    rideId: number,
    newDriverId: number,
    adminId: number,
    reason: string,
  ): Promise<any> {
    // Get current ride
    const currentRide = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!currentRide) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    // Check if ride can be reassigned
    if (
      !['pending', 'accepted', 'driver_confirmed'].includes(currentRide.status)
    ) {
      throw new Error(
        `Cannot reassign ride with status: ${currentRide.status}`,
      );
    }

    // Get new driver
    const newDriver = await this.prisma.driver.findUnique({
      where: { id: newDriverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
      },
    });

    if (!newDriver) {
      throw new NotFoundException(`Driver with ID ${newDriverId} not found`);
    }

    if (
      newDriver.status !== 'ONLINE' ||
      newDriver.verificationStatus !== 'VERIFIED'
    ) {
      throw new Error(`Driver ${newDriverId} is not available for assignment`);
    }

    // Update ride
    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        driverId: newDriverId,
        status: 'ACCEPTED', // Reset to accepted status
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        user: true,
        tier: true,
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'ride_reassign',
      `ride_${rideId}`,
      `Reassigned ride from driver ${currentRide.driverId} to ${newDriverId}. Reason: ${reason}`,
      {
        rideId,
        oldDriverId: currentRide.driverId,
        newDriverId,
        reason,
      },
      {
        rideId,
        previousDriver: currentRide.driverId,
        newDriver: newDriverId,
        reason,
      },
    );

    this.logger.log(
      `Admin ${adminId} reassigned ride ${rideId} from driver ${currentRide.driverId} to ${newDriverId}`,
    );

    return updatedRide;
  }

  async cancelRide(
    rideId: number,
    adminId: number,
    reason: string,
    refundAmount?: number,
  ): Promise<any> {
    // Get current ride
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    // Check if ride can be cancelled
    if (['completed', 'cancelled'].includes(ride.status)) {
      throw new Error(`Ride ${rideId} is already ${ride.status}`);
    }

    // Update ride status
    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'admin',
        cancellationReason: reason,
        cancellationNotes: `Admin cancellation: ${reason}`,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        user: true,
        tier: true,
      },
    });

    // Handle refund if specified
    if (refundAmount && refundAmount > 0) {
      // This would integrate with wallet service
      this.logger.log(
        `Processing refund of ${refundAmount} for ride ${rideId}`,
      );
    }

    // Log the action
    await this.logAdminAction(
      adminId,
      'ride_cancel',
      `ride_${rideId}`,
      `Cancelled ride ${rideId}. Reason: ${reason}`,
      { rideId, status: ride.status },
      {
        rideId,
        cancelledBy: 'admin',
        reason,
        refundAmount,
      },
    );

    this.logger.log(
      `Admin ${adminId} cancelled ride ${rideId}. Reason: ${reason}`,
    );

    return updatedRide;
  }

  async completeRideManually(
    rideId: number,
    adminId: number,
    reason: string,
  ): Promise<any> {
    // Get current ride
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    // Check if ride can be completed
    if (ride.status === 'COMPLETED') {
      throw new Error(`Ride ${rideId} is already completed`);
    }

    if (ride.status === 'CANCELLED') {
      throw new Error(`Cannot complete a cancelled ride ${rideId}`);
    }

    // Update ride status
    const updatedRide = await this.prisma.ride.update({
      where: { rideId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        user: true,
        tier: true,
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'ride_complete_manual',
      `ride_${rideId}`,
      `Manually completed ride ${rideId}. Reason: ${reason}`,
      { rideId, status: ride.status },
      {
        rideId,
        completedBy: 'admin',
        reason,
      },
    );

    this.logger.log(
      `Admin ${adminId} manually completed ride ${rideId}. Reason: ${reason}`,
    );

    return updatedRide;
  }

  private async logAdminAction(
    adminId: number,
    action: string,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
  ): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action,
          resource,
          resourceId,
          oldValue,
          newValue,
          ipAddress: 'system', // Would be populated from request in real implementation
          userAgent: 'admin-panel',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log admin action:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
}
