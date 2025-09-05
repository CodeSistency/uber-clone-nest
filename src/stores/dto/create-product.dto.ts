import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Margherita Pizza'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Classic pizza with tomato sauce, mozzarella, and basil'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 15.99
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/pizza.jpg'
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Pizza'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 50
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Preparation time in minutes',
    example: 15
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsNumber()
  preparationTime?: number;
}