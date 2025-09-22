import { Module } from '@nestjs/common';
import { ErrandsService } from './errands.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [ErrandsService],
  exports: [ErrandsService],
})
export class ErrandsModule {}
