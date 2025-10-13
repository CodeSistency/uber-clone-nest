import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Common Analytics Query DTOs
export class DashboardAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range preset',
    enum: ['today', 'yesterday', '7d', '30d', '90d', '1y'],
    example: '30d',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', '7d', '30d', '90d', '1y'])
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';

  @ApiPropertyOptional({
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Country ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Group by period',
    enum: ['day', 'week', 'month', 'quarter'],
    example: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter'])
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
}

export class RideAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range preset',
    enum: ['today', 'yesterday', '7d', '30d', '90d', '1y'],
    example: '30d',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', '7d', '30d', '90d', '1y'])
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';

  @ApiPropertyOptional({
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Country ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Zone ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Ride status filter',
    enum: ['completed', 'cancelled', 'in_progress'],
    example: 'completed',
  })
  @IsOptional()
  @IsEnum(['completed', 'cancelled', 'in_progress'])
  status?: 'completed' | 'cancelled' | 'in_progress';

  @ApiPropertyOptional({
    description: 'Ride tier ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rideTierId?: number;

  @ApiPropertyOptional({
    description: 'Group by time period',
    enum: ['hour', 'day', 'week', 'month'],
    example: 'day',
  })
  @IsOptional()
  @IsEnum(['hour', 'day', 'week', 'month'])
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export class FinancialAnalyticsQueryDto extends DashboardAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Include Stripe fees in calculation',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStripeFees?: boolean;

  @ApiPropertyOptional({
    description: 'Include taxes in calculation',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeTaxes?: boolean;
}

export class UserAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range preset',
    enum: ['today', 'yesterday', '7d', '30d', '90d', '1y'],
    example: '30d',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', '7d', '30d', '90d', '1y'])
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';

  @ApiPropertyOptional({
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Country ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'User type filter',
    enum: ['rider', 'driver', 'both'],
    example: 'rider',
  })
  @IsOptional()
  @IsEnum(['rider', 'driver', 'both'])
  userType?: 'rider' | 'driver' | 'both';

  @ApiPropertyOptional({
    description: 'User segment filter',
    enum: ['new', 'returning', 'power', 'churned'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['new', 'returning', 'power', 'churned'])
  segment?: 'new' | 'returning' | 'power' | 'churned';
}

export class DriverAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range preset',
    enum: ['today', 'yesterday', '7d', '30d', '90d', '1y'],
    example: '30d',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', '7d', '30d', '90d', '1y'])
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';

  @ApiPropertyOptional({
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Country ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'City ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({
    description: 'Driver status filter',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  @ApiPropertyOptional({
    description: 'Performance filter',
    enum: ['top', 'average', 'low'],
    example: 'top',
  })
  @IsOptional()
  @IsEnum(['top', 'average', 'low'])
  performance?: 'top' | 'average' | 'low';
}

export class GeographyAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range preset',
    enum: ['today', 'yesterday', '7d', '30d', '90d', '1y'],
    example: '30d',
  })
  @IsOptional()
  @IsEnum(['today', 'yesterday', '7d', '30d', '90d', '1y'])
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';

  @ApiPropertyOptional({
    description: 'Country ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'State ID filter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stateId?: number;

  @ApiPropertyOptional({
    description: 'Metric type filter',
    enum: ['rides', 'revenue', 'users', 'drivers', 'coverage'],
    example: 'rides',
  })
  @IsOptional()
  @IsEnum(['rides', 'revenue', 'users', 'drivers', 'coverage'])
  metric?: 'rides' | 'revenue' | 'users' | 'drivers' | 'coverage';
}

// Response DTOs
export class DashboardAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'Summary metrics',
  })
  summary: {
    totalRides: number;
    totalRevenue: number; // In cents
    totalUsers: number;
    totalDrivers: number;
    averageRideValue: number; // In cents
    averageRating: number; // 1-5 scale
    completionRate: number; // Percentage
  };

  @ApiPropertyOptional({
    description: 'Trends data',
  })
  trends: {
    rides: Array<{
      date: string; // YYYY-MM-DD
      count: number;
      revenue: number; // In cents
    }>;
    users: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
    drivers: Array<{
      date: string;
      newDrivers: number;
      activeDrivers: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Performance metrics',
  })
  performance: {
    peakHours: Array<{
      hour: number; // 0-23
      rideCount: number;
      averageWaitTime: number; // In minutes
    }>;
    popularRoutes: Array<{
      origin: string;
      destination: string;
      rideCount: number;
      averageFare: number; // In cents
    }>;
    driverPerformance: {
      averageRating: number;
      topPerformers: Array<{
        driverId: number;
        name: string;
        rating: number;
        completedRides: number;
      }>;
    };
  };

  @ApiPropertyOptional({
    description: 'Geography data',
  })
  geography: {
    ridesByCity: Array<{
      cityId: number;
      cityName: string;
      rideCount: number;
      revenue: number; // In cents
    }>;
    coverage: {
      activeCities: number;
      activeZones: number;
      totalAreaKm2: number;
    };
  };

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class RideAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'Overview metrics',
  })
  overview: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    completionRate: number; // Percentage
    averageRideDuration: number; // In minutes
    averageWaitTime: number; // In minutes
    averageDistance: number; // In miles
  };

  @ApiPropertyOptional({
    description: 'Rides by time period',
  })
  byTime: Array<{
    period: string; // Date/time period
    totalRides: number;
    completedRides: number;
    averageFare: number; // In cents
    averageDistance: number; // In miles
    averageDuration: number; // In minutes
  }>;

  @ApiPropertyOptional({
    description: 'Rides by service tier',
  })
  byTier: Array<{
    tierId: number;
    tierName: string;
    rideCount: number;
    revenue: number; // In cents
    averageFare: number; // In cents
    percentage: number; // Percentage of total rides
  }>;

  @ApiPropertyOptional({
    description: 'Rides by geography',
  })
  byGeography: Array<{
    locationId: number;
    locationName: string;
    locationType: 'country' | 'state' | 'city' | 'zone';
    rideCount: number;
    revenue: number; // In cents
    averageFare: number; // In cents
  }>;

  @ApiPropertyOptional({
    description: 'Cancellation reasons',
  })
  cancellationReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class FinancialAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'Revenue breakdown',
  })
  revenue: {
    totalRevenue: number; // In cents, after fees and taxes
    grossRevenue: number; // In cents, before fees and taxes
    stripeFees: number; // In cents
    taxes: number; // In cents
    netRevenue: number; // In cents
    averageTransaction: number; // In cents
  };

  @ApiPropertyOptional({
    description: 'Revenue trends',
  })
  trends: Array<{
    period: string; // Date period
    revenue: number; // In cents
    transactions: number;
    averageValue: number; // In cents
  }>;

  @ApiPropertyOptional({
    description: 'Revenue by payment method',
  })
  byPaymentMethod: Array<{
    method: string; // 'card', 'cash', 'wallet', etc.
    amount: number; // In cents
    transactionCount: number;
    percentage: number;
  }>;

  @ApiPropertyOptional({
    description: 'Revenue by service tier',
  })
  byTier: Array<{
    tierId: number;
    tierName: string;
    revenue: number; // In cents
    transactionCount: number;
    averageFare: number; // In cents
  }>;

  @ApiPropertyOptional({
    description: 'Revenue projections',
  })
  projections: {
    monthlyGrowth: number; // Percentage
    projectedRevenue: number; // In cents for next month
    confidence: number; // 0-100 confidence level
  };

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class UserAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'User overview metrics',
  })
  overview: {
    totalUsers: number;
    activeUsers: number; // Users with rides in period
    newUsers: number; // Users registered in period
    returningUsers: number; // Users with multiple rides
    churnedUsers: number; // Users inactive for 30+ days
    averageRidesPerUser: number;
    averageRating: number; // 1-5 scale
  };

  @ApiPropertyOptional({
    description: 'Demographic breakdown',
  })
  demographics: {
    byAgeGroup: Array<{
      ageGroup: string; // '18-24', '25-34', etc.
      count: number;
      percentage: number;
    }>;
    byGender: Array<{
      gender: string;
      count: number;
      percentage: number;
    }>;
    topCities: Array<{
      cityId: number;
      cityName: string;
      userCount: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'User behavior metrics',
  })
  behavior: {
    sessionDuration: {
      average: number; // In minutes
      distribution: Array<{
        range: string; // '0-5min', '5-15min', etc.
        count: number;
      }>;
    };
    rideFrequency: {
      daily: number; // Users with daily rides
      weekly: number; // Users with weekly rides
      monthly: number; // Users with monthly rides
    };
    preferredTimes: Array<{
      hour: number; // 0-23
      userCount: number;
      percentage: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'User retention metrics',
  })
  retention: {
    day1: number; // Percentage retained after 1 day
    day7: number; // Percentage retained after 7 days
    day30: number; // Percentage retained after 30 days
    cohortAnalysis: Array<{
      cohort: string; // Registration month
      month0: number; // Initial users
      month1: number; // Retained after 1 month
      month3: number; // Retained after 3 months
      month6: number; // Retained after 6 months
    }>;
  };

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class DriverAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'Driver overview metrics',
  })
  overview: {
    totalDrivers: number;
    activeDrivers: number;
    newDrivers: number; // Registered in period
    onlineDrivers: number; // Currently online
    averageRating: number; // 1-5 scale
    averageEarnings: number; // In cents per driver
    completionRate: number; // Percentage
  };

  @ApiPropertyOptional({
    description: 'Driver performance metrics',
  })
  performance: {
    topPerformers: Array<{
      driverId: number;
      name: string;
      rating: number;
      completedRides: number;
      earnings: number; // In cents
      acceptanceRate: number; // Percentage
    }>;
    ratingDistribution: Array<{
      rating: number; // 1-5
      count: number;
      percentage: number;
    }>;
    earningsDistribution: Array<{
      range: string; // '$0-50', '$50-100', etc.
      count: number;
      percentage: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Driver activity metrics',
  })
  activity: {
    onlineHours: {
      averagePerDriver: number; // Hours per day
      totalOnlineHours: number;
    };
    rideAcceptance: {
      averageResponseTime: number; // In seconds
      acceptanceRate: number; // Percentage
    };
    cancellationRate: number; // Percentage
  };

  @ApiPropertyOptional({
    description: 'Geographic driver distribution',
  })
  geography: {
    byCity: Array<{
      cityId: number;
      cityName: string;
      driverCount: number;
      averageRating: number;
      averageEarnings: number; // In cents
    }>;
    coverage: {
      citiesWithDrivers: number;
      averageDriversPerCity: number;
      supplyGaps: Array<{
        cityId: number;
        cityName: string;
        demandLevel: number;
        driverCoverage: number; // Drivers per 1000 users
        recommendedDrivers: number;
      }>;
    };
  };

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}

export class GeographyAnalyticsResponseDto {
  @ApiPropertyOptional({
    description: 'Coverage statistics',
  })
  coverage: {
    countries: number; // Active countries
    states: number; // Active states
    cities: number; // Active cities
    zones: number; // Active zones
    totalAreaKm2: number; // Total coverage area
    populationCovered: number;
  };

  @ApiPropertyOptional({
    description: 'Performance by geography',
  })
  performance: {
    byCountry: Array<{
      countryId: number;
      countryName: string;
      rides: number;
      revenue: number; // In cents
      users: number;
      drivers: number;
      averageFare: number; // In cents
    }>;
    byCity: Array<{
      cityId: number;
      cityName: string;
      rides: number;
      revenue: number; // In cents
      users: number;
      drivers: number;
      averageFare: number; // In cents
      marketShare: number; // Percentage
    }>;
    topCities: Array<{
      cityId: number;
      cityName: string;
      metric: string;
      value: number;
      rank: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Demand analysis',
  })
  demand: {
    highDemandAreas: Array<{
      zoneId: number;
      zoneName: string;
      demandLevel: number; // 1-10 scale
      averageWaitTime: number; // In minutes
      ridesPerHour: number;
    }>;
    supplyGaps: Array<{
      cityId: number;
      cityName: string;
      demandLevel: number;
      driverCoverage: number; // Drivers per 1000 users
      recommendedDrivers: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Expansion opportunities',
  })
  expansion: {
    potentialCities: Array<{
      cityId: number;
      cityName: string;
      population: number;
      estimatedDemand: number; // Based on demographics
      competitionLevel: 'low' | 'medium' | 'high';
      roi: number; // Estimated return on investment
    }>;
  };

  @ApiPropertyOptional({
    description: 'Response generation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}
