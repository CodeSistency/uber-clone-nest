import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SearchDriversDto } from 'src/drivers/dto/search-drivers.dto';
import { PaginatedDriversResponseDto } from 'src/drivers/dto/paginated-drivers-response.dto';
import { DriverWithUserDto } from '../types/driver.types';

// Extended driver type with all necessary properties
// Extended driver type with user information
type DriverWithUser = Prisma.DriverGetPayload<{
  include: {
    vehicles: {
      where: { status: 'active' };
      include: { vehicleType: true };
    };
    documents: true;
    driverPaymentMethods: {
      where: { isActive: true };
    };
    workZoneAssignments: {
      include: { zone: true };
    };
    _count: {
      select: { rides: boolean; documents: boolean; deliveryOrders: boolean };
    };
  };
}> & {
  user?: {
    id: number;
    email: string;
    phone: string | null;
    isActive: boolean;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  userId?: number;
  isOnline?: boolean;
  lastActive?: Date | null;
  isSuspended?: boolean;
  verifiedAt?: Date | null;
  verificationStatus?: string;
  verificationNotes?: string | null;
  profileImageUrl?: string | null;
  _count?: {
    rides: number;
    documents: number;
    deliveryOrders: number;
  };
  vehicles?: Array<{
    id: number;
    make: string;
    model: string;
    licensePlate: string;
    status: string;
    vehicleType: {
      id: number;
      name: string;
      displayName: string;
    };
  }>;
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
      where.vehicles = {
        some: { seatingCapacity: carSeats },
      };
    }

    if (vehicleTypeId !== undefined) {
      where.vehicles = {
        some: { vehicleTypeId: vehicleTypeId },
      };
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
          vehicles: {
            where: { status: 'active' },
            include: { vehicleType: true },
          },
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
    if (status) appliedFilters.push('status');
    if (verificationStatus) appliedFilters.push('verificationStatus');
    if (canDoDeliveries !== undefined) appliedFilters.push('canDoDeliveries');
    if (carSeats !== undefined) appliedFilters.push('carSeats');
    if (vehicleTypeId !== undefined) appliedFilters.push('vehicleTypeId');
    if (createdFrom || createdTo) appliedFilters.push('createdDateRange');
    if (updatedFrom || updatedTo) appliedFilters.push('updatedDateRange');

    // Transform drivers to match expected format
    const transformedDrivers: DriverWithUserDto[] = drivers.map(driver => ({
      id: driver.id,
      userId: driver.id, // Assuming driver.id === user.id for now
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: null, // Would need to join with user table
      phone: null, // Would need to join with user table
      status: driver.status as 'suspended' | 'active' | 'inactive',
      isOnline: driver.status === 'online',
      lastActive: driver.lastActive || driver.lastLocationUpdate,
      profileImageUrl: driver.profileImageUrl,
      rating: 0, // Would need to calculate
      totalRides: driver._count?.rides || 0,
      totalEarnings: 0, // Would need to calculate
      vehicles: driver.vehicles,
      documents: driver.documents?.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        status: doc.verificationStatus || 'pending',
        url: '', // Not selected in query
        uploadedAt: doc.uploadedAt,
        driverId: driver.id,
      })) || [],
      verificationStatus: driver.verificationStatus,
      verifiedAt: null,
      verificationNotes: null,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    }));

    return {
      data: transformedDrivers,
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
  async getDriverById(id: number): Promise<DriverWithUserDto> {
    // Get driver details with documents
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        vehicles: {
          where: { status: 'active' },
          include: { vehicleType: true },
        },
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
        driverPaymentMethods: {
          where: { isActive: true },
        },
        workZoneAssignments: {
          include: { zone: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    // For now, we'll assume drivers are linked to users by ID
    // In a real app, you'd have a proper foreign key relationship
    const user = await this.prisma.user.findUnique({
      where: { id: driver.id }, // Assuming driver.id === user.id for now
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
        paymentStatus: 'completed',
      },
      _sum: { farePrice: true },
    });

    // Transform the data for the response
    return {
      id: driver.id,
      userId: user.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: user.email,
      phone: user.phone,
      status: driver.status as 'suspended' | 'active' | 'inactive',
      isOnline: driver.status === 'online',
      lastActive: driver.lastActive || driver.lastLocationUpdate,
      profileImageUrl: driver.profileImageUrl,
      rating: ratings._avg.ratingValue || 0,
      totalRides: await this.prisma.ride.count({ where: { driverId: id } }),
      totalEarnings: earnings._sum.farePrice?.toNumber() || 0,
      vehicles: driver.vehicles,
      documents: driver.documents?.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        status: doc.verificationStatus || 'pending',
        url: doc.documentUrl,
        uploadedAt: doc.uploadedAt,
        driverId: doc.driverId,
      })) || [],
      verificationStatus: driver.verificationStatus,
      verifiedAt: driver.verificationStatus === 'approved' ? user.createdAt : null, // Placeholder
      verificationNotes: null, // Placeholder
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
    // Get the driver
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    // Get the associated user (assuming driver.id === user.id for now)
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    const statusMap: Record<string, string> = {
      verified: 'online',
      pending: 'offline',
      rejected: 'inactive',
    };

    const driverStatus = statusMap[verificationStatus] || driver.status;
    const userActiveStatus = verificationStatus === 'verified';

    try {
      // Update driver's verification status using a transaction
      await this.prisma.$transaction([
        this.prisma.driver.update({
          where: { id },
          data: {
            verificationStatus: verificationStatus.toLowerCase(),
            status: driverStatus,
            updatedAt: new Date(),
          },
        }),
        // Update user's active status if user exists
        ...(user
          ? [
              this.prisma.user.update({
                where: { id: user.id },
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
          notes,
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
