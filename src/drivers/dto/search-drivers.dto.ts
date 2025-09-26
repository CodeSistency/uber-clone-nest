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

export class SearchDriversDto {
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
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Buscar por apellido (búsqueda parcial, case-insensitive)',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'Buscar por modelo de vehículo (en vehículos asociados al conductor)',
    example: 'Toyota',
  })
  @IsOptional()
  @IsString()
  carModel?: string;

  @ApiPropertyOptional({
    description:
      'Buscar por placa de vehículo (en vehículos asociados al conductor)',
    example: 'ABC-123',
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({
    description: 'Estado del conductor',
    example: 'online',
    enum: ['online', 'offline', 'busy', 'unavailable'],
  })
  @IsOptional()
  @IsEnum(['online', 'offline', 'busy', 'unavailable'])
  status?: 'online' | 'offline' | 'busy' | 'unavailable';

  @ApiPropertyOptional({
    description: 'Estado de verificación',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'under_review'],
  })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'under_review'])
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'under_review';

  @ApiPropertyOptional({
    description: 'Puede hacer entregas',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  canDoDeliveries?: boolean;

  @ApiPropertyOptional({
    description:
      'Número de asientos del vehículo (en vehículos asociados al conductor)',
    example: 4,
    minimum: 1,
    maximum: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(8)
  carSeats?: number;

  @ApiPropertyOptional({
    description:
      'ID del tipo de vehículo (en vehículos asociados al conductor)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vehicleTypeId?: number;

  // Ordenamiento
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
    enum: [
      'id',
      'firstName',
      'lastName',
      'status',
      'verificationStatus',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsEnum([
    'id',
    'firstName',
    'lastName',
    'status',
    'verificationStatus',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'id'
    | 'firstName'
    | 'lastName'
    | 'status'
    | 'verificationStatus'
    | 'createdAt'
    | 'updatedAt';

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
    description: 'Fecha de actualización desde (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  updatedFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha de actualización hasta (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  updatedTo?: string;
}
