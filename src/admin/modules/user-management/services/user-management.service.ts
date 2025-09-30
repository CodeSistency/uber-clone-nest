import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface UserFilters {
  status?: string[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  hasWallet?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minRides?: number;
  maxRides?: number;
  search?: string; // nombre, email, teléfono
}

export interface UserListResponse {
  users: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  preferredLanguage?: string;
  timezone?: string;
  currency?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Stats
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  averageRating?: number;

  // Relations
  wallet?: {
    balance: number;
    totalTransactions: number;
  };
  emergencyContacts: any[];
  recentRides: any[];
}

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private prisma: PrismaService) {}

  async getUsersWithFilters(
    filters: UserFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserListResponse> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status) {
      if (filters.status.includes('active')) {
        where.isActive = true;
      }
      if (filters.status.includes('inactive')) {
        where.isActive = false;
      }
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.phoneVerified !== undefined) {
      where.phoneVerified = filters.phoneVerified;
    }

    if (filters.identityVerified !== undefined) {
      where.identityVerified = filters.identityVerified;
    }

    if (filters.hasWallet !== undefined) {
      where.wallet = filters.hasWallet ? { isNot: null } : { is: null };
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

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users with relations and stats
    const users = await this.prisma.user.findMany({
      where,
      include: {
        wallet: {
          select: {
            balance: true,
            _count: {
              select: { walletTransactions: true },
            },
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

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const rideStats = await this.getUserRideStats(user.id);
        const ratingStats = await this.getUserRatingStats(user.id);

        return {
          ...user,
          wallet: user.wallet
            ? {
                balance: Number(user.wallet.balance),
                totalTransactions: user.wallet._count.walletTransactions,
              }
            : null,
          totalRides: user._count.rides,
          completedRides: rideStats.completed,
          cancelledRides: rideStats.cancelled,
          averageRating: ratingStats.averageRating,
          _count: undefined, // Remove the _count field
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      users: usersWithStats,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getUserDetails(userId: number): Promise<UserDetails> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          include: {
            walletTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 10, // Last 10 transactions
            },
            _count: {
              select: { walletTransactions: true },
            },
          },
        },
        emergencyContacts: true,
        rides: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 rides
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            ratings: {
              where: { ratedByUserId: userId },
              select: { ratingValue: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const rideStats = await this.getUserRideStats(userId);
    const ratingStats = await this.getUserRatingStats(userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      gender: user.gender || undefined,
      profileImage: user.profileImage || undefined,
      address: user.address || undefined,
      city: user.city || undefined,
      state: user.state || undefined,
      country: user.country || undefined,
      postalCode: user.postalCode || undefined,
      preferredLanguage: user.preferredLanguage || 'en',
      timezone: user.timezone || 'UTC',
      currency: user.currency || 'USD',
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      identityVerified: user.identityVerified,
      lastLogin: user.lastLogin || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalRides: rideStats.total,
      completedRides: rideStats.completed,
      cancelledRides: rideStats.cancelled,
      averageRating: ratingStats.averageRating,
      wallet: user.wallet
        ? {
            balance: Number(user.wallet.balance),
            totalTransactions: user.wallet._count?.walletTransactions || 0,
          }
        : undefined,
      emergencyContacts: user.emergencyContacts,
      recentRides: user.rides.map((ride) => ({
        ...ride,
        userRating: ride.ratings[0]?.ratingValue,
        ratings: undefined,
      })),
    };
  }

  async updateUserStatus(
    userId: number,
    isActive: boolean,
    adminId: number,
    reason?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      isActive ? 'user_activate' : 'user_deactivate',
      `user_${userId}`,
      `${isActive ? 'Activated' : 'Deactivated'} user ${userId}. Reason: ${reason || 'No reason provided'}`,
      { userId, previousStatus: user.isActive },
      {
        userId,
        newStatus: isActive,
        reason,
      },
    );

    this.logger.log(
      `Admin ${adminId} ${isActive ? 'activated' : 'deactivated'} user ${userId}`,
    );

    return updatedUser;
  }

  async adjustWalletBalance(
    userId: number,
    amount: number,
    adminId: number,
    reason: string,
    description?: string,
  ): Promise<any> {
    // Get or create wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    // Create transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        transactionType: amount > 0 ? 'credit' : 'debit',
        description: description || `Admin adjustment: ${reason}`,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount,
        },
      },
      include: {
        _count: {
          select: { walletTransactions: true },
        },
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'wallet_adjust',
      `user_${userId}`,
      `Adjusted wallet balance for user ${userId} by ${amount}. Reason: ${reason}`,
      { userId, amount, reason },
      {
        userId,
        amount,
        reason,
        transactionId: transaction.id,
      },
    );

    this.logger.log(
      `Admin ${adminId} adjusted wallet balance for user ${userId} by ${amount}`,
    );

    return {
      wallet: {
        balance: Number(updatedWallet.balance),
        totalTransactions: updatedWallet._count.walletTransactions,
      },
      transaction,
    };
  }

  async addEmergencyContact(
    userId: number,
    contactName: string,
    contactPhone: string,
    adminId: number,
  ): Promise<any> {
    const contact = await this.prisma.emergencyContact.create({
      data: {
        userId,
        contactName,
        contactPhone,
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'emergency_contact_add',
      `user_${userId}`,
      `Added emergency contact for user ${userId}: ${contactName}`,
      { userId, contactName, contactPhone },
      {
        userId,
        contactId: contact.id,
        contactName,
        contactPhone,
      },
    );

    this.logger.log(
      `Admin ${adminId} added emergency contact for user ${userId}`,
    );

    return contact;
  }

  async removeEmergencyContact(
    contactId: number,
    adminId: number,
  ): Promise<void> {
    const contact = await this.prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(
        `Emergency contact with ID ${contactId} not found`,
      );
    }

    await this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'emergency_contact_remove',
      `user_${contact.userId}`,
      `Removed emergency contact ${contactId} for user ${contact.userId}`,
      { contactId, userId: contact.userId },
      { contactId, userId: contact.userId },
    );

    this.logger.log(
      `Admin ${adminId} removed emergency contact ${contactId} for user ${contact.userId}`,
    );
  }

  async bulkUpdateUserStatus(
    userIds: number[],
    isActive: boolean,
    adminId: number,
    reason?: string,
  ): Promise<any> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'users_bulk_status_update',
      'bulk_operation',
      `Bulk ${isActive ? 'activated' : 'deactivated'} ${result.count} users. Reason: ${reason || 'No reason provided'}`,
      { userIds, newStatus: isActive },
      {
        userIds,
        newStatus: isActive,
        affectedCount: result.count,
        reason,
      },
    );

    this.logger.log(
      `Admin ${adminId} bulk ${isActive ? 'activated' : 'deactivated'} ${result.count} users`,
    );

    return result;
  }

  async deleteUser(
    userId: number,
    adminId: number,
    reason?: string,
  ): Promise<void> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get related data counts for logging
    const relatedData = await this.getUserRelatedDataCounts(userId);

    // Delete user - this will cascade delete related records based on Prisma schema
    await this.prisma.user.delete({
      where: { id: userId },
    });

    // Log the action
    await this.logAdminAction(
      adminId,
      'user_delete',
      `user_${userId}`,
      `Deleted user ${userId} (${user.email}). Reason: ${reason || 'No reason provided'}`,
      {
        userId,
        userEmail: user.email,
        userName: user.name,
        wasActive: user.isActive,
        relatedData,
      },
      {
        userId,
        userEmail: user.email,
        userName: user.name,
        reason,
        relatedData,
      },
    );

    this.logger.log(
      `Admin ${adminId} deleted user ${userId} (${user.email})`,
    );
  }

  private async getUserRideStats(userId: number) {
    const rides = await this.prisma.ride.findMany({
      where: { userId },
      select: { status: true },
    });

    const completed = rides.filter((r) => r.status === 'completed').length;
    const cancelled = rides.filter((r) => r.status === 'cancelled').length;
    const total = rides.length;

    return { total, completed, cancelled };
  }

  private async getUserRatingStats(userId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: {
        ratedUserId: userId,
        ratedByUserId: { not: userId }, // Exclude self-ratings
      },
      select: { ratingValue: true },
    });

    if (ratings.length === 0) {
      return { averageRating: undefined };
    }

    const averageRating =
      ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length;

    return { averageRating: Math.round(averageRating * 10) / 10 };
  }

  private async getUserRelatedDataCounts(userId: number) {
    const [rideCount, walletTransactionsCount, emergencyContactsCount, ratingsCount] = await Promise.all([
      this.prisma.ride.count({ where: { userId } }),
      this.prisma.walletTransaction.count({
        where: { wallet: { userId } }
      }),
      this.prisma.emergencyContact.count({ where: { userId } }),
      this.prisma.rating.count({
        where: {
          OR: [
            { ratedUserId: userId },
            { ratedByUserId: userId },
          ],
        },
      }),
    ]);

    return {
      rides: rideCount,
      walletTransactions: walletTransactionsCount,
      emergencyContacts: emergencyContactsCount,
      ratings: ratingsCount,
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
