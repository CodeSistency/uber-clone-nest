import { Module } from '@nestjs/common';
import { ErrandsService } from './errands.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationManagerModule } from '../notifications/notification-manager.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, NotificationManagerModule, WebSocketModule],
  providers: [ErrandsService],
  exports: [ErrandsService],
})
export class ErrandsModule {}
