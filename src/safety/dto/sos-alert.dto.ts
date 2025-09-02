import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SOSAlertDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  userClerkId: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  rideId: number;

  @ApiProperty({
    type: 'object',
    properties: {
      latitude: { type: 'number', example: 40.7128 },
      longitude: { type: 'number', example: -74.006 },
    },
  })
  @IsNotEmpty()
  location: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ example: 'medical' })
  @IsNotEmpty()
  @IsString()
  emergencyType: string;

  @ApiProperty({ example: 'I need help.' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
