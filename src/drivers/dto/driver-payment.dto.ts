import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverPaymentDto {
  @ApiProperty({
    description: 'Driver ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiPropertyOptional({
    description: 'Payment method ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  paymentMethodId?: number;

  @ApiProperty({
    description: 'Payment amount',
    example: 150.75,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Payment type',
    example: 'ride_earning',
    enum: ['ride_earning', 'bonus', 'adjustment', 'deduction'],
  })
  @IsNotEmpty()
  @IsString()
  paymentType: string;

  @ApiProperty({
    description: 'Reference type',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel'],
  })
  @IsNotEmpty()
  @IsString()
  referenceType: string;

  @ApiProperty({
    description: 'Reference ID (ID of the related service)',
    example: 123,
  })
  @IsNotEmpty()
  @IsNumber()
  referenceId: number;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Payment for ride #123',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Period start date for bulk payments',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Period end date for bulk payments',
    example: '2024-01-07',
  })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class ProcessDriverPaymentDto {
  @ApiProperty({
    description: 'Payment ID to process',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  paymentId: number;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment processor',
    example: 'txn_1234567890',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Payment processed successfully via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverPaymentQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by payment status',
    example: 'pending',
    enum: ['pending', 'processed', 'failed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment type',
    example: 'ride_earning',
    enum: ['ride_earning', 'bonus', 'adjustment', 'deduction'],
  })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
