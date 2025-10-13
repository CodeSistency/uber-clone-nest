import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  Length,
  IsIn,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransferFundsDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Email del usuario destinatario',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  toUserEmail: string;

  @ApiProperty({
    example: 25.0,
    description: 'Monto a transferir',
    minimum: 0.01,
    maximum: 500,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(500)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 'Transfer between users',
    description: 'Descripción de la transferencia',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  description: string;

  @ApiPropertyOptional({
    example: 'user_transfer',
    description: 'Tipo de referencia de la transferencia',
    enum: ['user_transfer', 'referral_reward', 'admin_transfer'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['user_transfer', 'referral_reward', 'admin_transfer'])
  referenceType?: string;
}
