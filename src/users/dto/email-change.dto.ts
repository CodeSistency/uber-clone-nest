import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'Nueva dirección de email',
    example: 'nuevo.email@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Debe ser una dirección de email válida' })
  newEmail: string;

  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'MiContraseña123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;
}

export class VerifyEmailChangeDto {
  @ApiProperty({
    description: 'Nueva dirección de email',
    example: 'nuevo.email@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Debe ser una dirección de email válida' })
  newEmail: string;

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

export class CancelEmailChangeDto {
  @ApiProperty({
    description: 'Confirmación para cancelar el cambio de email',
    example: 'true',
  })
  @IsNotEmpty({ message: 'La confirmación es requerida' })
  confirm: boolean;
}
