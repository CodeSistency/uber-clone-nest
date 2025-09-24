import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  productId: number;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Special instructions for this item',
    example: 'Extra cheese',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Store ID',
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  storeId: number;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Delivery address',
    example: '123 Main St, New York, NY 10001',
  })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({
    description: 'Delivery latitude',
    example: 40.7128,
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  deliveryLatitude: number;

  @ApiProperty({
    description: 'Delivery longitude',
    example: -74.006,
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  deliveryLongitude: number;

  @ApiPropertyOptional({
    description: 'Special instructions for delivery',
    example: 'Ring doorbell, leave at door',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'card',
    enum: ['card', 'cash', 'wallet'],
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Promo code',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
