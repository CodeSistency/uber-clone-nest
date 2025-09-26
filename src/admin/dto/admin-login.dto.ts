import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@uberclone.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del administrador',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT para el administrador',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token de refresco para renovar el acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Información del usuario administrador',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      email: { type: 'string', example: 'admin@uberclone.com' },
      name: { type: 'string', example: 'Admin Principal' },
      role: { type: 'string', example: 'super_admin' },
      permissions: {
        type: 'array',
        items: { type: 'string' },
        example: ['users:read', 'rides:write', 'system:config:read'],
      },
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };

  @ApiProperty({
    description: 'Timestamp de expiración del token de acceso',
    example: 1640995200,
  })
  expires_in: number;
}
