import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationManagerModule } from '../notifications/notification-manager.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { BanksModule } from '../banks/banks.module';

@Module({
  imports: [PrismaModule, NotificationManagerModule, BanksModule, WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
