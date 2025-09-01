import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RateRideDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  ratedByClerkId: string;

  @ApiProperty({ example: 'driver_clerk_id_1' })
  @IsNotEmpty()
  @IsString()
  ratedClerkId: string;

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
