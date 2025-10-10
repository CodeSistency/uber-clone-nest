import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { WalletModule } from './wallet/wallet.module';
import { PromotionsModule } from './promotions/promotions.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { ChatModule } from './chat/chat.module';
import { SafetyModule } from './safety/safety.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentsModule } from './payments/payments.module';
import { WebSocketModule } from './websocket/websocket.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StoresModule } from './stores/stores.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { RidesFlowModule } from './rides/flow/rides-flow.module';
import { ErrandsModule } from './errands/errands.module';
import { ParcelsModule } from './parcels/parcels.module';
import { CartModule } from './cart/cart.module';
import { LocationsModule } from './locations/locations.module';
import { TestingModule } from './testing/testing.module';
import { ReferralsModule } from './referrals/referrals.module';
import { CommonModule } from './common/common.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { StorageModule } from './storage/storage.module';


@Module({
  imports: [
    // Configuración tipada y validada
    AppConfigModule,
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    DriversModule,
    RidesModule,
    WalletModule,
    PromotionsModule,
    EmergencyContactsModule,
    ChatModule,
    SafetyModule,
    StripeModule,
    PaymentsModule,
    WebSocketModule,
    RedisModule,
    RealtimeModule,
    NotificationsModule,
    // Marketplace & Delivery modules
    StoresModule,
    OrdersModule,
    AnalyticsModule,
    // Admin System
    AdminModule,
    // Flow orchestrator
    RidesFlowModule,
    // New services modules
    ErrandsModule,
    ParcelsModule,
    CartModule,
    LocationsModule,
    TestingModule,
    ReferralsModule,
    ExchangeRatesModule,
    // Storage module
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
