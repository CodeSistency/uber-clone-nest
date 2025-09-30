import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Driver,
  DriverDocument,
  Prisma,
  Vehicle,
  DriverPaymentMethod,
  DriverPayment,
  WorkZone,
  DriverVerificationHistory,
} from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { SearchDriversDto } from './dto/search-drivers.dto';
import { PaginatedDriversResponseDto } from './dto/paginated-drivers-response.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UploadVehicleDocumentDto } from './dto/upload-vehicle-document.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { VerifyDriverDto } from './dto/verify-driver.dto';
import { CreateDriverPaymentDto } from './dto/driver-payment.dto';
import { AssignWorkZoneDto } from './dto/work-zone.dto';
import {
  DriverStatisticsDto,
  DriverStatsSummaryDto,
} from './dto/driver-statistics.dto';
import { DriverProfileDto } from './dto/driver-profile.dto';

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
    const { firstName, lastName, email, phone, profileImageUrl } =
      registerDriverDto;

    return this.prisma.driver.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        profileImageUrl,
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
        vehicles: {
          where: { status: 'active' },
          include: { vehicleType: true },
        },
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
        vehicles: {
          where: { status: 'active', isDefault: true },
          include: { vehicleType: true },
        },
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
      user: { name: string; userId: number } | null;
      ratings: {
        ratingValue: number;
        comment: string | null;
        createdAt: Date;
      }[];
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
            userId: ride.user.id,
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

  /**
   * Buscar conductores con filtros dinámicos y paginación
   */
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

    // Filtros para vehículos
    if (carModel) {
      where.vehicles = {
        some: { model: { contains: carModel, mode: 'insensitive' } },
      };
    }

    if (licensePlate) {
      where.vehicles = {
        some: { licensePlate: { contains: licensePlate, mode: 'insensitive' } },
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

  // =========================================
  // VEHICLE MANAGEMENT METHODS
  // =========================================

  async createVehicle(
    driverId: number,
    createVehicleDto: CreateVehicleDto,
  ): Promise<Vehicle> {
    const { vehicleTypeId, isDefault, ...vehicleData } = createVehicleDto;

    // Verify driver exists
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // If this is the default vehicle, unset other defaults
    if (isDefault) {
      await this.prisma.vehicle.updateMany({
        where: { driverId },
        data: { isDefault: false },
      });
    }

    return this.prisma.vehicle.create({
      data: {
        driverId,
        vehicleTypeId,
        ...vehicleData,
      },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getDriverVehicles(driverId: number): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { driverId },
      include: {
        vehicleType: true,
        vehicleDocuments: true,
        rides: {
          select: {
            rideId: true,
            status: true,
            farePrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateVehicle(
    vehicleId: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const { isDefault, ...updateData } = updateVehicleDto;

    // If setting as default, unset other defaults for this driver
    if (isDefault) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { driverId: true },
      });

      if (vehicle) {
        await this.prisma.vehicle.updateMany({
          where: { driverId: vehicle.driverId, id: { not: vehicleId } },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateVehicleDto,
      include: {
        vehicleType: true,
        vehicleDocuments: true,
      },
    });
  }

  async deleteVehicle(vehicleId: number): Promise<void> {
    // Check if vehicle has active rides
    const activeRides = await this.prisma.ride.count({
      where: {
        vehicleId,
        status: { in: ['pending', 'accepted', 'arrived', 'in_progress'] },
      },
    });

    if (activeRides > 0) {
      throw new BadRequestException('Cannot delete vehicle with active rides');
    }

    await this.prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }

  async uploadVehicleDocument(
    uploadDto: UploadVehicleDocumentDto,
  ): Promise<any> {
    const { vehicleId, documentType, documentUrl } = uploadDto;

    // Verify vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    return this.prisma.vehicleDocument.create({
      data: {
        vehicleId,
        documentType,
        documentUrl,
      },
    });
  }

  // =========================================
  // PAYMENT METHODS MANAGEMENT
  // =========================================

  async createPaymentMethod(
    driverId: number,
    createDto: CreatePaymentMethodDto,
  ): Promise<DriverPaymentMethod> {
    const { isDefault, ...methodData } = createDto;

    // If this is the default method, unset other defaults
    if (isDefault) {
      await this.prisma.driverPaymentMethod.updateMany({
        where: { driverId },
        data: { isDefault: false },
      });
    }

    return this.prisma.driverPaymentMethod.create({
      data: {
        driverId,
        ...methodData,
      },
    });
  }

  async getDriverPaymentMethods(
    driverId: number,
  ): Promise<DriverPaymentMethod[]> {
    return this.prisma.driverPaymentMethod.findMany({
      where: { driverId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updatePaymentMethod(
    methodId: number,
    updateDto: Partial<CreatePaymentMethodDto>,
  ): Promise<DriverPaymentMethod> {
    const { isDefault } = updateDto;

    // If setting as default, unset other defaults for this driver
    if (isDefault) {
      const method = await this.prisma.driverPaymentMethod.findUnique({
        where: { id: methodId },
        select: { driverId: true },
      });

      if (method) {
        await this.prisma.driverPaymentMethod.updateMany({
          where: { driverId: method.driverId, id: { not: methodId } },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.driverPaymentMethod.update({
      where: { id: methodId },
      data: updateDto,
    });
  }

  async deletePaymentMethod(methodId: number): Promise<void> {
    // Check if method has pending payments
    const pendingPayments = await this.prisma.driverPayment.count({
      where: {
        paymentMethodId: methodId,
        status: 'pending',
      },
    });

    if (pendingPayments > 0) {
      throw new BadRequestException(
        'Cannot delete payment method with pending payments',
      );
    }

    await this.prisma.driverPaymentMethod.delete({
      where: { id: methodId },
    });
  }

  // =========================================
  // DRIVER PROFILE MANAGEMENT
  // =========================================

  async updateDriverProfile(
    driverId: number,
    updateDto: UpdateDriverProfileDto,
  ): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: updateDto,
      include: {
        vehicles: {
          where: { status: 'active' },
          include: { vehicleType: true },
        },
        documents: true,
        workZoneAssignments: {
          include: { zone: true },
        },
        driverPaymentMethods: true,
      },
    });
  }

  async getDriverProfile(driverId: number): Promise<DriverProfileDto> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicles: {
          where: { status: 'active' },
          include: { vehicleType: true },
        },
        documents: true,
        workZoneAssignments: {
          include: { zone: true },
        },
        driverPaymentMethods: {
          where: { isActive: true },
        },
        rides: {
          select: {
            rideId: true,
            originAddress: true,
            destinationAddress: true,
            farePrice: true,
            status: true,
            createdAt: true,
            ratings: {
              select: { ratingValue: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Calculate statistics
    const completedRides = driver.rides.filter(
      (ride) => ride.status === 'completed',
    );
    const totalEarnings = completedRides.reduce(
      (sum, ride) => sum + Number(ride.farePrice),
      0,
    );
    const ratings = driver.rides
      .flatMap((ride) => ride.ratings)
      .map((r) => Number(r.ratingValue));
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;
    const completionRate =
      driver.rides.length > 0
        ? (completedRides.length / driver.rides.length) * 100
        : 0;

    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
      city: driver.city,
      state: driver.state,
      postalCode: driver.postalCode,
      profileImageUrl: driver.profileImageUrl,
      dateOfBirth: driver.dateOfBirth?.toISOString().split('T')[0],
      gender: driver.gender,
      status: driver.status,
      verificationStatus: driver.verificationStatus,
      canDoDeliveries: driver.canDoDeliveries,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRides: driver.totalRides,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      completionRate: Math.round(completionRate * 10) / 10,
      bankAccountNumber: driver.bankAccountNumber,
      bankName: driver.bankName,
      taxId: driver.taxId,
      currentLocation:
        driver.currentLatitude && driver.currentLongitude
          ? {
              latitude: Number(driver.currentLatitude),
              longitude: Number(driver.currentLongitude),
              accuracy: Number(driver.locationAccuracy) || 0,
              lastUpdate: driver.lastLocationUpdate?.toISOString() || null,
            }
          : undefined,
      vehicles: driver.vehicles.map((vehicle) => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        isDefault: vehicle.isDefault,
        vehicleType: {
          id: vehicle.vehicleType.id,
          name: vehicle.vehicleType.name,
          displayName: vehicle.vehicleType.displayName,
        },
      })),
      workZones: driver.workZoneAssignments.map((assignment) => ({
        id: assignment.zone.id,
        name: assignment.zone.name,
        city: assignment.zone.city,
        state: assignment.zone.state,
        isPrimary: assignment.isPrimary,
        status: assignment.status,
      })),
      paymentMethods: driver.driverPaymentMethods.map((method) => ({
        id: method.id,
        methodType: method.methodType,
        accountName: method.accountName,
        bankName: method.bankName,
        isDefault: method.isDefault,
        isActive: method.isActive,
      })),
      documents: driver.documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        verificationStatus: doc.verificationStatus,
        uploadedAt: doc.uploadedAt.toISOString(),
      })),
      recentRides: driver.rides.map((ride) => ({
        id: ride.rideId,
        originAddress: ride.originAddress,
        destinationAddress: ride.destinationAddress,
        farePrice: Number(ride.farePrice),
        status: ride.status,
        createdAt: ride.createdAt.toISOString(),
        rating:
          ride.ratings.length > 0
            ? Number(ride.ratings[0].ratingValue)
            : undefined,
      })),
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
      lastLogin: driver.lastLogin?.toISOString(),
      lastActive: driver.lastActive?.toISOString(),
    };
  }

  // =========================================
  // DRIVER STATUS MANAGEMENT
  // =========================================

  async updateDriverStatus(
    driverId: number,
    statusDto: UpdateDriverStatusDto,
    adminId?: number,
  ): Promise<Driver> {
    const { status, reason, notes, suspensionEndDate } = statusDto;

    const updateData: any = {
      status,
      lastStatusChange: new Date(),
      statusChangedBy: adminId,
    };

    if (status === 'suspended') {
      updateData.suspensionReason = reason;
      updateData.suspensionEndDate = suspensionEndDate
        ? new Date(suspensionEndDate)
        : null;
    } else {
      updateData.suspensionReason = null;
      updateData.suspensionEndDate = null;
    }

    return this.prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });
  }

  // =========================================
  // DRIVER VERIFICATION MANAGEMENT
  // =========================================

  async verifyDriver(
    driverId: number,
    verifyDto: VerifyDriverDto,
    adminId: number,
  ): Promise<Driver> {
    const {
      verificationStatus,
      reason,
      notes,
      requestAdditionalDocs,
      additionalDocuments,
    } = verifyDto;

    // Get current driver
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { verificationStatus: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Create verification history record
    await this.prisma.driverVerificationHistory.create({
      data: {
        driverId,
        previousStatus: driver.verificationStatus,
        newStatus: verificationStatus,
        changeReason: reason || 'Verification status updated',
        additionalNotes: notes,
        changedBy: adminId,
      },
    });

    // Update driver verification status
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        verificationStatus,
      },
    });
  }

  // =========================================
  // WORK ZONE MANAGEMENT
  // =========================================

  async assignWorkZone(
    driverId: number,
    assignDto: AssignWorkZoneDto,
    adminId?: number,
  ): Promise<any> {
    const { zoneId, isPrimary } = assignDto;

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await this.prisma.driverWorkZone.updateMany({
        where: { driverId },
        data: { isPrimary: false },
      });
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.driverWorkZone.findUnique({
      where: {
        driverId_zoneId: {
          driverId,
          zoneId,
        },
      },
    });

    if (existingAssignment) {
      return this.prisma.driverWorkZone.update({
        where: {
          driverId_zoneId: {
            driverId,
            zoneId,
          },
        },
        data: {
          isPrimary,
          status: 'active',
        },
        include: { zone: true },
      });
    }

    return this.prisma.driverWorkZone.create({
      data: {
        driverId,
        zoneId,
        assignedBy: adminId,
        isPrimary,
      },
      include: { zone: true },
    });
  }

  async removeWorkZone(driverId: number, zoneId: number): Promise<void> {
    await this.prisma.driverWorkZone.delete({
      where: {
        driverId_zoneId: {
          driverId,
          zoneId,
        },
      },
    });
  }

  // =========================================
  // PAYMENT MANAGEMENT
  // =========================================

  async createDriverPayment(
    createDto: CreateDriverPaymentDto,
  ): Promise<DriverPayment> {
    return this.prisma.driverPayment.create({
      data: createDto,
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true },
        },
        paymentMethod: true,
      },
    });
  }

  async getDriverPayments(driverId: number, query?: any): Promise<any> {
    const {
      status,
      paymentType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query || {};

    const where: Prisma.DriverPaymentWhereInput = { driverId };

    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const offset = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.driverPayment.findMany({
        where,
        include: {
          paymentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.driverPayment.count({ where }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processDriverPayment(
    paymentId: number,
    transactionId?: string,
    notes?: string,
  ): Promise<DriverPayment> {
    return this.prisma.driverPayment.update({
      where: { id: paymentId },
      data: {
        status: 'processed',
        processedAt: new Date(),
        transactionId,
        notes,
      },
    });
  }

  // =========================================
  // STATISTICS AND METRICS
  // =========================================

  async getDriverStatistics(driverId: number): Promise<DriverStatisticsDto> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        rides: {
          select: {
            rideId: true,
            farePrice: true,
            status: true,
            createdAt: true,
            ratings: { select: { ratingValue: true } },
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const completedRides = driver.rides.filter(
      (ride) => ride.status === 'completed',
    );
    const totalEarnings = completedRides.reduce(
      (sum, ride) => sum + Number(ride.farePrice),
      0,
    );
    const cancelledRides = driver.rides.filter(
      (ride) => ride.status === 'cancelled',
    );

    const ratings = driver.rides
      .flatMap((ride) => ride.ratings)
      .map((r) => Number(r.ratingValue));
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    const completionRate =
      driver.rides.length > 0
        ? (completedRides.length / driver.rides.length) * 100
        : 0;

    // Calculate weekly earnings (simplified)
    const weeklyEarnings = this.calculateWeeklyEarnings(completedRides);

    // Calculate monthly earnings (simplified)
    const monthlyEarnings = this.calculateMonthlyEarnings(completedRides);

    // Rating distribution
    const ratingDistribution = this.calculateRatingDistribution(ratings);

    // Peak hours (simplified)
    const peakHours = this.calculatePeakHours(driver.rides);

    // Active days (simplified)
    const activeDays = this.calculateActiveDays(driver.rides);

    return {
      driverId,
      totalRides: driver.rides.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      totalDistance: 0, // Would need to calculate from ride data
      totalHours: 0, // Would need to calculate from ride data
      averageEarningsPerHour: 0, // Would need total hours
      cancelledRides: cancelledRides.length,
      weeklyEarnings,
      monthlyEarnings,
      ratingDistribution,
      peakHours,
      activeDays,
    };
  }

  async getDriversStatsSummary(): Promise<DriverStatsSummaryDto> {
    const [
      totalActiveDrivers,
      totalRidesToday,
      totalEarningsToday,
      onlineDrivers,
      pendingVerification,
      averageRating,
    ] = await Promise.all([
      this.prisma.driver.count({ where: { status: 'active' } }),
      this.prisma.ride.count({
        where: {
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.ride.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { farePrice: true },
      }),
      this.prisma.driver.count({ where: { status: 'online' } }),
      this.prisma.driver.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.rating.aggregate({
        _avg: { ratingValue: true },
      }),
    ]);

    return {
      totalActiveDrivers,
      totalRidesToday,
      totalEarningsToday: Number(totalEarningsToday._sum.farePrice) || 0,
      averageDriverRating:
        Math.round((Number(averageRating._avg.ratingValue) || 0) * 10) / 10,
      onlineDrivers,
      pendingVerification,
    };
  }

  // =========================================
  // BULK OPERATIONS
  // =========================================

  async bulkVerifyDrivers(
    driverIds: string[],
    verificationStatus: string,
    reason?: string,
    adminId?: number,
  ): Promise<any> {
    const drivers = await this.prisma.driver.findMany({
      where: { id: { in: driverIds.map((id) => Number(id)) } },
      select: { id: true, verificationStatus: true },
    });

    // Create verification history records
    const historyRecords = drivers.map((driver) => ({
      driverId: driver.id,
      previousStatus: driver.verificationStatus,
      newStatus: verificationStatus,
      changeReason: reason || 'Bulk verification',
      changedBy: adminId ?? 1, // Default admin ID if not provided
    }));

    await this.prisma.driverVerificationHistory.createMany({
      data: historyRecords,
    });

    // Update drivers
    await this.prisma.driver.updateMany({
      where: { id: { in: driverIds.map((id) => Number(id)) } },
      data: { verificationStatus },
    });

    return { updated: drivers.length };
  }

  async bulkUpdateStatus(
    driverIds: string[],
    status: string,
    reason?: string,
    adminId?: number,
  ): Promise<any> {
    const updateData: any = {
      status,
      lastStatusChange: new Date(),
      statusChangedBy: adminId,
    };

    if (status === 'suspended') {
      updateData.suspensionReason = reason;
    }

    await this.prisma.driver.updateMany({
      where: { id: { in: driverIds.map((id) => Number(id)) } },
      data: updateData,
    });

    return { updated: driverIds.length };
  }

  // =========================================
  // HELPER METHODS
  // =========================================

  private calculateWeeklyEarnings(rides: any[]): any[] {
    const weeklyData = new Map<string, { earnings: number; rides: number }>();

    rides.forEach((ride) => {
      const date = new Date(ride.createdAt);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() - date.getDay() + 1) / 7)}`;

      const current = weeklyData.get(weekKey) || { earnings: 0, rides: 0 };
      weeklyData.set(weekKey, {
        earnings: current.earnings + Number(ride.farePrice),
        rides: current.rides + 1,
      });
    });

    return Array.from(weeklyData.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 12); // Last 12 weeks
  }

  private calculateMonthlyEarnings(rides: any[]): any[] {
    const monthlyData = new Map<string, { earnings: number; rides: number }>();

    rides.forEach((ride) => {
      const date = new Date(ride.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = monthlyData.get(monthKey) || { earnings: 0, rides: 0 };
      monthlyData.set(monthKey, {
        earnings: current.earnings + Number(ride.farePrice),
        rides: current.rides + 1,
      });
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months
  }

  private calculateRatingDistribution(
    ratings: number[],
  ): Record<number, number> {
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratings.forEach((rating) => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded]++;
      }
    });
    return distribution;
  }

  private calculatePeakHours(rides: any[]): string[] {
    const hourCounts = new Array(24).fill(0);

    rides.forEach((ride) => {
      const hour = new Date(ride.createdAt).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const peakHours: string[] = [];

    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] >= maxCount * 0.8) {
        // Hours with 80% of max activity
        peakHours.push(
          `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`,
        );
      }
    }

    return peakHours.slice(0, 3); // Top 3 peak hours
  }

  private calculateActiveDays(rides: any[]): string[] {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayCounts = new Array(7).fill(0);

    rides.forEach((ride) => {
      const day = new Date(ride.createdAt).getDay();
      dayCounts[day]++;
    });

    const maxCount = Math.max(...dayCounts);
    const activeDays: string[] = [];

    for (let i = 0; i < 7; i++) {
      if (dayCounts[i] >= maxCount * 0.7) {
        // Days with 70% of max activity
        activeDays.push(dayNames[i]);
      }
    }

    return activeDays.slice(0, 3); // Top 3 active days
  }
}
