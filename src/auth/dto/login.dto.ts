import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Firebase Cloud Messaging token para notificaciones push',
    example: 'fcm_token_here_123456789',
  })
  @IsOptional()
  @IsString({ message: 'El token de Firebase debe ser una cadena de texto' })
  firebaseToken?: string;

  @ApiPropertyOptional({
    description: 'Tipo de dispositivo para notificaciones',
    enum: ['ios', 'android', 'web'],
    example: 'android',
  })
  @IsOptional()
  @IsIn(['ios', 'android', 'web'], { message: 'Tipo de dispositivo inválido' })
  deviceType?: 'ios' | 'android' | 'web';

  @ApiPropertyOptional({
    description: 'ID único del dispositivo',
    example: 'device-uuid-12345',
  })
  @IsOptional()
  @IsString({ message: 'El ID del dispositivo debe ser una cadena de texto' })
  deviceId?: string;
}
