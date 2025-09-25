import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketGatewayClass } from './websocket.gateway';
import { RealTimeService } from './real-time.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, NotificationsModule],
  providers: [WebSocketGatewayClass, RealTimeService],
  exports: [WebSocketGatewayClass, RealTimeService],
})
export class WebSocketModule {}
