import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsDecimal,
  Min,
  Max,
  IsArray,
  IsObject,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export class CreateCountryDto {
  @ApiProperty({
    description: 'Full country name',
    example: 'United States',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
  })
  @IsString()
  isoCode2: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-3 country code',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  isoCode3?: string | null;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 numeric country code',
    example: 840,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numericCode?: number | null;

  @ApiPropertyOptional({
    description: 'International dialing code',
    example: '+1',
  })
  @IsOptional()
  @IsString()
  phoneCode?: string | null;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'USD',
  })
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Currency full name',
    example: 'United States Dollar',
  })
  @IsOptional()
  @IsString()
  currencyName?: string | null;

  @ApiPropertyOptional({
    description: 'Currency symbol',
    example: '$',
  })
  @IsOptional()
  @IsString()
  currencySymbol?: string | null;

  @ApiPropertyOptional({
    description: 'Business hours configuration',
    example: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
    },
  })
  @IsOptional()
  businessHours?: any;

  @ApiPropertyOptional({
    description: 'Public holidays',
    example: ['2024-01-01', '2024-12-25'],
  })
  @IsOptional()
  publicHolidays?: string[];

  @ApiPropertyOptional({
    description: 'Time restrictions',
    example: { noServiceHours: ['02:00-06:00'] },
  })
  @IsOptional()
  timeRestrictions?: any;

  @ApiPropertyOptional({
    description: 'Regional settings',
    example: { timezone: 'America/New_York', language: 'en-US' },
  })
  @IsOptional()
  regionalSettings?: any;

  @ApiProperty({
    description: 'Primary timezone (IANA format)',
    example: 'America/New_York',
  })
  @IsString()
  timezone: string;

  @ApiProperty({
    description: 'Continent name',
    example: 'North America',
  })
  @IsString()
  continent: string;

  @ApiPropertyOptional({
    description: 'UN region',
    example: 'Americas',
  })
  @IsOptional()
  @IsString()
  region?: string | null;

  @ApiPropertyOptional({
    description: 'UN subregion',
    example: 'Northern America',
  })
  @IsOptional()
  @IsString()
  subregion?: string | null;

  @ApiPropertyOptional({
    description: 'VAT rate percentage',
    example: 8.25,
  })
  @IsOptional()
  vatRate?: number | null;

  @ApiPropertyOptional({
    description: 'Corporate tax rate percentage',
    example: 21.0,
  })
  @IsOptional()
  corporateTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Income tax rate percentage',
    example: 37.0,
  })
  @IsOptional()
  incomeTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Whether country is active for platform operations',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether extra verification is needed',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requiresVerification?: boolean;

  @ApiPropertyOptional({
    description: 'Supported languages (array of language codes)',
    example: ['en', 'es'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[] | null;

  @ApiPropertyOptional({
    description: 'Specific legal requirements',
    example: { requires_id_verification: true, minimum_age: 18 },
  })
  @IsOptional()
  @IsObject()
  legalRequirements?: any | null;

  @ApiPropertyOptional({
    description: 'Flag emoji or URL',
    example: '🇺🇸',
  })
  @IsOptional()
  @IsString()
  flag?: string | null;

  @ApiPropertyOptional({
    description: 'Capital city name',
    example: 'Washington D.C.',
  })
  @IsOptional()
  @IsString()
  capital?: string | null;

  @ApiPropertyOptional({
    description: 'Population count',
    example: 331900000,
  })
  @IsOptional()
  population?: number | null;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: 9833517,
  })
  @IsOptional()
  areaKm2?: number | null;
}

export class UpdateCountryDto extends CreateCountryDto {
  @ApiPropertyOptional({
    description: 'Country ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class CountryListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by country name or code',
    example: 'United',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by continent',
    example: 'Europe',
  })
  @IsOptional()
  @IsString()
  continent?: string;

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
    enum: ['name', 'isoCode2', 'continent', 'createdAt'],
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

export class CountryResponseDto {
  @ApiProperty({
    description: 'Country ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full country name',
    example: 'United States',
  })
  name: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 code',
    example: 'US',
  })
  isoCode2: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-3 code',
    example: 'USA',
  })
  isoCode3?: string | null;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 numeric code',
    example: 840,
  })
  numericCode?: number | null;

  @ApiPropertyOptional({
    description: 'International dialing code',
    example: '+1',
  })
  phoneCode?: string | null;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Currency name',
    example: 'United States Dollar',
  })
  currencyName?: string | null;

  @ApiPropertyOptional({
    description: 'Currency symbol',
    example: '$',
  })
  currencySymbol?: string | null;

  @ApiProperty({
    description: 'Primary timezone',
    example: 'America/New_York',
  })
  timezone: string;

  @ApiProperty({
    description: 'Continent',
    example: 'North America',
  })
  continent: string;

  @ApiPropertyOptional({
    description: 'UN region',
    example: 'Americas',
  })
  region?: string | null;

  @ApiPropertyOptional({
    description: 'UN subregion',
    example: 'Northern America',
  })
  subregion?: string | null;

  @ApiPropertyOptional({
    description: 'VAT rate',
    example: 8.25,
  })
  vatRate?: number | null;

  @ApiPropertyOptional({
    description: 'Corporate tax rate',
    example: 21.0,
  })
  corporateTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Income tax rate',
    example: 37.0,
  })
  incomeTaxRate?: number | null;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Requires verification',
    example: false,
  })
  requiresVerification: boolean;

  @ApiPropertyOptional({
    description: 'Supported languages',
    example: ['en', 'es'],
  })
  supportedLanguages?: string[] | null;

  @ApiPropertyOptional({
    description: 'Legal requirements',
  })
  legalRequirements?: any | null;

  @ApiPropertyOptional({
    description: 'Flag emoji',
    example: '🇺🇸',
  })
  flag?: string | null;

  @ApiPropertyOptional({
    description: 'Capital city',
    example: 'Washington D.C.',
  })
  capital?: string | null;

  @ApiPropertyOptional({
    description: 'Population',
    example: 331900000,
  })
  population?: number | null;

  @ApiPropertyOptional({
    description: 'Area in km²',
    example: 9833517,
  })
  areaKm2?: number | null;

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
    description: 'Business hours configuration',
  })
  businessHours?: any;

  @ApiPropertyOptional({
    description: 'Public holidays',
    example: ['2024-01-01', '2024-12-25'],
  })
  publicHolidays?: string[];

  @ApiPropertyOptional({
    description: 'Time-based restrictions',
  })
  timeRestrictions?: any;

  @ApiPropertyOptional({
    description: 'Custom regional settings',
  })
  regionalSettings?: any;

  @ApiPropertyOptional({
    description: 'Number of states/provinces',
    example: 50,
  })
  statesCount?: number | null;
}

// DTO for country list items (minimal data for performance)
export class CountryListItemDto {
  @ApiProperty({
    description: 'Country ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full country name',
    example: 'United States',
  })
  name: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 code',
    example: 'US',
  })
  isoCode2: string;

  @ApiProperty({
    description: 'Continent',
    example: 'North America',
  })
  continent: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of states/provinces',
    example: 50,
  })
  statesCount: number;
}

export class CountryListResponseDto {
  @ApiProperty({
    description: 'Array of countries',
    type: [CountryListItemDto],
  })
  countries: CountryListItemDto[];

  @ApiProperty({
    description: 'Total number of countries',
    example: 195,
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
    example: 10,
  })
  totalPages: number;
}

export class BulkImportResultDto {
  @ApiProperty({
    description: 'Total number of records processed',
    example: 195,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of countries successfully imported',
    example: 180,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of records that failed to import',
    example: 15,
  })
  failed: number;

  @ApiProperty({
    description: 'Number of records skipped (duplicates, etc.)',
    example: 5,
  })
  skipped: number;

  @ApiPropertyOptional({
    description: 'List of errors encountered during import',
    type: [Object],
  })
  errors?: Array<{
    row: number;
    field?: string;
    value?: string;
    error: string;
  }>;

  @ApiPropertyOptional({
    description: 'List of skipped records with reasons',
    type: [Object],
  })
  skippedRecords?: Array<{
    row: number;
    field?: string;
    value?: string;
    reason: string;
    data: any;
  }>;

  @ApiProperty({
    description: 'Import duration in milliseconds',
    example: 2500,
  })
  duration: number;
}

export class CountryCsvRowDto {
  @ApiProperty({
    description: 'Country name',
    example: 'United States',
  })
  name: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 code',
    example: 'US',
  })
  isoCode2: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-3 code',
    example: 'USA',
  })
  isoCode3?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 numeric code',
    example: '840',
  })
  numericCode?: string;

  @ApiPropertyOptional({
    description: 'International dialing code',
    example: '+1',
  })
  phoneCode?: string;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'USD',
  })
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Currency name',
    example: 'United States Dollar',
  })
  currencyName?: string;

  @ApiPropertyOptional({
    description: 'Currency symbol',
    example: '$',
  })
  currencySymbol?: string;

  @ApiProperty({
    description: 'Primary timezone (IANA format)',
    example: 'America/New_York',
  })
  timezone: string;

  @ApiProperty({
    description: 'Continent name',
    example: 'North America',
  })
  continent: string;

  @ApiPropertyOptional({
    description: 'UN region',
    example: 'Americas',
  })
  region?: string;

  @ApiPropertyOptional({
    description: 'UN subregion',
    example: 'Northern America',
  })
  subregion?: string;

  @ApiPropertyOptional({
    description: 'VAT rate percentage',
    example: '8.25',
  })
  vatRate?: string;

  @ApiPropertyOptional({
    description: 'Corporate tax rate percentage',
    example: '21.0',
  })
  corporateTaxRate?: string;

  @ApiPropertyOptional({
    description: 'Income tax rate percentage',
    example: '37.0',
  })
  incomeTaxRate?: string;

  @ApiPropertyOptional({
    description: 'Capital city name',
    example: 'Washington D.C.',
  })
  capital?: string;

  @ApiPropertyOptional({
    description: 'Population count',
    example: '331900000',
  })
  population?: string;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: '9833517',
  })
  areaKm2?: string;

  @ApiPropertyOptional({
    description: 'Supported languages (comma-separated)',
    example: 'en,es',
  })
  supportedLanguages?: string;

  @ApiPropertyOptional({
    description: 'Business hours configuration',
    example: { monday: '00:00-23:59', tuesday: '00:00-23:59' },
  })
  @IsOptional()
  @IsObject()
  businessHours?: any;

  @ApiPropertyOptional({
    description: 'Public holidays and special dates',
    example: ['2024-01-01', '2024-12-25'],
  })
  @IsOptional()
  publicHolidays?: any;

  @ApiPropertyOptional({
    description: 'Time-based restrictions (curfews, etc.)',
    example: {
      curfew: '22:00-06:00',
      rush_hour: ['07:00-09:00', '17:00-19:00'],
    },
  })
  @IsOptional()
  @IsObject()
  timeRestrictions?: any;

  @ApiPropertyOptional({
    description: 'Custom regional settings',
    example: { max_fare: 100, min_fare: 5 },
  })
  @IsOptional()
  @IsObject()
  regionalSettings?: any;

  @ApiPropertyOptional({
    description: 'Flag emoji',
    example: '🇺🇸',
  })
  flag?: string;
}

// State/Province DTOs
export class CreateStateDto {
  @ApiProperty({
    description: 'Full state/province name',
    example: 'California',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'State/province code',
    example: 'CA',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Country ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  countryId: number;

  @ApiPropertyOptional({
    description: 'State center latitude',
    example: 36.7783,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'State center longitude',
    example: -119.4179,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'State-specific timezone',
    example: 'America/Los_Angeles',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Whether state is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Pricing multiplier for this state',
    example: 1.2,
  })
  @IsOptional()
  pricingMultiplier?: Decimal;

  @ApiPropertyOptional({
    description: 'Additional service fee percentage',
    example: 2.5,
  })
  @IsOptional()
  serviceFee?: Decimal;

  @ApiPropertyOptional({
    description: 'Capital city name',
    example: 'Sacramento',
  })
  @IsOptional()
  @IsString()
  capital?: string;

  @ApiPropertyOptional({
    description: 'Population count',
    example: 39538223,
  })
  @IsOptional()
  population?: bigint;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: 423967,
  })
  @IsOptional()
  areaKm2?: Decimal;
}

export class UpdateStateDto extends CreateStateDto {
  @ApiPropertyOptional({
    description: 'State ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class StateResponseDto {
  @ApiProperty({
    description: 'State ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full state/province name',
    example: 'California',
  })
  name: string;

  @ApiProperty({
    description: 'State/province code',
    example: 'CA',
  })
  code: string;

  @ApiProperty({
    description: 'Country ID',
    example: 1,
  })
  countryId: number;

  @ApiPropertyOptional({
    description: 'State center latitude',
    example: 36.7783,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'State center longitude',
    example: -119.4179,
  })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'State-specific timezone',
    example: 'America/Los_Angeles',
  })
  timezone?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.2,
  })
  pricingMultiplier: number;

  @ApiPropertyOptional({
    description: 'Additional service fee',
    example: 2.5,
  })
  serviceFee?: number;

  @ApiPropertyOptional({
    description: 'Capital city name',
    example: 'Sacramento',
  })
  capital?: string;

  @ApiPropertyOptional({
    description: 'Population count',
    example: 39538223,
  })
  population?: number;

  @ApiPropertyOptional({
    description: 'Area in km²',
    example: 423967,
  })
  areaKm2?: number;

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
    description: 'Country information',
  })
  country?: {
    id: number;
    name: string;
    isoCode2: string;
  };

  @ApiPropertyOptional({
    description: 'Number of cities',
    example: 58,
  })
  citiesCount?: number;
}

export class StateListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by state name or code',
    example: 'California',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by country ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

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
    enum: ['name', 'code', 'createdAt'],
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

// DTO for state list items (minimal data for performance)
export class StateListItemDto {
  @ApiProperty({
    description: 'State ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full state/province name',
    example: 'California',
  })
  name: string;

  @ApiProperty({
    description: 'State/province code',
    example: 'CA',
  })
  code: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
  })
  countryName: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of cities',
    example: 58,
  })
  citiesCount: number;
}

export class StateListResponseDto {
  @ApiProperty({
    description: 'Array of states',
    type: [StateListItemDto],
  })
  states: StateListItemDto[];

  @ApiProperty({
    description: 'Total number of states',
    example: 50,
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
    example: 3,
  })
  totalPages: number;
}

// City DTOs
export class CreateCityDto {
  @ApiProperty({
    description: 'Full city name',
    example: 'Los Angeles',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'State ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  stateId: number;

  @ApiProperty({
    description: 'City center latitude',
    example: 34.0522,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'City center longitude',
    example: -118.2437,
  })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({
    description: 'City-specific timezone',
    example: 'America/Los_Angeles',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Whether city is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Pricing multiplier for this city',
    example: 1.3,
  })
  @IsOptional()
  pricingMultiplier?: Decimal;

  @ApiPropertyOptional({
    description: 'Additional service fee percentage',
    example: 1.5,
  })
  @IsOptional()
  serviceFee?: Decimal;

  @ApiPropertyOptional({
    description: 'Service radius in kilometers',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  serviceRadius?: number;

  @ApiPropertyOptional({
    description: 'Geographic boundaries (GeoJSON)',
    example: '{"type": "Polygon", "coordinates": [[[ ... ]]]}',
  })
  @IsOptional()
  boundaries?: any;

  @ApiPropertyOptional({
    description: 'Restricted areas within the city',
    example: ['airport', 'military_zone'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictedAreas?: string[];

  @ApiPropertyOptional({
    description: 'High-demand premium zones',
    example: ['downtown', 'stadium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  premiumZones?: string[];

  @ApiPropertyOptional({
    description: 'Population count',
    example: 3976322,
  })
  @IsOptional()
  population?: bigint;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: 1302,
  })
  @IsOptional()
  areaKm2?: Decimal;

  @ApiPropertyOptional({
    description: 'Elevation in meters',
    example: 89,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  elevation?: number;

  @ApiPropertyOptional({
    description: 'Postal codes array',
    example: ['90001', '90002', '90003'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postalCodes?: string[];
}

export class UpdateCityDto extends CreateCityDto {
  @ApiPropertyOptional({
    description: 'City ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class CityResponseDto {
  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full city name',
    example: 'Los Angeles',
  })
  name: string;

  @ApiProperty({
    description: 'State ID',
    example: 1,
  })
  stateId: number;

  @ApiProperty({
    description: 'City center latitude',
    example: 34.0522,
  })
  latitude: number;

  @ApiProperty({
    description: 'City center longitude',
    example: -118.2437,
  })
  longitude: number;

  @ApiPropertyOptional({
    description: 'City-specific timezone',
    example: 'America/Los_Angeles',
  })
  timezone?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.3,
  })
  pricingMultiplier: number;

  @ApiPropertyOptional({
    description: 'Additional service fee',
    example: 1.5,
  })
  serviceFee?: number;

  @ApiProperty({
    description: 'Service radius in km',
    example: 50,
  })
  serviceRadius: number;

  @ApiPropertyOptional({
    description: 'Geographic boundaries',
  })
  boundaries?: any;

  @ApiPropertyOptional({
    description: 'Restricted areas',
    example: ['airport', 'military_zone'],
  })
  restrictedAreas?: string[];

  @ApiPropertyOptional({
    description: 'Premium zones',
    example: ['downtown', 'stadium'],
  })
  premiumZones?: string[];

  @ApiPropertyOptional({
    description: 'Population count',
    example: 3976322,
  })
  population?: number;

  @ApiPropertyOptional({
    description: 'Area in km²',
    example: 1302,
  })
  areaKm2?: number;

  @ApiPropertyOptional({
    description: 'Elevation in meters',
    example: 89,
  })
  elevation?: number;

  @ApiPropertyOptional({
    description: 'Postal codes',
    example: ['90001', '90002', '90003'],
  })
  postalCodes?: string[];

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
    description: 'State and country information',
  })
  state?: {
    id: number;
    name: string;
    code: string;
    country: {
      id: number;
      name: string;
      isoCode2: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Number of service zones',
    example: 5,
  })
  serviceZonesCount?: number;
}

export class CityListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by city name',
    example: 'Los Angeles',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by state ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'Filter by country ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

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
    enum: ['name', 'createdAt', 'population'],
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

// DTO for city list items (minimal data for performance)
export class CityListItemDto {
  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full city name',
    example: 'Los Angeles',
  })
  name: string;

  @ApiProperty({
    description: 'State name',
    example: 'California',
  })
  stateName: string;

  @ApiProperty({
    description: 'City center latitude',
    example: 34.0522,
  })
  latitude: number;

  @ApiProperty({
    description: 'City center longitude',
    example: -118.2437,
  })
  longitude: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Population count',
    example: 3976322,
  })
  population: number | null;
}

export class CityListResponseDto {
  @ApiProperty({
    description: 'Array of cities',
    type: [CityListItemDto],
  })
  cities: CityListItemDto[];

  @ApiProperty({
    description: 'Total number of cities',
    example: 100,
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
    example: 5,
  })
  totalPages: number;
}

// Service Zone DTOs
export class CreateServiceZoneDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'Downtown LA',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  cityId: number;

  @ApiProperty({
    description: 'Zone type',
    example: 'premium',
    enum: ['regular', 'premium', 'restricted'],
  })
  @IsString()
  @IsIn(['regular', 'premium', 'restricted'])
  zoneType: 'regular' | 'premium' | 'restricted' = 'regular';

  @ApiProperty({
    description: 'Geographic boundaries (GeoJSON Polygon)',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-118.25, 34.05],
          [-118.23, 34.05],
          [-118.23, 34.03],
          [-118.25, 34.03],
          [-118.25, 34.05],
        ],
      ],
    },
  })
  @IsObject()
  boundaries: any;

  @ApiProperty({
    description: 'Zone center latitude',
    example: 34.0522,
  })
  @IsNumber()
  centerLat: number;

  @ApiProperty({
    description: 'Zone center longitude',
    example: -118.2437,
  })
  @IsNumber()
  centerLng: number;

  @ApiPropertyOptional({
    description: 'Whether zone is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Pricing multiplier for this zone',
    example: 1.2,
  })
  @IsOptional()
  pricingMultiplier?: Decimal;

  @ApiPropertyOptional({
    description: 'Maximum drivers allowed in zone',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxDrivers?: number;

  @ApiPropertyOptional({
    description: 'Minimum drivers required in zone',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minDrivers?: number;

  @ApiPropertyOptional({
    description: 'Peak hours configuration',
    example: {
      weekdays: ['07:00-09:00', '17:00-19:00'],
      weekends: ['10:00-22:00'],
    },
  })
  @IsOptional()
  @IsObject()
  peakHours?: any;

  @ApiPropertyOptional({
    description: 'Demand-based pricing multiplier',
    example: 1.5,
  })
  @IsOptional()
  demandMultiplier?: Decimal;
}

export class UpdateServiceZoneDto extends CreateServiceZoneDto {
  @ApiPropertyOptional({
    description: 'Zone ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class ServiceZoneResponseDto {
  @ApiProperty({
    description: 'Zone ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Zone name',
    example: 'Downtown LA',
  })
  name: string;

  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  cityId: number;

  @ApiProperty({
    description: 'Zone type',
    example: 'premium',
    enum: ['regular', 'premium', 'restricted'],
  })
  zoneType: 'regular' | 'premium' | 'restricted';

  @ApiProperty({
    description: 'Geographic boundaries',
  })
  boundaries: any;

  @ApiProperty({
    description: 'Zone center latitude',
    example: 34.0522,
  })
  centerLat: number;

  @ApiProperty({
    description: 'Zone center longitude',
    example: -118.2437,
  })
  centerLng: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.2,
  })
  pricingMultiplier: number;

  @ApiPropertyOptional({
    description: 'Maximum drivers allowed',
    example: 100,
  })
  maxDrivers?: number;

  @ApiPropertyOptional({
    description: 'Minimum drivers required',
    example: 10,
  })
  minDrivers?: number;

  @ApiPropertyOptional({
    description: 'Peak hours configuration',
  })
  peakHours?: any;

  @ApiProperty({
    description: 'Demand multiplier',
    example: 1.5,
  })
  demandMultiplier: number;

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
    description: 'City information',
  })
  city?: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      code: string;
      country: {
        id: number;
        name: string;
        isoCode2: string;
      };
    };
  };
}

export class ServiceZoneListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by zone name',
    example: 'Downtown',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by city ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Filter by state ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'Filter by zone type',
    example: 'premium',
    enum: ['regular', 'premium', 'restricted'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['regular', 'premium', 'restricted'])
  zoneType?: 'regular' | 'premium' | 'restricted';

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
    example: 'id',
    enum: ['id', 'zoneType', 'pricingMultiplier', 'demandMultiplier'],
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

export class ServiceZoneListItemDto {
  @ApiProperty({
    description: 'Zone ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Zone type',
    example: 'premium',
    enum: ['regular', 'premium', 'restricted'],
  })
  zoneType: 'regular' | 'premium' | 'restricted';

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.2,
  })
  pricingMultiplier: number;

  @ApiProperty({
    description: 'Demand multiplier',
    example: 1.5,
  })
  demandMultiplier: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;
}

export class ServiceZoneListResponseDto {
  @ApiProperty({
    description: 'Array of service zones',
    type: [ServiceZoneListItemDto],
  })
  zones: ServiceZoneListItemDto[];

  @ApiProperty({
    description: 'Total number of zones',
    example: 50,
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
    example: 5,
  })
  totalPages: number;
}

export class ZoneValidationResultDto {
  @ApiProperty({
    description: 'Whether the zone is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation errors',
    example: ['Zone overlaps with existing zone XYZ'],
  })
  errors: string[];

  @ApiProperty({
    description: 'Validation warnings',
    example: ['Zone covers large area, consider splitting'],
  })
  warnings: string[];

  @ApiPropertyOptional({
    description: 'Coverage statistics',
  })
  coverage?: {
    areaKm2: number;
    overlapPercentage: number;
    gapPercentage: number;
  };
}

export class CityCoverageAnalysisDto {
  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  cityId: number;

  @ApiProperty({
    description: 'City name',
    example: 'Los Angeles',
  })
  cityName: string;

  @ApiProperty({
    description: 'Total coverage percentage',
    example: 85.5,
  })
  totalCoverage: number;

  @ApiProperty({
    description: 'Overlapping area percentage',
    example: 2.3,
  })
  overlappingArea: number;

  @ApiProperty({
    description: 'Uncovered area percentage',
    example: 12.2,
  })
  uncoveredArea: number;

  @ApiProperty({
    description: 'Coverage by zone type',
    example: {
      regular: 65.0,
      premium: 20.5,
      restricted: 0.0,
    },
  })
  coverageByType: {
    regular: number;
    premium: number;
    restricted: number;
  };

  @ApiProperty({
    description: 'Zones with issues',
    example: ['Zone 1 overlaps with Zone 2'],
  })
  issues: string[];

  @ApiProperty({
    description: 'Recommendations for improvement',
    example: ['Add zone for uncovered area in northwest'],
  })
  recommendations: string[];
}

// =========================================
// SECTION 7: PAGINATED RESPONSE DTOS
// =========================================

export class CityServiceZonesListResponseDto {
  @ApiProperty({
    description: 'Array of service zones for the city',
    type: [ServiceZoneResponseDto],
  })
  zones: ServiceZoneResponseDto[];

  @ApiProperty({
    description: 'Total number of zones',
    example: 50,
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
    example: 5,
  })
  totalPages: number;
}

export class PricingMatrixItemDto {
  @ApiProperty({
    description: 'Zone ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Zone name',
    example: 'Downtown LA',
  })
  name: string;

  @ApiProperty({
    description: 'Zone type',
    example: 'premium',
    enum: ['regular', 'premium', 'restricted'],
  })
  type: 'regular' | 'premium' | 'restricted';

  @ApiProperty({
    description: 'Pricing multiplier',
    example: 1.2,
  })
  pricingMultiplier: number;

  @ApiProperty({
    description: 'Demand multiplier',
    example: 1.5,
  })
  demandMultiplier: number;

  @ApiPropertyOptional({
    description: 'Maximum drivers allowed',
    example: 100,
  })
  maxDrivers?: number;

  @ApiPropertyOptional({
    description: 'Minimum drivers required',
    example: 10,
  })
  minDrivers?: number;
}

export class CityPricingMatrixResponseDto {
  @ApiProperty({
    description: 'City ID',
    example: 1,
  })
  cityId: number;

  @ApiProperty({
    description: 'Array of pricing matrix items',
    type: [PricingMatrixItemDto],
  })
  zones: PricingMatrixItemDto[];

  @ApiProperty({
    description: 'Total number of zones',
    example: 50,
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
    example: 5,
  })
  totalPages: number;
}
