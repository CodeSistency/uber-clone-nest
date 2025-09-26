import { Module } from '@nestjs/common';

// Controllers
import { RideManagementController } from './controllers/ride-management.controller';

// Services
import { RideManagementService } from './services/ride-management.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RideManagementController],
  providers: [RideManagementService],
  exports: [RideManagementService],
})
export class RideManagementModule {}
