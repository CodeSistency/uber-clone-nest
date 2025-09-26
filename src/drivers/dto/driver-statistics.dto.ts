import { ApiProperty } from '@nestjs/swagger';

export class DriverStatisticsDto {
  @ApiProperty({
    description: 'Driver ID',
    example: 1,
  })
  driverId: number;

  @ApiProperty({
    description: 'Total number of rides completed',
    example: 150,
  })
  totalRides: number;

  @ApiProperty({
    description: 'Total earnings',
    example: 12500.75,
  })
  totalEarnings: number;

  @ApiProperty({
    description: 'Average rating from passengers',
    example: 4.8,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Ride completion rate percentage',
    example: 98.5,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Total distance driven in kilometers',
    example: 2500.5,
  })
  totalDistance: number;

  @ApiProperty({
    description: 'Total hours worked',
    example: 300.5,
  })
  totalHours: number;

  @ApiProperty({
    description: 'Average earnings per hour',
    example: 41.67,
  })
  averageEarningsPerHour: number;

  @ApiProperty({
    description: 'Number of cancelled rides',
    example: 3,
  })
  cancelledRides: number;

  @ApiProperty({
    description: 'Weekly earnings breakdown',
    example: [
      { week: '2024-W01', earnings: 450.50, rides: 12 },
      { week: '2024-W02', earnings: 520.25, rides: 15 },
    ],
  })
  weeklyEarnings: Array<{
    week: string;
    earnings: number;
    rides: number;
  }>;

  @ApiProperty({
    description: 'Monthly earnings breakdown',
    example: [
      { month: '2024-01', earnings: 1850.75, rides: 45 },
      { month: '2024-02', earnings: 2100.25, rides: 52 },
    ],
  })
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
    rides: number;
  }>;

  @ApiProperty({
    description: 'Rating distribution',
    example: {
      5: 120,
      4: 25,
      3: 3,
      2: 1,
      1: 1,
    },
  })
  ratingDistribution: Record<number, number>;

  @ApiProperty({
    description: 'Peak working hours',
    example: ['08:00-10:00', '17:00-19:00', '20:00-22:00'],
  })
  peakHours: string[];

  @ApiProperty({
    description: 'Most active days',
    example: ['Friday', 'Saturday', 'Sunday'],
  })
  activeDays: string[];
}

export class DriverStatsSummaryDto {
  @ApiProperty({
    description: 'Total active drivers',
    example: 150,
  })
  totalActiveDrivers: number;

  @ApiProperty({
    description: 'Total rides completed today',
    example: 450,
  })
  totalRidesToday: number;

  @ApiProperty({
    description: 'Total earnings today',
    example: 3750.50,
  })
  totalEarningsToday: number;

  @ApiProperty({
    description: 'Average driver rating',
    example: 4.6,
  })
  averageDriverRating: number;

  @ApiProperty({
    description: 'Online drivers count',
    example: 89,
  })
  onlineDrivers: number;

  @ApiProperty({
    description: 'Drivers with pending verification',
    example: 12,
  })
  pendingVerification: number;
}
