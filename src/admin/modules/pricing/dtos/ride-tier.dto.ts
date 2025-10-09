import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateRideTierDto {
  @ApiProperty({
    description: 'Tier name (e.g., UberX, UberXL, Premium)',
    example: 'UberX',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Base fare in cents',
    example: 250,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  baseFare: number;

  @ApiProperty({
    description: 'Minimum fare in cents',
    example: 200,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  minimunFare: number;

  @ApiProperty({
    description: 'Rate per minute in cents',
    example: 15,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  perMinuteRate: number;

  @ApiProperty({
    description: 'Rate per kilometer in cents',
    example: 80,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  perKmRate: number;

  @ApiPropertyOptional({
    description: 'Image URL for the tier',
    example: 'https://example.com/uberx.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Base multiplier for this tier',
    example: 1.0,
    default: 1.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(5.0)
  tierMultiplier?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Surge pricing multiplier',
    example: 1.2,
    default: 1.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(10.0)
  surgeMultiplier?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Demand-based multiplier',
    example: 1.1,
    default: 1.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  demandMultiplier?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Luxury service multiplier',
    example: 1.5,
    default: 1.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(3.0)
  luxuryMultiplier?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Comfort features multiplier',
    example: 1.2,
    default: 1.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(2.0)
  comfortMultiplier?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Minimum number of passengers',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  minPassengers?: number = 1;

  @ApiPropertyOptional({
    description: 'Maximum number of passengers',
    example: 4,
    default: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  maxPassengers?: number = 4;

  @ApiPropertyOptional({
    description: 'Whether tier is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Display priority (higher = more prominent)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number = 1;

  @ApiPropertyOptional({
    description: 'Vehicle type IDs to associate with this tier',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  vehicleTypeIds?: number[];
}

export class UpdateRideTierDto extends CreateRideTierDto {
  @ApiPropertyOptional({
    description: 'Tier ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class RideTierResponseDto {
  @ApiProperty({
    description: 'Tier ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tier name',
    example: 'UberX',
  })
  name: string;

  @ApiProperty({
    description: 'Base fare in cents',
    example: 250,
  })
  baseFare: number;

  @ApiProperty({
    description: 'Minimum fare in cents',
    example: 200,
  })
  minimunFare: number;

  @ApiProperty({
    description: 'Rate per minute in cents',
    example: 15,
  })
  perMinuteRate: number;

  @ApiProperty({
    description: 'Rate per kilometer in cents',
    example: 80,
  })
  perKmRate: number;

  @ApiPropertyOptional({
    description: 'Image URL',
    example: 'https://example.com/uberx.png',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Base multiplier for this tier',
    example: 1.0,
  })
  tierMultiplier: number;

  @ApiProperty({
    description: 'Surge pricing multiplier',
    example: 1.2,
  })
  surgeMultiplier: number;

  @ApiProperty({
    description: 'Demand-based multiplier',
    example: 1.1,
  })
  demandMultiplier: number;

  @ApiProperty({
    description: 'Luxury service multiplier',
    example: 1.5,
  })
  luxuryMultiplier: number;

  @ApiProperty({
    description: 'Comfort features multiplier',
    example: 1.2,
  })
  comfortMultiplier: number;

  @ApiProperty({
    description: 'Minimum number of passengers',
    example: 1,
  })
  minPassengers: number;

  @ApiProperty({
    description: 'Maximum number of passengers',
    example: 4,
  })
  maxPassengers: number;

  @ApiProperty({
    description: 'Whether tier is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Display priority (higher = more prominent)',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of rides using this tier',
    example: 1500,
  })
  ridesCount?: number;

  @ApiPropertyOptional({
    description: 'Associated vehicle types with IDs and names',
    example: [
      { id: 1, name: 'car', displayName: 'Carro' },
      { id: 2, name: 'motorcycle', displayName: 'Moto' }
    ],
  })
  vehicleTypes?: Array<{
    id: number;
    name: string;
    displayName: string;
  }>;
}

export class RideTierListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by tier name',
    example: 'UberX',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'name',
    enum: ['name', 'baseFare', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class RideTierListItemDto {
  @ApiProperty({
    description: 'Tier ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tier name',
    example: 'UberX',
  })
  name: string;

  @ApiProperty({
    description: 'Base fare in cents',
    example: 250,
  })
  baseFare: number;

  @ApiProperty({
    description: 'Minimum fare in cents',
    example: 200,
  })
  minimunFare: number;

  @ApiProperty({
    description: 'Rate per minute in cents',
    example: 15,
  })
  perMinuteRate: number;

  @ApiProperty({
    description: 'Minimum passengers',
    example: 1,
  })
  minPassengers: number;

  @ApiProperty({
    description: 'Maximum passengers',
    example: 4,
  })
  maxPassengers: number;

  @ApiProperty({
    description: 'Display priority',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Whether tier is active',
    example: true,
  })
  isActive: boolean;
}

export class RideTierListResponseDto {
  @ApiProperty({
    description: 'Array of ride tiers (reduced data for list view)',
    type: [RideTierListItemDto],
  })
  tiers: RideTierListItemDto[];

  @ApiProperty({
    description: 'Total number of tiers',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total pages',
    example: 1,
  })
  totalPages: number;
}

export class PricingCalculationDto {
  @ApiProperty({
    description: 'Tier ID to use for calculation',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  tierId: number;

  @ApiProperty({
    description: 'Trip distance in kilometers',
    example: 5.2,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  distance: number;

  @ApiProperty({
    description: 'Trip duration in minutes',
    example: 15,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    description: 'Country ID for regional pricing',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID for regional pricing',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID for regional pricing',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Service zone ID for zone-specific pricing',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Surge multiplier for dynamic pricing',
    example: 1.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(10)
  surgeMultiplier?: number = 1.0;
}

export class PricingCalculationResultDto {
  @ApiProperty({
    description: 'Tier used for calculation',
  })
  tier: {
    id: number;
    name: string;
    baseFare: number;
    minimunFare: number;
    perMinuteRate: number;
    perKmRate: number;
    tierMultiplier: number;
    surgeMultiplier: number;
    demandMultiplier: number;
    luxuryMultiplier: number;
    comfortMultiplier: number;
  };

  @ApiProperty({
    description: 'Base pricing components',
  })
  basePricing: {
    baseFare: number;
    distanceCost: number;
    timeCost: number;
    subtotal: number;
    tierAdjustedTotal: number;
  };

  @ApiProperty({
    description: 'Regional multipliers applied',
  })
  regionalMultipliers: {
    countryMultiplier: number;
    stateMultiplier: number;
    cityMultiplier: number;
    zoneMultiplier: number;
    totalMultiplier: number;
  };

  @ApiProperty({
    description: 'Dynamic pricing factors',
  })
  dynamicPricing: {
    surgeMultiplier: number;
    demandMultiplier: number;
    totalDynamicMultiplier: number;
  };

  @ApiProperty({
    description: 'Final pricing breakdown',
  })
  finalPricing: {
    baseAmount: number;
    regionalAdjustments: number;
    dynamicAdjustments: number;
    serviceFees: number;
    taxes: number;
    totalAmount: number;
  };

  @ApiProperty({
    description: 'Pricing metadata',
  })
  metadata: {
    currency: string;
    distanceUnit: string;
    calculationTimestamp: Date;
    appliedRules: string[];
  };
}

export class PricingValidationDto {
  @ApiProperty({
    description: 'Tier configuration to validate',
    type: CreateRideTierDto,
  })
  @Type(() => CreateRideTierDto)
  tier: CreateRideTierDto;

  @ApiPropertyOptional({
    description: 'Compare with existing tier',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compareWithTierId?: number;
}

export class PricingValidationResultDto {
  @ApiProperty({
    description: 'Whether the pricing is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation errors',
    example: ['Base fare too low', 'Per mile rate too high'],
  })
  errors: string[];

  @ApiProperty({
    description: 'Validation warnings',
    example: ['Pricing may be too competitive'],
  })
  warnings: string[];

  @ApiPropertyOptional({
    description: 'Comparison with existing tier',
  })
  comparison?: {
    existingTier: {
      id: number;
      name: string;
      baseFare: number;
      perMinuteRate: number;
      perKmRate: number;
    };
    differences: {
      baseFare: number;
      perMinuteRate: number;
      perKmRate: number;
    };
    competitiveness: 'more_expensive' | 'similar' | 'more_competitive';
  };
}

export class VehicleTypeResponseDto {
  @ApiProperty({
    description: 'Vehicle type ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Vehicle type name',
    example: 'car',
  })
  name: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Carro',
  })
  displayName: string;

  @ApiPropertyOptional({
    description: 'Icon URL',
    example: '🚗',
  })
  icon?: string;

  @ApiProperty({
    description: 'Whether the vehicle type is active',
    example: true,
  })
  isActive: boolean;
}

export class VehicleTypesResponseDto {
  @ApiProperty({
    description: 'Array of vehicle types',
    type: [VehicleTypeResponseDto],
  })
  vehicleTypes: VehicleTypeResponseDto[];
}
