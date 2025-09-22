import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsBoolean, IsEnum, IsPhoneNumber, IsUrl, Min, Max } from 'class-validator';

export class AdminCreateStoreDto {
  @ApiProperty({ example: 'Pizza Palace', description: 'The name of the store' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Best pizza in town', description: 'A short description of the store', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'restaurant', description: 'Type of the store', enum: ['restaurant', 'grocery', 'pharmacy', 'convenience', 'other'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['restaurant', 'grocery', 'pharmacy', 'convenience', 'other'])
  type: string;

  @ApiProperty({ example: '123 Main St, City', description: 'Physical address of the store' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 40.7128, description: 'Latitude coordinate of the store location' })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: -74.006, description: 'Longitude coordinate of the store location' })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ example: '+1234567890', description: 'Contact phone number for the store' })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'info@pizzapalace.com', description: 'Contact email for the store' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://pizzapalace.com', description: 'Website URL of the store', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: 'Mon-Fri: 9:00 AM - 10:00 PM', description: 'Store opening hours', required: false })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg', description: 'URL to the store logo', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiProperty({ example: 'https://example.com/banner.jpg', description: 'URL to the store banner', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  banner?: string;

  @ApiProperty({ example: 2.5, description: 'Delivery fee for orders from this store', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryFee?: number = 0;

  @ApiProperty({ example: 10, description: 'Minimum order amount for delivery', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number = 0;

  @ApiProperty({ example: 30, description: 'Estimated delivery time in minutes', required: false, default: 30 })
  @IsNumber()
  @IsOptional()
  @Min(5)
  estimatedDeliveryTime?: number = 30;

  @ApiProperty({ example: true, description: 'Whether the store is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ example: true, description: 'Whether the store is featured', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @ApiProperty({ example: 15, description: 'Commission rate percentage', required: false, default: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionRate?: number = 15;

  @ApiProperty({ example: 8.875, description: 'Tax rate percentage', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number = 0;

  @ApiProperty({ example: 'John Doe', description: 'Name of the store owner', required: false })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email of the store owner', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @ApiProperty({ example: '+1987654321', description: 'Phone number of the store owner', required: false })
  @IsString()
  @IsPhoneNumber()
  @IsOptional()
  ownerPhone?: string;

  @ApiProperty({ example: 'Chase Bank', description: 'Name of the bank for payouts', required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: 'John Doe', description: 'Name on the bank account', required: false })
  @IsString()
  @IsOptional()
  bankAccountHolder?: string;

  @ApiProperty({ example: '1234567890', description: 'Bank account number', required: false })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiProperty({ example: '026009593', description: 'Bank routing number', required: false })
  @IsString()
  @IsOptional()
  bankRoutingNumber?: string;
}
