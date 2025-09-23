import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole, Permission } from '../entities/admin.entity';

export class CreateBusinessUserDto {
  @ApiProperty({
    description: 'Business user full name',
    example: 'John Business',
    type: 'string',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Business user email address',
    example: 'business@company.com',
    type: 'string',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Business user password (minimum 6 characters)',
    example: 'Business123!',
    type: 'string',
    minLength: 6
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Business user phone number',
    example: '+1234567890',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateBusinessUserResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'string'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for getting new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'string'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated business user information',
    type: 'object',
    properties: {
      id: {
        type: 'number',
        example: 1,
        description: 'Business user ID'
      },
      name: {
        type: 'string',
        example: 'John Business',
        description: 'Business user full name'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'business@company.com',
        description: 'Business user email address'
      },
      userType: {
        type: 'string',
        example: 'user',
        enum: ['user'],
        description: 'User type (business users are regular users with business permissions)'
      },
      adminRole: {
        type: 'string',
        example: 'bussiness',
        enum: ['bussiness'],
        description: 'Business role assigned to the user'
      },
      adminPermissions: {
        type: 'array',
        items: { type: 'string' },
        example: ['bussiness:read', 'bussiness:write', 'bussiness:approve'],
        description: 'Business permissions granted to the user'
      },
      lastLogin: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp of last successful login',
        nullable: true
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the business account is active'
      },
      profileImage: {
        type: 'string',
        nullable: true,
        example: null,
        description: 'Business user profile image URL'
      },
      phone: {
        type: 'string',
        nullable: true,
        example: '+1234567890',
        description: 'Business user phone number'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Business account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Business account last update timestamp'
      }
    }
  })
  admin: {
    id: number;
    name: string;
    email: string;
    userType: 'user';
    adminRole: 'bussiness';
    adminPermissions: string[];
    lastLogin: Date | null;
    isActive: boolean;
    profileImage: string | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({
    description: 'Time in seconds until the access token expires',
    example: 3600,
    type: 'number'
  })
  expiresIn: number;
}

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe',
    type: 'string',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

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
    description: 'Admin password (minimum 6 characters)',
    example: 'Admin123!',
    type: 'string',
    minLength: 6
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: AdminRole,
    enumName: 'AdminRole'
  })
  @IsNotEmpty()
  @IsEnum(AdminRole)
  adminRole: AdminRole;

  @ApiPropertyOptional({
    description: 'Custom permissions array (optional - will use default permissions for role if not provided)',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(Permission)
    }
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  adminPermissions?: Permission[];

  @ApiPropertyOptional({
    description: 'Whether the admin account should be active',
    example: true,
    type: 'boolean',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminResponseDto {
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
    enum: AdminRole,
    enumName: 'AdminRole'
  })
  adminRole: AdminRole;

  @ApiProperty({
    description: 'Admin permissions array',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(Permission)
    }
  })
  adminPermissions: Permission[];

  @ApiProperty({
    description: 'Whether the admin account is active',
    example: true,
    type: 'boolean'
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Admin account creation timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  adminCreatedAt: Date | null;
}
