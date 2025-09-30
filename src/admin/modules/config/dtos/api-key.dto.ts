import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAPIKeyDto {
  @ApiProperty({
    description: 'Human readable name for the API key',
    example: 'Stripe Production Secret Key',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Service name',
    example: 'stripe',
    enum: [
      'stripe',
      'twilio',
      'firebase',
      'google_maps',
      'sendgrid',
      'aws',
      'azure',
      'google_analytics',
    ],
  })
  @IsString()
  @IsIn([
    'stripe',
    'twilio',
    'firebase',
    'google_maps',
    'sendgrid',
    'aws',
    'azure',
    'google_analytics',
  ])
  service: string;

  @ApiProperty({
    description: 'Environment',
    example: 'production',
    enum: ['development', 'staging', 'production'],
  })
  @IsString()
  @IsIn(['development', 'staging', 'production'])
  environment: string;

  @ApiProperty({
    description: 'Type of API key',
    example: 'secret',
    enum: [
      'secret',
      'public',
      'private_key',
      'access_token',
      'refresh_token',
      'webhook_secret',
    ],
  })
  @IsString()
  @IsIn([
    'secret',
    'public',
    'private_key',
    'access_token',
    'refresh_token',
    'webhook_secret',
  ])
  keyType: string;

  @ApiProperty({
    description: 'The actual API key value (will be encrypted)',
    example: 'sk_live_1234567890abcdef',
  })
  @IsString()
  keyValue: string;

  @ApiPropertyOptional({
    description: 'Description of the API key',
    example: 'Primary Stripe secret key for production payments',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Rotation policy',
    example: 'auto_90d',
    enum: ['manual', 'auto_30d', 'auto_90d', 'auto_1y'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['manual', 'auto_30d', 'auto_90d', 'auto_1y'])
  rotationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary key for the service/environment',
    example: true,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean = false;

  @ApiPropertyOptional({
    description: 'Access level',
    example: 'write',
    enum: ['read', 'write', 'admin', 'full'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['read', 'write', 'admin', 'full'])
  accessLevel?: string = 'read';

  @ApiPropertyOptional({
    description: 'Rate limit in requests per minute',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  rateLimit?: number;

  @ApiPropertyOptional({
    description: 'Tags for organization',
    example: ['production', 'critical'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateAPIKeyDto {
  @ApiPropertyOptional({
    description: 'API key ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({
    description: 'New key value (leave empty to keep current)',
    example: 'sk_live_new1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  keyValue?: string;

  @ApiPropertyOptional({
    description: 'Human readable name for the API key',
    example: 'Stripe Production Secret Key',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Service name',
    example: 'stripe',
    enum: [
      'stripe',
      'twilio',
      'firebase',
      'google_maps',
      'sendgrid',
      'aws',
      'azure',
      'google_analytics',
    ],
  })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({
    description: 'Environment',
    example: 'production',
    enum: ['development', 'staging', 'production'],
  })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({
    description: 'Type of API key',
    example: 'secret',
    enum: [
      'secret',
      'public',
      'private_key',
      'access_token',
      'refresh_token',
      'webhook_secret',
    ],
  })
  @IsOptional()
  @IsString()
  keyType?: string;

  @ApiPropertyOptional({
    description: 'Description of the API key',
    example: 'Primary Stripe secret key for production payments',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Rotation policy',
    example: 'auto_90d',
    enum: ['manual', 'auto_30d', 'auto_90d', 'auto_1y'],
  })
  @IsOptional()
  @IsString()
  rotationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary key for the service/environment',
    example: true,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Access level',
    example: 'write',
    enum: ['read', 'write', 'admin', 'full'],
  })
  @IsOptional()
  @IsString()
  accessLevel?: string;

  @ApiPropertyOptional({
    description: 'Rate limit in requests per minute',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rateLimit?: number;

  @ApiPropertyOptional({
    description: 'Tags for organization',
    example: ['production', 'critical'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class APIKeyResponseDto {
  @ApiProperty({
    description: 'API key ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Human readable name',
    example: 'Stripe Production Secret Key',
  })
  name: string;

  @ApiProperty({
    description: 'Service name',
    example: 'stripe',
  })
  service: string;

  @ApiProperty({
    description: 'Environment',
    example: 'production',
  })
  environment: string;

  @ApiProperty({
    description: 'Key type',
    example: 'secret',
  })
  keyType: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Primary Stripe secret key for production payments',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Last rotation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastRotated?: Date;

  @ApiPropertyOptional({
    description: 'Rotation policy',
    example: 'auto_90d',
  })
  rotationPolicy?: string;

  @ApiProperty({
    description: 'Whether key is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this is the primary key',
    example: true,
  })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Access level',
    example: 'write',
  })
  accessLevel: string;

  @ApiPropertyOptional({
    description: 'Last used timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastUsed?: Date;

  @ApiProperty({
    description: 'Usage count',
    example: 1250,
  })
  usageCount: number;

  @ApiProperty({
    description: 'Error count',
    example: 5,
  })
  errorCount: number;

  @ApiPropertyOptional({
    description: 'Rate limit',
    example: 100,
  })
  rateLimit?: number;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['production', 'critical'],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'User who created the key',
    example: 'admin@example.com',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'User who updated the key',
    example: 'admin@example.com',
  })
  updatedBy?: string;

  // Note: encryptedKey and keyHash are never returned in responses
}

export class APIKeyListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name or service',
    example: 'stripe',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by service',
    example: 'stripe',
    enum: [
      'stripe',
      'twilio',
      'firebase',
      'google_maps',
      'sendgrid',
      'aws',
      'azure',
      'google_analytics',
    ],
  })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({
    description: 'Filter by environment',
    example: 'production',
    enum: ['development', 'staging', 'production'],
  })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({
    description: 'Filter by key type',
    example: 'secret',
    enum: [
      'secret',
      'public',
      'private_key',
      'access_token',
      'refresh_token',
      'webhook_secret',
    ],
  })
  @IsOptional()
  @IsString()
  keyType?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by primary status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by tags',
    example: ['production'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'service',
    enum: [
      'name',
      'service',
      'environment',
      'lastUsed',
      'usageCount',
      'createdAt',
    ],
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

export class APIKeyListResponseDto {
  @ApiProperty({
    description: 'Array of API keys',
    type: [APIKeyResponseDto],
  })
  keys: APIKeyResponseDto[];

  @ApiProperty({
    description: 'Total number of keys',
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

export class APIKeyRotationDto {
  @ApiProperty({
    description: 'New API key value',
    example: 'sk_live_new1234567890abcdef',
  })
  @IsString()
  newKeyValue: string;

  @ApiPropertyOptional({
    description: 'Reason for rotation',
    example: 'Security breach detected',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkAPIKeyUpdateDto {
  @ApiProperty({
    description: 'API key IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  keyIds: number[];

  @ApiProperty({
    description: 'Fields to update',
    example: { isActive: false, accessLevel: 'read' },
  })
  @IsObject()
  updates: Partial<UpdateAPIKeyDto>;
}

export class CreateStandardAPIKeysDto {
  @ApiPropertyOptional({
    description: 'Services to create standard keys for',
    example: ['stripe', 'twilio', 'firebase'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({
    description: 'Environments to create keys for',
    example: ['development', 'production'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  environments?: string[];
}

export class APIKeyAuditResponseDto {
  @ApiProperty({
    description: 'Audit log ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'API key ID',
    example: 5,
  })
  apiKeyId: number;

  @ApiProperty({
    description: 'Action performed',
    example: 'rotated',
  })
  action: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { reason: 'Security update' },
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: 'User who performed the action',
    example: 'admin@example.com',
  })
  performedBy?: string;

  @ApiProperty({
    description: 'Timestamp of action',
    example: '2024-01-15T10:30:00Z',
  })
  performedAt: Date;

  @ApiPropertyOptional({
    description: 'IP address',
    example: '192.168.1.100',
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;
}

export class APIKeyHealthCheckDto {
  @ApiProperty({
    description: 'Service name',
    example: 'stripe',
  })
  @IsString()
  service: string;

  @ApiPropertyOptional({
    description: 'Environment',
    example: 'production',
  })
  @IsOptional()
  @IsString()
  environment?: string;
}

export class APIKeyHealthStatusDto {
  @ApiProperty({
    description: 'Service name',
    example: 'stripe',
  })
  service: string;

  @ApiProperty({
    description: 'Environment',
    example: 'production',
  })
  environment: string;

  @ApiProperty({
    description: 'Health status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'down', 'maintenance'],
  })
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';

  @ApiPropertyOptional({
    description: 'Response time in milliseconds',
    example: 250,
  })
  responseTime?: number;

  @ApiPropertyOptional({
    description: 'Error message if any',
    example: 'Connection timeout',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'API version',
    example: '2020-08-27',
  })
  version?: string;

  @ApiProperty({
    description: 'Uptime percentage (last 30 days)',
    example: 99.8,
  })
  uptimePercentage: number;

  @ApiProperty({
    description: 'Error rate (last 24 hours)',
    example: 0.5,
  })
  errorRate: number;

  @ApiProperty({
    description: 'Last checked timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastChecked: Date;
}
