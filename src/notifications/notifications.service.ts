import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FirebaseService,
  PushNotificationPayload,
} from '../services/firebase.service';
import { TwilioService, SMSMessage } from '../services/twilio.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from './interfaces/notification.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private twilioService: TwilioService,
  ) {}

  async sendNotification(
    payload: NotificationPayload,
  ): Promise<NotificationDeliveryResult[]> {
    const { userId, type, title, message, data, channels, priority } = payload;

    // Get user preferences and device tokens
    const [preferences, pushTokens] = await Promise.all([
      this.getUserNotificationPreferences(userId),
      this.getUserPushTokens(userId),
    ]);

    // Determine which channels to use
    const channelsToUse = channels || this.determineChannels(type, preferences);

    const deliveryResults: NotificationDeliveryResult[] = [];

    // Send push notifications
    if (
      channelsToUse.includes(NotificationChannel.PUSH) &&
      pushTokens.length > 0
    ) {
      try {
        const pushPayload: PushNotificationPayload = {
          title,
          body: message,
          data: data || {},
          sound: this.getNotificationSound(type),
          badge: 1,
          priority: priority === 'critical' ? 'high' : 'normal',
        };

        const pushResult = await this.firebaseService.sendNotificationToUser(
          userId,
          pushTokens,
          pushPayload,
        );

        deliveryResults.push({
          success: pushResult !== null,
          channel: NotificationChannel.PUSH,
          messageId: pushResult ? 'batch_sent' : undefined,
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.error(
          `Push notification failed for user ${userId}:`,
          error,
        );
        deliveryResults.push({
          success: false,
          channel: NotificationChannel.PUSH,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    // Send SMS notifications
    if (
      channelsToUse.includes(NotificationChannel.SMS) &&
      preferences?.smsEnabled
    ) {
      try {
        const smsMessage: SMSMessage = {
          to: this.getUserPhoneNumber(),
          body: this.twilioService.getSMSTemplate(type, data),
        };

        const smsResult = await this.twilioService.sendSMS(smsMessage);

        deliveryResults.push({
          success: smsResult !== null,
          channel: NotificationChannel.SMS,
          messageId: smsResult?.sid,
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.error(`SMS notification failed for user ${userId}:`, error);
        deliveryResults.push({
          success: false,
          channel: NotificationChannel.SMS,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    // Store notification in database
    try {
      await this.saveNotificationHistory({
        userId,
        type,
        title,
        message,
        data,
        pushSent: deliveryResults.some(
          (r) => r.channel === NotificationChannel.PUSH && r.success,
        ),
        smsSent: deliveryResults.some(
          (r) => r.channel === NotificationChannel.SMS && r.success,
        ),
        pushSentAt: deliveryResults.find(
          (r) => r.channel === NotificationChannel.PUSH && r.success,
        )?.timestamp,
        smsSentAt: deliveryResults.find(
          (r) => r.channel === NotificationChannel.SMS && r.success,
        )?.timestamp,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save notification history for user ${userId}:`,
        error,
      );
    }

    return deliveryResults;
  }

  async sendBulkNotifications(
    payloads: NotificationPayload[],
  ): Promise<NotificationDeliveryResult[][]> {
    const results = await Promise.all(
      payloads.map((payload) => this.sendNotification(payload)),
    );

    this.logger.log(`Bulk notifications completed: ${payloads.length} sent`);
    return results;
  }

  async notifyNearbyDrivers(
    rideId: number,
    pickupLocation: { lat: number; lng: number },
  ): Promise<void> {
    try {
      // Find nearby drivers (within 5km)
      const nearbyDrivers = await this.prisma.driver.findMany({
        where: {
          status: 'online',
          canDoDeliveries: false, // For now, only non-delivery drivers
        },
        take: 10, // Limit to 10 nearby drivers
      });

      if (nearbyDrivers.length === 0) {
        this.logger.warn('No nearby drivers found for ride notification');
        return;
      }

      // Send notifications to nearby drivers
      // Note: In this system, drivers share IDs with users (driver.id === user.id)
      const notifications: NotificationPayload[] = nearbyDrivers.map(
        (driver) => ({
          userId: driver.id.toString(), // Use driver ID as user ID (they share the same ID in this system)
          type: NotificationType.RIDE_REQUEST,
          title: 'New Ride Request',
          message: 'A new ride is available in your area',
          data: {
            rideId,
            pickupLocation,
          },
          channels: [NotificationChannel.PUSH],
          priority: 'high',
        }),
      );

      await this.sendBulkNotifications(notifications);
      this.logger.log(
        `Notified ${nearbyDrivers.length} drivers about ride ${rideId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify nearby drivers for ride ${rideId}:`,
        error,
      );
      throw error;
    }
  }

  async notifyRideStatusUpdate(
    rideId: number,
    userId: string,
    driverId: number | null,
    status: string,
    additionalData?: Record<string, any>,
  ): Promise<void> {
    const notificationType = this.getNotificationTypeForRideStatus(status);
    if (!notificationType) return;

    const payload: NotificationPayload = {
      userId,
      type: notificationType,
      title: this.getNotificationTitleForRideStatus(status),
      message: this.getNotificationMessageForRideStatus(status, additionalData),
      data: {
        rideId,
        driverId,
        status,
        ...additionalData,
      },
      channels: [NotificationChannel.PUSH, NotificationChannel.WEBSOCKET],
      priority: status === 'emergency' ? 'critical' : 'high',
    };

    await this.sendNotification(payload);
  }

  async registerPushToken(
    userId: string,
    token: string,
    deviceType?: string,
    deviceId?: string,
  ): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await this.prisma.pushToken.findFirst({
        where: {
          token,
          userId: parseInt(userId),
        },
      });

      if (existingToken) {
        // Update existing token
        await this.prisma.pushToken.update({
          where: { id: existingToken.id },
          data: {
            deviceType,
            deviceId,
            isActive: true,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new token
        await this.prisma.pushToken.create({
          data: {
            userId: parseInt(userId),
            token,
            deviceType,
            deviceId,
            isActive: true,
          },
        });
      }

      this.logger.log(`Push token registered for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to register push token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async unregisterPushToken(userId: string, token: string): Promise<void> {
    try {
      await this.prisma.pushToken.updateMany({
        where: {
          userId: parseInt(userId),
          token,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Push token unregistered for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to unregister push token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<{
      pushEnabled: boolean;
      smsEnabled: boolean;
      emailEnabled: boolean;
      rideUpdates: boolean;
      driverMessages: boolean;
      promotional: boolean;
      emergencyAlerts: boolean;
    }>,
  ): Promise<void> {
    try {
      await this.prisma.notificationPreferences.upsert({
        where: { userId: parseInt(userId) },
        update: {
          ...preferences,
          updatedAt: new Date(),
        },
        create: {
          userId: parseInt(userId),
          ...preferences,
        },
      });

      this.logger.log(`Notification preferences updated for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update notification preferences for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    try {
      return await this.prisma.notification.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get notification history for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async markNotificationAsRead(
    notificationId: number,
    userId: string,
  ): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: parseInt(userId),
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${notificationId} as read:`,
        error,
      );
      throw error;
    }
  }

  private async getUserNotificationPreferences(userId: string) {
    try {
      const parsedUserId = parseInt(userId);

      // Validate that userId is a valid number
      if (isNaN(parsedUserId)) {
        this.logger.error(
          `Invalid userId for notification preferences: ${userId}`,
        );
        return null;
      }

      const preferences = await this.prisma.notificationPreferences.findUnique({
        where: { userId: parsedUserId },
      });

      return (
        preferences || {
          pushEnabled: true,
          smsEnabled: false,
          emailEnabled: false,
          rideUpdates: true,
          driverMessages: true,
          promotional: false,
          emergencyAlerts: true,
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get notification preferences for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  private async getUserPushTokens(userId: string) {
    try {
      const parsedUserId = parseInt(userId);

      // Validate that userId is a valid number
      if (isNaN(parsedUserId)) {
        this.logger.error(`Invalid userId for push tokens: ${userId}`);
        return [];
      }

      const tokens = await this.prisma.pushToken.findMany({
        where: {
          userId: parsedUserId,
          isActive: true,
        },
        select: {
          token: true,
          deviceType: true,
          deviceId: true,
        },
      });

      return tokens.map((token) => ({
        token: token.token,
        deviceType: token.deviceType || undefined,
        deviceId: token.deviceId || undefined,
        isActive: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to get push tokens for user ${userId}:`, error);
      return [];
    }
  }

  private getUserPhoneNumber(): string {
    // This would typically come from user profile
    // For now, return a placeholder
    return '+1234567890';
  }

  private determineChannels(
    type: NotificationType,
    preferences: any,
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Always try push first if available
    if (preferences?.pushEnabled) {
      channels.push(NotificationChannel.PUSH);
    }

    // Use SMS for critical notifications
    if (
      (type === NotificationType.EMERGENCY_TRIGGERED ||
        type === NotificationType.PAYMENT_FAILED) &&
      preferences?.smsEnabled
    ) {
      channels.push(NotificationChannel.SMS);
    }

    // Default to push if no preferences
    if (channels.length === 0) {
      channels.push(NotificationChannel.PUSH);
    }

    return channels;
  }

  private getNotificationSound(type: NotificationType): string {
    switch (type) {
      case NotificationType.EMERGENCY_TRIGGERED:
        return 'emergency.wav';
      case NotificationType.RIDE_REQUEST:
        return 'ride_request.wav';
      case NotificationType.DRIVER_REPORT_TRAFFIC:
      case NotificationType.DRIVER_REPORT_BREAKDOWN:
      case NotificationType.DRIVER_REPORT_ACCIDENT:
        return 'alert.wav';
      case NotificationType.DRIVER_CANCEL_RIDE:
        return 'cancel.wav';
      case NotificationType.RIDE_REFUND_PROCESSED:
        return 'refund.wav';
      default:
        return 'default';
    }
  }

  private getNotificationTypeForRideStatus(
    status: string,
  ): NotificationType | null {
    switch (status) {
      case 'accepted':
        return NotificationType.RIDE_ACCEPTED;
      case 'arrived':
        return NotificationType.DRIVER_ARRIVED;
      case 'in_progress':
        return NotificationType.RIDE_STARTED;
      case 'completed':
        return NotificationType.RIDE_COMPLETED;
      case 'cancelled':
        return NotificationType.RIDE_CANCELLED;
      case 'emergency':
        return NotificationType.EMERGENCY_TRIGGERED;
      default:
        return null;
    }
  }

  private getNotificationTitleForRideStatus(status: string): string {
    switch (status) {
      case 'accepted':
        return 'Ride Accepted! 🎉';
      case 'arrived':
        return 'Driver Arrived 🚗';
      case 'in_progress':
        return 'Ride Started 🚀';
      case 'completed':
        return 'Ride Completed ✅';
      case 'cancelled':
        return 'Ride Cancelled ❌';
      case 'emergency':
        return 'Emergency Alert 🚨';
      default:
        return 'Ride Update';
    }
  }

  private getNotificationMessageForRideStatus(
    status: string,
    data?: Record<string, any>,
  ): string {
    switch (status) {
      case 'accepted':
        return `Your driver ${data?.driverName || ''} is on the way!`;
      case 'arrived':
        return 'Your driver has arrived. Please meet them outside.';
      case 'in_progress':
        return 'Your ride has started. Enjoy your trip!';
      case 'completed':
        return `Ride completed! Total fare: $${data?.fare || 'TBD'}`;
      case 'cancelled':
        return 'Your ride has been cancelled.';
      case 'emergency':
        return 'Emergency alert triggered. Help is on the way.';
      default:
        return 'Your ride status has been updated.';
    }
  }

  private async saveNotificationHistory(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    pushSent?: boolean;
    smsSent?: boolean;
    pushSentAt?: Date;
    smsSentAt?: Date;
  }): Promise<void> {
    try {
      const userId = parseInt(data.userId);

      // Validate that userId is a valid number
      if (isNaN(userId)) {
        this.logger.error(
          `Invalid userId for notification history: ${data.userId}`,
        );
        throw new Error(`Invalid userId: ${data.userId}`);
      }

      await this.prisma.notification.create({
        data: {
          userId: userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          pushSent: data.pushSent || false,
          smsSent: data.smsSent || false,
          pushSentAt: data.pushSentAt,
          smsSentAt: data.smsSentAt,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save notification history:', error);
      throw error;
    }
  }
}
