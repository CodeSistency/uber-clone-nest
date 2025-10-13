import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService, SMSMessage } from '../services/twilio.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPayload,
  NotificationDeliveryResult,
} from './interfaces/notification.interface';
import {
  Expo,
  ExpoPushMessage,
  ExpoPushToken,
  ExpoPushTicket,
} from 'expo-server-sdk';

@Injectable()
export class ExpoNotificationsService {
  private readonly logger = new Logger(ExpoNotificationsService.name);
  private expo: Expo;

  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
  ) {
    this.expo = new Expo();
  }

  async sendNotification(
    payload: NotificationPayload,
  ): Promise<NotificationDeliveryResult[]> {
    const { userId, type, title, message, data, channels, priority } = payload;

    // Get user preferences and device tokens
    const [preferences, pushTokens] = await Promise.all([
      this.getUserNotificationPreferences(userId),
      this.getUserExpoTokens(userId),
    ]);

    // Determine which channels to use
    const channelsToUse = channels || this.determineChannels(type, preferences);

    const deliveryResults: NotificationDeliveryResult[] = [];

    // Send push notifications via Expo
    if (
      channelsToUse.includes(NotificationChannel.PUSH) &&
      pushTokens.length > 0
    ) {
      try {
        const pushResult = await this.sendExpoPushNotifications(
          pushTokens,
          payload,
        );
        deliveryResults.push({
          success: pushResult.some((ticket) => ticket.status === 'ok'),
          channel: NotificationChannel.PUSH,
          messageId: pushResult
            .filter((ticket) => ticket.status === 'ok')
            .map((ticket) => ticket.id)
            .join(','),
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
      this.logger.log(`🔍 Buscando drivers online para ride ${rideId}...`);
      this.logger.log(
        `📍 Ubicación pickup: ${pickupLocation.lat}, ${pickupLocation.lng}`,
      );

      // Find nearby drivers (within 5km)
      const nearbyDrivers = await this.prisma.driver.findMany({
        where: {
          status: 'ONLINE' as any,
          canDoDeliveries: false, // For now, only non-delivery drivers
          verificationStatus: 'APPROVED' as any,
        },
        include: {
          vehicles: {
            where: { isDefault: true, status: 'ACTIVE' },
            take: 1,
            include: { vehicleType: true },
          },
        },
        take: 10, // Limit to 10 nearby drivers
      });

      this.logger.log(`👥 Drivers encontrados: ${nearbyDrivers.length}`);

      if (nearbyDrivers.length === 0) {
        this.logger.warn('❌ No nearby drivers found for ride notification');
        return;
      }

      // Log details of found drivers
      nearbyDrivers.forEach((driver, index) => {
        this.logger.log(
          `  ${index + 1}. Driver ${driver.id}: ${driver.firstName} ${driver.lastName} (Sin tipo)`,
        );
      });

      // Send notifications to nearby drivers
      const notifications: NotificationPayload[] = nearbyDrivers.map(
        (driver) => ({
          userId: driver.id.toString(),
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
        `📢 Notificaciones enviadas a ${nearbyDrivers.length} drivers sobre ride ${rideId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al notificar drivers cercanos para ride ${rideId}:`,
        error,
      );
      throw error;
    }
  }

  async findAndAssignNearbyDriver(
    rideId: number,
    pickupLocation: { lat: number; lng: number },
  ): Promise<{
    assigned: boolean;
    driverId?: number;
    availableDrivers: number;
    notifiedDrivers: number;
  }> {
    try {
      this.logger.log(`🎯 Iniciando matching automático para ride ${rideId}`);
      this.logger.log(
        `📍 Ubicación pickup: ${pickupLocation.lat}, ${pickupLocation.lng}`,
      );

      // 1. Buscar drivers online disponibles
      const availableDrivers = await this.prisma.driver.findMany({
        where: {
          status: 'ONLINE' as any,
          canDoDeliveries: false,
          verificationStatus: 'APPROVED' as any,
        },
        include: {
          vehicles: {
            where: { isDefault: true, status: 'ACTIVE' },
            take: 1,
            include: { vehicleType: true },
          },
        },
        take: 20, // Buscar más drivers para tener mejores opciones
      });

      this.logger.log(
        `👥 Drivers online encontrados: ${availableDrivers.length}`,
      );

      if (availableDrivers.length === 0) {
        this.logger.warn(
          `⚠️ No hay drivers online disponibles para ride ${rideId}`,
        );
        return {
          assigned: false,
          availableDrivers: 0,
          notifiedDrivers: 0,
        };
      }

      // 2. Calcular distancias simuladas (por ahora, distancia aleatoria entre 0-5km)
      const driversWithDistance = availableDrivers.map((driver) => {
        // Simular distancia (en producción usaríamos cálculo real con coordenadas GPS)
        const simulatedDistance = Math.random() * 5; // 0-5km
        return {
          ...driver,
          distance: simulatedDistance,
        };
      });

      // 3. Ordenar por distancia (más cercano primero)
      driversWithDistance.sort((a, b) => a.distance - b.distance);

      this.logger.log(`📊 Drivers ordenados por distancia:`);
      driversWithDistance.slice(0, 5).forEach((driver, index) => {
        this.logger.log(
          `  ${index + 1}. Driver ${driver.id}: ${driver.firstName} ${driver.lastName} - ${driver.distance.toFixed(2)}km`,
        );
      });

      // 4. Intentar asignar el driver más cercano
      const selectedDriver = driversWithDistance[0];
      this.logger.log(
        `🎯 Intentando asignar driver ${selectedDriver.id} (${selectedDriver.distance.toFixed(2)}km)`,
      );

      try {
        // Asignar driver usando el método existente de confirmación
        await this.confirmDriverForRide(rideId, selectedDriver.id);

        this.logger.log(
          `✅ Driver ${selectedDriver.id} asignado exitosamente a ride ${rideId}`,
        );

        // 5. Notificar al driver asignado
        const notification: NotificationPayload = {
          userId: selectedDriver.id.toString(),
          type: NotificationType.RIDE_REQUEST,
          title: 'Ride Assigned - Respond Now!',
          message:
            'You have been automatically assigned to a ride. Check your pending requests.',
          data: {
            rideId,
            pickupLocation,
            autoAssigned: true,
          },
          channels: [NotificationChannel.PUSH],
          priority: 'critical',
        };

        await this.sendNotification(notification);
        this.logger.log(
          `📱 Notificación enviada al driver ${selectedDriver.id}`,
        );

        return {
          assigned: true,
          driverId: selectedDriver.id,
          availableDrivers: availableDrivers.length,
          notifiedDrivers: 1,
        };
      } catch (assignmentError) {
        this.logger.error(
          `❌ Error asignando driver ${selectedDriver.id} a ride ${rideId}:`,
          assignmentError,
        );

        // Si falla la asignación automática, enviar notificaciones a todos los drivers cercanos
        this.logger.log(
          `🔄 Fallback: Enviando notificaciones push a ${Math.min(driversWithDistance.length, 5)} drivers`,
        );
        await this.notifyNearbyDrivers(rideId, pickupLocation);

        return {
          assigned: false,
          availableDrivers: availableDrivers.length,
          notifiedDrivers: Math.min(driversWithDistance.length, 5),
        };
      }
    } catch (error) {
      this.logger.error(
        `❌ Error en findAndAssignNearbyDriver para ride ${rideId}:`,
        error,
      );
      throw error;
    }
  }

  async confirmDriverForRide(rideId: number, driverId: number): Promise<void> {
    try {
      this.logger.log(`🔄 Confirmando driver ${driverId} para ride ${rideId}`);

      // Buscar el ride
      const ride = await this.prisma.ride.findUnique({
        where: { rideId },
        include: { user: true },
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.driverId) {
        throw new Error('RIDE_ALREADY_HAS_DRIVER');
      }

      // Verificar que el driver esté disponible
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver || driver.status !== 'ONLINE') {
        throw new Error('DRIVER_NOT_AVAILABLE');
      }

      // Asignar driver y cambiar status
      await this.prisma.ride.update({
        where: { rideId },
        data: {
          driverId: driverId,
          status: 'DRIVER_CONFIRMED',
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Driver ${driverId} confirmado para ride ${rideId} (status: driver_confirmed)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error confirmando driver ${driverId} para ride ${rideId}:`,
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

  // Helper methods
  private async sendExpoPushNotifications(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<ExpoPushTicket[]> {
    // Filter out invalid tokens
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      return [];
    }

    // Create Expo push messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.message,
      data: payload.data || {},
      sound: this.getNotificationSound(payload.type),
      priority: payload.priority === 'critical' ? 'high' : 'default',
      ttl: 86400, // 24 hours
      expiration: Math.floor(Date.now() / 1000) + 86400,
    }));

    // Send in chunks (Expo recommends max 100 messages per request)
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // Handle tickets for delivery tracking
        await this.handleExpoTickets(ticketChunk);
      } catch (error) {
        this.logger.error('Error sending Expo push notifications:', error);
      }
    }

    return tickets;
  }

  private async handleExpoTickets(tickets: ExpoPushTicket[]): Promise<void> {
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        this.logger.error('Expo push error:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Token is invalid/expired, should be removed from database
          // Note: Expo doesn't provide the token in error receipts
          // We would need to track this differently in a production system
          this.logger.warn('Device not registered for push notifications');
        }
      }
    }
  }

  private async removeInvalidToken(token: string): Promise<void> {
    if (!token) return;

    try {
      await this.prisma.pushToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
      this.logger.warn(`Removed invalid Expo token: ${token}`);
    } catch (error) {
      this.logger.error(`Failed to remove invalid token ${token}:`, error);
    }
  }

  private async getUserNotificationPreferences(userId: string) {
    try {
      const parsedUserId = parseInt(userId);

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

  private async getUserExpoTokens(userId: string): Promise<string[]> {
    try {
      const parsedUserId = parseInt(userId);

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
        },
      });

      return tokens.map((t) => t.token);
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
