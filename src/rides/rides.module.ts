import { Module, forwardRef } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationManagerModule } from '../notifications/notification-manager.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    PrismaModule,
    NotificationManagerModule,
    forwardRef(() => ReferralsModule), // Avoid circular dependency
  ],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
