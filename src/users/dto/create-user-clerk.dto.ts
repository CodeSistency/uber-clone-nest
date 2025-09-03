import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear usuario básico
 * Este endpoint es público y no requiere autenticación
 * El Clerk ID se genera automáticamente como temporal
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

/**
 * DTO para callback de autenticación de Clerk
 * Se usa después de que Clerk autentica al usuario
 */
export class ClerkAuthCallbackDto {
  @ApiProperty({
    description: 'Full name from Clerk/Google authentication',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Email from Clerk/Google authentication',
    example: 'john.doe@gmail.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
