import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StoresModule } from '../stores/stores.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [PrismaModule, AuthModule, StoresModule, DriversModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}