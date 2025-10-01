import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { ReferralCodesService } from './services/referral-codes.service';
import { ReferralsService } from './services/referrals.service';
import { ReferralRewardsService } from './services/referral-rewards.service';
import { ReferralAnalyticsService } from './services/referral-analytics.service';
import { ReferralJobsService } from './services/referral-jobs.service';

// Controllers
import { ReferralCodesController } from './controllers/referral-codes.controller';
import { ReferralsController } from './controllers/referrals.controller';
import { ReferralRewardsController } from './controllers/referral-rewards.controller';

// External Modules
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    // NestJS Modules
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
    ScheduleModule.forRoot(), // Enable scheduled jobs

    // Internal Modules
    PrismaModule,
    ConfigModule,
    forwardRef(() => AuthModule), // Avoid circular dependency
    RedisModule,
    forwardRef(() => WalletModule), // Avoid circular dependency
  ],
  controllers: [
    ReferralCodesController,
    ReferralsController,
    ReferralRewardsController,
  ],
  providers: [
    ReferralCodesService,
    ReferralsService,
    ReferralRewardsService,
    ReferralAnalyticsService,
    ReferralJobsService,
  ],
  exports: [
    ReferralCodesService,
    ReferralsService,
    ReferralRewardsService,
    ReferralAnalyticsService,
  ],
})
export class ReferralsModule {}
