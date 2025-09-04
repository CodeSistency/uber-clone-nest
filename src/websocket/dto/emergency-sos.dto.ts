import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmergencySOSDto {
  @ApiProperty({
    description: 'Clerk ID of the user triggering the SOS alert',
    example: 'user_2abc123def456'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ID of the ride where the emergency occurred',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  rideId: number;

  @ApiProperty({
    description: 'Current location coordinates where the emergency occurred',
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

  @ApiProperty({
    description: 'Description of the emergency situation',
    example: 'I need immediate medical assistance due to chest pain.',
    minLength: 10,
    maxLength: 500
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}



