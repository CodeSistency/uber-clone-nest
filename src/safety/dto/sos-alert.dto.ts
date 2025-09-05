import { IsNotEmpty, IsString, IsNumber, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SOSAlertDto {
  @ApiProperty({
    description: 'Clerk ID of the user triggering the SOS alert',
    example: 'user_2abc123def456',
    minLength: 10,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ID of the ride where the emergency occurred',
    example: 1,
    minimum: 1,
    type: Number
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  rideId: number;

  @ApiProperty({
    description: 'Current location coordinates where the emergency occurred',
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        example: 40.7128,
        description: 'Latitude coordinate (-90 to 90)',
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        example: -74.006,
        description: 'Longitude coordinate (-180 to 180)',
        minimum: -180,
        maximum: 180
      },
    },
  })
  @IsNotEmpty()
  location: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: 'Emergency category: medical, safety, vehicle, or other',
    example: 'medical',
    enum: ['medical', 'safety', 'vehicle', 'other']
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['medical', 'safety', 'vehicle', 'other'])
  emergencyType: string;

  @ApiProperty({
    description: 'Description of the emergency situation',
    example: 'I need immediate medical assistance.',
    minLength: 10,
    maxLength: 500
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message: string;
}
