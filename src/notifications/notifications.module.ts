import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PreferencesController } from './preferences.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../services/firebase.service';
import { TwilioService } from '../services/twilio.service';

@Module({
  imports: [],
  controllers: [NotificationsController, PreferencesController],
  providers: [
    NotificationsService,
    PrismaService,
    FirebaseService,
    TwilioService,
  ],
  exports: [NotificationsService, FirebaseService, TwilioService],
})
export class NotificationsModule {}
