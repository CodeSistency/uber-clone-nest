import { Module, forwardRef } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationManagerModule } from '../notifications/notification-manager.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { RedisModule } from '../redis/redis.module';
import { GeographicPricingService } from './services/geographic-pricing.service';
import { PromotionService } from './services/promotion.service';
import { PricingCacheService } from './services/pricing-cache.service';

@Module({
  imports: [
    PrismaModule,
    NotificationManagerModule,
    RedisModule,
    forwardRef(() => ReferralsModule), // Avoid circular dependency
  ],
  controllers: [RidesController],
  providers: [
    RidesService,
    GeographicPricingService,
    PromotionService,
    PricingCacheService,
  ],
  exports: [RidesService],
})
export class RidesModule {}
