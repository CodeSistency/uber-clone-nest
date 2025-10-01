import {
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenerateReferenceDto {
  @ApiProperty({
    description: 'Tipo de servicio para el pago',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel'],
  })
  @IsNotEmpty()
  @IsIn(['ride', 'delivery', 'errand', 'parcel'])
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiProperty({
    description: 'ID del servicio (rideId, orderId, etc.)',
    example: 123,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  serviceId: number;

  @ApiProperty({
    description: 'Monto del pago en VES',
    example: 25.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Método de pago',
    example: 'transfer',
    enum: ['transfer', 'pago_movil', 'zelle', 'bitcoin', 'cash', 'wallet'],
  })
  @IsOptional()
  @IsIn(['transfer', 'pago_movil', 'zelle', 'bitcoin', 'cash', 'wallet'])
  paymentMethod?: 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin' | 'cash' | 'wallet';

  @ApiPropertyOptional({
    description: 'Código del banco venezolano',
    example: '0102',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiProperty({
    description: 'ID del usuario que realiza el pago',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({
    description: 'Indica si este es un pago parcial de un grupo',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPartial?: boolean;

  @ApiPropertyOptional({
    description: 'ID del grupo de pagos múltiples (UUID)',
    example: 'cm1n8x9p40000abcdefghijk',
  })
  @IsOptional()
  @IsString()
  groupId?: string;
}

// DTO for initiating multiple payment methods
export class InitiateMultiplePaymentsDto {
  @ApiProperty({
    description: 'Tipo de servicio',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel'],
  })
  @IsNotEmpty()
  @IsIn(['ride', 'delivery', 'errand', 'parcel'])
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiProperty({
    description: 'ID del servicio',
    example: 123,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  serviceId: number;

  @ApiProperty({
    description: 'ID del usuario que realiza el pago',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiProperty({
    description: 'Monto total a pagar',
    example: 75.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  totalAmount: number;

  @ApiProperty({
    description: 'Lista de métodos de pago con montos',
    example: [
      { method: 'transfer', amount: 25.0, bankCode: '0102' },
      { method: 'pago_movil', amount: 30.5, bankCode: '0105' },
      { method: 'cash', amount: 20.0 },
    ],
  })
  @IsNotEmpty()
  payments: PaymentMethodDto[];
}

// DTO for individual payment methods in multiple payments
export class PaymentMethodDto {
  @ApiProperty({
    description: 'Método de pago',
    example: 'transfer',
    enum: ['transfer', 'pago_movil', 'zelle', 'bitcoin', 'cash', 'wallet'],
  })
  @IsNotEmpty()
  @IsIn(['transfer', 'pago_movil', 'zelle', 'bitcoin', 'cash', 'wallet'])
  method: 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin' | 'cash' | 'wallet';

  @ApiProperty({
    description: 'Monto para este método de pago',
    example: 25.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Código del banco (requerido para transfer y pago_movil)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  bankCode?: string;
}

// DTO for confirming individual payments in multiple payment group
export class ConfirmPartialPaymentDto {
  @ApiProperty({
    description: 'Número de referencia bancaria',
    example: '12345678901234567890',
    minLength: 20,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  referenceNumber: string;

  @ApiPropertyOptional({
    description: 'Código del banco (requerido para pagos electrónicos)',
    example: '0102',
  })
  @IsOptional()
  @IsString()
  bankCode?: string;
}

// DTO for payment group status
export class PaymentGroupStatusDto {
  @ApiProperty({
    description: 'ID del grupo de pagos',
    example: 'cm1n8x9p40000abcdefghijk',
  })
  @IsNotEmpty()
  @IsString()
  groupId: string;
}
