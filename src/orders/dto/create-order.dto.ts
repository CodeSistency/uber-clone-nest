import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, ValidateNested, ArrayMinSize, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class CreateOrderDto {
  @IsNumber()
  storeId: number;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsNumber()
  deliveryLatitude: number;

  @IsNumber()
  deliveryLongitude: number;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  @IsIn(['card', 'cash', 'wallet'])
  paymentMethod?: string;
}
