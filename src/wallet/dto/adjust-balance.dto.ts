import { IsNotEmpty, IsString, IsNumber, Min, Max, Length, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdjustBalanceDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID del usuario cuya wallet se va a ajustar',
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiProperty({ 
    example: 50.0,
    description: 'Monto del ajuste (positivo para crédito, negativo para débito)',
    minimum: -1000,
    maximum: 1000
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-1000)
  @Max(1000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ 
    example: 'Manual adjustment for refund',
    description: 'Descripción del ajuste',
    minLength: 1,
    maxLength: 255
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  description: string;

  @ApiProperty({ 
    example: 'admin_adjustment',
    description: 'Tipo de ajuste',
    enum: ['admin_adjustment', 'refund', 'correction', 'bonus']
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['admin_adjustment', 'refund', 'correction', 'bonus'])
  adjustmentType: string;

  @ApiProperty({ 
    example: 1,
    description: 'ID del administrador que realiza el ajuste',
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  adminId: number;
}
