import { IsNotEmpty, IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkOperationDto {
  @ApiProperty({
    description: 'Array of driver IDs to operate on',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true }) // Since IDs might be strings in some cases
  driverIds: string[];

  @ApiProperty({
    description: 'Operation to perform',
    example: 'verify',
    enum: ['verify', 'suspend', 'activate', 'deactivate', 'export', 'notify'],
  })
  @IsNotEmpty()
  @IsString()
  operation: string;

  @ApiPropertyOptional({
    description: 'Additional data for the operation',
    example: { status: 'approved', reason: 'Bulk verification' },
  })
  @IsOptional()
  data?: any;
}

export class BulkVerificationDto {
  @ApiProperty({
    description: 'Verification status for all drivers',
    example: 'approved',
    enum: ['approved', 'rejected'],
  })
  @IsNotEmpty()
  @IsString()
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Reason for bulk verification',
    example: 'Bulk verification after document review',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Important Update',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Please update your vehicle documents by end of week',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    example: 'info',
    enum: ['info', 'warning', 'success', 'error'],
  })
  @IsOptional()
  @IsString()
  type?: string;
}
