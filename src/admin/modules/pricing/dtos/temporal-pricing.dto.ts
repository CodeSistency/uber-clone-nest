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

export class TemporalPricingRuleListResponseDto {
  @ApiProperty({
    description: 'Array of temporal pricing rules',
    type: [TemporalPricingRuleResponseDto],
  })
  rules: TemporalPricingRuleResponseDto[];

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
