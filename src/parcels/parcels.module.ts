import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, NotificationsModule, WebSocketModule],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
