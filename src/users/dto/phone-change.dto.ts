import {
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPhoneChangeDto {
  @ApiProperty({
    description: 'Nuevo número de teléfono',
    example: '+584121234567',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsNotEmpty({ message: 'El número de teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato internacional (ej: +584121234567)',
  })
  newPhone: string;
}

export class VerifyPhoneChangeDto {
  @ApiProperty({
    description: 'Nuevo número de teléfono',
    example: '+584121234567',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsNotEmpty({ message: 'El número de teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato internacional (ej: +584121234567)',
  })
  newPhone: string;

  @ApiProperty({
    description: 'Código de verificación de 6 dígitos',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @Matches(/^[0-9]{6}$/, {
    message: 'El código debe ser de exactamente 6 dígitos numéricos',
  })
  code: string;
}

export class CancelPhoneChangeDto {
  @ApiProperty({
    description: 'Confirmación para cancelar el cambio de teléfono',
    example: 'true',
  })
  @IsNotEmpty({ message: 'La confirmación es requerida' })
  confirm: boolean;
}
