import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetServiceStateDto {
  @ApiProperty({
    description: 'Service ID to update',
    example: 123,
    type: 'number'
  })
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty({
    description: 'Type of service',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel']
  })
  @IsNotEmpty()
  @IsString()
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiProperty({
    description: 'New state for the service',
    example: 'completed',
    type: 'string'
  })
  @IsNotEmpty()
  @IsString()
  state: string;
}
