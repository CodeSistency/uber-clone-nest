# Service Zones API Reference

Frontend reference documentation for Service Zones endpoints in the Geography module.

## Overview

Service Zones define geographical areas within cities where ride-sharing and delivery services operate. Each zone has specific pricing multipliers, capacity limits, and operational characteristics.

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Rate Limiting

- Read operations: 100 requests per minute
- Write operations: 50 requests per minute
- Bulk operations: 10 requests per minute
- Analytics endpoints: 50 requests per minute

---

## Endpoints

### `GET /admin/geography/service-zones`

**Purpose:** List service zones with pagination and advanced filtering

**Query Parameters:**
```typescript
interface ServiceZonesQueryParams {
  search?: string;      // Search by zone name
  cityId?: number;      // Filter by city ID
  stateId?: number;     // Filter by state ID
  zoneType?: 'regular' | 'premium' | 'restricted';  // Filter by zone type
  isActive?: boolean;   // Filter by active status
  sortBy?: 'id' | 'zoneType' | 'pricingMultiplier' | 'demandMultiplier';  // Sort field
  sortOrder?: 'asc' | 'desc';  // Sort order
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
}
```

**Response:**
```typescript
interface ServiceZoneListResponse {
  zones: ServiceZoneListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ServiceZoneListItem {
  id: number;
  name: string;                   // Zone name
  zoneType: 'regular' | 'premium' | 'restricted';
  pricingMultiplier: number;      // Price multiplier for the zone (e.g., 1.2 = 20% more expensive)
  demandMultiplier: number;       // Demand multiplier for dynamic pricing
  isActive: boolean;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/service-zones`

**Purpose:** Create a new service zone

**Request Body:**
```typescript
interface CreateServiceZoneDto {
  name: string;                    // Required: 2-100 chars, unique within city
  cityId: number;                  // Required: valid city ID
  zoneType?: 'regular' | 'premium' | 'restricted';  // Optional: default 'regular'
  boundaries: any;                 // Required: GeoJSON Polygon geometry
  centerLat: number;               // Required: zone center latitude (-90 to 90)
  centerLng: number;               // Required: zone center longitude (-180 to 180)
  isActive?: boolean;              // Optional: default true
  pricingMultiplier?: number;      // Optional: price multiplier (0.1-5.0), default 1.0
  maxDrivers?: number;             // Optional: maximum drivers allowed in zone
  minDrivers?: number;             // Optional: minimum drivers required in zone
  peakHours?: any;                 // Optional: peak hours configuration
  demandMultiplier?: number;       // Optional: demand multiplier (0.1-5.0), default 1.0
}
```

**Response:**
```typescript
interface ServiceZoneResponse {
  id: number;
  name: string;
  cityId: number;
  zoneType: 'regular' | 'premium' | 'restricted';
  boundaries: any;                 // GeoJSON Polygon
  centerLat: number;
  centerLng: number;
  isActive: boolean;
  pricingMultiplier: number;
  maxDrivers?: number;
  minDrivers?: number;
  peakHours?: any;
  demandMultiplier: number;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      code: string;
      country: {
        id: number;
        name: string;
        code: string;
        isoCode2: string;
      };
    };
  };
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/service-zones/:id`

**Purpose:** Get complete details of a specific service zone

**Path Parameters:**
```typescript
interface ServiceZonePathParams {
  id: number;  // Service zone ID
}
```

**Response:**
```typescript
interface ServiceZoneResponse {
  id: number;
  name: string;
  cityId: number;
  zoneType: 'regular' | 'premium' | 'restricted';
  boundaries: any;                 // GeoJSON Polygon geometry
  centerLat: number;
  centerLng: number;
  isActive: boolean;
  pricingMultiplier: number;
  maxDrivers?: number;
  minDrivers?: number;
  peakHours?: any;
  demandMultiplier: number;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      code: string;
      country: {
        id: number;
        name: string;
        code: string;
        isoCode2: string;
      };
    };
  };
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/service-zones/:id`

**Purpose:** Update an existing service zone

**Path Parameters:**
```typescript
interface ServiceZonePathParams {
  id: number;  // Service zone ID
}
```

**Request Body:**
```typescript
interface UpdateServiceZoneDto {
  name?: string;                   // 2-100 chars, unique within city
  cityId?: number;                 // Valid city ID
  zoneType?: 'regular' | 'premium' | 'restricted';
  boundaries?: any;                // GeoJSON Polygon geometry
  centerLat?: number;              // -90 to 90
  centerLng?: number;              // -180 to 180
  isActive?: boolean;
  pricingMultiplier?: number;      // 0.1-5.0
  maxDrivers?: number;             // Maximum drivers allowed
  minDrivers?: number;             // Minimum drivers required
  peakHours?: any;                 // Peak hours configuration
  demandMultiplier?: number;       // 0.1-5.0
}
```

**Response:**
```typescript
interface ServiceZoneResponse {
  id: number;
  name: string;
  cityId: number;
  zoneType: 'regular' | 'premium' | 'restricted';
  boundaries: any;                 // GeoJSON Polygon
  centerLat: number;
  centerLng: number;
  isActive: boolean;
  pricingMultiplier: number;
  maxDrivers?: number;
  minDrivers?: number;
  peakHours?: any;
  demandMultiplier: number;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      code: string;
      country: {
        id: number;
        name: string;
        code: string;
        isoCode2: string;
      };
    };
  };
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/geography/service-zones/:id`

**Purpose:** Delete a service zone

**Path Parameters:**
```typescript
interface ServiceZonePathParams {
  id: number;  // Service zone ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/service-zones/by-city/:cityId`

**Purpose:** Get all active service zones for a specific city with pagination

**Path Parameters:**
```typescript
interface CityServiceZonesParams {
  cityId: number;  // City ID
}
```

**Query Parameters:**
```typescript
interface CityServiceZonesQueryParams {
  activeOnly?: boolean;  // Default: true - Only return active zones
  page?: number;         // Default: 1
  limit?: number;        // Default: 20, Max: 100
}
```

**Response:**
```typescript
interface CityServiceZonesListResponse {
  zones: Array<{
    id: number;
    name: string;
    zoneType: 'regular' | 'premium' | 'restricted';
    boundaries: any;                 // GeoJSON Polygon
    centerLat: number;
    centerLng: number;
    isActive: boolean;
    pricingMultiplier: number;
    demandMultiplier: number;
    maxDrivers?: number;
    minDrivers?: number;
  }>;
  total: number;        // Total number of zones
  page: number;         // Current page
  limit: number;        // Items per page
  totalPages: number;   // Total pages
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/service-zones/:id/toggle-status`

**Purpose:** Toggle the active status of a service zone

**Path Parameters:**
```typescript
interface ServiceZonePathParams {
  id: number;  // Service zone ID
}
```

**Response:**
```typescript
interface ServiceZoneResponse {
  id: number;
  name: string;
  cityId: number;
  zoneType: 'regular' | 'premium' | 'restricted';
  boundaries: any;                 // GeoJSON Polygon
  centerLat: number;
  centerLng: number;
  isActive: boolean;
  pricingMultiplier: number;
  maxDrivers?: number;
  minDrivers?: number;
  peakHours?: any;
  demandMultiplier: number;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      code: string;
      country: {
        id: number;
        name: string;
        code: string;
        isoCode2: string;
      };
    };
  };
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/service-zones/validate-geometry`

**Purpose:** Validate service zone geometry and boundaries

**Request Body:**
```typescript
interface ValidateZoneGeometryRequest {
  zoneData: CreateServiceZoneDto | UpdateServiceZoneDto;  // Zone data containing boundaries
  cityId: number;                 // City ID for validation context
  excludeZoneId?: number;         // Optional: exclude this zone from overlap checks
}
```

**Response:**
```typescript
interface ZoneValidationResult {
  isValid: boolean;
  errors: string[];               // Validation errors
  warnings: string[];             // Validation warnings
  coverage?: {
    areaKm2: number;              // Calculated area in square kilometers
    overlapPercentage: number;    // Percentage of overlap with existing zones
    gapPercentage: number;        // Percentage of uncovered area
  };
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/service-zones/coverage-analysis/city/:cityId`

**Purpose:** Analyze coverage and statistics for all zones in a city

**Path Parameters:**
```typescript
interface CityCoverageAnalysisParams {
  cityId: number;  // City ID
}
```

**Response:**
```typescript
interface CityCoverageAnalysis {
  cityId: number;
  cityName: string;
  totalCoverage: number;           // Percentage of city covered (0-100)
  overlappingArea: number;         // Percentage of overlapping zones
  uncoveredArea: number;           // Percentage of uncovered area
  coverageByType: {
    regular: number;               // Coverage percentage by regular zones
    premium: number;               // Coverage percentage by premium zones
    restricted: number;            // Coverage percentage by restricted zones
  };
  issues: string[];                // List of geometry issues found
  recommendations: string[];       // Suggested improvements
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/service-zones/bulk-update-status`

**Purpose:** Bulk update active status for multiple service zones

**Request Body:**
```typescript
interface BulkUpdateZoneStatusRequest {
  zoneIds: number[];              // Array of zone IDs to update
  isActive: boolean;              // New active status for all zones
}
```

**Response:**
```typescript
interface BulkUpdateZoneStatusResponse {
  message: string;                // Completion message
  results: Array<{                // Detailed results for each zone
    zoneId: number;               // Zone ID
    success: boolean;             // Whether the update was successful
    data?: ServiceZoneResponse;   // Zone data if successful
    error?: string;               // Error message if failed
  }>;
  successful: number;             // Number of successful updates
  failed: number;                 // Number of failed updates
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/service-zones/pricing-matrix/city/:cityId`

**Purpose:** Get pricing matrix for all active zones in a city with pagination

**Path Parameters:**
```typescript
interface CityPricingMatrixParams {
  cityId: number;  // City ID
}
```

**Query Parameters:**
```typescript
interface CityPricingMatrixQueryParams {
  page?: number;   // Default: 1
  limit?: number;  // Default: 20, Max: 100
}
```

**Response:**
```typescript
interface CityPricingMatrixResponse {
  cityId: number;
  zones: Array<{
    id: number;
    name: string;
    type: 'regular' | 'premium' | 'restricted';  // Note: 'type' instead of 'zoneType'
    pricingMultiplier: number;
    demandMultiplier: number;
    maxDrivers?: number;
    minDrivers?: number;
  }>;
  total: number;      // Total number of zones
  page: number;       // Current page
  limit: number;      // Items per page
  totalPages: number; // Total pages
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

## Common Data Types

### Zone Types
```typescript
type ZoneType = 'regular' | 'premium' | 'restricted';
```

### GeoJSON Polygon Structure
```typescript
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];  // [[[lng, lat], [lng, lat], ...]]
}
```

### Peak Hours Configuration
```typescript
interface PeakHoursConfig {
  monday?: TimeRange[];
  tuesday?: TimeRange[];
  wednesday?: TimeRange[];
  thursday?: TimeRange[];
  friday?: TimeRange[];
  saturday?: TimeRange[];
  sunday?: TimeRange[];
}

interface TimeRange {
  start: string;  // HH:mm format
  end: string;    // HH:mm format
  multiplier: number;  // Price multiplier during this time
}
```

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
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate, constraint violation)
- `500 Internal Server Error` - Server error

## Usage Examples

### Creating a Service Zone
```typescript
const newZone = {
  name: "Downtown Premium Zone",
  cityId: 1,
  zoneType: "premium",
  boundaries: {
    type: "Polygon",
    coordinates: [[
      [-74.0060, 40.7128],
      [-74.0060, 40.7589],
      [-73.9352, 40.7589],
      [-73.9352, 40.7128],
      [-74.0060, 40.7128]
    ]]
  },
  centerLat: 40.7359,
  centerLng: -73.9706,
  pricingMultiplier: 1.5,
  demandMultiplier: 1.8,
  maxDrivers: 50,
  minDrivers: 10
};
```

### Validating Zone Geometry
```typescript
const validationRequest = {
  zoneData: newZone,
  cityId: 1,
  excludeZoneId: undefined  // For new zones
};
```

### Bulk Status Update
```typescript
const bulkUpdate = {
  zoneIds: [1, 2, 3, 4, 5],
  isActive: false
};
```

## Important Notes

1. **GeoJSON Format**: All boundaries must be valid GeoJSON Polygon geometries
2. **Coordinate System**: Uses WGS84 coordinate system (longitude, latitude)
3. **Uniqueness**: Zone names must be unique within a city
4. **Pricing**: Multipliers are decimal values (0.1 to 5.0)
5. **Validation**: Always validate geometry before creating/updating zones
6. **Coverage**: Use coverage analysis to ensure proper city coverage without gaps or excessive overlaps
