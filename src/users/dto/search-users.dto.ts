import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class SearchUsersDto {
  // Paginación
  @ApiPropertyOptional({
    description: 'Número de página (empieza en 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Filtros de búsqueda
  @ApiPropertyOptional({
    description: 'Buscar por nombre (búsqueda parcial, case-insensitive)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Buscar por email (búsqueda parcial, case-insensitive)',
    example: 'juan@',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Buscar por teléfono',
    example: '+58412',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Buscar por ciudad',
    example: 'Caracas',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Buscar por estado',
    example: 'Miranda',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Buscar por país',
    example: 'Venezuela',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Tipo de usuario',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  userType?: 'user' | 'admin';

  @ApiPropertyOptional({
    description: 'Rol de administrador',
    example: 'admin',
    enum: ['super_admin', 'admin', 'moderator', 'support'],
  })
  @IsOptional()
  @IsEnum(['super_admin', 'admin', 'moderator', 'support'])
  adminRole?: 'super_admin' | 'admin' | 'moderator' | 'support';

  @ApiPropertyOptional({
    description: 'Estado activo del usuario',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Email verificado',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Teléfono verificado',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Identidad verificada',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  identityVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Género del usuario',
    example: 'male',
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @ApiPropertyOptional({
    description: 'Idioma preferido',
    example: 'es',
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  // Ordenamiento
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
    enum: ['id', 'name', 'email', 'createdAt', 'updatedAt', 'lastLogin'],
  })
  @IsOptional()
  @IsEnum(['id', 'name', 'email', 'createdAt', 'updatedAt', 'lastLogin'])
  sortBy?: 'id' | 'name' | 'email' | 'createdAt' | 'updatedAt' | 'lastLogin';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Filtros de fecha
  @ApiPropertyOptional({
    description: 'Fecha de creación desde (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha de creación hasta (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Último login desde (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  lastLoginFrom?: string;

  @ApiPropertyOptional({
    description: 'Último login hasta (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  lastLoginTo?: string;
}
