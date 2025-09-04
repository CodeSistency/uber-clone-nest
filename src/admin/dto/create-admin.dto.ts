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
import { AdminRole, Permission } from '../entities/admin.entity';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsEnum(AdminRole)
  adminRole: AdminRole;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  adminPermissions?: Permission[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminResponseDto {
  id: number;
  name: string;
  email: string;
  userType: 'user' | 'admin';
  adminRole: AdminRole;
  adminPermissions: Permission[];
  isActive: boolean;
  adminCreatedAt: Date | null;
}
