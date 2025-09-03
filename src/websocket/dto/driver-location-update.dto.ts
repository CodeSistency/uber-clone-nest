import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverLocationUpdateDto {
  @ApiProperty({
    description: 'Unique identifier of the driver',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiProperty({
    description: 'Current location coordinates of the driver',
    type: 'object',
    properties: {
      lat: {
        type: 'number',
        example: 40.7128,
        description: 'Latitude coordinate',
        minimum: -90,
        maximum: 90
      },
      lng: {
        type: 'number',
        example: -74.006,
        description: 'Longitude coordinate',
        minimum: -180,
        maximum: 180
      }
    }
  })
  @IsNotEmpty()
  location: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional({
    description: 'ID of the active ride (if applicable)',
    example: 1,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  rideId?: number;
}
