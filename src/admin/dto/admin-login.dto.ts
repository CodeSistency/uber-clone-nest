import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@uberclone.com',
    type: 'string',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'Admin123!',
    type: 'string',
    minLength: 6
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

// Clase para el objeto admin dentro de la respuesta
class AdminInfoDto {
  @ApiProperty({
    description: 'Admin ID',
    example: 1,
    type: 'number'
  })
  id: number;

  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe',
    type: 'string'
  })
  name: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@uberclone.com',
    type: 'string',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    description: 'User type',
    example: 'admin',
    enum: ['user', 'admin']
  })
  userType: 'user' | 'admin';

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: ['super_admin', 'admin', 'moderator', 'support']
  })
  adminRole: string;

  @ApiProperty({
    description: 'Admin permissions array',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: { type: 'string' }
  })
  adminPermissions: string[];

  @ApiProperty({
    description: 'Last admin login timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  lastAdminLogin?: Date;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for token renewal',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated admin information',
    type: AdminInfoDto
  })
  admin: AdminInfoDto;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: 'number'
  })
  expiresIn: number;
}
