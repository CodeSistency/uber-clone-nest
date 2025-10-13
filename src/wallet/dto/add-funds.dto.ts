import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  Length,
  IsIn,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddFundsDto {
  @ApiProperty({
    example: 50.0,
    description: 'Monto a agregar a la wallet',
    minimum: 0.01,
    maximum: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(1000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 'Wallet top-up',
    description: 'Descripción de la adición de fondos',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  description: string;

  @ApiPropertyOptional({
    example: 'credit_card',
    description: 'Fuente de los fondos',
    enum: [
      'credit_card',
      'bank_transfer',
      'cash',
      'referral_bonus',
      'admin_adjustment',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'credit_card',
    'bank_transfer',
    'cash',
    'referral_bonus',
    'admin_adjustment',
  ])
  source?: string;

  @ApiPropertyOptional({
    example: 'TXN-123456',
    description: 'ID de transacción externa (opcional)',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  externalTransactionId?: string;
}
