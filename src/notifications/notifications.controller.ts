import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AppConfigService } from '../config/config.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import {
  NotificationType,
  NotificationChannel,
} from './interfaces/notification.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a notification',
    description:
      'Send a notification to a specific user through configured channels (push, SMS, WebSocket)',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification data to send',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          channel: { type: 'string', example: 'push' },
          messageId: { type: 'string', example: 'msg_123456' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid notification data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
    const payload = {
      userId: createNotificationDto.userId,
      type: createNotificationDto.type,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      data: createNotificationDto.data,
      channels: createNotificationDto.channels,
      priority: createNotificationDto.priority,
    };

    return await this.notificationsService.sendNotification(payload);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register push notification token',
    description:
      'Register a device token for Firebase Cloud Messaging push notifications',
  })
  @ApiBody({
    type: RegisterPushTokenDto,
    description: 'Push token registration data',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to register token for',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 201,
    description: 'Push token registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Push token registered successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid token data',
  })
  async registerPushToken(
    @Body() registerPushTokenDto: RegisterPushTokenDto,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.registerPushToken(
      userId,
      registerPushTokenDto.token,
      registerPushTokenDto.deviceType,
      registerPushTokenDto.deviceId,
    );
    return { message: 'Push token registered successfully' };
  }

  @Delete('push-token/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unregister push notification token',
    description: 'Unregister a device token from push notifications',
  })
  @ApiParam({
    name: 'token',
    description: 'Push notification token to unregister',
    example: 'fcm_token_here_123456789',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to unregister token for',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token unregistered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Push token unregistered successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async unregisterPushToken(
    @Param('token') token: string,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.unregisterPushToken(userId, token);
    return { message: 'Push token unregistered successfully' };
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification preferences',
    description:
      'Update user notification preferences for different channels and types',
  })
  @ApiBody({
    type: UpdateNotificationPreferencesDto,
    description: 'Notification preferences to update',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to update preferences for',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification preferences updated successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid preferences data',
  })
  async updatePreferences(
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.updateNotificationPreferences(
      userId,
      updatePreferencesDto,
    );
    return { message: 'Notification preferences updated successfully' };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get notification history',
    description: 'Get user notification history with pagination support',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to get history for',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of notifications to return',
    required: false,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of notifications to skip',
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              userId: {
                type: 'string',
                example: 'user_2abc123def456ghi789jkl012',
              },
              type: { type: 'string', example: 'ride_accepted' },
              title: { type: 'string', example: 'Ride Accepted!' },
              message: { type: 'string', example: 'Your driver is on the way' },
              isRead: { type: 'boolean', example: false },
              pushSent: { type: 'boolean', example: true },
              smsSent: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 25 },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  async getNotificationHistory(
    @Query('userId') userId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const history = await this.notificationsService.getNotificationHistory(
      userId,
      parseInt(limit.toString()),
      parseInt(offset.toString()),
    );
    return {
      notifications: history,
      total: history.length,
      limit: parseInt(limit.toString()),
      offset: parseInt(offset.toString()),
    };
  }

  @Put(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read for the user',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID to mark as read',
    example: '123',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID who is marking the notification as read',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Notification marked as read' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.markNotificationAsRead(
      parseInt(notificationId),
      userId,
    );
    return { message: 'Notification marked as read' };
  }

  @Post('test/ride-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test ride request notification',
    description:
      'Send a test ride request notification (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test ride request notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Test ride request notification sent',
        },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testRideRequestNotification(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: NotificationType.RIDE_REQUEST,
      title: 'Test: New Ride Request',
      message: 'This is a test ride request notification',
      data: {
        rideId: 999,
        pickupLocation: { lat: 40.7128, lng: -74.006 },
        fare: 25.5,
      },
      channels: [NotificationChannel.PUSH],
      priority: 'normal' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'Test ride request notification sent',
      result,
    };
  }

  @Post('test/driver-arrived')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test driver arrived notification',
    description:
      'Send a test driver arrived notification (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test driver arrived notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Test driver arrived notification sent',
        },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testDriverArrivedNotification(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: NotificationType.DRIVER_ARRIVED,
      title: 'Test: Driver Arrived',
      message: 'Your driver has arrived at the pickup location',
      data: {
        rideId: 999,
        driverName: 'Test Driver',
        vehicleInfo: 'Toyota Camry - ABC123',
      },
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: 'high' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'Test driver arrived notification sent',
      result,
    };
  }

  @Post('test/emergency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test emergency notification',
    description:
      'Send a test emergency notification (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test emergency notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Test emergency notification sent',
        },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testEmergencyNotification(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: NotificationType.EMERGENCY_TRIGGERED,
      title: 'Test: Emergency Alert',
      message: 'Emergency alert triggered. Help is on the way.',
      data: {
        rideId: 999,
        location: { lat: 40.7128, lng: -74.006 },
        emergencyType: 'test',
      },
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: 'critical' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'Test emergency notification sent',
      result,
    };
  }

  @Post('test/bulk-drivers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test bulk driver notifications',
    description:
      'Send notifications to multiple drivers (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'rideId',
    description: 'Ride ID to send bulk notifications for',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk driver notifications sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Bulk notifications sent for ride 123',
        },
      },
    },
  })
  async testBulkDriverNotifications(@Query('rideId') rideId: string) {
    await this.notificationsService.notifyNearbyDrivers(parseInt(rideId), {
      lat: 40.7128,
      lng: -74.006,
    });

    return {
      message: `Bulk notifications sent for ride ${rideId}`,
    };
  }

  @Post('test/driver-location-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test driver location update notification',
    description:
      'Send a test notification when driver location updates (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test driver location update notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Driver location update notification sent',
        },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'websocket' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testDriverLocationUpdate(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: 'driver_location_update' as any,
      title: 'Driver Location Update',
      message: 'Your driver location has been updated',
      data: {
        rideId: 999,
        driverLocation: { lat: 40.7128, lng: -74.006 },
        eta: '5 mins',
      },
      channels: ['websocket' as any],
      priority: 'normal' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'Driver location update notification sent',
      result,
    };
  }

  @Post('test/ride-status-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test ride status change notification',
    description:
      'Send a test notification for ride status changes (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiQuery({
    name: 'status',
    description: 'Ride status to test',
    enum: ['accepted', 'arrived', 'started', 'completed'],
    example: 'accepted',
  })
  @ApiResponse({
    status: 200,
    description: 'Test ride status change notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Ride accepted notification sent' },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testRideStatusChange(
    @Query('userId') userId: string,
    @Query('status') status: string = 'accepted',
  ) {
    let title = 'Ride Update';
    let message = 'Your ride status has been updated';

    switch (status) {
      case 'accepted':
        title = 'Ride Accepted! 🎉';
        message = 'Your driver is on the way';
        break;
      case 'arrived':
        title = 'Driver Arrived 🚗';
        message = 'Your driver has arrived at the pickup location';
        break;
      case 'started':
        title = 'Ride Started 🚀';
        message = 'Your ride has started';
        break;
      case 'completed':
        title = 'Ride Completed ✅';
        message = 'Your ride has been completed';
        break;
    }

    const testPayload = {
      userId,
      type: `ride_${status}` as any,
      title,
      message,
      data: {
        rideId: 999,
        driverId: 1,
        status,
      },
      channels: [NotificationChannel.PUSH, NotificationChannel.WEBSOCKET],
      priority: 'high' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: `Ride ${status} notification sent`,
      result,
    };
  }

  @Post('test/promotional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test promotional notification',
    description:
      'Send a test promotional notification (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test promotional notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Promotional notification sent' },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testPromotionalNotification(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: NotificationType.PROMOTIONAL,
      title: 'Special Offer! 🎁',
      message: 'Get 20% off your next ride with code SAVE20',
      data: {
        offer: '20% off',
        code: 'SAVE20',
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      channels: [NotificationChannel.PUSH],
      priority: 'normal' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'Promotional notification sent',
      result,
    };
  }

  @Post('switch-provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Switch notification provider dynamically',
    description:
      'Change the active notification provider (firebase/expo) at runtime',
  })
  @ApiBody({
    type: Object,
    description: 'Provider configuration',
    schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['firebase', 'expo'],
          example: 'expo',
        },
      },
      required: ['provider'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification provider switched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification provider switched to expo',
        },
        previousProvider: {
          type: 'string',
          example: 'firebase',
        },
        currentProvider: {
          type: 'string',
          example: 'expo',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid provider specified',
  })
  async switchProvider(@Body() body: { provider: 'firebase' | 'expo' }) {
    const { provider } = body;

    if (!['firebase', 'expo'].includes(provider)) {
      throw new Error('Invalid provider. Must be "firebase" or "expo"');
    }

    const previousProvider =
      await this.notificationsService.getCurrentProviderType();
    await this.notificationsService.switchProvider(provider);

    return {
      message: `Notification provider switched to ${provider}`,
      previousProvider,
      currentProvider: provider,
    };
  }

  @Get('provider-status')
  @ApiOperation({
    summary: 'Get notification provider status',
    description:
      'Get information about the current notification provider configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currentProvider: {
          type: 'string',
          example: 'expo',
        },
        availableProviders: {
          type: 'array',
          items: { type: 'string' },
          example: ['firebase', 'expo'],
        },
        provider: {
          type: 'string',
          example: 'expo',
        },
        expo: {
          type: 'object',
          properties: {
            initialized: { type: 'boolean', example: true },
            status: { type: 'string', example: 'configured' },
          },
        },
        firebase: {
          type: 'object',
          properties: {
            initialized: { type: 'boolean', example: false },
            status: { type: 'string', example: 'not_configured' },
          },
        },
        twilio: {
          type: 'object',
          properties: {
            initialized: { type: 'boolean', example: true },
            status: { type: 'string', example: 'configured' },
            phoneNumber: { type: 'string', example: '+1234567890' },
          },
        },
      },
    },
  })
  async getProviderStatus() {
    const providerStatus = await this.notificationsService.getProviderStatus();

    return {
      currentProvider: providerStatus.currentProvider,
      availableProviders: providerStatus.availableProviders,
      provider: providerStatus.currentProvider,
      expo: {
        initialized: true,
        status: 'configured', // Always configured for Expo
      },
      firebase: {
        initialized: this.configService.get('FIREBASE_PROJECT_ID')
          ? true
          : false,
        status: this.configService.get('FIREBASE_PROJECT_ID')
          ? 'configured'
          : 'not_configured',
      },
      twilio: {
        initialized: this.configService.get('TWILIO_ACCOUNT_SID')
          ? true
          : false,
        status: this.configService.get('TWILIO_ACCOUNT_SID')
          ? 'configured'
          : 'not_configured',
        phoneNumber: this.configService.get('TWILIO_PHONE_NUMBER') || null,
      },
    };
  }

  @Post('test/system-maintenance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test system maintenance notification',
    description:
      'Send a test system maintenance notification (for development and testing)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to send test notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Test system maintenance notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'System maintenance notification sent',
        },
        result: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              channel: { type: 'string', example: 'push' },
              messageId: { type: 'string', example: 'msg_123456' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async testSystemMaintenanceNotification(@Query('userId') userId: string) {
    const testPayload = {
      userId,
      type: NotificationType.SYSTEM_MAINTENANCE,
      title: 'Scheduled Maintenance ⏰',
      message:
        'System maintenance will occur tonight from 2-4 AM. Service may be interrupted.',
      data: {
        maintenanceStart: new Date(
          Date.now() + 4 * 60 * 60 * 1000,
        ).toISOString(),
        maintenanceEnd: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        expectedDowntime: '2 hours',
      },
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: 'normal' as any,
    };

    const result =
      await this.notificationsService.sendNotification(testPayload);
    return {
      message: 'System maintenance notification sent',
      result,
    };
  }

  @Get('test/status')
  @ApiOperation({
    summary: 'Get notification system status',
    description:
      'Check the status of notification services (Firebase, Twilio, WebSocket)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification system status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        firebase: {
          type: 'object',
          properties: {
            initialized: { type: 'boolean', example: true },
            status: { type: 'string', example: 'operational' },
            projectId: { type: 'string', example: 'your-firebase-project' },
          },
        },
        twilio: {
          type: 'object',
          properties: {
            initialized: { type: 'boolean', example: true },
            status: { type: 'string', example: 'operational' },
            phoneNumber: { type: 'string', example: '+1234567890' },
          },
        },
        websocket: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'operational' },
            activeConnections: { type: 'number', example: 25 },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getNotificationStatus() {
    return await this.getProviderStatus();
  }
}
