import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRideDto {
  @ApiProperty({ example: '123 Main St, New York, NY' })
  @IsNotEmpty()
  @IsString()
  origin_address: string;

  @ApiProperty({ example: '456 Broadway, New York, NY' })
  @IsNotEmpty()
  @IsString()
  destination_address: string;

  @ApiProperty({ example: 40.7128 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  origin_latitude: number;

  @ApiProperty({ example: -74.006 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  origin_longitude: number;

  @ApiProperty({ example: 40.7589 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  destination_latitude: number;

  @ApiProperty({ example: -73.9851 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  destination_longitude: number;

  @ApiProperty({ example: 25 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  ride_time: number;

  @ApiProperty({ example: 15.75 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  fare_price: number;

  @ApiProperty({ example: 'completed' })
  @IsNotEmpty()
  @IsString()
  payment_status: string;

  @ApiProperty({ example: 1, required: false })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsNumber()
  driver_id?: number;

  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ example: 1, required: false })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsNumber()
  tier_id?: number;
}
