import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryOrderFlowDto {
  @IsNotEmpty()
  @IsNumber()
  storeId: number;

  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsNotEmpty()
  @IsNumber()
  deliveryLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  deliveryLongitude: number;

  // Items will be provided via OrdersService DTO directly in controller if needed
}

export class ConfirmDeliveryPaymentDto {
  @IsIn(['cash', 'card', 'wallet'])
  method: 'cash' | 'card' | 'wallet';

  @IsOptional()
  @IsString()
  clientSecret?: string;
}


