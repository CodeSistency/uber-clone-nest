import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdatePromotionDto {
  @ApiPropertyOptional({
    description: 'New promotional code (must be unique)',
    example: 'UPDATED10',
    minLength: 3,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({
    description: 'Updated discount percentage (e.g., 15 for 15% off)',
    example: 15.0,
    minimum: 0,
    maximum: 100,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Updated fixed discount amount in dollars',
    example: 5.0,
    minimum: 0,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Updated expiration date of the promotion (ISO date string)',
    example: '2024-12-31',
    format: 'date'
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Updated active status of the promotion',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
