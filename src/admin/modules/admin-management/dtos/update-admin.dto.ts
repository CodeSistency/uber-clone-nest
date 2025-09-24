import { PartialType } from '@nestjs/swagger';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayUnique,
  IsBoolean,
} from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';
import { AdminRole, Permission } from '../../../../admin/entities/admin.entity';

export class UpdateAdminDto extends PartialType(
  OmitType(CreateAdminDto, ['password'] as const),
) {
  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8,
    required: false,
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Indica si la cuenta del administrador está activa',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Rol del administrador',
    enum: AdminRole,
    example: AdminRole.ADMIN,
    required: false,
  })
  @IsEnum(AdminRole)
  @IsOptional()
  adminRole?: AdminRole;

  @ApiProperty({
    description: 'Permisos del administrador',
    type: [String],
    enum: Object.values(Permission),
    example: [Permission.USER_READ, Permission.USER_WRITE],
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  adminPermissions?: Permission[];
}
