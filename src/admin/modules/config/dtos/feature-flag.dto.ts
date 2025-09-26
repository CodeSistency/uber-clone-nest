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

export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'Feature name',
    example: 'New Payment Flow',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique feature key',
    example: 'new_payment_flow',
  })
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Feature description',
    example: 'New payment processing system with improved security',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Feature category',
    example: 'payments',
    enum: [
      'payments',
      'rides',
      'admin',
      'notifications',
      'geography',
      'pricing',
      'system',
    ],
  })
  @IsString()
  @IsIn([
    'payments',
    'rides',
    'admin',
    'notifications',
    'geography',
    'pricing',
    'system',
  ])
  category: string;

  @ApiPropertyOptional({
    description: 'Whether feature is enabled',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isEnabled?: boolean = false;

  @ApiPropertyOptional({
    description: 'Additional configuration data',
    example: { max_amount: 1000, supported_currencies: ['USD', 'EUR'] },
  })
  @IsOptional()
  config?: any;

  @ApiPropertyOptional({
    description: 'Rollout percentage (0-100)',
    example: 50,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number = 100;

  @ApiPropertyOptional({
    description: 'User roles this feature applies to',
    example: ['admin', 'driver'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userRoles?: string[];

  @ApiPropertyOptional({
    description: 'Specific user IDs',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'Environments where feature is active',
    example: ['dev', 'staging'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['dev', 'staging', 'prod'], { each: true })
  environments?: string[];

  @ApiPropertyOptional({
    description: 'Whether flag is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Auto-enable feature after creation',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoEnable?: boolean = false;
}

export class UpdateFeatureFlagDto extends CreateFeatureFlagDto {
  @ApiPropertyOptional({
    description: 'Feature flag ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}

export class FeatureFlagResponseDto {
  @ApiProperty({
    description: 'Feature flag ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Feature name',
    example: 'New Payment Flow',
  })
  name: string;

  @ApiProperty({
    description: 'Unique feature key',
    example: 'new_payment_flow',
  })
  key: string;

  @ApiPropertyOptional({
    description: 'Feature description',
    example: 'New payment processing system with improved security',
  })
  description?: string;

  @ApiProperty({
    description: 'Feature category',
    example: 'payments',
  })
  category: string;

  @ApiProperty({
    description: 'Whether feature is enabled',
    example: false,
  })
  isEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Additional configuration data',
    example: { max_amount: 1000, supported_currencies: ['USD', 'EUR'] },
  })
  config?: any;

  @ApiProperty({
    description: 'Rollout percentage',
    example: 50,
  })
  rolloutPercentage: number;

  @ApiPropertyOptional({
    description: 'User roles this feature applies to',
    example: ['admin', 'driver'],
  })
  userRoles?: string[];

  @ApiPropertyOptional({
    description: 'Specific user IDs',
    example: [1, 2, 3],
  })
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'Environments where feature is active',
    example: ['dev', 'staging'],
  })
  environments?: string[];

  @ApiProperty({
    description: 'Whether flag is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Auto-enable setting',
    example: false,
  })
  autoEnable: boolean;

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
    description: 'User who created the flag',
    example: 'admin@example.com',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'User who updated the flag',
    example: 'admin@example.com',
  })
  updatedBy?: string;
}

export class FeatureFlagListQueryDto {
  @ApiPropertyOptional({
    description: 'Search by feature name or key',
    example: 'payment',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'payments',
    enum: [
      'payments',
      'rides',
      'admin',
      'notifications',
      'geography',
      'pricing',
      'system',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'payments',
    'rides',
    'admin',
    'notifications',
    'geography',
    'pricing',
    'system',
  ])
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by enabled status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isEnabled?: boolean;

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
    enum: ['name', 'key', 'category', 'isEnabled', 'createdAt'],
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

export class FeatureFlagListResponseDto {
  @ApiProperty({
    description: 'Array of feature flags',
    type: [FeatureFlagResponseDto],
  })
  flags: FeatureFlagResponseDto[];

  @ApiProperty({
    description: 'Total number of flags',
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

export class FeatureFlagEvaluationDto {
  @ApiProperty({
    description: 'Feature key to evaluate',
    example: 'new_payment_flow',
  })
  @IsString()
  featureKey: string;

  @ApiPropertyOptional({
    description: 'User ID for evaluation',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'User role for evaluation',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiPropertyOptional({
    description: 'Environment for evaluation',
    example: 'dev',
    enum: ['dev', 'staging', 'prod'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['dev', 'staging', 'prod'])
  environment?: string;
}

export class FeatureFlagEvaluationResultDto {
  @ApiProperty({
    description: 'Feature key evaluated',
    example: 'new_payment_flow',
  })
  featureKey: string;

  @ApiProperty({
    description: 'Whether feature is enabled',
    example: true,
  })
  isEnabled: boolean;

  @ApiProperty({
    description: 'Whether user is targeted',
    example: true,
  })
  isTargeted: boolean;

  @ApiProperty({
    description: 'Rollout percentage applied',
    example: 50,
  })
  rolloutPercentage: number;

  @ApiProperty({
    description: 'Whether user is in rollout',
    example: true,
  })
  isInRollout: boolean;

  @ApiPropertyOptional({
    description: 'Feature configuration',
    example: { max_amount: 1000 },
  })
  config?: any;

  @ApiProperty({
    description: 'Evaluation context',
  })
  context: {
    userId?: number;
    userRole?: string;
    environment?: string;
    userHash?: number;
  };
}

export class BulkFeatureFlagUpdateDto {
  @ApiProperty({
    description: 'Feature flag IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  flagIds: number[];

  @ApiProperty({
    description: 'Fields to update',
    example: { isEnabled: true, rolloutPercentage: 75 },
  })
  @IsObject()
  updates: Partial<CreateFeatureFlagDto>;
}

export class CreateStandardFeatureFlagsDto {
  @ApiPropertyOptional({
    description: 'Categories to create standard flags for',
    example: ['payments', 'rides', 'admin'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(
    [
      'payments',
      'rides',
      'admin',
      'notifications',
      'geography',
      'pricing',
      'system',
    ],
    { each: true },
  )
  categories?: string[];
}
