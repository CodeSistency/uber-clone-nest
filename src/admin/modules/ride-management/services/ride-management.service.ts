import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// Note: Ride model in Prisma doesn't have a status field, only paymentStatus
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'all';

interface RideUser {
  id: number;
  name: string;
  phone: string;
}

interface RideDriver {
  id: number;
  firstName: string;
  lastName: string;
  carModel?: string | null;
  licensePlate?: string | null;
  profileImageUrl?: string | null;
}

interface RideTier {
  id: number;
  name: string;
}

type PrismaRide = {
  rideId: number;
  originAddress: string;
  destinationAddress: string;
  originLatitude: Decimal;
  originLongitude: Decimal;
  destinationLatitude: Decimal;
  destinationLongitude: Decimal;
  rideTime: number;
  farePrice: Decimal;
  paymentStatus: string;
  scheduledFor: Date | null;
  createdAt: Date;
  user: RideUser;
  driver: RideDriver | null;
  tier: RideTier | null;
};

// Extended ride type with all necessary properties
export interface FormattedRide {
  id: number;
  originAddress: string;
  destinationAddress: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  rideTime: number;
  farePrice: number;
  paymentStatus: string;
  scheduledFor: Date | null;
  createdAt: Date;
  user: RideUser;
  driver: {
    id: number;
    name: string;
    carModel: string;
    licensePlate: string;
    profileImageUrl: string;
  } | null;
  vehicleType: RideTier | null;
}

export interface GetRidesOptions {
  page: number;
  limit: number;
  paymentStatus?: PaymentStatus;
  driverId?: number;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class RideManagementService {
  private readonly logger = new Logger(RideManagementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get a paginated list of rides with filters
   * @param options Pagination and filtering options
   * @returns List of rides and pagination info
   */
  async getRides(options: GetRidesOptions) {
    const {
      page,
      limit,
      paymentStatus,
      driverId,
      userId,
      dateFrom,
      dateTo,
    } = options;
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: any = {};

    // Apply payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus;
    }

    // Apply driver filter
    if (driverId) {
      where.driverId = Number(driverId);
    }

    // Apply user filter
    if (userId) {
      where.userId = Number(userId);
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    try {
      const [rides, total] = await Promise.all([
        // Get paginated rides with related data
        this.prisma.ride.findMany({
          where,
          skip,
          take: limit,
          select: {
            rideId: true,
            originAddress: true,
            destinationAddress: true,
            originLatitude: true,
            originLongitude: true,
            destinationLatitude: true,
            destinationLongitude: true,
            rideTime: true,
            farePrice: true,
            paymentStatus: true,
            scheduledFor: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true,
                carModel: true,
                licensePlate: true,
              },
            },
            tier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Count total rides matching filters
        this.prisma.ride.count({ where }),
      ]);

      // Transform the data for the response
      const formattedRides: FormattedRide[] = rides.map((ride: any) => ({
        id: ride.rideId,
        originAddress: ride.originAddress,
        destinationAddress: ride.destinationAddress,
        originLatitude: Number(ride.originLatitude),
        originLongitude: Number(ride.originLongitude),
        destinationLatitude: Number(ride.destinationLatitude),
        destinationLongitude: Number(ride.destinationLongitude),
        rideTime: ride.rideTime,
        farePrice: Number(ride.farePrice),
        paymentStatus: ride.paymentStatus.toLowerCase(),
        scheduledFor: ride.scheduledFor,
        createdAt: ride.createdAt,
        user: ride.user,
        driver: ride.driver ? {
          id: ride.driver.id,
          name: `${ride.driver.firstName} ${ride.driver.lastName}`.trim(),
          carModel: ride.driver.carModel || '',
          licensePlate: ride.driver.licensePlate || '',
          profileImageUrl: ride.driver.profileImageUrl || ''
        } : null,
        vehicleType: ride.tier
      }));

      return {
        success: true,
        data: formattedRides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching rides:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific ride
   * @param rideId Ride ID
   * @returns Detailed ride information
   */
  async getRideById(rideId: number) {
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      select: {
        rideId: true,
        originAddress: true,
        destinationAddress: true,
        originLatitude: true,
        originLongitude: true,
        destinationLatitude: true,
        destinationLongitude: true,
        rideTime: true,
        farePrice: true,
        paymentStatus: true,
        scheduledFor: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            carModel: true,
            licensePlate: true,
          },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return {
      id: ride.rideId,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      originLatitude: Number(ride.originLatitude),
      originLongitude: Number(ride.originLongitude),
      destinationLatitude: Number(ride.destinationLatitude),
      destinationLongitude: Number(ride.destinationLongitude),
      rideTime: ride.rideTime,
      farePrice: Number(ride.farePrice),
      paymentStatus: ride.paymentStatus.toLowerCase(),
      scheduledFor: ride.scheduledFor,
      createdAt: ride.createdAt,
      user: ride.user,
      driver: ride.driver ? {
        id: ride.driver.id,
        name: `${ride.driver.firstName} ${ride.driver.lastName}`.trim(),
        carModel: ride.driver.carModel || '',
        licensePlate: ride.driver.licensePlate || '',
        profileImageUrl: ride.driver.profileImageUrl || ''
      } : null
    };
  }

  /**
   * Get ride statistics (total rides, revenue, etc.)
   * @returns Ride statistics
   */
  async getRideStatistics() {
    try {
      const [
        totalRides,
        completedRides,
        cancelledRides,
        totalRevenue,
        averageRating,
        ridesByStatus,
        ridesByDay,
      ] = await Promise.all([
        // Total rides
        this.prisma.ride.count(),
        
        // Completed rides (using payment status as a proxy for completion)
        this.prisma.ride.count({ 
          where: { 
            paymentStatus: 'PAID',
            rideTime: { gt: 0 } // Assuming rideTime is a number representing seconds
          } 
        }),
        
        // Cancelled rides
        this.prisma.ride.count({ 
          where: { 
            paymentStatus: 'CANCELLED' 
          } 
        }),
        
        // Total revenue (only from paid rides)
        this.prisma.ride.aggregate({
          where: { 
            paymentStatus: 'PAID',
            rideTime: { gt: 0 } // Assuming rideTime is a number representing seconds
          },
          _sum: { farePrice: true },
        }),
        
        // Average rating
        this.prisma.rating.aggregate({
          _avg: { ratingValue: true },
          _count: true,
        }),
        
        // Rides by payment status
        this.prisma.ride.groupBy({
          by: ['paymentStatus'],
          _count: { _all: true },
        }),
        
        // Rides by day for the last 30 days
        this.prisma.$queryRaw`
          SELECT DATE("createdAt") as date, COUNT(*) as count
          FROM "Ride"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
      ]);

      // Process rides by status to use payment status instead of ride status
      const statusCounts = ridesByStatus.reduce((acc, item) => {
        acc[item.paymentStatus.toLowerCase()] = item._count._all;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalRides,
          completedRides,
          cancelledRides,
          completionRate: totalRides > 0 ? (completedRides / totalRides) * 100 : 0,
          totalRevenue: totalRevenue._sum?.farePrice ? Number(totalRevenue._sum.farePrice) : 0,
          averageRating: averageRating._avg?.ratingValue || 0,
          totalRatings: averageRating._count || 0,
          ridesByStatus: statusCounts,
          ridesByDay: Array.isArray(ridesByDay) 
            ? ridesByDay.map(item => ({
                date: item.date.toISOString().split('T')[0],
                count: Number(item.count),
              }))
            : [],
        },
      };
    } catch (error) {
      this.logger.error('Error fetching ride statistics:', error);
      throw error;
    }
  }
}
