# Pricing Module - API Endpoints Reference

Frontend reference documentation for Pricing module endpoints (Ride Tiers & Temporal Rules).

## Ride Tiers Endpoints

### `GET /admin/pricing/ride-tiers`

**Purpose:** List ride tiers with pagination and filters

**Query Parameters:**
```typescript
interface RideTiersQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  countryId?: number;
  stateId?: number;
  cityId?: number;
  serviceZoneId?: number;
  isActive?: boolean;
  search?: string;      // Search in name or description
  sortBy?: 'name' | 'baseFare' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface RideTiersListResponse {
  tiers: RideTier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RideTier {
  id: number;
  name: string;
  description?: string;
  baseFare: number;           // Base fare in cents
  perMinuteRate: number;      // Rate per minute in cents
  perMileRate: number;        // Rate per mile in cents
  minimumFare?: number;       // Minimum fare in cents
  maximumFare?: number;       // Maximum fare in cents
  bookingFee?: number;        // Booking fee in cents
  tierMultiplier: number;     // Base multiplier (default: 1.0)
  surgeMultiplier: number;    // Surge pricing multiplier
  demandMultiplier: number;   // Demand-based multiplier
  luxuryMultiplier?: number;  // Luxury service multiplier
  comfortMultiplier?: number; // Comfort features multiplier
  minPassengers: number;      // Minimum passengers
  maxPassengers: number;      // Maximum passengers
  isActive: boolean;
  priority: number;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  serviceZoneId?: number;
  features?: string[];        // Array of feature strings
  restrictions?: string[];    // Array of restriction strings
  createdAt: string;          // ISO date string
  updatedAt: string;          // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/ride-tiers`

**Purpose:** Create a new ride tier

**Request Body:**
```typescript
interface CreateRideTierDto {
  name: string;                    // Required: 2-50 chars
  description?: string;            // Optional: max 500 chars
  baseFare: number;                // Required: 0-10000 cents
  perMinuteRate: number;           // Required: 0-500 cents
  perMileRate: number;             // Required: 0-1000 cents
  minimumFare?: number;            // Optional: 0-5000 cents
  maximumFare?: number;            // Optional: 1000-100000 cents
  bookingFee?: number;             // Optional: 0-2000 cents
  tierMultiplier?: number;         // Optional: 0.5-5.0, default: 1.0
  surgeMultiplier?: number;        // Optional: 1.0-10.0, default: 1.0
  demandMultiplier?: number;       // Optional: 1.0-5.0, default: 1.0
  luxuryMultiplier?: number;       // Optional: 1.0-3.0, default: 1.0
  comfortMultiplier?: number;      // Optional: 1.0-2.0, default: 1.0
  minPassengers?: number;          // Optional: 1-8, default: 1
  maxPassengers?: number;          // Optional: 1-8, default: 4
  isActive?: boolean;              // Optional: default true
  priority?: number;               // Optional: 1-100, default: 1
  countryId?: number;              // Optional: geographic scope
  stateId?: number;                // Optional: geographic scope
  cityId?: number;                 // Optional: geographic scope
  serviceZoneId?: number;          // Optional: geographic scope
  features?: string[];             // Optional: feature descriptions
  restrictions?: string[];         // Optional: restriction descriptions
}
```

**Response:**
```typescript
interface RideTierResponse extends RideTier {
  // Same as RideTier interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/pricing/ride-tiers/:id`

**Purpose:** Get details of a specific ride tier

**Path Parameters:**
```typescript
interface RideTierPathParams {
  id: number;  // Ride tier ID
}
```

**Response:**
```typescript
interface RideTierResponse extends RideTier {
  // Same as RideTier interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/pricing/ride-tiers/:id`

**Purpose:** Update an existing ride tier

**Path Parameters:**
```typescript
interface RideTierPathParams {
  id: number;  // Ride tier ID
}
```

**Request Body:**
```typescript
interface UpdateRideTierDto {
  name?: string;                   // Optional: 2-50 chars
  description?: string;            // Optional: max 500 chars
  baseFare?: number;               // Optional: 0-10000 cents
  perMinuteRate?: number;          // Optional: 0-500 cents
  perMileRate?: number;            // Optional: 0-1000 cents
  minimumFare?: number;            // Optional: 0-5000 cents
  maximumFare?: number;            // Optional: 1000-100000 cents
  bookingFee?: number;             // Optional: 0-2000 cents
  tierMultiplier?: number;         // Optional: 0.5-5.0
  surgeMultiplier?: number;        // Optional: 1.0-10.0
  demandMultiplier?: number;       // Optional: 1.0-5.0
  luxuryMultiplier?: number;       // Optional: 1.0-3.0
  comfortMultiplier?: number;      // Optional: 1.0-2.0
  minPassengers?: number;          // Optional: 1-8
  maxPassengers?: number;          // Optional: 1-8
  isActive?: boolean;
  priority?: number;               // Optional: 1-100
  countryId?: number;              // Optional: geographic scope
  stateId?: number;                // Optional: geographic scope
  cityId?: number;                 // Optional: geographic scope
  serviceZoneId?: number;          // Optional: geographic scope
  features?: string[];             // Optional: feature descriptions
  restrictions?: string[];         // Optional: restriction descriptions
}
```

**Response:**
```typescript
interface RideTierResponse extends RideTier {
  // Same as RideTier interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/pricing/ride-tiers/:id`

**Purpose:** Delete a ride tier

**Path Parameters:**
```typescript
interface RideTierPathParams {
  id: number;  // Ride tier ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/ride-tiers/calculate-pricing`

**Purpose:** Calculate pricing for a ride scenario

**Request Body:**
```typescript
interface PricingCalculationDto {
  tierId: number;                  // Required: Ride tier ID
  distanceMiles: number;           // Required: Distance in miles (0.1-500)
  durationMinutes: number;         // Required: Duration in minutes (1-1440)
  surgeMultiplier?: number;        // Optional: Surge multiplier (1.0-10.0)
  demandMultiplier?: number;       // Optional: Demand multiplier (1.0-5.0)
  countryId?: number;              // Optional: Country for regional pricing
  stateId?: number;                // Optional: State for regional pricing
  cityId?: number;                 // Optional: City for regional pricing
  serviceZoneId?: number;          // Optional: Service zone for regional pricing
  timestamp?: string;              // Optional: ISO date string for temporal pricing
  isPeakHour?: boolean;            // Optional: Peak hour flag
  isNightTime?: boolean;           // Optional: Night time flag
  isWeekend?: boolean;             // Optional: Weekend flag
  isHoliday?: boolean;             // Optional: Holiday flag
  trafficMultiplier?: number;      // Optional: Traffic multiplier (0.5-3.0)
}
```

**Response:**
```typescript
interface PricingCalculationResultDto {
  tier: {
    id: number;
    name: string;
    baseFare: number;           // Base fare in cents
    perMinuteRate: number;      // Per minute rate in cents
    perMileRate: number;        // Per mile rate in cents
  };
  distance: number;             // Distance used in calculation
  duration: number;             // Duration used in calculation
  baseFare: number;             // Base fare applied in cents
  distanceFare: number;         // Distance-based fare in cents
  timeFare: number;             // Time-based fare in cents
  subtotal: number;             // Subtotal before multipliers in cents
  bookingFee: number;           // Booking fee in cents
  surgeFare: number;            // Additional surge fare in cents
  demandFare: number;           // Additional demand fare in cents
  totalFare: number;            // Total fare before taxes in cents
  estimatedTaxes: number;       // Estimated taxes in cents
  finalFare: number;            // Final fare including taxes in cents
  currency: string;             // Currency code (default: "USD")
  breakdown: {
    components: Array<{
      name: string;             // Component name
      amount: number;           // Amount in cents
      description: string;      // Human readable description
    }>;
  };
  appliedRules: Array<{
    type: string;               // Rule type (surge, demand, temporal, etc.)
    multiplier: number;         // Multiplier applied
    description: string;        // Rule description
  }>;
  effectiveMultiplier: number;  // Total effective multiplier
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/ride-tiers/validate-pricing`

**Purpose:** Validate pricing configuration

**Request Body:**
```typescript
interface PricingValidationDto {
  tier: {
    name?: string;
    baseFare?: number;
    perMinuteRate?: number;
    perMileRate?: number;
    minimumFare?: number;
    maximumFare?: number;
    bookingFee?: number;
  };
  compareWithTierId?: number;    // Optional: Compare with existing tier
}
```

**Response:**
```typescript
interface PricingValidationResultDto {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  suggestions: Array<{
    type: string;
    message: string;
    action?: string;
  }>;
  comparison?: {                 // Only present if compareWithTierId provided
    existingTier: {
      id: number;
      name: string;
      baseFare: number;
      perMinuteRate: number;
      perMileRate: number;
    };
    differences: Array<{
      field: string;
      newValue: any;
      existingValue: any;
      percentageChange?: number;
    }>;
    recommendations: string[];
  };
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/ride-tiers/create-standard-tiers`

**Purpose:** Create standard Uber-style ride tiers

**Response:**
```typescript
interface StandardTiersResponse {
  created: number;        // Number of tiers created
  tiers: RideTier[];      // Array of created ride tiers
  skipped: Array<{        // Tiers that were skipped (already exist)
    name: string;
    reason: string;
  }>;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/ride-tiers/bulk-update`

**Purpose:** Bulk update multiple ride tiers

**Request Body:**
```typescript
interface BulkRideTierUpdateDto {
  tierIds: number[];      // Array of ride tier IDs to update
  adjustmentType: 'percentage' | 'absolute' | 'multiplier';
  adjustmentValue: number; // Adjustment value (percentage, amount in cents, or multiplier)
  field: 'baseFare' | 'perMinuteRate' | 'perMileRate' | 'bookingFee' | 'tierMultiplier' | 'surgeMultiplier' | 'demandMultiplier';
  condition?: {           // Optional condition for selective updates
    countryId?: number;
    stateId?: number;
    cityId?: number;
    serviceZoneId?: number;
    isActive?: boolean;
  };
}
```

**Response:**
```typescript
interface BulkTierUpdateResponse {
  updated: number;        // Number of successfully updated tiers
  failed: number;         // Number of failed updates
  totalAffected: number;  // Total tiers that matched conditions
  results: Array<{
    tierId: number;
    tierName: string;
    success: boolean;
    oldValue?: number;
    newValue?: number;
    error?: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

## Temporal Pricing Rules Endpoints

### `GET /admin/pricing/temporal-rules`

**Purpose:** List temporal pricing rules with pagination and filters

**Query Parameters:**
```typescript
interface TemporalRulesQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  ruleType?: 'time_range' | 'day_of_week' | 'date_specific' | 'seasonal';
  isActive?: boolean;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  zoneId?: number;
  search?: string;      // Search in name or description
  sortBy?: 'name' | 'ruleType' | 'multiplier' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface TemporalPricingRulesListResponse {
  rules: TemporalPricingRule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TemporalPricingRule {
  id: number;
  name: string;
  description?: string;
  ruleType: 'time_range' | 'day_of_week' | 'date_specific' | 'seasonal';
  multiplier: number;           // Pricing multiplier (1.0-10.0)
  startTime?: string;           // HH:MM format (for time_range)
  endTime?: string;             // HH:MM format (for time_range)
  daysOfWeek?: number[];        // 0-6 (Sunday-Saturday) for day_of_week
  specificDates?: string[];     // YYYY-MM-DD format for date_specific
  dateRanges?: Array<{          // For seasonal rules
    start: string;              // YYYY-MM-DD
    end: string;                // YYYY-MM-DD
  }>;
  isActive: boolean;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  zoneId?: number;
  priority: number;             // Rule priority (higher = applied first)
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/temporal-rules`

**Purpose:** Create a new temporal pricing rule

**Request Body:**
```typescript
interface CreateTemporalPricingRuleDto {
  name: string;                    // Required: 3-100 chars
  description?: string;            // Optional: max 500 chars
  ruleType: 'time_range' | 'day_of_week' | 'date_specific' | 'seasonal';  // Required
  multiplier: number;              // Required: 1.0-10.0
  startTime?: string;              // Required for time_range: HH:MM format
  endTime?: string;                // Required for time_range: HH:MM format
  daysOfWeek?: number[];           // Required for day_of_week: array of 0-6
  specificDates?: string[];        // Required for date_specific: YYYY-MM-DD array
  dateRanges?: Array<{             // Required for seasonal
    start: string;                 // YYYY-MM-DD
    end: string;                   // YYYY-MM-DD
  }>;
  isActive?: boolean;              // Optional, default: true
  countryId?: number;              // Optional: geographic scope
  stateId?: number;                // Optional: geographic scope
  cityId?: number;                 // Optional: geographic scope
  zoneId?: number;                 // Optional: geographic scope
  priority?: number;               // Optional: 1-100, default: 1
}
```

**Response:**
```typescript
interface TemporalPricingRuleResponse extends TemporalPricingRule {
  // Same as TemporalPricingRule interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/pricing/temporal-rules/:id`

**Purpose:** Get details of a specific temporal rule

**Path Parameters:**
```typescript
interface TemporalRulePathParams {
  id: number;  // Temporal rule ID
}
```

**Response:**
```typescript
interface TemporalPricingRuleResponse extends TemporalPricingRule {
  // Same as TemporalPricingRule interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/pricing/temporal-rules/:id`

**Purpose:** Update an existing temporal rule

**Path Parameters:**
```typescript
interface TemporalRulePathParams {
  id: number;  // Temporal rule ID
}
```

**Request Body:**
```typescript
interface UpdateTemporalPricingRuleDto {
  name?: string;                   // Optional: 3-100 chars
  description?: string;            // Optional: max 500 chars
  ruleType?: 'time_range' | 'day_of_week' | 'date_specific' | 'seasonal';
  multiplier?: number;             // Optional: 1.0-10.0
  startTime?: string;              // Optional: HH:MM format
  endTime?: string;                // Optional: HH:MM format
  daysOfWeek?: number[];           // Optional: array of 0-6
  specificDates?: string[];        // Optional: YYYY-MM-DD array
  dateRanges?: Array<{             // Optional
    start: string;                 // YYYY-MM-DD
    end: string;                   // YYYY-MM-DD
  }>;
  isActive?: boolean;
  countryId?: number;              // Optional: geographic scope
  stateId?: number;                // Optional: geographic scope
  cityId?: number;                 // Optional: geographic scope
  zoneId?: number;                 // Optional: geographic scope
  priority?: number;               // Optional: 1-100
}
```

**Response:**
```typescript
interface TemporalPricingRuleResponse extends TemporalPricingRule {
  // Same as TemporalPricingRule interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/pricing/temporal-rules/:id`

**Purpose:** Delete a temporal pricing rule

**Path Parameters:**
```typescript
interface TemporalRulePathParams {
  id: number;  // Temporal rule ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/temporal-rules/evaluate`

**Purpose:** Evaluate active temporal rules for a date/time

**Request Body:**
```typescript
interface TemporalPricingEvaluationDto {
  dateTime: string;              // Required: ISO date string
  countryId?: number;            // Optional: Country for geographic filtering
  stateId?: number;              // Optional: State for geographic filtering
  cityId?: number;               // Optional: City for geographic filtering
  zoneId?: number;               // Optional: Zone for geographic filtering
}
```

**Response:**
```typescript
interface TemporalPricingEvaluationResultDto {
  dateTime: string;              // Input date/time
  location: {                    // Geographic context used
    countryId?: number;
    stateId?: number;
    cityId?: number;
    zoneId?: number;
  };
  activeRules: Array<{
    id: number;
    name: string;
    ruleType: string;
    multiplier: number;
    reason: string;              // Why this rule applies
  }>;
  effectiveMultiplier: number;   // Combined multiplier from all active rules
  ruleCount: number;             // Number of active rules
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/temporal-rules/create-standard-rules`

**Purpose:** Create standard temporal pricing rules

**Request Body:**
```typescript
interface CreateStandardTemporalRulesDto {
  countryId?: number;            // Optional: Country scope
  cityId?: number;               // Optional: City scope
  rules: Array<{
    type: 'morning_peak' | 'evening_peak' | 'night_surcharge' | 'weekend_surcharge' | 'holiday_surcharge';
    multiplier: number;          // 1.0-10.0
    customConfig?: {             // Optional custom configuration
      startTime?: string;        // HH:MM format
      endTime?: string;          // HH:MM format
      daysOfWeek?: number[];     // 0-6 array
    };
  }>;
}
```

**Response:**
```typescript
interface StandardTemporalRulesResponse {
  created: number;        // Number of rules created
  rules: TemporalPricingRule[];  // Array of created rules
  skipped: Array<{        // Rules that were skipped
    type: string;
    reason: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/pricing/temporal-rules/bulk-update`

**Purpose:** Bulk update multiple temporal rules

**Request Body:**
```typescript
interface BulkTemporalRuleUpdateDto {
  ruleIds: number[];      // Array of rule IDs to update
  updates: {
    multiplier?: number;  // 1.0-10.0
    isActive?: boolean;
    priority?: number;    // 1-100
    countryId?: number;
    stateId?: number;
    cityId?: number;
    zoneId?: number;
  };
}
```

**Response:**
```typescript
interface BulkTemporalRuleUpdateResponse {
  updated: number;        // Number of successfully updated rules
  failed: number;         // Number of failed updates
  results: Array<{
    ruleId: number;
    ruleName: string;
    success: boolean;
    error?: string;
  }>;
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

Pricing endpoints are rate limited:
- Read operations: 100 requests per minute
- Write operations: 50 requests per minute
- Bulk operations: 10 requests per minute
- Calculation endpoints: 200 requests per minute</content>
</xai:function_call











