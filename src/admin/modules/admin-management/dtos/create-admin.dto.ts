import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { AdminRole, Permission } from '../../../entities/admin.entity';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Nombre completo del administrador',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del administrador',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del administrador (mínimo 8 caracteres)',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Rol del administrador',
    enum: AdminRole,
    example: AdminRole.ADMIN,
  })
  @IsEnum(AdminRole)
  adminRole: AdminRole;

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

  @ApiProperty({
    description: 'Indica si la cuenta del administrador está activa',
    default: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean = true;
}
