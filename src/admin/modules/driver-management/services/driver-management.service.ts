import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DriverStatus, VerificationStatus } from '../types/driver.types';
import { Prisma, Driver, User, DriverDocument } from '@prisma/client';

// Extended driver type with all necessary properties
// Extended driver type with user information
type DriverWithUser = Prisma.DriverGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        phone: true;
        isActive: boolean;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    };
    documents: true;
    vehicleType: true;
    _count: {
      select: { rides: boolean; documents: boolean; deliveryOrders: boolean };
    };
  };
}> & {
  userId?: number;
  isOnline?: boolean;
  lastActive?: Date | null;
  isSuspended?: boolean;
  verifiedAt?: Date | null;
  verificationStatus?: string;
  verificationNotes?: string | null;
  profileImageUrl?: string | null;
  carImageUrl?: string | null;
  carModel?: string | null;
  licensePlate?: string | null;
  _count?: {
    rides: number;
    documents: number;
    deliveryOrders: number;
  };
  documents?: Array<{
    id: number;
    documentType: string;
    documentUrl: string;
    uploadedAt: Date;
    verificationStatus?: string;
    driverId: number;
  }>;
};

export interface GetDriversOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  verificationStatus?: string;
}

@Injectable()
export class DriverManagementService {
  private readonly logger = new Logger(DriverManagementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get a paginated list of drivers with filters
   * @param options Pagination and filtering options
   * @returns List of drivers and pagination info
   */
  async getDrivers(options: GetDriversOptions) {
    const { page, limit, search, status, verificationStatus } = options;
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: Prisma.DriverWhereInput = {};

    // Apply search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        // User-related searches will be handled after fetching
      ];
    }

    // We'll apply the status filter after fetching since we can't directly query the user relation
    // The actual filtering will be done after we have the driver data

    // Apply verification status filter
    if (verificationStatus && verificationStatus !== 'all') {
      where.verificationStatus = verificationStatus.toUpperCase() as VerificationStatus;
    }

    try {
      // First get the driver IDs that match the search criteria
      const driverIds = await this.prisma.driver.findMany({
        where,
        select: { id: true },
        skip,
        take: limit,
      });

      // Then get the full driver details with documents
      const drivers = await Promise.all(driverIds.map(async ({ id }) => {
        return await this.getDriverById(id);
      }));

      // Get counts for each driver
      const driversWithCounts = await Promise.all(drivers.map(async (driver) => {
        const [ridesCount, documentsCount] = await Promise.all([
          this.prisma.ride.count({ where: { driverId: driver.id } }),
          this.prisma.driverDocument.count({ where: { driverId: driver.id } }),
        ]);

        return {
          ...driver,
          _count: {
            rides: ridesCount,
            documents: documentsCount,
          }
        };
      }));

      // Get the total count for pagination
      const total = await this.prisma.driver.count({ where });

      // Get user details for the filtered drivers
      const userIds = drivers
        .map(d => {
          const driverWithUser = d as any;
          return driverWithUser.user?.id;
        })
        .filter((id): id is number => id !== undefined);

      const users = await this.prisma.user.findMany({
        where: { 
          id: { in: userIds },
          userType: 'driver' 
        },
        select: {
          id: true,
          email: true,
          phone: true,
          isActive: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Create a map of user ID to user data
      const userMap = new Map(users.map(user => [user.id, user]));

      // Combine driver and user data
      const driversWithUsers = drivers.map(driver => {
        const driverWithUser = driver as any;
        return {
          ...driverWithUser,
          user: userMap.get(driverWithUser.userId) || null
        };
      });

      // Apply search and status filters
      const filteredDrivers = driversWithUsers.filter(driver => {
        const user = driver.user;
        if (!user) return false;

        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch =
            user.email?.toLowerCase().includes(searchLower) ||
            user.phone?.includes(search);
          if (!matchesSearch) return false;
        }

        // Apply status filter if provided
        if (status && status !== 'all') {
          if (status === 'suspended') {
            return (driver as any).isSuspended === true;
          } else if (status === 'active') {
            return user.isActive === true && (driver as any).isSuspended !== true;
          } else if (status === 'inactive') {
            return user.isActive === false && (driver as any).isSuspended !== true;
          }
        }

        return true;
      });

      // Format the response
      const formattedDrivers = filteredDrivers
        .filter((driver): driver is typeof driver & { user: NonNullable<typeof driver.user> } => !!driver.user)
        .map(driver => {
          const [firstName, ...lastNameParts] = (driver.user.name || '').split(' ');
          const lastName = lastNameParts.join(' ');
          
          return {
            id: driver.id,
            userId: driver.user.id,
            firstName: firstName || '',
            lastName: lastName || '',
            email: driver.user.email || '',
            phone: driver.user.phone || '',
            status: (driver as any).isSuspended ? 'suspended' : driver.user.isActive ? 'active' : 'inactive',
            isOnline: (driver as any).isOnline || false,
            lastActive: (driver as any).lastActive || null,
            profileImageUrl: (driver as any).profileImageUrl || null,
            carImageUrl: (driver as any).carImageUrl || null,
            carModel: (driver as any).carModel || null,
            licensePlate: (driver as any).licensePlate || null,
            rating: 0, // Will be calculated separately
            totalRides: (driver as any)._count?.rides || 0,
            totalEarnings: 0, // Will be calculated separately
            documents: ((driver as any).documents || []).map((doc: any) => ({
              id: doc.id,
              type: doc.documentType,
              status: doc.verificationStatus,
              url: doc.documentUrl,
              uploadedAt: doc.uploadedAt,
              driverId: doc.driverId
            })),
            verificationStatus: ((driver as any).verificationStatus || '').toLowerCase() || null,
            verifiedAt: (driver as any).verifiedAt || null,
            verificationNotes: (driver as any).verificationNotes || null,
            createdAt: driver.user.createdAt,
            updatedAt: driver.user.updatedAt,
          };
        });

      return {
        success: true,
        data: formattedDrivers,
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching drivers:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific driver
   * @param id Driver ID
   * @returns Detailed driver information
   */
  async getDriverById(id: number) {
    // Get driver details with documents
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            documentUrl: true,
            uploadedAt: true,
            verificationStatus: true,
            driverId: true
          },
        },
      },
    }) as unknown as DriverWithUser;
    
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: driver.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new NotFoundException(`User not found for driver ID ${id}`);
    }
    
    // Combine driver and user data
    const driverWithUser = {
      ...driver,
      user: {
        ...user,
        isActive: user.isActive ?? false,
      }
    };

    // Calculate average rating
    const ratings = await this.prisma.rating.aggregate({
      where: { ratedUserId: id },
      _avg: { ratingValue: true },
      _count: true,
    });

    // Calculate total earnings from completed rides
    const earnings = await this.prisma.ride.aggregate({
      where: { 
        driverId: id, 
        paymentStatus: 'COMPLETED' 
      },
      _sum: { farePrice: true },
    });

    // Transform the data for the response
    return {
      ...driverWithUser.user,
      verificationStatus: driver.verificationStatus.toLowerCase(),
      isOnline: driver.isOnline,
      isSuspended: driver.isSuspended,
      driverProfile: {
        licenseNumber: 'DL1234567890', // This would come from driver profile in a real app
        licenseExpiry: '2025-12-31', // This would come from driver profile in a real app
        vehicleMake: driver.carModel?.split(' ')[0] || 'N/A', // Extract make from car model
        vehicleModel: driver.carModel || 'N/A',
        vehicleYear: 2020, // Default year
        vehicleColor: 'Blue', // Default color
        vehiclePlate: driver.licensePlate || 'N/A',
        averageRating: ratings._avg.ratingValue || 0,
        totalRides: await this.prisma.ride.count({ where: { driverId: id } }),
        totalEarnings: earnings._sum.farePrice?.toNumber() || 0,
      },
      documents: driverWithUser.documents,
    };
  }

  /**
   * Update a driver's verification status
   * @param id Driver ID
   * @param verificationStatus New verification status
   * @param notes Optional notes about the verification
   * @returns Updated driver verification information
   */
  async updateDriverVerification(id: number, verificationStatus: string, notes?: string) {
    // First get the driver with user data using a raw query to avoid type issues
    const driverData = await this.prisma.$queryRaw<Array<{
      id: number;
      status: string;
      userId: number;
      verificationStatus: string | null;
      user: {
        id: number;
        isActive: boolean;
        name: string | null;
        email: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }>>`
      SELECT 
        d.id, 
        d.status, 
        d."userId", 
        d."verificationStatus",
        json_build_object(
          'id', u.id,
          'isActive', u."isActive",
          'name', u.name,
          'email', u.email,
          'phone', u.phone,
          'createdAt', u."createdAt",
          'updatedAt', u."updatedAt"
        ) as "user"
      FROM "Driver" d
      LEFT JOIN "User" u ON d."userId" = u.id
      WHERE d.id = ${id}
    `;

    if (!driverData || driverData.length === 0 || !driverData[0]) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    const driver = driverData[0];

    const statusMap: Record<string, string> = {
      verified: 'ONLINE',
      pending: 'OFFLINE',
      rejected: 'INACTIVE',
    };

    const driverStatus = statusMap[verificationStatus] || driver.status;
    const userActiveStatus = verificationStatus === 'verified';

    try {
      // Update driver's verification status using a transaction
      await this.prisma.$transaction([
        this.prisma.driver.update({
          where: { id },
          data: {
            verificationStatus: verificationStatus.toUpperCase(),
            status: driverStatus,
            updatedAt: new Date(),
            // Only include fields that exist in the Prisma schema
            ...(notes ? { verificationNotes: notes } : {}),
          },
        }),
        // Update user's active status if verification is successful and user exists
        ...(driver.user ? [
          this.prisma.user.update({
            where: { id: driver.user.id },
            data: { isActive: userActiveStatus },
          })
        ] : []),
      ]);

      this.logger.log(
        `Updated verification status for driver ${id} to ${verificationStatus}`,
      );

      return {
        success: true,
        message: 'Driver verification status updated',
        data: {
          id,
          verificationStatus: verificationStatus.toLowerCase(),
          verifiedAt: verificationStatus === 'verified' ? new Date() : null,
          verifiedBy: 1, // This would be the ID of the admin who performed the verification
          notes, // Use the notes parameter that was passed in
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update driver verification status: ${error.message}`, error.stack);
      throw new Error('Failed to update driver verification status');
    }
  }
}
