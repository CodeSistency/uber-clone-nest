import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { WalletModule } from './wallet/wallet.module';
import { PromotionsModule } from './promotions/promotions.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { ChatModule } from './chat/chat.module';
import { SafetyModule } from './safety/safety.module';
import { StripeModule } from './stripe/stripe.module';
import { WebSocketModule } from './websocket/websocket.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Configuración tipada y validada
    AppConfigModule,
    PrismaModule,
    UsersModule,
    DriversModule,
    RidesModule,
    WalletModule,
    PromotionsModule,
    EmergencyContactsModule,
    ChatModule,
    SafetyModule,
    StripeModule,
    WebSocketModule,
    RedisModule,
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
