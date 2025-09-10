import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { WebSocketModule } from '../../websocket/websocket.module';
import { RidesModule } from '../rides.module';
import { OrdersModule } from '../../orders/orders.module';
import { StripeModule } from '../../stripe/stripe.module';
import { PaymentsModule } from '../../payments/payments.module';
import { RidesFlowService } from './rides-flow.service';
import { TransportClientController } from './transport.client.controller';
import { TransportDriverController } from './transport.driver.controller';
import { DeliveryClientController } from './delivery.client.controller';
import { DeliveryDriverController } from './delivery.driver.controller';
import { ErrandClientController } from './errand.client.controller';
import { ErrandDriverController } from './errand.driver.controller';
import { ParcelClientController } from './parcel.client.controller';
import { ParcelDriverController } from './parcel.driver.controller';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { DriverAvailabilityController } from './driver.availability.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    WebSocketModule,
    RidesModule,
    OrdersModule,
    StripeModule,
    PaymentsModule,
  ],
  controllers: [
    TransportClientController,
    TransportDriverController,
    DeliveryClientController,
    DeliveryDriverController,
    ErrandClientController,
    ErrandDriverController,
    ParcelClientController,
    ParcelDriverController,
    DriverAvailabilityController,
  ],
  providers: [RidesFlowService, IdempotencyService],
})
export class RidesFlowModule {}


