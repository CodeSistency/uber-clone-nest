import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RideJoinDto {
  @ApiProperty({
    description: 'Unique identifier of the ride to join',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  rideId: number;

  @ApiProperty({
    description: 'Clerk ID of the user joining the ride tracking',
    example: 'user_2abc123def456'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}




