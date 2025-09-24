import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ScheduleRideDto {
  @ApiProperty({ example: '555 5th Ave, New York, NY' })
  @IsNotEmpty()
  @IsString()
  origin_address: string;

  @ApiProperty({ example: '888 Madison Ave, New York, NY' })
  @IsNotEmpty()
  @IsString()
  destination_address: string;

  @ApiProperty({ example: 40.7549 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  origin_latitude: number;

  @ApiProperty({ example: -73.984 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  origin_longitude: number;

  @ApiProperty({ example: 40.7744 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  destination_latitude: number;

  @ApiProperty({ example: -73.9653 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  destination_longitude: number;

  @ApiProperty({ example: 30 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  ride_time: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  tier_id: number;

  @ApiProperty({
    example: 1,
    description: 'Tipo de vehículo solicitado (1=Carro, 2=Moto, 3=Bicicleta)',
    required: false,
  })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsNumber()
  vehicle_type_id?: number;

  @ApiProperty({ example: '2024-12-25T14:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduled_for: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  user_id: number;
}
