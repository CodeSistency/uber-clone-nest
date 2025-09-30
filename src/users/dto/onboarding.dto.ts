import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para ubicación (Paso 1 del onboarding)
export class OnboardingLocationDto {
  @ApiProperty({
    description: 'País de residencia',
    example: 'Venezuela',
  })
  @IsNotEmpty({ message: 'El país es requerido' })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  country: string;

  @ApiProperty({
    description: 'Estado o provincia',
    example: 'Miranda',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  state: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Caracas',
  })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  city: string;

  @ApiPropertyOptional({
    description: 'Código postal',
    example: '1010',
  })
  @IsOptional()
  @IsString({ message: 'El código postal debe ser una cadena de texto' })
  postalCode?: string;
}

// DTO para información personal (Paso 2 del onboarding)
export class OnboardingPersonalDto {
  @ApiProperty({
    description: 'Número de teléfono',
    example: '+584141234567',
  })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone: string;

  @ApiProperty({
    description: 'Fecha de nacimiento (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' },
  )
  dateOfBirth: string;

  @ApiProperty({
    description: 'Género',
    example: 'male',
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  @IsNotEmpty({ message: 'El género es requerido' })
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: 'Género inválido',
  })
  gender: string;
}

// DTO para preferencias (Paso 3 del onboarding)
export class OnboardingPreferencesDto {
  @ApiProperty({
    description: 'Idioma preferido',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsNotEmpty({ message: 'El idioma es requerido' })
  @IsIn(['es', 'en'], { message: 'Idioma inválido' })
  preferredLanguage: string;

  @ApiProperty({
    description: 'Zona horaria',
    example: 'America/Caracas',
  })
  @IsNotEmpty({ message: 'La zona horaria es requerida' })
  @IsString({ message: 'La zona horaria debe ser una cadena de texto' })
  timezone: string;

  @ApiProperty({
    description: 'Moneda preferida',
    example: 'USD',
    enum: ['USD', 'EUR', 'VES'],
  })
  @IsNotEmpty({ message: 'La moneda es requerida' })
  @IsIn(['USD', 'EUR', 'VES'], { message: 'Moneda inválida' })
  currency: string;
}

// DTO para verificación (Paso 4 del onboarding)
export class OnboardingVerificationDto {
  @ApiProperty({
    description: 'Código de verificación del teléfono',
    example: '123456',
  })
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  phoneVerificationCode: string;

  @ApiPropertyOptional({
    description: 'Código de verificación del email',
    example: 'ABC123',
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  emailVerificationCode?: string;
}

// DTO para completar onboarding
export class CompleteOnboardingDto {
  @ApiPropertyOptional({
    description: 'Dirección completa',
    example: 'Calle 123, Centro, Caracas',
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @ApiPropertyOptional({
    description: 'URL de imagen de perfil',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString({ message: 'La URL de imagen debe ser una cadena de texto' })
  profileImage?: string;
}

// DTO para el estado del onboarding
export class OnboardingStatusDto {
  @ApiProperty({
    description: 'Si el usuario ha completado el onboarding',
    example: false,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Pasos completados del onboarding',
    example: ['location'],
  })
  completedSteps: string[];

  @ApiProperty({
    description: 'Próximo paso a completar',
    example: 'personal',
  })
  nextStep: string;

  @ApiProperty({
    description: 'Progreso del onboarding (0-100)',
    example: 25,
  })
  progress: number;
}
