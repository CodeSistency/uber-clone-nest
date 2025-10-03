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
import { AsyncMatchingService } from './services/async-matching.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule,
    NotificationManagerModule,
    RedisModule,
    WebsocketModule,
    CommonModule,
    forwardRef(() => ReferralsModule), // Avoid circular dependency
  ],
  controllers: [RidesController],
  providers: [
    RidesService,
    GeographicPricingService,
    PromotionService,
    PricingCacheService,
    AsyncMatchingService,
  ],
  exports: [RidesService],
})
export class RidesModule {}
