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
export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: ['active', 'inactive'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filter by email verification status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by phone verification status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by identity verification status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  identityVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter users with/without wallet',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWallet?: boolean;

  @ApiPropertyOptional({
    description: 'Filter users registered from this date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter users registered until this date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Minimum number of rides',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRides?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of rides',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRides?: number;

  @ApiPropertyOptional({
    description: 'Search in name, email, or phone',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

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

export class UpdateUserStatusDto {
  @ApiPropertyOptional({
    description: 'New status for the user',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Reason for the status change',
    example: 'Violation of terms of service',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdjustWalletDto {
  @ApiPropertyOptional({
    description:
      'Amount to add/subtract (positive for credit, negative for debit)',
    example: 50.0,
  })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Reason for the adjustment',
    example: 'Refund for cancelled ride',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Optional description for the transaction',
    example: 'Administrative adjustment',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddEmergencyContactDto {
  @ApiPropertyOptional({
    description: 'Name of the emergency contact',
    example: 'Jane Doe',
  })
  @IsString()
  contactName: string;

  @ApiPropertyOptional({
    description: 'Phone number of the emergency contact',
    example: '+1234567890',
  })
  @IsString()
  contactPhone: string;
}

export class BulkUpdateStatusDto {
  @ApiPropertyOptional({
    description: 'User IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiPropertyOptional({
    description: 'New status for all users',
    example: false,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Reason for the bulk status change',
    example: 'Bulk account maintenance',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteUserDto {
  @ApiPropertyOptional({
    description: 'Reason for user deletion',
    example: 'Account violation - spam and abuse',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTOs
export class UserListItemDto {
  @ApiPropertyOptional({
    description: 'User unique identifier',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  emailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Phone verification status',
    example: false,
  })
  phoneVerified: boolean;

  @ApiPropertyOptional({
    description: 'Identity verification status',
    example: false,
  })
  identityVerified: boolean;

  @ApiPropertyOptional({
    description: 'User registration date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Wallet information',
  })
  wallet?: {
    balance: number;
    totalTransactions: number;
  };

  @ApiPropertyOptional({
    description: 'Total number of rides',
    example: 25,
  })
  totalRides: number;

  @ApiPropertyOptional({
    description: 'Number of completed rides',
    example: 23,
  })
  completedRides: number;

  @ApiPropertyOptional({
    description: 'Number of cancelled rides',
    example: 2,
  })
  cancelledRides: number;

  @ApiPropertyOptional({
    description: 'Average rating received',
    example: 4.7,
  })
  averageRating?: number;
}

export class UserDetailsDto {
  @ApiPropertyOptional({
    description: 'Basic user information',
  })
  basic: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    lastLogin?: Date;
    createdAt: Date;
  };

  @ApiPropertyOptional({
    description: 'User address information',
  })
  address?: {
    profileImage?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  @ApiPropertyOptional({
    description: 'User preferences',
  })
  preferences: {
    preferredLanguage?: string;
    timezone?: string;
    currency?: string;
  };

  @ApiPropertyOptional({
    description: 'User statistics',
  })
  stats: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    averageRating?: number;
  };

  @ApiPropertyOptional({
    description: 'Wallet information',
  })
  wallet?: {
    balance: number;
    totalTransactions: number;
  };

  @ApiPropertyOptional({
    description: 'Emergency contacts',
    type: [Object],
  })
  emergencyContacts: any[];

  @ApiPropertyOptional({
    description: 'Recent rides',
    type: [Object],
  })
  recentRides: any[];
}

export class WalletTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Transaction amount',
    example: 25.5,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Transaction type',
    example: 'credit',
  })
  transactionType: string;

  @ApiPropertyOptional({
    description: 'Transaction description',
    example: 'Ride payment',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Transaction timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class EmergencyContactDto {
  @ApiPropertyOptional({
    description: 'Contact ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'Jane Doe',
  })
  contactName: string;

  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+1234567890',
  })
  contactPhone: string;
}

export class UserListResponseDto {
  @ApiPropertyOptional({
    description: 'Array of users',
    type: [UserListItemDto],
  })
  users: UserListItemDto[];

  @ApiPropertyOptional({
    description: 'Total number of users matching the filters',
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
