import { Module } from '@nestjs/common';

// Controllers
import { DashboardController } from '../../controllers/dashboard.controller';

// Services
import { DashboardService } from '../../services/dashboard.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
