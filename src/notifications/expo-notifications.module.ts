import { Module } from '@nestjs/common';
import { ExpoNotificationsService } from './expo-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../services/twilio.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ExpoNotificationsService, PrismaService, TwilioService],
  exports: [ExpoNotificationsService],
})
export class ExpoNotificationsModule {}
