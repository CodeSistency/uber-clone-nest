import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: 'Enable/disable push notifications',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable SMS notifications',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable email notifications',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable ride status updates',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  rideUpdates?: boolean;

  @ApiProperty({
    description: 'Enable/disable driver messages',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  driverMessages?: boolean;

  @ApiProperty({
    description: 'Enable/disable promotional notifications',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  promotional?: boolean;

  @ApiProperty({
    description: 'Enable/disable emergency alerts',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emergencyAlerts?: boolean;
}
