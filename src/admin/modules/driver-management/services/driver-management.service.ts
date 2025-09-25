import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SearchDriversDto } from 'src/drivers/dto/search-drivers.dto';
import { PaginatedDriversResponseDto } from 'src/drivers/dto/paginated-drivers-response.dto';

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

  async searchDrivers(
    searchDto: SearchDriversDto,
  ): Promise<PaginatedDriversResponseDto> {
    const {
      page = 1,
      limit = 10,
      firstName,
      lastName,
      carModel,
      licensePlate,
      status,
      verificationStatus,
      canDoDeliveries,
      carSeats,
      vehicleTypeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdFrom,
      createdTo,
      updatedFrom,
      updatedTo,
    } = searchDto;

    // Construir filtros dinámicamente
    const where: Prisma.DriverWhereInput = {};

    // Filtros de texto (búsqueda parcial case-insensitive)
    if (firstName) {
      where.firstName = {
        contains: firstName,
        mode: 'insensitive',
      };
    }

    if (lastName) {
      where.lastName = {
        contains: lastName,
        mode: 'insensitive',
      };
    }

    if (carModel) {
      where.carModel = {
        contains: carModel,
        mode: 'insensitive',
      };
    }

    if (licensePlate) {
      where.licensePlate = {
        contains: licensePlate,
        mode: 'insensitive',
      };
    }

    // Filtros exactos
    if (status !== undefined) {
      where.status = status;
    }

    if (verificationStatus !== undefined) {
      where.verificationStatus = verificationStatus;
    }

    if (canDoDeliveries !== undefined) {
      where.canDoDeliveries = canDoDeliveries;
    }

    if (carSeats !== undefined) {
      where.carSeats = carSeats;
    }

    if (vehicleTypeId !== undefined) {
      where.vehicleTypeId = vehicleTypeId;
    }

    // Filtros de fecha
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    if (updatedFrom || updatedTo) {
      where.updatedAt = {};
      if (updatedFrom) {
        where.updatedAt.gte = new Date(updatedFrom);
      }
      if (updatedTo) {
        where.updatedAt.lte = new Date(updatedTo);
      }
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta de conteo y búsqueda en paralelo
    const [total, drivers] = await Promise.all([
      this.prisma.driver.count({ where }),
      this.prisma.driver.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
        include: {
          vehicleType: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              verificationStatus: true,
              uploadedAt: true,
            },
          },
          _count: {
            select: {
              rides: true,
              deliveryOrders: true,
            },
          },
        },
      }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Construir lista de filtros aplicados
    const appliedFilters: string[] = [];
    const filters: any = {};

    if (firstName) {
      appliedFilters.push('firstName');
      filters.searchTerm = firstName;
    }
    if (lastName) appliedFilters.push('lastName');
    if (carModel) appliedFilters.push('carModel');
    if (licensePlate) appliedFilters.push('licensePlate');
    if (status) appliedFilters.push('status');
    if (verificationStatus) appliedFilters.push('verificationStatus');
    if (canDoDeliveries !== undefined) appliedFilters.push('canDoDeliveries');
    if (carSeats !== undefined) appliedFilters.push('carSeats');
    if (vehicleTypeId !== undefined) appliedFilters.push('vehicleTypeId');
    if (createdFrom || createdTo) appliedFilters.push('createdDateRange');
    if (updatedFrom || updatedTo) appliedFilters.push('updatedDateRange');

    return {
      data: drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters:
        appliedFilters.length > 0
          ? {
              applied: appliedFilters,
              ...filters,
            }
          : undefined,
    };
  }


  /**
   * Get detailed information about a specific driver
   * @param id Driver ID
   * @returns Detailed driver information
   */
  async getDriverById(id: number) {
    // Get driver details with documents
    const driver = (await this.prisma.driver.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            documentUrl: true,
            uploadedAt: true,
            verificationStatus: true,
            driverId: true,
          },
        },
      },
    })) as unknown as DriverWithUser;

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
      },
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
        paymentStatus: 'COMPLETED',
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
  async updateDriverVerification(
    id: number,
    verificationStatus: string,
    notes?: string,
  ) {
    // First get the driver with user data using a raw query to avoid type issues
    const driverData = await this.prisma.$queryRaw<
      Array<{
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
      }>
    >`
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
        ...(driver.user
          ? [
              this.prisma.user.update({
                where: { id: driver.user.id },
                data: { isActive: userActiveStatus },
              }),
            ]
          : []),
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
      this.logger.error(
        `Failed to update driver verification status: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to update driver verification status');
    }
  }
}
