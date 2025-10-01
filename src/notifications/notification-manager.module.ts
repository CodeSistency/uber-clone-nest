import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationManagerService } from './notification-manager.service';
import { NotificationsService } from './notifications.service';
import { ExpoNotificationsService } from './expo-notifications.service';
import { NotificationsModule } from './notifications.module';
import { ExpoNotificationsModule } from './expo-notifications.module';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,      // Firebase provider
    ExpoNotificationsModule,  // Expo provider
  ],
  controllers: [],
  providers: [
    NotificationManagerService,
  ],
  exports: [NotificationManagerService],
})
export class NotificationManagerModule {}




