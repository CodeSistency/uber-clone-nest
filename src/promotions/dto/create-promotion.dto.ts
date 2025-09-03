import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Unique promotional code that users can enter',
    example: 'WELCOME10',
    minLength: 3,
    maxLength: 20
  })
  @IsNotEmpty()
  @IsString()
  promoCode: string;

  @ApiPropertyOptional({
    description: 'Discount percentage (e.g., 10 for 10% off)',
    example: 10.0,
    minimum: 0,
    maximum: 100,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed discount amount in dollars',
    example: 5.0,
    minimum: 0,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Expiration date of the promotion (ISO date string)',
    example: '2024-12-31',
    format: 'date'
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Whether the promotion is currently active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
