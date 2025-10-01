import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationManagerModule } from '../notifications/notification-manager.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, NotificationManagerModule, WebSocketModule],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
