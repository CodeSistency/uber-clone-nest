import {
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Request DTOs
export class GenerateReportDto {
  @ApiPropertyOptional({
    description: 'Start date for the report (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for the report (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Predefined period for the report',
    enum: ['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom'])
  period?:
    | 'today'
    | 'yesterday'
    | 'week'
    | 'month'
    | 'quarter'
    | 'year'
    | 'custom';

  @ApiPropertyOptional({
    description: 'Type of entity to report on',
    enum: ['rides', 'users', 'drivers', 'financial', 'performance'],
    example: 'rides',
  })
  @IsOptional()
  @IsEnum(['rides', 'users', 'drivers', 'financial', 'performance'])
  entityType?: 'rides' | 'users' | 'drivers' | 'financial' | 'performance';

  @ApiPropertyOptional({
    description: 'How to group the data',
    enum: ['day', 'week', 'month', 'driver', 'user', 'zone'],
    example: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'driver', 'user', 'zone'])
  groupBy?: 'day' | 'week' | 'month' | 'driver' | 'user' | 'zone';

  @ApiPropertyOptional({
    description: 'Specific metrics to include',
    example: ['totalRides', 'revenue', 'completionRate'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class ExportReportDto extends GenerateReportDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: ['csv', 'excel', 'pdf'],
    example: 'csv',
  })
  @IsString()
  format: 'csv' | 'excel' | 'pdf';
}

export class CreateCustomDashboardDto {
  @ApiPropertyOptional({
    description: 'Dashboard name',
    example: 'My Custom Dashboard',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Dashboard description',
    example: 'Custom dashboard for ride analytics',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Dashboard widgets configuration',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  widgets?: any[];

  @ApiPropertyOptional({
    description: 'Whether the dashboard is public',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;
}

export class ScheduleReportDto extends GenerateReportDto {
  @ApiPropertyOptional({
    description: 'Report name',
    example: 'Daily Summary Report',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Cron schedule expression',
    example: '0 9 * * *',
  })
  @IsString()
  schedule: string;

  @ApiPropertyOptional({
    description: 'Email recipients',
    example: ['admin@uberclone.com', 'manager@uberclone.com'],
  })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiPropertyOptional({
    description: 'Whether the scheduled report is active',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

// Response DTOs
export class ReportSummaryDto {
  @ApiPropertyOptional({
    description: 'Total rides in the period',
    example: 1250,
  })
  totalRides?: number;

  @ApiPropertyOptional({
    description: 'Completed rides',
    example: 1200,
  })
  completedRides?: number;

  @ApiPropertyOptional({
    description: 'Cancelled rides',
    example: 50,
  })
  cancelledRides?: number;

  @ApiPropertyOptional({
    description: 'Total revenue',
    example: 15000.5,
  })
  totalRevenue?: number;

  @ApiPropertyOptional({
    description: 'Average fare price',
    example: 25.5,
  })
  averageFare?: number;

  @ApiPropertyOptional({
    description: 'Ride completion rate (percentage)',
    example: 96.0,
  })
  completionRate?: number;

  @ApiPropertyOptional({
    description: 'Total users',
    example: 5000,
  })
  totalUsers?: number;

  @ApiPropertyOptional({
    description: 'Active users',
    example: 3200,
  })
  activeUsers?: number;

  @ApiPropertyOptional({
    description: 'Verified users',
    example: 2800,
  })
  verifiedUsers?: number;

  @ApiPropertyOptional({
    description: 'Total drivers',
    example: 500,
  })
  totalDrivers?: number;

  @ApiPropertyOptional({
    description: 'Active drivers',
    example: 350,
  })
  activeDrivers?: number;

  @ApiPropertyOptional({
    description: 'Average driver rating',
    example: 4.6,
  })
  averageRating?: number;

  @ApiPropertyOptional({
    description: 'Net income (revenue - payouts)',
    example: 8500.25,
  })
  netIncome?: number;

  @ApiPropertyOptional({
    description: 'Average ride time in minutes',
    example: 18.5,
  })
  avgRideTime?: number;

  @ApiPropertyOptional({
    description: 'Average rides per user',
    example: 3.2,
  })
  avgRidesPerUser?: number;
}

export class ChartDataPointDto {
  @ApiPropertyOptional({
    description: 'Data point label',
    example: '2024-01-15',
  })
  date?: string;

  @ApiPropertyOptional({
    description: 'Data point label',
    example: 'John Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Numeric value',
    example: 125,
  })
  value?: number;

  @ApiPropertyOptional({
    description: 'Rides count',
    example: 25,
  })
  rides?: number;

  @ApiPropertyOptional({
    description: 'Revenue amount',
    example: 625.5,
  })
  revenue?: number;

  @ApiPropertyOptional({
    description: 'Rating value',
    example: 4.7,
  })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Users count',
    example: 150,
  })
  users?: number;

  @ApiPropertyOptional({
    description: 'Earnings amount',
    example: 850.25,
  })
  earnings?: number;
}

export class ReportMetadataDto {
  @ApiPropertyOptional({
    description: 'Report generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;

  @ApiPropertyOptional({
    description: 'Applied filters',
  })
  filters: any;

  @ApiPropertyOptional({
    description: 'Total records in the report',
    example: 1250,
  })
  totalRecords: number;

  @ApiPropertyOptional({
    description: 'Report generation execution time in milliseconds',
    example: 250,
  })
  executionTime: number;
}

export class ReportResponseDto {
  @ApiPropertyOptional({
    description: 'Report summary metrics',
  })
  summary: ReportSummaryDto;

  @ApiPropertyOptional({
    description: 'Chart data points',
    type: [ChartDataPointDto],
  })
  chartData: ChartDataPointDto[];

  @ApiPropertyOptional({
    description: 'Detailed report data',
    type: [Object],
  })
  details: any[];

  @ApiPropertyOptional({
    description: 'Report metadata',
  })
  metadata: ReportMetadataDto;
}

export class DashboardWidgetDto {
  @ApiPropertyOptional({
    description: 'Widget unique identifier',
    example: 'today-overview',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Widget type',
    enum: ['metric', 'chart', 'table', 'kpi'],
    example: 'kpi',
  })
  type: 'metric' | 'chart' | 'table' | 'kpi';

  @ApiPropertyOptional({
    description: 'Widget title',
    example: "Today's Overview",
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Widget data',
  })
  data: any;

  @ApiPropertyOptional({
    description: 'Widget configuration',
  })
  config: any;

  @ApiPropertyOptional({
    description: 'Widget position in dashboard',
  })
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export class CustomDashboardDto {
  @ApiPropertyOptional({
    description: 'Dashboard unique identifier',
    example: 'dashboard_1705312800000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Dashboard name',
    example: 'My Custom Dashboard',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Dashboard description',
    example: 'Custom dashboard for ride analytics',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Dashboard widgets',
    type: [DashboardWidgetDto],
  })
  widgets: DashboardWidgetDto[];

  @ApiPropertyOptional({
    description: 'Whether the dashboard is public',
    example: false,
  })
  isPublic: boolean;

  @ApiPropertyOptional({
    description: 'User ID who created the dashboard',
    example: 1,
  })
  createdBy: number;

  @ApiPropertyOptional({
    description: 'Dashboard creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Dashboard last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class ScheduledReportDto {
  @ApiPropertyOptional({
    description: 'Scheduled report ID',
    example: 'daily_summary',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Report name',
    example: 'Daily Summary Report',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Cron schedule expression',
    example: '0 9 * * *',
  })
  schedule: string;

  @ApiPropertyOptional({
    description: 'Email recipients',
    example: ['admin@uberclone.com'],
  })
  recipients: string[];

  @ApiPropertyOptional({
    description: 'Report filters',
  })
  filters: any;

  @ApiPropertyOptional({
    description: 'Whether the scheduled report is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Last execution timestamp',
    example: '2024-01-14T09:00:00Z',
  })
  lastRun?: Date;

  @ApiPropertyOptional({
    description: 'Next execution timestamp',
    example: '2024-01-15T09:00:00Z',
  })
  nextRun?: Date;
}

export class ExportResponseDto {
  @ApiPropertyOptional({
    description: 'Export filename',
    example: 'report.csv',
  })
  filename: string;

  @ApiPropertyOptional({
    description: 'Export format',
    example: 'csv',
  })
  format: 'csv' | 'excel' | 'pdf';

  @ApiPropertyOptional({
    description: 'Export data or URL',
  })
  data: any;
}

export class DashboardWidgetsResponseDto {
  @ApiPropertyOptional({
    description: 'Array of dashboard widgets',
    type: [DashboardWidgetDto],
  })
  widgets: DashboardWidgetDto[];
}

export class ScheduledReportsResponseDto {
  @ApiPropertyOptional({
    description: 'Array of scheduled reports',
    type: [ScheduledReportDto],
  })
  reports: ScheduledReportDto[];
}
