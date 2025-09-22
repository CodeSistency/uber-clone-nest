import { Module } from '@nestjs/common';
import { DriverManagementController } from './controllers/driver-management.controller';
import { DriverManagementService } from './services/driver-management.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [DriverManagementController],
  providers: [DriverManagementService, PrismaService],
  exports: [DriverManagementService],
})
export class DriverManagementModule {}
