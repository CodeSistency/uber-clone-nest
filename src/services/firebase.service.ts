import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../config/config.service';
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

  constructor(
    private configService: ConfigService,
    private appConfigService: AppConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (!this.appConfigService.firebase) {
        this.logger.warn(
          'Firebase configuration not found. Push notifications will be disabled.',
        );
        return;
      }

      const firebaseConfig = this.appConfigService.firebase;
      const projectId = firebaseConfig.projectId;
      const serviceAccount = firebaseConfig.serviceAccount;

      if (!projectId || !serviceAccount) {
        this.logger.warn(
          'Firebase configuration incomplete. Push notifications will be disabled.',
        );
        return;
      }

      let serviceAccountJson;
      try {
        // Try to parse service account (it might be a JSON string or already an object)
        serviceAccountJson =
          typeof serviceAccount === 'string'
            ? JSON.parse(serviceAccount)
            : serviceAccount;

        // Validate required service account fields
        if (
          !serviceAccountJson.private_key ||
          !serviceAccountJson.client_email
        ) {
          throw new Error(
            'Service account is missing required fields (private_key or client_email)',
          );
        }

        // Fix common PEM formatting issues
        if (serviceAccountJson.private_key) {
          // Remove any extra quotes and fix line breaks
          let privateKey = serviceAccountJson.private_key;

          // If it's double-quoted, remove the quotes
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
          }

          // Fix escaped newlines
          privateKey = privateKey.replace(/\\n/g, '\n');

          // Ensure it starts with BEGIN PRIVATE KEY
          if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            this.logger.warn('Private key does not appear to be in PEM format');
          }

          // Ensure it ends with END PRIVATE KEY
          if (!privateKey.includes('-----END PRIVATE KEY-----')) {
            this.logger.warn('Private key does not appear to be properly closed');
          }

          serviceAccountJson.private_key = privateKey;
        }

      } catch (error) {
        this.logger.error('Failed to parse Firebase service account:', error);
        this.logger.warn('Firebase push notifications will be disabled. Check your FIREBASE_SERVICE_ACCOUNT environment variable.');
        return;
      }

      try {
        // Initialize Firebase Admin SDK
        const firebaseAppConfig: admin.AppOptions = {
          credential: admin.credential.cert(
            serviceAccountJson as admin.ServiceAccount,
          ),
          projectId: projectId,
        };

        // Add optional properties if available
        if (firebaseConfig.storageBucket) {
          firebaseAppConfig.storageBucket = firebaseConfig.storageBucket;
        }

        this.firebaseApp = admin.initializeApp(firebaseAppConfig);
        this.logger.log('✅ Firebase Admin SDK initialized successfully');
        this.logger.log(`📱 Push notifications enabled for project: ${projectId}`);
      } catch (error: any) {
        this.logger.error('❌ Failed to initialize Firebase Admin SDK:', error.message || error);

        // Provide specific guidance based on error type
        if (error.message?.includes('Invalid PEM formatted message')) {
          this.logger.error('💡 This usually means the private_key in your Firebase service account is malformed.');
          this.logger.error('💡 Check that your FIREBASE_SERVICE_ACCOUNT environment variable contains valid JSON with a properly formatted private_key field.');
        } else if (error.message?.includes('Project')) {
          this.logger.error('💡 Check that your FIREBASE_PROJECT_ID matches the project ID in your service account.');
        }

        this.firebaseApp = null;
        this.logger.warn('⚠️ Firebase push notifications will be disabled until configuration is fixed.');
      }
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
      this.logger.debug(
        'Firebase not initialized, push notifications are disabled',
      );
      return null;
    }

    if (!token) {
      this.logger.warn('Cannot send push notification: missing token');
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
        this.logger.warn(
          `Token ${token} is not registered, should be removed from database`,
        );
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
        tokens: tokens.map((t) => t.token),
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

      const response = await this.firebaseApp
        .messaging()
        .sendEachForMulticast(message);
      this.logger.log(
        `Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`,
      );
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
      this.logger.warn(
        `Firebase not initialized, cannot send notification to user ${userId}`,
      );
      return null;
    }

    if (tokens.length === 0) {
      this.logger.warn(`No tokens found for user ${userId}`);
      return null;
    }

    try {
      const response = await this.sendMulticastNotification(tokens, payload);
      this.logger.log(
        `Notification sent to user ${userId}: ${response.successCount}/${tokens.length} successful`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}:`,
        error,
      );
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
      await this.firebaseApp.messaging().send(
        {
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
        },
        true,
      ); // dryRun = true

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
