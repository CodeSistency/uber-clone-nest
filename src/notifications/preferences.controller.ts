import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('notifications/preferences')
export class PreferencesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Get user notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Get user notification preferences for different channels and types',
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to get preferences for',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_2abc123def456ghi789jkl012' },
        preferences: {
          type: 'object',
          properties: {
            pushEnabled: { type: 'boolean', example: true },
            smsEnabled: { type: 'boolean', example: false },
            emailEnabled: { type: 'boolean', example: false },
            rideUpdates: { type: 'boolean', example: true },
            driverMessages: { type: 'boolean', example: true },
            promotional: { type: 'boolean', example: false },
            emergencyAlerts: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  async getPreferences(@Query('userId') userId: string) {
    // In a real implementation, you'd get this from the JWT token
    // For now, we'll pass it as a query parameter
    return {
      userId,
      preferences: {
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: false,
        rideUpdates: true,
        driverMessages: true,
        promotional: false,
        emergencyAlerts: true,
      },
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update user notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
  })
  async updatePreferences(
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.updateNotificationPreferences(userId, updatePreferencesDto);
    return { message: 'Notification preferences updated successfully' };
  }

  @Post('push-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register push notification token',
    description: 'Register a device token for push notifications',
  })
  @ApiResponse({
    status: 201,
    description: 'Push token registered successfully',
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
  @ApiResponse({
    status: 200,
    description: 'Push token unregistered successfully',
  })
  async unregisterPushToken(
    @Param('token') token: string,
    @Query('userId') userId: string,
  ) {
    await this.notificationsService.unregisterPushToken(userId, token);
    return { message: 'Push token unregistered successfully' };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get notification history',
    description: 'Get user notification history with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
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
    description: 'Mark a specific notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
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
}
