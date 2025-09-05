import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
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

  async findUserByClerkId(clerkId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        clerkId: true,
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

  async getUserDeliveryOrders(userClerkId: string): Promise<any[]> {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { userClerkId },
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
   * Crear usuario con Clerk ID obtenido del token
   */
  async createUserWithClerk(
    clerkId: string,
    userData: { name: string; email: string }
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        clerkId,
        name: userData.name,
        email: userData.email,
      },
    });
  }

  /**
   * Actualizar el Clerk ID de un usuario existente
   */
  async linkUserWithClerk(
    userId: number,
    clerkId: string
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { clerkId },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });
  }

  /**
   * Obtener usuario actual basado en Clerk ID del token
   */
  async getCurrentUser(clerkId: string): Promise<User | null> {
    return this.findUserByClerkId(clerkId);
  }

  /**
   * Actualizar usuario actual basado en Clerk ID del token
   */
  async updateCurrentUser(
    clerkId: string,
    data: { name?: string; email?: string }
  ): Promise<User> {
    // Primero verificar que el usuario existe
    const user = await this.findUserByClerkId(clerkId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return this.prisma.user.update({
      where: { clerkId },
      data,
    });
  }

  /**
   * Verificar si un usuario existe por Clerk ID
   */
  async userExistsByClerkId(clerkId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });
    return !!user;
  }
}
