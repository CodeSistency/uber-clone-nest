import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsPhoneNumber, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

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

  // Campos opcionales para configuración inicial
  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+584141234567',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'País de residencia',
    example: 'Venezuela',
  })
  @IsOptional()
  @IsString({ message: 'El país debe ser una cadena de texto' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Estado o provincia',
    example: 'Miranda',
  })
  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  state?: string;

  @ApiPropertyOptional({
    description: 'Ciudad',
    example: 'Caracas',
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  city?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Género',
    example: 'male',
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], { message: 'Género inválido' })
  gender?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferido',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsOptional()
  @IsIn(['es', 'en'], { message: 'Idioma inválido' })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Zona horaria',
    example: 'America/Caracas',
  })
  @IsOptional()
  @IsString({ message: 'La zona horaria debe ser una cadena de texto' })
  timezone?: string;
}
