import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to clean database (useful for testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      // Clean database in proper order to respect foreign key constraints
      await (this as any).chatMessage?.deleteMany();
      await (this as any).rating?.deleteMany();
      await (this as any).emergencyContact?.deleteMany();
      await (this as any).orderItem?.deleteMany();
      await (this as any).deliveryOrder?.deleteMany();
      await (this as any).ride?.deleteMany();
      await (this as any).driverDocument?.deleteMany();
      await (this as any).driver?.deleteMany();
      await (this as any).product?.deleteMany();
      await (this as any).store?.deleteMany();
      await (this as any).walletTransaction?.deleteMany();
      await (this as any).wallet?.deleteMany();
      await (this as any).notification?.deleteMany();
      await (this as any).pushToken?.deleteMany();
      await (this as any).notificationPreferences?.deleteMany();
      await (this as any).promotion?.deleteMany();
      await (this as any).rideTier?.deleteMany();
      await (this as any).user?.deleteMany();
    }
  }
}
