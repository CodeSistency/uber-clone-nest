import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // Ensure required fields have defaults
    const userData = {
      ...data,
      preferredLanguage: data.preferredLanguage || 'es',
      timezone: data.timezone || 'America/Caracas',
      currency: data.currency || 'USD',
    };

    return this.prisma.user.create({
      data: userData,
    });
  }

  async findUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      userType: user.userType || 'user',
      adminRole: user.adminRole || null,
      adminPermissions: user.adminPermissions || [],
      lastAdminLogin: user.lastAdminLogin || null,
      adminCreatedAt: user.adminCreatedAt || null,
      adminUpdatedAt: user.adminUpdatedAt || null,
    };
  }

  async findUserByIdWithRelations(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });
  }

  async findUserByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userType: true,
        adminRole: true,
        adminPermissions: true,
        lastAdminLogin: true,
        adminCreatedAt: true,
        adminUpdatedAt: true,
        wallet: true,
        emergencyContacts: true,
        rides: true,
        deliveryOrders: true,
        ratings: true,
        sentMessages: true,
        receivedRatings: true,
        notificationPreferences: true,
        pushTokens: true,
        notifications: true,
        adminAuditLogs: true,
      },
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserRides(userId: number): Promise<any[]> {
    const rides = await this.prisma.ride.findMany({
      where: { userId },
      include: {
        driver: true,
        tier: true,
        ratings: true,
        messages: true,
      },
    });
    return rides;
  }

  async getUserDeliveryOrders(userId: number): Promise<any[]> {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { userId },
      include: {
        store: true,
        courier: true,
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
   * Obtener usuario actual basado en ID del token JWT
   */
  async getCurrentUser(userId: number): Promise<User | null> {
    return this.findUserByIdWithRelations(userId);
  }

  /**
   * Actualizar usuario actual basado en ID del token JWT
   */
  async updateCurrentUser(
    userId: number,
    data: any
  ): Promise<User> {
    // Convertir campos de fecha si existen
    const updateData = { ...data };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Verificar si un usuario existe por ID
   */
  async userExistsById(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return !!user;
  }
}
