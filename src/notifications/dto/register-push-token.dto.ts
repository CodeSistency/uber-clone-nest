import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token',
    example: 'fcm_token_here_123456789',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Device type',
    enum: ['ios', 'android', 'web'],
    required: false,
    example: 'ios',
  })
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  deviceType?: 'ios' | 'android' | 'web';

  @ApiProperty({
    description: 'Unique device identifier',
    required: false,
    example: 'device-uuid-12345',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
