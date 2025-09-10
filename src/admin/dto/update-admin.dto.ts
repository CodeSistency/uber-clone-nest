import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { AdminRole, Permission } from '../entities/admin.entity';

export class UpdateAdminDto {
  @ApiPropertyOptional({
    description: 'Admin full name',
    example: 'John Doe Updated',
    type: 'string',
    minLength: 2,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Admin email address',
    example: 'updated-admin@uberclone.com',
    type: 'string',
    format: 'email'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Admin password (minimum 6 characters)',
    example: 'NewPassword123!',
    type: 'string',
    minLength: 6
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'Admin role',
    example: 'moderator',
    enum: AdminRole,
    enumName: 'AdminRole'
  })
  @IsOptional()
  @IsEnum(AdminRole)
  adminRole?: AdminRole;

  @ApiPropertyOptional({
    description: 'Custom permissions array',
    example: ['user:read', 'user:write', 'reports:view'],
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
    type: 'boolean'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminResponseDto {
  @ApiProperty({
    description: 'Admin ID',
    example: 1,
    type: 'number'
  })
  id: number;

  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe Updated',
    type: 'string'
  })
  name: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'updated-admin@uberclone.com',
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
    example: 'moderator',
    enum: AdminRole,
    enumName: 'AdminRole'
  })
  adminRole: AdminRole;

  @ApiProperty({
    description: 'Admin permissions array',
    example: ['user:read', 'user:write', 'reports:view'],
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
    description: 'Admin account last update timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  adminUpdatedAt: Date | null;
}
