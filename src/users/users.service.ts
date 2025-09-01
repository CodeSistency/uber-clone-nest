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
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });
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

  async getUserRides(userId: string): Promise<any[]> {
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
}
