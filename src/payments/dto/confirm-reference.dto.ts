import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmReferenceDto {
  @ApiProperty({
    description: 'Número de referencia bancaria de 20 dígitos',
    example: '12345678901234567890',
    minLength: 20,
    maxLength: 20
  })
  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  referenceNumber: string;

  @ApiProperty({
    description: 'Código del banco venezolano (opcional, se infiere de la referencia si no se proporciona)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}
