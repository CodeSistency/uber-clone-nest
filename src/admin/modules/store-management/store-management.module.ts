import { Module } from '@nestjs/common';
import { StoreManagementController } from './controllers/store-management.controller';
import { StoreManagementService } from './services/store-management.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [StoreManagementController],
  providers: [StoreManagementService, PrismaService],
  exports: [StoreManagementService],
})
export class StoreManagementModule {}
