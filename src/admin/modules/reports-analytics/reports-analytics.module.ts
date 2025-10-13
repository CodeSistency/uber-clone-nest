import { Module } from '@nestjs/common';

// Controllers
import { ReportsAnalyticsController } from './controllers/reports-analytics.controller';
import { AnalyticsController } from './controllers/analytics.controller';

// Services
import { ReportsAnalyticsService } from './services/reports-analytics.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsAnalyticsController, AnalyticsController],
  providers: [ReportsAnalyticsService],
  exports: [ReportsAnalyticsService],
})
export class ReportsAnalyticsModule {}
