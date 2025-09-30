import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverStatusUpdateDto {
  @ApiProperty({
    description: 'Unique identifier of the driver',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiProperty({
    description: 'New availability status of the driver',
    example: 'online',
    enum: ['online', 'offline', 'busy', 'away'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['online', 'offline', 'busy', 'away'])
  status: string;
}
