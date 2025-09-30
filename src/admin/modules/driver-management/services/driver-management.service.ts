import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface DriverFilters {
  status?: string[];
  verificationStatus?: string[];
  canDoDeliveries?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minRating?: number;
  maxRating?: number;
  minRides?: number;
  maxRides?: number;
  minEarnings?: number;
  maxEarnings?: number;
  search?: string; // nombre, email, teléfono
  zoneId?: number;
}

export interface DriverListResponse {
  drivers: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DriverDetails {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  profileImageUrl?: string;
  status: string;
  verificationStatus: string;
  canDoDeliveries: boolean;
  averageRating?: number;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalEarnings: number;
  completionRate: number;
  lastActive?: Date;
  createdAt: Date;

  // Relations
  address?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  documents: any[];
  vehicles: any[];
  currentWorkZone?: any;
  paymentMethods: any[];
  recentRides: any[];
  performanceStats: {
    todayRides: number;
    weekRides: number;
    monthRides: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    averageResponseTime?: number;
    customerSatisfaction?: number;
  };
}

@Injectable()
export class DriverManagementService {
  private readonly logger = new Logger(DriverManagementService.name);

  constructor(private prisma: PrismaService) {}

  async getDriversWithFilters(
    filters: DriverFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<DriverListResponse> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      where.verificationStatus = { in: filters.verificationStatus };
    }

    if (filters.canDoDeliveries !== undefined) {
      where.canDoDeliveries = filters.canDoDeliveries;
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

    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      where.averageRating = {};
      if (filters.minRating !== undefined) {
        where.averageRating.gte = filters.minRating;
      }
      if (filters.maxRating !== undefined) {
        where.averageRating.lte = filters.maxRating;
      }
    }

    if (filters.minRides !== undefined || filters.maxRides !== undefined) {
      where.totalRides = {};
      if (filters.minRides !== undefined) {
        where.totalRides.gte = filters.minRides;
      }
      if (filters.maxRides !== undefined) {
        where.totalRides.lte = filters.maxRides;
      }
    }

    if (
      filters.minEarnings !== undefined ||
      filters.maxEarnings !== undefined
    ) {
      where.totalEarnings = {};
      if (filters.minEarnings !== undefined) {
        where.totalEarnings.gte = filters.minEarnings;
      }
      if (filters.maxEarnings !== undefined) {
        where.totalEarnings.lte = filters.maxEarnings;
      }
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters.zoneId) {
      where.driverWorkZones = {
        some: {
          zoneId: filters.zoneId,
          status: 'active',
        },
      };
    }

    // Get total count
    const total = await this.prisma.driver.count({ where });

    // Get drivers with relations
    const drivers = await this.prisma.driver.findMany({
      where,
      include: {
        workZoneAssignments: {
          where: { status: 'active' },
          include: { zone: true },
          take: 1,
        },
        vehicles: {
          where: { status: 'active' },
          include: {
            vehicleType: true,
          },
          orderBy: {
            isDefault: 'desc', // Default vehicle first
          },
        },
        _count: {
          select: {
            rides: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get additional stats for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const rideStats = await this.getDriverRideStats(driver.id);
        const earningsStats = await this.getDriverEarningsStats(driver.id);

        return {
          ...driver,
          totalRides: driver._count.rides,
          completedRides: rideStats.completed,
          cancelledRides: rideStats.cancelled,
          totalEarnings: earningsStats.total,
          completionRate:
            rideStats.total > 0
              ? (rideStats.completed / rideStats.total) * 100
              : 0,
          currentWorkZone: driver.workZoneAssignments?.[0]?.zone || null,
          vehicles: driver.vehicles.map(vehicle => ({
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            licensePlate: vehicle.licensePlate,
            status: vehicle.status,
            verificationStatus: vehicle.verificationStatus,
            isDefault: vehicle.isDefault,
            vehicleType: vehicle.vehicleType,
            seatingCapacity: vehicle.seatingCapacity,
            fuelType: vehicle.fuelType,
          })),
          _count: undefined, // Remove the _count field
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      drivers: driversWithStats,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getDriverDetails(driverId: number): Promise<DriverDetails> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        workZoneAssignments: {
          where: { status: 'active' },
          include: { zone: true },
        },
        vehicles: {
          where: { status: 'active' },
          include: {
            vehicleType: true,
            vehicleDocuments: {
              where: { verificationStatus: 'verified' },
            },
          },
          orderBy: {
            isDefault: 'desc', // Default vehicle first
          },
        },
        driverPaymentMethods: {
          where: { isActive: true },
        },
        rides: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            ratings: {
              where: { ratedByUserId: { not: driverId } },
            },
          },
        },
        driverPayments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const rideStats = await this.getDriverRideStats(driverId);
    const earningsStats = await this.getDriverEarningsStats(driverId);
    const performanceStats = await this.getDriverPerformanceStats(driverId);

    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email || undefined,
      phone: driver.phone || undefined,
      dateOfBirth: driver.dateOfBirth || undefined,
      gender: driver.gender || undefined,
      profileImageUrl: driver.profileImageUrl || undefined,
      status: driver.status,
      verificationStatus: driver.verificationStatus,
      canDoDeliveries: driver.canDoDeliveries,
      averageRating: driver.averageRating
        ? Number(driver.averageRating)
        : undefined,
      totalRides: rideStats.total,
      completedRides: rideStats.completed,
      cancelledRides: rideStats.cancelled,
      totalEarnings: Number(earningsStats.total),
      completionRate:
        rideStats.total > 0 ? (rideStats.completed / rideStats.total) * 100 : 0,
      lastActive: driver.lastActive || undefined,
      createdAt: driver.createdAt,
      address: {
        address: driver.address || undefined,
        city: driver.city || undefined,
        state: driver.state || undefined,
        postalCode: driver.postalCode || undefined,
      },
      documents: [], // Driver documents not directly related in schema
      vehicles: (driver as any).vehicles.map((vehicle: any) => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        seatingCapacity: vehicle.seatingCapacity,
        fuelType: vehicle.fuelType,
        hasAC: vehicle.hasAC,
        hasGPS: vehicle.hasGPS,
        status: vehicle.status,
        verificationStatus: vehicle.verificationStatus,
        isDefault: vehicle.isDefault,
        vehicleType: vehicle.vehicleType,
        insuranceProvider: vehicle.insuranceProvider,
        insurancePolicyNumber: vehicle.insurancePolicyNumber,
        insuranceExpiryDate: vehicle.insuranceExpiryDate,
        frontImageUrl: vehicle.frontImageUrl,
        sideImageUrl: vehicle.sideImageUrl,
        backImageUrl: vehicle.backImageUrl,
        interiorImageUrl: vehicle.interiorImageUrl,
        documents: vehicle.vehicleDocuments,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      })),
      currentWorkZone: (driver as any).workZoneAssignments?.[0]?.zone || undefined,
      paymentMethods: (driver as any).driverPaymentMethods || [],
      recentRides: ((driver as any).rides || []).map((ride: any) => ({
        ...ride,
        driverRating: ride.ratings.find((r) => r.ratedByUserId)?.ratingValue,
        ratings: undefined,
      })),
      performanceStats,
    };
  }

  async updateDriverStatus(
    driverId: number,
    status: string,
    adminId: number,
    reason?: string,
    suspensionEndDate?: Date,
  ): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const updateData: any = {
      status,
      statusChangedBy: adminId,
      lastStatusChange: new Date(),
    };

    if (status === 'suspended' && suspensionEndDate) {
      updateData.suspensionEndDate = suspensionEndDate;
      updateData.suspensionReason = reason;
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'driver_status_update',
      `driver_${driverId}`,
      `Updated driver ${driverId} status from ${driver.status} to ${status}. Reason: ${reason || 'No reason provided'}`,
      { driverId, oldStatus: driver.status },
      {
        driverId,
        newStatus: status,
        reason,
        suspensionEndDate,
      },
    );

    this.logger.log(
      `Admin ${adminId} updated driver ${driverId} status to ${status}`,
    );

    return updatedDriver;
  }

  async updateDriverVerification(
    driverId: number,
    verificationStatus: string,
    adminId: number,
    notes?: string,
  ): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        verificationStatus,
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'driver_verification_update',
      `driver_${driverId}`,
      `Updated driver ${driverId} verification status from ${driver.verificationStatus} to ${verificationStatus}`,
      { driverId, oldVerificationStatus: driver.verificationStatus },
      {
        driverId,
        newVerificationStatus: verificationStatus,
        notes,
      },
    );

    this.logger.log(
      `Admin ${adminId} updated driver ${driverId} verification to ${verificationStatus}`,
    );

    return updatedDriver;
  }

  async updateDriverWorkZones(
    driverId: number,
    zoneIds: number[],
    adminId: number,
    primaryZoneId?: number,
  ): Promise<any> {
    // Remove existing work zones
    await this.prisma.driverWorkZone.deleteMany({
      where: { driverId },
    });

    // Add new work zones
    const workZones = zoneIds.map((zoneId, index) => ({
      driverId,
      zoneId,
      assignedBy: adminId,
      isPrimary: zoneId === primaryZoneId,
      status: 'active' as const,
    }));

    const createdWorkZones = await this.prisma.driverWorkZone.createMany({
      data: workZones,
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'driver_work_zones_update',
      `driver_${driverId}`,
      `Updated work zones for driver ${driverId}: ${zoneIds.join(', ')}`,
      { driverId },
      {
        driverId,
        zoneIds,
        primaryZoneId,
      },
    );

    this.logger.log(
      `Admin ${adminId} updated work zones for driver ${driverId}`,
    );

    return createdWorkZones;
  }

  async bulkUpdateDriverStatus(
    driverIds: number[],
    status: string,
    adminId: number,
    reason?: string,
  ): Promise<any> {
    const updateData: any = {
      status,
      statusChangedBy: adminId,
      lastStatusChange: new Date(),
    };

    if (status === 'suspended') {
      updateData.suspensionReason = reason;
    }

    const result = await this.prisma.driver.updateMany({
      where: {
        id: { in: driverIds },
      },
      data: updateData,
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'drivers_bulk_status_update',
      'bulk_operation',
      `Bulk updated ${result.count} drivers to status ${status}. Reason: ${reason || 'No reason provided'}`,
      { driverIds, newStatus: status },
      {
        driverIds,
        newStatus: status,
        affectedCount: result.count,
        reason,
      },
    );

    this.logger.log(
      `Admin ${adminId} bulk updated ${result.count} drivers to status ${status}`,
    );

    return result;
  }

  private async getDriverRideStats(driverId: number) {
    const rides = await this.prisma.ride.findMany({
      where: { driverId },
      select: { status: true },
    });

    const completed = rides.filter((r) => r.status === 'completed').length;
    const cancelled = rides.filter((r) => r.status === 'cancelled').length;
    const total = rides.length;

    return { total, completed, cancelled };
  }

  private async getDriverEarningsStats(driverId: number) {
    const result = await this.prisma.driverPayment.aggregate({
      where: {
        driverId,
        status: 'processed',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      total: result._sum.amount || 0,
    };
  }

  private async getDriverPerformanceStats(driverId: number) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, weekStats, monthStats] = await Promise.all([
      this.getDriverStatsForPeriod(driverId, today, now),
      this.getDriverStatsForPeriod(driverId, weekStart, now),
      this.getDriverStatsForPeriod(driverId, monthStart, now),
    ]);

    return {
      todayRides: todayStats.rides,
      weekRides: weekStats.rides,
      monthRides: monthStats.rides,
      todayEarnings: todayStats.earnings,
      weekEarnings: weekStats.earnings,
      monthEarnings: monthStats.earnings,
      averageResponseTime: undefined, // Would need additional tracking
      customerSatisfaction: undefined, // Would need ratings analysis
    };
  }

  private async getDriverStatsForPeriod(
    driverId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const rides = await this.prisma.ride.findMany({
      where: {
        driverId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      select: {
        farePrice: true,
      },
    });

    const totalEarnings = rides.reduce(
      (sum, ride) => sum + Number(ride.farePrice),
      0,
    );

    return {
      rides: rides.length,
      earnings: totalEarnings,
    };
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
          ipAddress: 'system',
          userAgent: 'admin-panel',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log admin action:', error);
    }
  }
}
