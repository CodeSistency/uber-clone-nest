import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Driver, DriverDocument, Prisma } from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async createDriver(data: Prisma.DriverCreateInput): Promise<Driver> {
    return this.prisma.driver.create({
      data,
    });
  }

  async findAllDrivers(filters?: {
    status?: string;
    verified?: boolean;
    location?: {
      lat: number;
      lng: number;
      radius: number;
    };
  }): Promise<Driver[]> {
    const whereClause: Prisma.DriverWhereInput = {};

    // Apply status filter
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Apply verification filter
    if (filters?.verified !== undefined) {
      if (filters.verified) {
        whereClause.verificationStatus = 'approved';
      } else {
        whereClause.verificationStatus = {
          not: 'approved',
        };
      }
    }

    // Apply location filter (basic implementation - could be enhanced)
    if (filters?.location) {
      // For now, we'll just return all drivers if location is specified
      // A more sophisticated implementation would calculate distances
      // and filter by actual proximity
    }

    return this.prisma.driver.findMany({
      where: whereClause,
      include: {
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async registerDriver(registerDriverDto: RegisterDriverDto): Promise<Driver> {
    const {
      firstName,
      lastName,
      carModel,
      licensePlate,
      carSeats,
      profileImageUrl,
      carImageUrl,
    } = registerDriverDto;

    return this.prisma.driver.create({
      data: {
        firstName,
        lastName,
        profileImageUrl,
        carImageUrl,
        carModel,
        licensePlate,
        carSeats,
      },
    });
  }

  async uploadDocument(
    uploadDocumentDto: UploadDocumentDto,
  ): Promise<DriverDocument> {
    const { driverId, documentType, documentUrl } = uploadDocumentDto;

    return this.prisma.driverDocument.create({
      data: {
        driverId,
        documentType,
        documentUrl,
      },
    });
  }

  async findDriverById(id: number): Promise<Driver | null> {
    return this.prisma.driver.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });
  }

  async findAvailableDrivers(): Promise<Driver[]> {
    return this.prisma.driver.findMany({
      where: {
        status: 'online',
        canDoDeliveries: true,
      },
      include: {
        documents: true,
      },
    });
  }

  async updateDriver(
    id: number,
    data: Prisma.DriverUpdateInput,
  ): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id },
      data,
    });
  }

  async updateDriverStatus(id: number, status: string): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id },
      data: { status },
    });
  }

  async deleteDriver(id: number): Promise<Driver> {
    return this.prisma.driver.delete({
      where: { id },
    });
  }

  async getRideRequests(): Promise<any[]> {
    const rides = await this.prisma.ride.findMany({
      where: {
        driverId: null, // Rides without assigned driver
        paymentStatus: 'completed',
      },
      include: {
        tier: true,
      },
    });

    return rides.map((ride) => ({
      ride_id: ride.rideId,
      origin_address: ride.originAddress,
      destination_address: ride.destinationAddress,
      fare_price: ride.farePrice.toString(),
      tier_name: ride.tier?.name || 'Standard',
    }));
  }

  async getDriverRides(
    driverId: number,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    data: {
      rideId: number;
      originAddress: string;
      destinationAddress: string;
      farePrice: number;
      status: string;
      createdAt: Date;
      completedAt: Date | null;
      distance: number | null;
      duration: number;
      user: { name: string; clerkId: string | null } | null;
      ratings: { ratingValue: number; comment: string | null; createdAt: Date }[];
    }[];
    summary: {
      totalRides: number;
      totalEarnings: number;
      averageRating: number;
      completedRides: number;
      cancelledRides: number;
    };
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    // Build where clause
    const whereClause: Prisma.RideWhereInput = {
      driverId,
    };

    // Apply status filter
    if (filters?.status) {
      whereClause.paymentStatus = filters.status;
    }

    // Apply date filters
    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    // Get rides with pagination
    const rides = await this.prisma.ride.findMany({
      where: whereClause,
      include: {
        user: true,
        tier: true,
        ratings: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 10, // Limit messages for performance
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
    });

    // Get total count for pagination
    const totalCount = await this.prisma.ride.count({
      where: whereClause,
    });

    // Calculate statistics
    const completedRides = rides.filter(
      (ride) => ride.paymentStatus === 'completed',
    );
    const cancelledRides = rides.filter(
      (ride) => ride.paymentStatus === 'cancelled',
    );
    const totalEarnings = completedRides.reduce(
      (sum, ride) => sum + Number(ride.farePrice),
      0,
    );

    // Calculate average rating
    const ratings = rides.flatMap((ride) => ride.ratings || []);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + Number(rating.ratingValue), 0) /
          ratings.length
        : 0;

    // Format rides data
    const formattedRides = rides.map((ride) => ({
      rideId: ride.rideId,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      farePrice: Number(ride.farePrice),
      status: ride.paymentStatus || 'pending',
      createdAt: ride.createdAt,
      completedAt: ride.paymentStatus === 'completed' ? ride.createdAt : null, // You might want to add a completedAt field
      distance: null, // You might want to calculate or store actual distance
      duration: ride.rideTime,
      user: ride.user
        ? {
            name: ride.user.name,
            clerkId: ride.user.clerkId,
          }
        : null,
      ratings:
        ride.ratings?.map((rating) => ({
          ratingValue: Number(rating.ratingValue),
          comment: rating.comment,
          createdAt: rating.createdAt,
        })) || [],
    }));

    return {
      data: formattedRides,
      summary: {
        totalRides: rides.length,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        averageRating: Math.round(averageRating * 10) / 10,
        completedRides: completedRides.length,
        cancelledRides: cancelledRides.length,
      },
      pagination: {
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        total: totalCount,
      },
    };
  }

  async getDriverDeliveryOrders(driverId: number): Promise<any[]> {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { courierId: driverId },
      include: {
        user: true,
        store: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        ratings: true,
        messages: true,
      },
    });
    return orders;
  }
}
