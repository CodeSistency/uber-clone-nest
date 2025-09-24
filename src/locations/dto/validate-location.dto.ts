import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateLocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 10.5061,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -66.9146,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
