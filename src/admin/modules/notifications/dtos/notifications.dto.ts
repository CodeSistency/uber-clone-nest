import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Request DTOs
export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by notification type',
    example: ['ride_completed', 'payment_received'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: string[];

  @ApiPropertyOptional({
    description: 'Filter by delivery status',
    enum: ['sent', 'pending'],
    example: ['sent'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by notification channel',
    enum: ['push', 'email', 'sms'],
    example: 'push',
  })
  @IsOptional()
  @IsEnum(['push', 'email', 'sms'])
  channel?: 'push' | 'email' | 'sms';

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter notifications from this date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter notifications until this date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SendNotificationDto {
  @ApiPropertyOptional({
    description: 'Type of notification',
    example: 'ride_completed',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Notification title (for push notifications)',
    example: 'Ride Completed',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification message/body',
    example: 'Your ride has been completed successfully',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional data to include with notification',
    example: { rideId: 123, amount: 25.5 },
  })
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({
    description: 'Specific user IDs to send to',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'Specific driver IDs to send to',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  driverIds?: number[];

  @ApiPropertyOptional({
    description: 'Send to all users/drivers',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  broadcast?: boolean;

  @ApiPropertyOptional({
    description: 'Channels to send notification via',
    enum: ['push', 'email', 'sms'],
    example: ['push', 'email'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['push', 'email', 'sms'], { each: true })
  channels?: ('push' | 'email' | 'sms')[];

  @ApiPropertyOptional({
    description: 'Schedule notification for future sending (ISO string)',
    example: '2024-01-15T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

export class BroadcastNotificationDto {
  @ApiPropertyOptional({
    description: 'Type of notification',
    example: 'promotion',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Notification title (for push notifications)',
    example: 'Special Promotion',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification message/body',
    example: 'Get 20% off your next ride with code SAVE20',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional data to include with notification',
    example: { promoCode: 'SAVE20', discount: 20 },
  })
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({
    description: 'Target audience for broadcast',
    enum: [
      'all_users',
      'all_drivers',
      'active_users',
      'active_drivers',
      'custom',
    ],
    example: 'active_users',
  })
  @IsEnum([
    'all_users',
    'all_drivers',
    'active_users',
    'active_drivers',
    'custom',
  ])
  targetAudience:
    | 'all_users'
    | 'all_drivers'
    | 'active_users'
    | 'active_drivers'
    | 'custom';

  @ApiPropertyOptional({
    description: 'Channels to send notification via',
    enum: ['push', 'email', 'sms'],
    example: ['push', 'email'],
  })
  @IsArray()
  @IsEnum(['push', 'email', 'sms'], { each: true })
  channels: ('push' | 'email' | 'sms')[];

  @ApiPropertyOptional({
    description: 'Specific user IDs (when targetAudience is custom)',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'Specific driver IDs (when targetAudience is custom)',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  driverIds?: number[];

  @ApiPropertyOptional({
    description: 'Additional filters for custom audience',
  })
  @IsOptional()
  filters?: {
    minRides?: number;
    maxRides?: number;
    verificationStatus?: string[];
    lastActiveDays?: number;
  };
}

export class CreateNotificationTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name',
    example: 'Ride Completed Notification',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Template type',
    enum: ['push', 'email', 'sms'],
    example: 'push',
  })
  @IsEnum(['push', 'email', 'sms'])
  type: 'push' | 'email' | 'sms';

  @ApiPropertyOptional({
    description: 'Email subject (for email templates)',
    example: 'Your Ride Has Been Completed',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Push notification title (for push templates)',
    example: 'Ride Completed',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Template body/content',
    example:
      'Your ride with {driver_name} has been completed. Total: ${amount}',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Available variables in template',
    example: ['driver_name', 'amount', 'ride_id'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({
    description: 'Whether template is active',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

// Response DTOs
export class NotificationListItemDto {
  @ApiPropertyOptional({
    description: 'Notification ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Notification type',
    example: 'ride_completed',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Notification title',
    example: 'Ride Completed',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification message',
    example: 'Your ride has been completed successfully',
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Whether notification has been read',
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'Push notification sent status',
    example: true,
  })
  pushSent: boolean;

  @ApiPropertyOptional({
    description: 'Email sent status',
    example: false,
  })
  emailSent: boolean;

  @ApiPropertyOptional({
    description: 'SMS sent status',
    example: false,
  })
  smsSent: boolean;

  @ApiPropertyOptional({
    description: 'Notification creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'User information',
  })
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export class NotificationTemplateDto {
  @ApiPropertyOptional({
    description: 'Template ID',
    example: 'ride_completed',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Template name',
    example: 'Ride Completed Notification',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Template type',
    enum: ['push', 'email', 'sms'],
    example: 'push',
  })
  type: 'push' | 'email' | 'sms';

  @ApiPropertyOptional({
    description: 'Email subject',
    example: 'Your Ride Has Been Completed',
  })
  subject?: string;

  @ApiPropertyOptional({
    description: 'Push notification title',
    example: 'Ride Completed',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Template body',
    example:
      'Your ride with {driver_name} has been completed. Total: ${amount}',
  })
  body: string;

  @ApiPropertyOptional({
    description: 'Available variables',
    example: ['driver_name', 'amount', 'ride_id'],
  })
  variables: string[];

  @ApiPropertyOptional({
    description: 'Whether template is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Template creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Template last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class NotificationStatsDto {
  @ApiPropertyOptional({
    description: 'Total notifications sent',
    example: 1250,
  })
  totalNotifications: number;

  @ApiPropertyOptional({
    description: 'Delivery statistics by channel',
  })
  deliveryStats: {
    push: number;
    email: number;
    sms: number;
    total: number;
  };

  @ApiPropertyOptional({
    description: 'Engagement statistics',
  })
  engagementStats: {
    read: number;
    unread: number;
    readRate: number;
  };

  @ApiPropertyOptional({
    description: 'Overall performance statistics',
  })
  overallStats: {
    deliveryRate: number;
    successRate: number;
  };
}

export class SendNotificationResponseDto {
  @ApiPropertyOptional({
    description: 'Total number of recipients',
    example: 500,
  })
  totalRecipients: number;

  @ApiPropertyOptional({
    description: 'Number of push notifications sent',
    example: 450,
  })
  pushSent: number;

  @ApiPropertyOptional({
    description: 'Number of emails sent',
    example: 380,
  })
  emailSent: number;

  @ApiPropertyOptional({
    description: 'Number of SMS sent',
    example: 320,
  })
  smsSent: number;

  @ApiPropertyOptional({
    description: 'Errors encountered during sending',
    type: [Object],
  })
  errors: { recipient: string; channel?: string; error: string }[];
}

export class NotificationListResponseDto {
  @ApiPropertyOptional({
    description: 'Array of notifications',
    type: [NotificationListItemDto],
  })
  notifications: NotificationListItemDto[];

  @ApiPropertyOptional({
    description: 'Total number of notifications',
    example: 1250,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiPropertyOptional({
    description: 'Total number of pages',
    example: 63,
  })
  totalPages: number;
}

export class NotificationTemplatesResponseDto {
  @ApiPropertyOptional({
    description: 'Array of notification templates',
    type: [NotificationTemplateDto],
  })
  templates: NotificationTemplateDto[];
}

export class UserNotificationsResponseDto {
  @ApiPropertyOptional({
    description: 'Array of user notifications',
    type: [NotificationListItemDto],
  })
  notifications: NotificationListItemDto[];

  @ApiPropertyOptional({
    description: 'Total number of notifications',
    example: 25,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiPropertyOptional({
    description: 'Total number of pages',
    example: 2,
  })
  totalPages: number;
}
