import { Module } from '@nestjs/common';

// Controllers
import { RideTiersController } from './controllers/ride-tiers.controller';
import { TemporalPricingController } from './controllers/temporal-pricing.controller';

// Services
import { RideTiersService } from './services/ride-tiers.service';
import { TemporalPricingService } from './services/temporal-pricing.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RideTiersController, TemporalPricingController],
  providers: [RideTiersService, TemporalPricingService],
  exports: [RideTiersService, TemporalPricingService],
})
export class PricingModule {}
