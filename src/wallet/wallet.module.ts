import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './admin/wallet-admin.controller';
import { WalletValidationService } from './services/wallet-validation.service';
import { WalletAuditService } from './services/wallet-audit.service';
import { WalletNotificationService } from './services/wallet-notification.service';
import { WalletMonitoringService } from './services/wallet-monitoring.service';
import { WalletRateLimitService } from './services/wallet-rate-limit.service';
import { WalletRateLimitGuard } from './guards/wallet-rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ScheduleModule.forRoot()],
  controllers: [WalletController, WalletAdminController],
  providers: [
    WalletService,
    WalletValidationService,
    WalletAuditService,
    WalletNotificationService,
    WalletMonitoringService,
    WalletRateLimitService,
    WalletRateLimitGuard,
  ],
  exports: [
    WalletService,
    WalletValidationService,
    WalletAuditService,
    WalletNotificationService,
    WalletMonitoringService,
    WalletRateLimitService,
    WalletRateLimitGuard,
  ],
})
export class WalletModule {}
