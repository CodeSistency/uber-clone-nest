import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nuevo nombre del administrador',
    example: 'Juan Pérez Actualizado',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Nuevo correo electrónico',
    example: 'nuevo.email@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Contraseña actual (requerida para realizar cambios en el perfil)',
    example: 'currentPassword123',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8,
    example: 'newSecurePassword123',
    required: false,
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  newPassword?: string;
}
