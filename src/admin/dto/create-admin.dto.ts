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

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe',
    type: 'string',
    minLength: 2,
    maxLength: 100,
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
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password (minimum 6 characters)',
    example: 'Admin123!',
    type: 'string',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: AdminRole,
    enumName: 'AdminRole',
  })
  @IsNotEmpty()
  @IsEnum(AdminRole)
  adminRole: AdminRole;

  @ApiPropertyOptional({
    description:
      'Custom permissions array (optional - will use default permissions for role if not provided)',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(Permission),
    },
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  adminPermissions?: Permission[];

  @ApiPropertyOptional({
    description: 'Whether the admin account should be active',
    example: true,
    type: 'boolean',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminResponseDto {
  @ApiProperty({
    description: 'Admin ID',
    example: 1,
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
    description: 'User type',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  userType: 'user' | 'admin';

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: AdminRole,
    enumName: 'AdminRole',
  })
  adminRole: AdminRole;

  @ApiProperty({
    description: 'Admin permissions array',
    example: ['user:read', 'user:write', 'driver:read'],
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(Permission),
    },
  })
  adminPermissions: Permission[];

  @ApiProperty({
    description: 'Whether the admin account is active',
    example: true,
    type: 'boolean',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Admin account creation timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  adminCreatedAt: Date | null;
}
