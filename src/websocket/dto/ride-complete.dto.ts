import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RideCompleteDto {
  @ApiProperty({
    description: 'Unique identifier of the completed ride',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  rideId: number;

  @ApiProperty({
    description: 'Unique identifier of the driver who completed the ride',
    example: 5,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiProperty({
    description: 'Clerk ID of the passenger',
    example: 'user_2abc123def456'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Final fare amount for the completed ride',
    example: 25.75,
    minimum: 0,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  fare: number;
}







