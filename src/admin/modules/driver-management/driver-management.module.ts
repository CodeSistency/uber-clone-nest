import { Module } from '@nestjs/common';

// Controllers
import { DriverManagementController } from './controllers/driver-management.controller';

// Services
import { DriverManagementService } from './services/driver-management.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverManagementController],
  providers: [DriverManagementService],
  exports: [DriverManagementService],
})
export class DriverManagementModule {}
