import { Module } from '@nestjs/common';

// Controllers
import { NotificationsController } from './controllers/notifications.controller';

// Services
import { NotificationsService } from './services/notifications.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
