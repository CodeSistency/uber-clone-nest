import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PreferencesController } from './preferences.controller';
import { NotificationManagerService } from './notification-manager.service';
import { ExpoNotificationsService } from './expo-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../services/firebase.service';
import { TwilioService } from '../services/twilio.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController, PreferencesController],
  providers: [
    NotificationsService,
    NotificationManagerService,
    ExpoNotificationsService,
    PrismaService,
    FirebaseService,
    TwilioService,
  ],
  exports: [
    NotificationsService,
    NotificationManagerService,
    ExpoNotificationsService,
    FirebaseService,
    TwilioService,
  ],
})
export class NotificationsModule {}
