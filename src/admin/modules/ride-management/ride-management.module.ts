import { Module } from '@nestjs/common';
import { RideManagementController } from './controllers/ride-management.controller';
import { RideManagementService } from './services/ride-management.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [RideManagementController],
  providers: [RideManagementService, PrismaService],
  exports: [RideManagementService],
})
export class RideManagementModule {}
