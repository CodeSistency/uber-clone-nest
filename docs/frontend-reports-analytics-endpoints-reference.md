# Reports & Analytics Module - API Endpoints Reference

Frontend reference documentation for Reports & Analytics module endpoints.

## Reports Endpoints

### `GET /admin/reports-analytics/reports`

**Purpose:** List available reports with pagination and filters

**Query Parameters:**
```typescript
interface ReportsQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  category?: 'financial' | 'operational' | 'user' | 'geographic' | 'performance';
  reportType?: 'summary' | 'detailed' | 'trends' | 'comparison';
  isActive?: boolean;
  search?: string;      // Search in name or description
  sortBy?: 'name' | 'category' | 'lastGenerated' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ReportsListResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Report {
  id: number;
  name: string;
  description?: string;
  category: 'financial' | 'operational' | 'user' | 'geographic' | 'performance';
  reportType: 'summary' | 'detailed' | 'trends' | 'comparison';
  dataSource: string;               // Database table or service name
  queryTemplate: string;            // SQL or query template
  parameters: Array<{               // Required parameters
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  outputFormat: ('json' | 'csv' | 'pdf' | 'xlsx')[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;                   // HH:MM format
    timezone: string;
    recipients?: string[];          // Email recipients
  };
  lastGenerated?: string;           // ISO date string
  isActive: boolean;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  createdBy?: string;
  updatedBy?: string;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/reports-analytics/reports`

**Purpose:** Create a new report definition

**Request Body:**
```typescript
interface CreateReportDto {
  name: string;                    // Required: 3-100 chars
  description?: string;            // Optional: max 500 chars
  category: 'financial' | 'operational' | 'user' | 'geographic' | 'performance';  // Required
  reportType: 'summary' | 'detailed' | 'trends' | 'comparison';  // Required
  dataSource: string;              // Required: table or service name
  queryTemplate: string;           // Required: SQL or query template
  parameters?: Array<{             // Optional: parameter definitions
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    required?: boolean;            // Default: false
    defaultValue?: any;
    description?: string;
  }>;
  outputFormat: ('json' | 'csv' | 'pdf' | 'xlsx')[];  // Required: at least one format
  schedule?: {                     // Optional: scheduling configuration
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;                  // HH:MM format
    timezone: string;
    recipients?: string[];         // Email addresses
  };
  isActive?: boolean;              // Optional: default true
}
```

**Response:**
```typescript
interface ReportResponse extends Report {
  // Same as Report interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/reports/:id`

**Purpose:** Get details of a specific report

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Response:**
```typescript
interface ReportResponse extends Report {
  // Same as Report interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/reports-analytics/reports/:id`

**Purpose:** Update an existing report

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Request Body:**
```typescript
interface UpdateReportDto {
  name?: string;                   // 3-100 chars
  description?: string;            // max 500 chars
  category?: 'financial' | 'operational' | 'user' | 'geographic' | 'performance';
  reportType?: 'summary' | 'detailed' | 'trends' | 'comparison';
  dataSource?: string;
  queryTemplate?: string;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    required?: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  outputFormat?: ('json' | 'csv' | 'pdf' | 'xlsx')[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;                  // HH:MM format
    timezone: string;
    recipients?: string[];
  };
  isActive?: boolean;
}
```

**Response:**
```typescript
interface ReportResponse extends Report {
  // Same as Report interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/reports-analytics/reports/:id`

**Purpose:** Delete a report

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/reports-analytics/reports/:id/generate`

**Purpose:** Generate a report with specific parameters

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Request Body:**
```typescript
interface GenerateReportDto {
  parameters?: Record<string, any>;  // Report parameters
  outputFormat?: 'json' | 'csv' | 'pdf' | 'xlsx';  // Default: 'json'
  dateRange?: {                     // Optional date range
    startDate: string;              // ISO date string
    endDate: string;                // ISO date string
  };
  filters?: Record<string, any>;     // Additional filters
}
```

**Response:**
```typescript
interface GenerateReportResponse {
  reportId: number;
  executionId: string;             // Unique execution identifier
  status: 'queued' | 'processing' | 'completed' | 'failed';
  format: string;
  downloadUrl?: string;            // For non-JSON formats
  data?: any;                      // For JSON format
  metadata: {
    generatedAt: string;           // ISO date string
    executionTimeMs: number;
    rowCount?: number;
    parameters: Record<string, any>;
  };
  error?: string;                  // Present if status is 'failed'
}
```

**Status Codes:** `200 OK`, `202 Accepted`, `400 Bad Request`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/reports/:id/executions`

**Purpose:** Get execution history for a report

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Query Parameters:**
```typescript
interface ReportExecutionsQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  sortBy?: 'executedAt' | 'executionTimeMs';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ReportExecutionsResponse {
  executions: ReportExecution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReportExecution {
  id: string;                      // Execution ID
  reportId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  parameters: Record<string, any>;
  executedAt: string;              // ISO date string
  completedAt?: string;            // ISO date string
  executionTimeMs?: number;
  rowCount?: number;
  format: string;
  downloadUrl?: string;
  error?: string;
  initiatedBy?: string;            // User who initiated execution
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/reports/:id/executions/:executionId/download`

**Purpose:** Download generated report file

**Path Parameters:**
```typescript
interface ReportDownloadParams {
  id: number;           // Report ID
  executionId: string;  // Execution ID
}
```

**Response:** File download (CSV, PDF, XLSX)

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/reports-analytics/reports/:id/schedule`

**Purpose:** Schedule automatic report generation

**Path Parameters:**
```typescript
interface ReportPathParams {
  id: number;  // Report ID
}
```

**Request Body:**
```typescript
interface ScheduleReportDto {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';  // Required
  time: string;                   // Required: HH:MM format
  timezone: string;               // Required: timezone name
  recipients?: string[];          // Optional: email recipients
  parameters?: Record<string, any>; // Optional: default parameters
  isActive?: boolean;             // Optional: default true
}
```

**Response:**
```typescript
interface ScheduleReportResponse {
  reportId: number;
  scheduleId: string;
  frequency: string;
  nextExecution: string;           // ISO date string
  recipients: string[];
  isActive: boolean;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

## Analytics Endpoints

### `GET /admin/reports-analytics/analytics/dashboard`

**Purpose:** Get dashboard analytics data

**Query Parameters:**
```typescript
interface DashboardAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: string;              // ISO date string
  endDate?: string;                // ISO date string
  countryId?: number;
  stateId?: number;
  cityId?: number;
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
}
```

**Response:**
```typescript
interface DashboardAnalyticsResponse {
  summary: {
    totalRides: number;
    totalRevenue: number;           // In cents
    totalUsers: number;
    totalDrivers: number;
    averageRideValue: number;       // In cents
    averageRating: number;          // 1-5 scale
    completionRate: number;         // Percentage
  };
  trends: {
    rides: Array<{
      date: string;                 // YYYY-MM-DD
      count: number;
      revenue: number;              // In cents
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
  performance: {
    peakHours: Array<{
      hour: number;                 // 0-23
      rideCount: number;
      averageWaitTime: number;      // In minutes
    }>;
    popularRoutes: Array<{
      origin: string;
      destination: string;
      rideCount: number;
      averageFare: number;          // In cents
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
  geography: {
    ridesByCity: Array<{
      cityId: number;
      cityName: string;
      rideCount: number;
      revenue: number;              // In cents
    }>;
    coverage: {
      activeCities: number;
      activeZones: number;
      totalAreaKm2: number;
    };
  };
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/analytics/rides`

**Purpose:** Get detailed ride analytics

**Query Parameters:**
```typescript
interface RideAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: string;              // ISO date string
  endDate?: string;                // ISO date string
  countryId?: number;
  stateId?: number;
  cityId?: number;
  zoneId?: number;
  status?: 'completed' | 'cancelled' | 'in_progress';
  rideTierId?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}
```

**Response:**
```typescript
interface RideAnalyticsResponse {
  overview: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    completionRate: number;         // Percentage
    averageRideDuration: number;    // In minutes
    averageWaitTime: number;        // In minutes
    averageDistance: number;        // In miles
  };
  byTime: Array<{
    period: string;                 // Date/time period
    totalRides: number;
    completedRides: number;
    averageFare: number;            // In cents
    averageDistance: number;        // In miles
    averageDuration: number;        // In minutes
  }>;
  byTier: Array<{
    tierId: number;
    tierName: string;
    rideCount: number;
    revenue: number;                // In cents
    averageFare: number;            // In cents
    percentage: number;             // Percentage of total rides
  }>;
  byGeography: Array<{
    locationId: number;
    locationName: string;
    locationType: 'country' | 'state' | 'city' | 'zone';
    rideCount: number;
    revenue: number;                // In cents
    averageFare: number;            // In cents
  }>;
  cancellationReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/analytics/financial`

**Purpose:** Get financial analytics and revenue data

**Query Parameters:**
```typescript
interface FinancialAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: string;              // ISO date string
  endDate?: string;                // ISO date string
  countryId?: number;
  stateId?: number;
  cityId?: number;
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
  includeStripeFees?: boolean;     // Default: true
  includeTaxes?: boolean;          // Default: true
}
```

**Response:**
```typescript
interface FinancialAnalyticsResponse {
  revenue: {
    totalRevenue: number;           // In cents, after fees and taxes
    grossRevenue: number;           // In cents, before fees and taxes
    stripeFees: number;             // In cents
    taxes: number;                  // In cents
    netRevenue: number;             // In cents
    averageTransaction: number;     // In cents
  };
  trends: Array<{
    period: string;                 // Date period
    revenue: number;                // In cents
    transactions: number;
    averageValue: number;           // In cents
  }>;
  byPaymentMethod: Array<{
    method: string;                 // 'card', 'cash', 'wallet', etc.
    amount: number;                 // In cents
    transactionCount: number;
    percentage: number;
  }>;
  byTier: Array<{
    tierId: number;
    tierName: string;
    revenue: number;                // In cents
    transactionCount: number;
    averageFare: number;            // In cents
  }>;
  projections: {
    monthlyGrowth: number;          // Percentage
    projectedRevenue: number;       // In cents for next month
    confidence: number;             // 0-100 confidence level
  };
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/analytics/users`

**Purpose:** Get user analytics and behavior data

**Query Parameters:**
```typescript
interface UserAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: string;              // ISO date string
  endDate?: string;                // ISO date string
  countryId?: number;
  stateId?: number;
  cityId?: number;
  userType?: 'rider' | 'driver' | 'both';
  segment?: 'new' | 'returning' | 'power' | 'churned';
}
```

**Response:**
```typescript
interface UserAnalyticsResponse {
  overview: {
    totalUsers: number;
    activeUsers: number;            // Users with rides in period
    newUsers: number;               // Users registered in period
    returningUsers: number;         // Users with multiple rides
    churnedUsers: number;           // Users inactive for 30+ days
    averageRidesPerUser: number;
    averageRating: number;          // 1-5 scale
  };
  demographics: {
    byAgeGroup: Array<{
      ageGroup: string;             // '18-24', '25-34', etc.
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
  behavior: {
    sessionDuration: {
      average: number;              // In minutes
      distribution: Array<{
        range: string;              // '0-5min', '5-15min', etc.
        count: number;
      }>;
    };
    rideFrequency: {
      daily: number;                // Users with daily rides
      weekly: number;               // Users with weekly rides
      monthly: number;              // Users with monthly rides
    };
    preferredTimes: Array<{
      hour: number;                 // 0-23
      userCount: number;
      percentage: number;
    }>;
  };
  retention: {
    day1: number;                   // Percentage retained after 1 day
    day7: number;                   // Percentage retained after 7 days
    day30: number;                  // Percentage retained after 30 days
    cohortAnalysis: Array<{
      cohort: string;               // Registration month
      month0: number;               // Initial users
      month1: number;               // Retained after 1 month
      month3: number;               // Retained after 3 months
      month6: number;               // Retained after 6 months
    }>;
  };
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/analytics/drivers`

**Purpose:** Get driver analytics and performance data

**Query Parameters:**
```typescript
interface DriverAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: string;              // ISO date string
  endDate?: string;                // ISO date string
  countryId?: number;
  stateId?: number;
  cityId?: number;
  status?: 'active' | 'inactive' | 'suspended';
  performance?: 'top' | 'average' | 'low';
}
```

**Response:**
```typescript
interface DriverAnalyticsResponse {
  overview: {
    totalDrivers: number;
    activeDrivers: number;
    newDrivers: number;             // Registered in period
    onlineDrivers: number;          // Currently online
    averageRating: number;          // 1-5 scale
    averageEarnings: number;        // In cents per driver
    completionRate: number;         // Percentage
  };
  performance: {
    topPerformers: Array<{
      driverId: number;
      name: string;
      rating: number;
      completedRides: number;
      earnings: number;             // In cents
      acceptanceRate: number;       // Percentage
    }>;
    ratingDistribution: Array<{
      rating: number;               // 1-5
      count: number;
      percentage: number;
    }>;
    earningsDistribution: Array<{
      range: string;                // '$0-50', '$50-100', etc.
      count: number;
      percentage: number;
    }>;
  };
  activity: {
    onlineHours: {
      averagePerDriver: number;     // Hours per day
      totalOnlineHours: number;
    };
    rideAcceptance: {
      averageResponseTime: number;  // In seconds
      acceptanceRate: number;       // Percentage
    };
    cancellationRate: number;       // Percentage
  };
  geography: {
    byCity: Array<{
      cityId: number;
      cityName: string;
      driverCount: number;
      averageRating: number;
      averageEarnings: number;      // In cents
    }>;
    coverage: {
      citiesWithDrivers: number;
      averageDriversPerCity: number;
      coverageGapCities: Array<{
        cityId: number;
        cityName: string;
        driverCount: number;
        demandLevel: 'high' | 'medium' | 'low';
      }>;
    };
  };
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/reports-analytics/analytics/geography`

**Purpose:** Get geographic analytics and coverage data

**Query Parameters:**
```typescript
interface GeographyAnalyticsQueryParams {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  countryId?: number;
  stateId?: number;
  metric?: 'rides' | 'revenue' | 'users' | 'drivers' | 'coverage';
}
```

**Response:**
```typescript
interface GeographyAnalyticsResponse {
  coverage: {
    countries: number;              // Active countries
    states: number;                 // Active states
    cities: number;                 // Active cities
    zones: number;                  // Active zones
    totalAreaKm2: number;           // Total coverage area
    populationCovered: number;
  };
  performance: {
    byCountry: Array<{
      countryId: number;
      countryName: string;
      rides: number;
      revenue: number;              // In cents
      users: number;
      drivers: number;
      averageFare: number;          // In cents
    }>;
    byCity: Array<{
      cityId: number;
      cityName: string;
      rides: number;
      revenue: number;              // In cents
      users: number;
      drivers: number;
      averageFare: number;          // In cents
      marketShare: number;          // Percentage
    }>;
    topCities: Array<{
      cityId: number;
      cityName: string;
      metric: string;
      value: number;
      rank: number;
    }>;
  };
  demand: {
    highDemandAreas: Array<{
      zoneId: number;
      zoneName: string;
      demandLevel: number;          // 1-10 scale
      averageWaitTime: number;      // In minutes
      ridesPerHour: number;
    }>;
    supplyGaps: Array<{
      cityId: number;
      cityName: string;
      demandLevel: number;
      driverCoverage: number;       // Drivers per 1000 users
      recommendedDrivers: number;
    }>;
  };
  expansion: {
    potentialCities: Array<{
      cityId: number;
      cityName: string;
      population: number;
      estimatedDemand: number;      // Based on demographics
      competitionLevel: 'low' | 'medium' | 'high';
      roi: number;                  // Estimated return on investment
    }>;
  };
  generatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

## Error Response Format

All endpoints follow consistent error response format:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];  // Error message(s)
  error: string;               // Error type
  timestamp?: string;          // ISO date string
  path?: string;               // Request path
  method?: string;             // HTTP method
}
```

## Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate, constraint violation)
- `500 Internal Server Error` - Server error

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Rate Limiting

Reports & Analytics endpoints are rate limited:
- Report listing: 100 requests per minute
- Report generation: 20 requests per minute
- Analytics endpoints: 50 requests per minute
- File downloads: 30 requests per minute</content>
</xai:function_call











