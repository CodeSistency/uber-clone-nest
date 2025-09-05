import { IsNotEmpty, IsString, IsOptional, IsNumber, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateStoreDto {
  @ApiProperty({
    description: 'Store name',
    example: 'Pizza Palace'
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Store address',
    example: '123 Main St, New York, NY 10001'
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Store latitude',
    example: 40.7128
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({
    description: 'Store longitude',
    example: -74.0060
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiPropertyOptional({
    description: 'Store category',
    example: 'restaurant'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Cuisine type',
    example: 'italian'
  })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @ApiPropertyOptional({
    description: 'Store logo URL',
    example: 'https://example.com/logo.png'
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Store phone number',
    example: '+1-555-0123'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Store email',
    example: 'contact@pizzapalace.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}