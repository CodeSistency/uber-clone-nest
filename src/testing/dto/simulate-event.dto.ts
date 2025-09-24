import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimulateEventDto {
  @ApiProperty({
    description: 'Service ID to simulate event for',
    example: 123,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty({
    description: 'Type of service',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel'],
  })
  @IsNotEmpty()
  @IsString()
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiProperty({
    description: 'Type of event to simulate',
    example: 'accepted',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  eventType: string;

  @ApiPropertyOptional({
    description: 'Additional data for the event',
    example: { driverId: 99, estimatedTime: 15 },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  data?: any;
}
