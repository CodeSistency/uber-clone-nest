import { IsNotEmpty, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Type of service to create',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel']
  })
  @IsNotEmpty()
  @IsString()
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiPropertyOptional({
    description: 'User ID for the service (optional, will use default if not provided)',
    example: 1,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Driver ID for the service (optional, will assign automatically if not provided)',
    example: 1,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  driverId?: number;

  @ApiProperty({
    description: 'Service-specific data',
    example: {
      originAddress: 'Centro, Caracas',
      originLat: 10.5061,
      originLng: -66.9146,
      destinationAddress: 'La Castellana, Caracas',
      destinationLat: 10.4998,
      destinationLng: -66.8517
    }
  })
  @IsNotEmpty()
  @IsObject()
  data: any;
}
