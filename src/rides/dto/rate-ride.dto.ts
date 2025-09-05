import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RateRideDto {
  @ApiProperty({ example: 1, description: 'ID del usuario que califica' })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  ratedByUserId: number;

  @ApiProperty({ example: 2, description: 'ID del usuario calificado' })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  ratedUserId: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingValue: number;

  @ApiProperty({ example: 'Great ride!', required: false })
  @IsString()
  comment?: string;
}
