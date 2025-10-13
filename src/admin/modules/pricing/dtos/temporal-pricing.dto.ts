import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  ValidateNested,
  IsDateString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateTemporalPricingRuleDto {
  @ApiProperty({
    description: 'Rule name',
    example: 'Morning Peak Hours',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Surge pricing during morning rush hour',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Rule type',
    example: 'time_range',
    enum: ['time_range', 'day_of_week', 'date_specific', 'seasonal'],
  })
  @IsString()
  @IsIn(['time_range', 'day_of_week', 'date_specific', 'seasonal'])
  ruleType: 'time_range' | 'day_of_week' | 'date_specific' | 'seasonal';

  @ApiPropertyOptional({
    description: 'Start time in HH:MM format',
    example: '07:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:MM format',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Days of week (0=Sunday, 6=Saturday)',
    example: [1, 2, 3, 4, 5],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    description: 'Specific dates (YYYY-MM-DD format)',
    example: ['2024-01-01', '2024-12-25'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificDates?: string[];

  @ApiPropertyOptional({
    description: 'Date ranges with start and end dates',
    example: [{ start: '2024-06-01', end: '2024-08-31' }],
  })
  @IsOptional()
  @IsArray()
  dateRanges?: Array<{ start: string; end: string }>;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.4,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(10.0)
  multiplier: number;

  @ApiPropertyOptional({
    description: 'Rule priority (higher = applied first)',
    example: 10,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number = 1;

  @ApiPropertyOptional({
    description: 'Country ID for geographic scope',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID for geographic scope',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID for geographic scope',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Zone ID for geographic scope',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Whether rule is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether to auto-apply the rule',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoApply?: boolean = true;
}

export class UpdateTemporalPricingRuleDto extends CreateTemporalPricingRuleDto {
  @ApiPropertyOptional({
    description: 'Rule ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class TemporalPricingRuleResponseDto {
  @ApiProperty({
    description: 'Rule ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Rule name',
    example: 'Morning Peak Hours',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Surge pricing during morning rush hour',
  })
  description?: string;

  @ApiProperty({
    description: 'Rule type',
    example: 'time_range',
  })
  ruleType: string;

  @ApiPropertyOptional({
    description: 'Start time',
    example: '07:00',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time',
    example: '09:00',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Days of week',
    example: [1, 2, 3, 4, 5],
  })
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    description: 'Specific dates',
    example: ['2024-01-01', '2024-12-25'],
  })
  specificDates?: string[];

  @ApiPropertyOptional({
    description: 'Date ranges',
    example: [{ start: '2024-06-01', end: '2024-08-31' }],
  })
  dateRanges?: Array<{ start: string; end: string }>;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.4,
  })
  multiplier: number;

  @ApiProperty({
    description: 'Rule priority',
    example: 10,
  })
  priority: number;

  @ApiPropertyOptional({
    description: 'Country ID',
    example: 1,
  })
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID',
    example: 5,
  })
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID',
    example: 25,
  })
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Zone ID',
    example: 10,
  })
  zoneId?: number;

  @ApiProperty({
    description: 'Whether rule is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether to auto-apply',
    example: true,
  })
  autoApply: boolean;

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
    description: 'Associated country',
  })
  country?: {
    id: number;
    name: string;
    isoCode2: string;
  };

  @ApiPropertyOptional({
    description: 'Associated state',
  })
  state?: {
    id: number;
    name: string;
    code: string;
  };

  @ApiPropertyOptional({
    description: 'Associated city',
  })
  city?: {
    id: number;
    name: string;
  };

  @ApiPropertyOptional({
    description: 'Associated zone',
  })
  zone?: {
    id: number;
    name: string;
  };
}

export class TemporalPricingRuleListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by rule name',
    example: 'Peak',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by rule type',
    example: 'time_range',
    enum: ['time_range', 'day_of_week', 'date_specific', 'seasonal'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['time_range', 'day_of_week', 'date_specific', 'seasonal'])
  ruleType?: string;

  @ApiPropertyOptional({
    description: 'Filter by geographic scope',
    example: 'country',
    enum: ['global', 'country', 'state', 'city', 'zone'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['global', 'country', 'state', 'city', 'zone'])
  scope?: string;

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
    example: 'priority',
    enum: ['name', 'ruleType', 'multiplier', 'priority', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
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

export class TemporalPricingRuleListItemDto {
  @ApiProperty({
    description: 'Rule ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Rule name',
    example: 'Morning Peak Hours',
  })
  name: string;

  @ApiProperty({
    description: 'Rule type',
    example: 'time_range',
    enum: ['time_range', 'day_of_week', 'date_specific', 'seasonal'],
  })
  ruleType: string;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.4,
  })
  multiplier: number;

  @ApiProperty({
    description: 'Rule priority',
    example: 10,
  })
  priority: number;

  @ApiProperty({
    description: 'Whether rule is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Geographic scope summary',
    example: 'Country: Venezuela',
  })
  scope?: string;
}

export class TemporalPricingRuleListResponseDto {
  @ApiProperty({
    description: 'Array of temporal pricing rules (reduced data for list view)',
    type: [TemporalPricingRuleListItemDto],
  })
  rules: TemporalPricingRuleListItemDto[];

  @ApiProperty({
    description: 'Total number of rules',
    example: 25,
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
    example: 2,
  })
  totalPages: number;
}

export class TemporalPricingEvaluationDto {
  @ApiProperty({
    description: 'Date and time to evaluate',
    example: '2024-01-15T08:30:00Z',
  })
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional({
    description: 'Country ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Zone ID',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;
}

export class TemporalPricingEvaluationResultDto {
  @ApiProperty({
    description: 'Evaluated date and time',
    example: '2024-01-15T08:30:00Z',
  })
  evaluatedAt: string;

  @ApiProperty({
    description: 'Day of week (0=Sunday, 6=Saturday)',
    example: 1,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Time in HH:MM format',
    example: '08:30',
  })
  time: string;

  @ApiProperty({
    description: 'Applicable rules found',
  })
  applicableRules: Array<{
    id: number;
    name: string;
    ruleType: string;
    multiplier: number;
    priority: number;
  }>;

  @ApiProperty({
    description: 'Highest priority rule applied',
  })
  appliedRule?: {
    id: number;
    name: string;
    ruleType: string;
    multiplier: number;
    priority: number;
  };

  @ApiProperty({
    description: 'Combined multiplier from all applicable rules',
    example: 1.4,
  })
  combinedMultiplier: number;

  @ApiProperty({
    description: 'Geographic scope considered',
  })
  scope: {
    country?: string;
    state?: string;
    city?: string;
    zone?: string;
  };
}

export class CreateStandardTemporalRulesDto {
  @ApiPropertyOptional({
    description: 'Country ID to create rules for',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID to create rules for',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID to create rules for',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;
}

export class BulkTemporalRuleUpdateDto {
  @ApiProperty({
    description: 'Rule IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ruleIds: number[];

  @ApiProperty({
    description: 'Fields to update',
    example: { multiplier: 1.5, isActive: false },
  })
  @IsObject()
  updates: Partial<CreateTemporalPricingRuleDto>;
}

export class SimulatePricingDto {
  @ApiProperty({
    description: 'Tier ID to use for pricing calculation',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  tierId: number;

  @ApiProperty({
    description: 'Trip distance in kilometers',
    example: 12.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  distance: number;

  @ApiProperty({
    description: 'Trip duration in minutes',
    example: 25,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Date and time for simulation (ISO string)',
    example: '2024-01-15T08:30:00Z',
  })
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional({
    description:
      'Specific temporal rule IDs to apply (overrides automatic evaluation)',
    example: [1, 5, 8],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ruleIds?: number[];

  @ApiPropertyOptional({
    description: 'Country ID for geographic scope',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID for geographic scope',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID for geographic scope',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Zone ID for geographic scope',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;
}

// Simulate Pricing Response DTOs
export class SimulatePricingBasePricingDto {
  @ApiProperty({
    description: 'Base fare amount in cents',
    example: 250,
  })
  baseFare: number;

  @ApiProperty({
    description: 'Distance cost in cents',
    example: 1200,
  })
  distanceCost: number;

  @ApiProperty({
    description: 'Time cost in cents',
    example: 300,
  })
  timeCost: number;

  @ApiProperty({
    description: 'Subtotal before tier multipliers',
    example: 1750,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Total after tier multiplier application',
    example: 2450,
  })
  tierAdjustedTotal: number;
}

export class SimulatePricingRegionalMultipliersDto {
  @ApiProperty({
    description: 'Country pricing multiplier',
    example: 1.0,
  })
  countryMultiplier: number;

  @ApiProperty({
    description: 'State pricing multiplier',
    example: 1.1,
  })
  stateMultiplier: number;

  @ApiProperty({
    description: 'City pricing multiplier',
    example: 1.0,
  })
  cityMultiplier: number;

  @ApiProperty({
    description: 'Zone pricing multiplier',
    example: 0.9,
  })
  zoneMultiplier: number;

  @ApiProperty({
    description: 'Combined regional multiplier',
    example: 0.99,
  })
  totalMultiplier: number;
}

export class SimulatePricingDynamicPricingDto {
  @ApiProperty({
    description: 'Surge pricing multiplier',
    example: 1.0,
  })
  surgeMultiplier: number;

  @ApiProperty({
    description: 'Demand-based multiplier',
    example: 1.0,
  })
  demandMultiplier: number;

  @ApiProperty({
    description: 'Combined dynamic multiplier',
    example: 1.0,
  })
  totalDynamicMultiplier: number;
}

export class SimulatePricingTemporalPricingDto {
  @ApiProperty({
    description: 'Temporal pricing multiplier applied',
    example: 0.7,
  })
  temporalMultiplier: number;

  @ApiProperty({
    description: 'Total after temporal multiplier application',
    example: 1715,
  })
  temporalAdjustedTotal: number;

  @ApiProperty({
    description: 'Adjustment amount due to temporal pricing',
    example: -735,
  })
  temporalAdjustments: number;
}

export class SimulatePricingFinalPricingDto {
  @ApiProperty({
    description: 'Base amount before temporal adjustments',
    example: 2450,
  })
  baseAmount: number;

  @ApiProperty({
    description: 'Regional pricing adjustments',
    example: 0,
  })
  regionalAdjustments: number;

  @ApiProperty({
    description: 'Dynamic pricing adjustments',
    example: 0,
  })
  dynamicAdjustments: number;

  @ApiProperty({
    description: 'Service fees in cents',
    example: 245,
  })
  serviceFees: number;

  @ApiProperty({
    description: 'Taxes in cents',
    example: 196,
  })
  taxes: number;

  @ApiProperty({
    description: 'Total amount with temporal adjustments',
    example: 1715,
  })
  temporalAdjustedTotal: number;

  @ApiProperty({
    description: 'Temporal pricing adjustments',
    example: -735,
  })
  temporalAdjustments: number;

  @ApiProperty({
    description: 'Final total amount including all fees',
    example: 2156,
  })
  totalAmountWithTemporal: number;
}

export class SimulatePricingTierDto {
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

  @ApiProperty({
    description: 'Tier-specific multiplier',
    example: 1.0,
  })
  tierMultiplier: number;

  @ApiProperty({
    description: 'Surge multiplier',
    example: 1.0,
  })
  surgeMultiplier: number;

  @ApiProperty({
    description: 'Demand multiplier',
    example: 1.0,
  })
  demandMultiplier: number;

  @ApiProperty({
    description: 'Luxury multiplier',
    example: 1.0,
  })
  luxuryMultiplier: number;

  @ApiProperty({
    description: 'Comfort multiplier',
    example: 1.0,
  })
  comfortMultiplier: number;
}

export class SimulatePricingMetadataDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Distance unit',
    example: 'kilometers',
  })
  distanceUnit: string;

  @ApiProperty({
    description: 'Calculation timestamp',
    example: '2024-01-15T08:30:00Z',
  })
  calculationTimestamp: Date;

  @ApiProperty({
    description: 'List of applied pricing rules',
    example: ['country_pricing_multiplier', 'temporal_pricing'],
    type: [String],
  })
  appliedRules: string[];

  @ApiProperty({
    description: 'Simulation mode',
    example: 'automatic_evaluation',
    enum: ['manual_rules', 'automatic_evaluation'],
  })
  simulationMode: 'manual_rules' | 'automatic_evaluation';
}

export class SimulatePricingScopeDto {
  @ApiProperty({
    description: 'Country name',
    example: 'Venezuela',
  })
  country: string;

  @ApiProperty({
    description: 'State name',
    example: 'Guárico',
  })
  state: string;

  @ApiProperty({
    description: 'City name',
    example: 'San Juan de los Morros',
  })
  city: string;
}

export class SimulatePricingResponseDto {
  @ApiProperty({
    description: 'Temporal pricing evaluation result',
    type: TemporalPricingEvaluationResultDto,
  })
  temporalEvaluation: TemporalPricingEvaluationResultDto;

  @ApiProperty({
    description: 'Base pricing breakdown',
    type: SimulatePricingBasePricingDto,
  })
  basePricing: SimulatePricingBasePricingDto;

  @ApiProperty({
    description: 'Regional pricing multipliers',
    type: SimulatePricingRegionalMultipliersDto,
  })
  regionalMultipliers: SimulatePricingRegionalMultipliersDto;

  @ApiProperty({
    description: 'Dynamic pricing multipliers',
    type: SimulatePricingDynamicPricingDto,
  })
  dynamicPricing: SimulatePricingDynamicPricingDto;

  @ApiProperty({
    description: 'Temporal pricing application',
    type: SimulatePricingTemporalPricingDto,
  })
  temporalPricing: SimulatePricingTemporalPricingDto;

  @ApiProperty({
    description: 'Final pricing breakdown',
    type: SimulatePricingFinalPricingDto,
  })
  finalPricing: SimulatePricingFinalPricingDto;

  @ApiProperty({
    description: 'Pricing calculation metadata',
    type: SimulatePricingMetadataDto,
  })
  metadata: SimulatePricingMetadataDto;

  @ApiProperty({
    description: 'Ride tier information',
    type: SimulatePricingTierDto,
  })
  tier: SimulatePricingTierDto;

  @ApiProperty({
    description: 'Geographic scope of evaluation',
    type: SimulatePricingScopeDto,
  })
  scope: SimulatePricingScopeDto;
}
