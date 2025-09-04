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
import { AdminRole, Permission } from '../entities/admin.entity';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  adminRole?: AdminRole;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  adminPermissions?: Permission[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminResponseDto {
  id: number;
  name: string;
  email: string;
  userType: 'user' | 'admin';
  adminRole: AdminRole;
  adminPermissions: Permission[];
  isActive: boolean;
  adminUpdatedAt: Date | null;
}
