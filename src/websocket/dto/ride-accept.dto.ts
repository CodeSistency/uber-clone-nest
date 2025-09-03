import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RideAcceptDto {
  @ApiProperty({
    description: 'Unique identifier of the ride being accepted',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  rideId: number;

  @ApiProperty({
    description: 'Unique identifier of the driver accepting the ride',
    example: 5,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiProperty({
    description: 'Clerk ID of the passenger whose ride is being accepted',
    example: 'user_2abc123def456'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
