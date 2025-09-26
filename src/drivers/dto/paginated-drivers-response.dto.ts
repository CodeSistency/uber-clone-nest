import { ApiProperty } from '@nestjs/swagger';
import { Driver } from '@prisma/client';

export class PaginatedDriversResponseDto {
  @ApiProperty({
    description: 'Lista de conductores',
    type: [Object],
  })
  data: any[];

  @ApiProperty({
    description: 'Información de paginación',
    type: Object,
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Información de filtros aplicados',
    type: Object,
    required: false,
  })
  filters?: {
    applied: string[];
    searchTerm?: string;
  };
}
