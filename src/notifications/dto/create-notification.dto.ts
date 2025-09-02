import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationChannel,
} from '../interfaces/notification.interface';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: 'user_2abc123def456ghi789jkl012',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.RIDE_ACCEPTED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Ride Accepted! 🎉',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your driver Carlos is on the way',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Additional notification data',
    required: false,
    example: { rideId: 1, driverId: 123 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Notification channels to use',
    enum: NotificationChannel,
    isArray: true,
    required: false,
    example: [NotificationChannel.PUSH, NotificationChannel.WEBSOCKET],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiProperty({
    description: 'Notification priority',
    enum: ['low', 'normal', 'high', 'critical'],
    required: false,
    example: 'high',
  })
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'critical'])
  priority?: 'low' | 'normal' | 'high' | 'critical';
}
