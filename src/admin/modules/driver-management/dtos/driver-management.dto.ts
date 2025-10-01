import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Request DTOs
export class GetDriversQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by driver status',
    enum: ['online', 'offline', 'busy', 'suspended'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationStatus?: string[];

  @ApiPropertyOptional({
    description: 'Filter by delivery capability',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  canDoDeliveries?: boolean;

  @ApiPropertyOptional({
    description: 'Filter drivers registered from this date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter drivers registered until this date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Minimum average rating',
    example: 4.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Maximum average rating',
    example: 5.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of rides',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRides?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of rides',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRides?: number;

  @ApiPropertyOptional({
    description: 'Minimum total earnings',
    example: 1000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minEarnings?: number;

  @ApiPropertyOptional({
    description: 'Maximum total earnings',
    example: 50000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxEarnings?: number;

  @ApiPropertyOptional({
    description: 'Search in first name, last name, email, or phone',
    example: 'john doe',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by work zone ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
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

export class UpdateDriverStatusDto {
  @ApiPropertyOptional({
    description: 'New status for the driver',
    enum: ['online', 'offline', 'busy', 'suspended'],
    example: 'suspended',
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for the status change',
    example: 'Violation of terms of service',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'End date for suspension (ISO string)',
    example: '2024-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  suspensionEndDate?: string;
}

export class UpdateDriverVerificationDto {
  @ApiPropertyOptional({
    description: 'New verification status',
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    example: 'approved',
  })
  @IsString()
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Additional notes for verification',
    example: 'All documents verified successfully',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDriverWorkZonesDto {
  @ApiPropertyOptional({
    description: 'Array of work zone IDs to assign',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  zoneIds: number[];

  @ApiPropertyOptional({
    description: 'Primary work zone ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  primaryZoneId?: number;
}

export class BulkUpdateDriverStatusDto {
  @ApiPropertyOptional({
    description: 'Driver IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  driverIds: number[];

  @ApiPropertyOptional({
    description: 'New status for all drivers',
    enum: ['online', 'offline', 'busy', 'suspended'],
    example: 'suspended',
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for the bulk status change',
    example: 'System maintenance',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTOs
export class DriverListItemDto {
  @ApiPropertyOptional({
    description: 'Driver unique identifier',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Driver first name',
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    description: 'Driver last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Driver email address',
    example: 'john.doe@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Driver phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Driver current status',
    example: 'online',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Driver verification status',
    example: 'approved',
  })
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Whether driver can do deliveries',
    example: true,
  })
  canDoDeliveries: boolean;

  @ApiPropertyOptional({
    description: 'Driver average rating',
    example: 4.7,
  })
  averageRating?: number;

  @ApiPropertyOptional({
    description: 'Total number of rides',
    example: 150,
  })
  totalRides: number;

  @ApiPropertyOptional({
    description: 'Number of completed rides',
    example: 145,
  })
  completedRides: number;

  @ApiPropertyOptional({
    description: 'Number of cancelled rides',
    example: 5,
  })
  cancelledRides: number;

  @ApiPropertyOptional({
    description: 'Total earnings',
    example: 2500.5,
  })
  totalEarnings: number;

  @ApiPropertyOptional({
    description: 'Ride completion rate (percentage)',
    example: 96.7,
  })
  completionRate: number;

  @ApiPropertyOptional({
    description: 'Current work zone',
  })
  currentWorkZone?: any;

  @ApiPropertyOptional({
    description: 'Default vehicle',
  })
  defaultVehicle?: any;
}

export class DriverDetailsDto {
  @ApiPropertyOptional({
    description: 'Basic driver information',
  })
  basic: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    status: string;
    verificationStatus: string;
    canDoDeliveries: boolean;
    lastActive?: Date;
    createdAt: Date;
  };

  @ApiPropertyOptional({
    description: 'Driver performance statistics',
  })
  stats: {
    averageRating?: number;
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    totalEarnings: number;
    completionRate: number;
  };

  @ApiPropertyOptional({
    description: 'Driver address information',
  })
  address?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };

  @ApiPropertyOptional({
    description: 'Driver documents (license, ID, etc.)',
    type: [Object],
  })
  documents: any[];

  @ApiPropertyOptional({
    description:
      'Driver vehicles with full details including documents and history',
    type: [Object],
  })
  vehicles: any[];

  @ApiPropertyOptional({
    description: 'Current active work zone assignment',
  })
  currentWorkZone?: any;

  @ApiPropertyOptional({
    description: 'All work zone assignments history',
    type: [Object],
  })
  workZoneAssignments: any[];

  @ApiPropertyOptional({
    description: 'Active payment methods for receiving earnings',
    type: [Object],
  })
  paymentMethods: any[];

  @ApiPropertyOptional({
    description: 'Driver payment/earnings history',
    type: [Object],
  })
  driverPayments: any[];

  @ApiPropertyOptional({
    description: 'Recent rides with full details',
    type: [Object],
  })
  recentRides: any[];

  @ApiPropertyOptional({
    description: 'Recent delivery orders (if driver does deliveries)',
    type: [Object],
  })
  recentDeliveryOrders: any[];

  @ApiPropertyOptional({
    description: 'Recent errands (personal tasks)',
    type: [Object],
  })
  recentErrands: any[];

  @ApiPropertyOptional({
    description: 'Recent parcels delivery',
    type: [Object],
  })
  recentParcels: any[];

  @ApiPropertyOptional({
    description: 'Driver reports (issues during rides)',
    type: [Object],
  })
  driverReports: any[];

  @ApiPropertyOptional({
    description: 'Recent location tracking history',
    type: [Object],
  })
  recentLocationHistory: any[];

  @ApiPropertyOptional({
    description: 'Vehicle change history for audit trail',
    type: [Object],
  })
  vehicleHistory: any[];

  @ApiPropertyOptional({
    description: 'Driver verification status change history',
    type: [Object],
  })
  verificationHistory: any[];

  @ApiPropertyOptional({
    description: 'Performance statistics by period',
  })
  performanceStats: {
    todayRides: number;
    weekRides: number;
    monthRides: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    averageResponseTime?: number;
    customerSatisfaction?: number;
  };
}

export class DriverDocumentDto {
  @ApiPropertyOptional({
    description: 'Document ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Document type',
    example: 'license',
  })
  documentType: string;

  @ApiPropertyOptional({
    description: 'Document URL',
    example: 'https://example.com/docs/license.pdf',
  })
  documentUrl: string;

  @ApiPropertyOptional({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  uploadedAt: Date;

  @ApiPropertyOptional({
    description: 'Verification status',
    example: 'approved',
  })
  verificationStatus: string;
}

export class VehicleDto {
  @ApiPropertyOptional({
    description: 'Vehicle ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Vehicle make',
    example: 'Toyota',
  })
  make: string;

  @ApiPropertyOptional({
    description: 'Vehicle model',
    example: 'Camry',
  })
  model: string;

  @ApiPropertyOptional({
    description: 'Vehicle year',
    example: 2020,
  })
  year: number;

  @ApiPropertyOptional({
    description: 'License plate',
    example: 'ABC-123',
  })
  licensePlate: string;

  @ApiPropertyOptional({
    description: 'Vehicle color',
    example: 'White',
  })
  color: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default vehicle',
    example: true,
  })
  isDefault: boolean;
}

export class DriverListResponseDto {
  @ApiPropertyOptional({
    description: 'Array of drivers',
    type: [DriverListItemDto],
  })
  drivers: DriverListItemDto[];

  @ApiPropertyOptional({
    description: 'Total number of drivers matching the filters',
    example: 150,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiPropertyOptional({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}
