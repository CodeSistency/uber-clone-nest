import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';
export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@uberclone.com',
    type: 'string',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'Admin123!',
    type: 'string',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

// Clase para el objeto admin dentro de la respuesta
export class AdminInfoDto {
  @ApiProperty({
    description: 'Admin ID',
    example: '1',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@uberclone.com',
    type: 'string',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Whether the admin account is active',
    example: true,
    type: 'boolean',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  lastLogin: Date;

  @ApiProperty({
    description: 'User type',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  userType: 'user' | 'admin';

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: ['super_admin', 'admin', 'moderator', 'support'],
  })
  adminRole: string;

  @ApiProperty({
    description: 'Admin permissions array',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: { type: 'string' },
  })
  adminPermissions: string[];

  @ApiProperty({
    description: 'Last admin login timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  lastAdminLogin?: Date;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
    type: 'string',
    required: false,
  })
  profileImage?: string | null;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    type: 'string',
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
  role: any;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for token renewal',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated admin information',
    type: AdminInfoDto,
  })
  admin: AdminInfoDto;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: 'number',
  })
  expiresIn: number;
}

export class RefreshTokenParams {
  @ApiProperty({
    example: 'admin@unerg.edu',
    description: 'Email of the admin user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token for session renewal',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
