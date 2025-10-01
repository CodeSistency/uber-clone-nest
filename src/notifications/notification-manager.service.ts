import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INotificationProvider } from './notification-provider.interface';
import { NotificationsService } from './notifications.service';
import { ExpoNotificationsService } from './expo-notifications.service';
import { NotificationPayload, NotificationDeliveryResult } from './interfaces/notification.interface';

export type NotificationProviderType = 'firebase' | 'expo';

@Injectable()
export class NotificationManagerService implements INotificationProvider, OnModuleInit {
  private readonly logger = new Logger(NotificationManagerService.name);
  private currentProvider: INotificationProvider;
  private providerType: NotificationProviderType;

  constructor(
    private configService: ConfigService,
    private firebaseService: NotificationsService,
    private expoService: ExpoNotificationsService,
  ) {}

  onModuleInit() {
    // Determine which provider to use based on configuration
    this.providerType = (this.configService.get<string>('NOTIFICATION_PROVIDER') as NotificationProviderType) || 'firebase';

    // Set the current provider
    this.setProvider(this.providerType);

    this.logger.log(`🔔 Notification Manager initialized with provider: ${this.providerType}`);
  }

  private setProvider(providerType: NotificationProviderType): void {
    switch (providerType) {
      case 'expo':
        this.currentProvider = this.expoService;
        this.logger.log('📱 Using Expo Notifications Service');
        break;
      case 'firebase':
      default:
        this.currentProvider = this.firebaseService;
        this.logger.log('🔥 Using Firebase Notifications Service');
        break;
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationDeliveryResult[]> {
    try {
      return await this.currentProvider.sendNotification(payload);
    } catch (error) {
      this.logger.error(`Error sending notification via ${this.providerType}:`, error);
      throw error;
    }
  }

  async sendBulkNotifications(payloads: NotificationPayload[]): Promise<NotificationDeliveryResult[][]> {
    try {
      return await this.currentProvider.sendBulkNotifications(payloads);
    } catch (error) {
      this.logger.error(`Error sending bulk notifications via ${this.providerType}:`, error);
      throw error;
    }
  }

  async notifyNearbyDrivers(
    rideId: number,
    pickupLocation: { lat: number; lng: number },
  ): Promise<void> {
    try {
      await this.currentProvider.notifyNearbyDrivers(rideId, pickupLocation);
    } catch (error) {
      this.logger.error(`Error notifying nearby drivers via ${this.providerType}:`, error);
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
      return await this.currentProvider.findAndAssignNearbyDriver(rideId, pickupLocation);
    } catch (error) {
      this.logger.error(`Error in findAndAssignNearbyDriver via ${this.providerType}:`, error);
      throw error;
    }
  }

  async confirmDriverForRide(rideId: number, driverId: number): Promise<void> {
    try {
      await this.currentProvider.confirmDriverForRide(rideId, driverId);
    } catch (error) {
      this.logger.error(`Error confirming driver for ride via ${this.providerType}:`, error);
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
    try {
      await this.currentProvider.notifyRideStatusUpdate(rideId, userId, driverId, status, additionalData);
    } catch (error) {
      this.logger.error(`Error notifying ride status update via ${this.providerType}:`, error);
      throw error;
    }
  }

  // Additional methods for provider management
  getCurrentProviderType(): NotificationProviderType {
    return this.providerType;
  }

  switchProvider(providerType: NotificationProviderType): void {
    if (this.providerType !== providerType) {
      this.logger.log(`🔄 Switching notification provider from ${this.providerType} to ${providerType}`);
      this.providerType = providerType;
      this.setProvider(providerType);
    }
  }

  getProviderStatus(): {
    currentProvider: NotificationProviderType;
    availableProviders: NotificationProviderType[];
  } {
    return {
      currentProvider: this.providerType,
      availableProviders: ['firebase', 'expo'],
    };
  }

  /**
   * Notify user when they earn referral rewards
   */
  async notifyReferralRewardEarned(
    userId: number,
    data: { refereeName: string; amount: number; tier: string }
  ): Promise<NotificationDeliveryResult[]> {
    const payload: NotificationPayload = {
      userId: userId.toString(),
      type: 'referral_reward_earned',
      title: '¡Recompensa de referido ganada! 🎉',
      message: `${data.refereeName} completó su primer viaje. Ganaste $${data.amount.toFixed(2)} en tu tier ${data.tier}!`,
      data: {
        type: 'referral_reward',
        refereeName: data.refereeName,
        amount: data.amount,
        tier: data.tier,
      },
      channels: ['push', 'email'],
    };

    try {
      const results = await this.sendNotification(payload);
      this.logger.log(`Sent referral reward notification to user ${userId}`);
      return results;
    } catch (error) {
      this.logger.error(`Error sending referral reward notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notify user when they receive referral bonus
   */
  async notifyReferralBonusReceived(
    userId: number,
    data: { referrerName: string; amount: number }
  ): Promise<NotificationDeliveryResult[]> {
    const payload: NotificationPayload = {
      userId: userId.toString(),
      type: 'referral_bonus_received',
      title: '¡Bonificación de referido! 🎁',
      message: `${data.referrerName} te invitó y ganaste $${data.amount.toFixed(2)} de bonificación en tu primer viaje!`,
      data: {
        type: 'referral_bonus',
        referrerName: data.referrerName,
        amount: data.amount,
      },
      channels: ['push', 'email'],
    };

    try {
      const results = await this.sendNotification(payload);
      this.logger.log(`Sent referral bonus notification to user ${userId}`);
      return results;
    } catch (error) {
      this.logger.error(`Error sending referral bonus notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notify user when they achieve a new referral tier
   */
  async notifyReferralTierUpgrade(
    userId: number,
    data: { newTier: string; totalReferrals: number; benefits: string[] }
  ): Promise<NotificationDeliveryResult[]> {
    const payload: NotificationPayload = {
      userId: userId.toString(),
      type: 'referral_tier_upgrade',
      title: `¡Ascendiste al tier ${data.newTier}! 🚀`,
      message: `Felicitaciones! Con ${data.totalReferrals} referidos convertidos, ahora eres parte del tier ${data.newTier}. ${data.benefits.join(', ')}`,
      data: {
        type: 'tier_upgrade',
        newTier: data.newTier,
        totalReferrals: data.totalReferrals,
        benefits: data.benefits,
      },
      channels: ['push', 'email'],
    };

    try {
      const results = await this.sendNotification(payload);
      this.logger.log(`Sent tier upgrade notification to user ${userId}`);
      return results;
    } catch (error) {
      this.logger.error(`Error sending tier upgrade notification to user ${userId}:`, error);
      throw error;
    }
  }
}


