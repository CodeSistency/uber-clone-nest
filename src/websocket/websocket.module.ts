import { Module } from '@nestjs/common';
import { WebSocketGatewayClass } from './websocket.gateway';
import { RealTimeService } from './real-time.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [WebSocketGatewayClass, RealTimeService],
  exports: [WebSocketGatewayClass, RealTimeService],
})
export class WebSocketModule {}
