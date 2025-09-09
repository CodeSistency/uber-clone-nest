import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'Lista de usuarios con relaciones incluidas',
    type: [Object],
  })
  data: (User & {
    wallet?: { balance: number } | null;
    emergencyContacts?: any[];
    _count?: { rides: number; deliveryOrders: number; ratings: number };
  })[];

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
