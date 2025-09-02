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
  @ApiProperty({ example: 'WELCOME10' })
  @IsNotEmpty()
  @IsString()
  promoCode: string;

  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : value))
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
