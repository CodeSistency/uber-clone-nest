import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  badge?: number;
  priority?: 'high' | 'normal';
}

export interface PushTokenData {
  token: string;
  deviceType?: string;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

      if (!serviceAccount || !projectId) {
        this.logger.warn('Firebase configuration not found. Push notifications will be disabled.');
        return;
      }

      // Initialize Firebase Admin SDK
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        projectId: projectId,
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
      this.firebaseApp = null;
    }
  }

  async sendPushNotification(
    token: string,
    payload: PushNotificationPayload,
  ): Promise<string | null> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized, skipping push notification');
      return null;
    }

    try {
      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority || 'high',
          notification: {
            sound: payload.sound || 'default',
            channelId: 'ride_updates',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || 'default',
              badge: payload.badge || 1,
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);

      // Handle specific Firebase errors
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Token ${token} is not registered, should be removed from database`);
        throw new Error('INVALID_TOKEN');
      }

      throw error;
    }
  }

  async sendMulticastNotification(
    tokens: PushTokenData[],
    payload: PushNotificationPayload,
  ): Promise<admin.messaging.BatchResponse> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    if (tokens.length === 0) {
      throw new Error('No tokens provided');
    }

    try {
      const message = {
        tokens: tokens.map(t => t.token),
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority || 'high',
          notification: {
            sound: payload.sound || 'default',
            channelId: 'ride_updates',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || 'default',
              badge: payload.badge || 1,
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
      this.logger.log(`Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send multicast notification:', error);
      throw error;
    }
  }

  async sendNotificationToUser(
    userId: string,
    tokens: PushTokenData[],
    payload: PushNotificationPayload,
  ): Promise<admin.messaging.BatchResponse | null> {
    if (!this.firebaseApp) {
      this.logger.warn(`Firebase not initialized, cannot send notification to user ${userId}`);
      return null;
    }

    if (tokens.length === 0) {
      this.logger.warn(`No tokens found for user ${userId}`);
      return null;
    }

    try {
      const response = await this.sendMulticastNotification(tokens, payload);
      this.logger.log(`Notification sent to user ${userId}: ${response.successCount}/${tokens.length} successful`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.firebaseApp) {
      return false;
    }

    try {
      // Send a test message with dry run to validate token
      await this.firebaseApp.messaging().send({
        token: token,
        notification: {
          title: 'Test',
          body: 'Test',
        },
        android: {
          priority: 'normal',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      }, true); // dryRun = true

      return true;
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      // For other errors, assume token is valid
      return true;
    }
  }
}
