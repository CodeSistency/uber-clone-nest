import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDriverStatusDto {
  @ApiProperty({
    description: 'New driver status',
    example: 'active',
    enum: ['active', 'inactive', 'suspended', 'online', 'offline', 'busy'],
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Driver requested suspension for vacation',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Will return on January 15th',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Suspension end date (for temporary suspensions)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  suspensionEndDate?: string;
}
