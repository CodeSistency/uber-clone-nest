import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Request DTOs
export class GetRidesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by ride status',
    enum: [
      'pending',
      'accepted',
      'driver_confirmed',
      'arrived',
      'in_progress',
      'completed',
      'cancelled',
    ],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filter by driver ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  driverId?: number;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter rides from this date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter rides until this date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Minimum fare price',
    example: 10.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minFare?: number;

  @ApiPropertyOptional({
    description: 'Maximum fare price',
    example: 100.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxFare?: number;

  @ApiPropertyOptional({
    description: 'Filter by origin address (partial match)',
    example: 'Downtown',
  })
  @IsOptional()
  @IsString()
  originAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by destination address (partial match)',
    example: 'Airport',
  })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

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

export class ReassignRideDto {
  @ApiPropertyOptional({
    description: 'ID of the new driver to assign',
    example: 2,
  })
  @IsNumber()
  newDriverId: number;

  @ApiPropertyOptional({
    description: 'Reason for reassignment',
    example: 'Driver requested cancellation due to vehicle issue',
  })
  @IsString()
  reason: string;
}

export class CancelRideDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Refund amount (optional)',
    example: 25.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

export class CompleteRideDto {
  @ApiPropertyOptional({
    description: 'Reason for manual completion',
    example: 'GPS tracking lost - customer confirmed arrival',
  })
  @IsString()
  reason: string;
}

// Response DTOs
export class RideListItemDto {
  @ApiPropertyOptional({
    description: 'Unique ride identifier',
    example: 123,
  })
  rideId: number;

  @ApiPropertyOptional({
    description: 'Ride creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Current ride status',
    example: 'completed',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Origin address',
    example: '123 Main St, City',
  })
  originAddress: string;

  @ApiPropertyOptional({
    description: 'Destination address',
    example: '456 Oak Ave, City',
  })
  destinationAddress: string;

  @ApiPropertyOptional({
    description: 'Total fare price',
    example: 25.5,
  })
  farePrice: number;

  @ApiPropertyOptional({
    description: 'Driver information',
  })
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    averageRating?: number;
  };

  @ApiPropertyOptional({
    description: 'User information',
  })
  user?: {
    id: number;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Ride tier information',
  })
  tier?: {
    id: number;
    name: string;
  };

  @ApiPropertyOptional({
    description: 'Number of messages in the ride',
    example: 5,
  })
  messagesCount: number;
}

export class RideDetailsDto {
  @ApiPropertyOptional({
    description: 'Ride basic information',
  })
  basic: {
    id: number;
    rideId: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    rideTime: number;
    farePrice: number;
    paymentStatus: string;
  };

  @ApiPropertyOptional({
    description: 'Ride locations',
  })
  locations: {
    originAddress: string;
    destinationAddress: string;
    originLatitude: number;
    originLongitude: number;
    destinationLatitude: number;
    destinationLongitude: number;
  };

  @ApiPropertyOptional({
    description: 'Driver information',
  })
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    profileImageUrl?: string;
    carModel?: string;
    licensePlate?: string;
    averageRating?: number;
  };

  @ApiPropertyOptional({
    description: 'User information',
  })
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };

  @ApiPropertyOptional({
    description: 'Ride tier details',
  })
  tier?: {
    id: number;
    name: string;
    baseFare: number;
    perMinuteRate: number;
    perMileRate: number;
  };

  @ApiPropertyOptional({
    description: 'Ride ratings',
    type: [Object],
  })
  ratings: any[];

  @ApiPropertyOptional({
    description: 'Ride messages/chat',
    type: [Object],
  })
  messages: any[];

  @ApiPropertyOptional({
    description: 'Recent location history',
    type: [Object],
  })
  recentLocations: any[];
}

export class RideListResponseDto {
  @ApiPropertyOptional({
    description: 'Array of rides',
    type: [RideListItemDto],
  })
  rides: RideListItemDto[];

  @ApiPropertyOptional({
    description: 'Total number of rides matching the filters',
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
