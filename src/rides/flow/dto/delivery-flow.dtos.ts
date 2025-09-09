import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDeliveryOrderFlowDto {
  @ApiProperty({
    description: 'ID de la tienda/restaurante que procesará el pedido de delivery',
    example: 1,
    minimum: 1,
    type: 'number'
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  storeId: number;

  @ApiProperty({
    description: 'Dirección completa donde se entregará el pedido',
    example: 'Carrera 7 #23-45, Apartamento 1201, Bogotá, Colombia',
    minLength: 10,
    maxLength: 255,
    type: 'string'
  })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({
    description: 'Latitud de la dirección de entrega (coordenadas GPS)',
    example: 4.6097,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float'
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  deliveryLatitude: number;

  @ApiProperty({
    description: 'Longitud de la dirección de entrega (coordenadas GPS)',
    example: -74.0817,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float'
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  deliveryLongitude: number;

  // Items will be provided via OrdersService DTO directly in controller if needed
}

export class ConfirmDeliveryPaymentDto {
  @ApiProperty({
    description: 'Método de pago para el pedido de delivery',
    example: 'card',
    enum: ['cash', 'card', 'wallet'],
    enumName: 'DeliveryPaymentMethod'
  })
  @IsIn(['cash', 'card', 'wallet'])
  method: 'cash' | 'card' | 'wallet';

  @ApiPropertyOptional({
    description: 'Client secret de Stripe para pagos con tarjeta. Requerido cuando method es "card"',
    example: 'pi_1234567890_secret_abcdef123456',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  clientSecret?: string;
}


