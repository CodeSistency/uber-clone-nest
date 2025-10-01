# Geography Module - API Endpoints Reference

Frontend reference documentation for Geography module endpoints (Countries, States, Cities, Zones).

## Countries Endpoints

### `GET /admin/geography/countries`

**Purpose:** List countries with pagination and filters

**Query Parameters:**
```typescript
interface CountriesQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  isActive?: boolean;
  search?: string;      // Search in name, code, or capital
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface CountriesListResponse {
  countries: Country[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Country {
  id: number;
  name: string;
  code: string;                    // ISO 3166-1 alpha-2 (e.g., "US", "MX")
  code3: string;                   // ISO 3166-1 alpha-3 (e.g., "USA", "MEX")
  capital?: string;
  currency?: string;               // ISO 4217 currency code
  currencySymbol?: string;
  phoneCode?: string;              // International dialing code
  flag?: string;                   // Flag emoji or URL
  region: string;                  // Continent/region
  subregion?: string;              // Sub-region
  languages: string[];             // Array of language codes
  timezones: string[];             // Array of timezone names
  latitude?: number;               // Centroid latitude
  longitude?: number;              // Centroid longitude
  area?: number;                   // Area in square kilometers
  population?: number;
  isActive: boolean;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/countries`

**Purpose:** Create a new country

**Request Body:**
```typescript
interface CreateCountryDto {
  name: string;                    // Required: 2-100 chars
  code: string;                    // Required: 2 chars, uppercase
  code3: string;                   // Required: 3 chars, uppercase
  capital?: string;                // Optional
  currency?: string;               // Optional: 3 chars
  currencySymbol?: string;         // Optional
  phoneCode?: string;              // Optional: e.g., "+1"
  flag?: string;                   // Optional: emoji or URL
  region: string;                  // Required: continent/region
  subregion?: string;              // Optional
  languages?: string[];            // Optional: language codes array
  timezones?: string[];            // Optional: timezone names array
  latitude?: number;               // Optional: -90 to 90
  longitude?: number;              // Optional: -180 to 180
  area?: number;                   // Optional: positive number
  population?: number;             // Optional: positive number
  isActive?: boolean;              // Optional, default: true
}
```

**Response:**
```typescript
interface CountryResponse extends Country {
  // Same as Country interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/countries/:id`

**Purpose:** Get details of a specific country

**Path Parameters:**
```typescript
interface CountryPathParams {
  id: number;  // Country ID
}
```

**Response:**
```typescript
interface CountryResponse extends Country {
  // Same as Country interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/countries/:id`

**Purpose:** Update an existing country

**Path Parameters:**
```typescript
interface CountryPathParams {
  id: number;  // Country ID
}
```

**Request Body:**
```typescript
interface UpdateCountryDto {
  name?: string;                   // Optional: 2-100 chars
  code?: string;                   // Optional: 2 chars, uppercase
  code3?: string;                  // Optional: 3 chars, uppercase
  capital?: string;
  currency?: string;               // Optional: 3 chars
  currencySymbol?: string;
  phoneCode?: string;
  flag?: string;
  region?: string;
  subregion?: string;
  languages?: string[];
  timezones?: string[];
  latitude?: number;               // -90 to 90
  longitude?: number;              // -180 to 180
  area?: number;                   // Positive number
  population?: number;             // Positive number
  isActive?: boolean;
}
```

**Response:**
```typescript
interface CountryResponse extends Country {
  // Same as Country interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/geography/countries/:id`

**Purpose:** Delete a country

**Path Parameters:**
```typescript
interface CountryPathParams {
  id: number;  // Country ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/countries/active`

**Purpose:** Get all active countries

**Response:**
```typescript
interface ActiveCountriesResponse extends Array<Country> {
  // Array of active Country objects
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/countries/bulk-import`

**Purpose:** Bulk import countries from standard data

**Request Body:**
```typescript
interface BulkImportCountriesDto {
  countries: Array<{
    name: string;
    code: string;
    code3: string;
    capital?: string;
    currency?: string;
    currencySymbol?: string;
    phoneCode?: string;
    region: string;
    subregion?: string;
    languages?: string[];
    timezones?: string[];
    latitude?: number;
    longitude?: number;
    area?: number;
    population?: number;
  }>;
  updateExisting?: boolean;       // Default: false
  skipDuplicates?: boolean;       // Default: true
}
```

**Response:**
```typescript
interface BulkImportCountriesResponse {
  imported: number;        // Number of countries imported
  updated: number;         // Number of countries updated
  skipped: number;         // Number of countries skipped
  errors: Array<{          // Errors for failed imports
    index: number;
    country: string;
    error: string;
  }>;
  countries: Country[];    // Array of imported/updated countries
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

## States/Provinces Endpoints

### `GET /admin/geography/states`

**Purpose:** List states/provinces with pagination and filters

**Query Parameters:**
```typescript
interface StatesQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  countryId?: number;   // Filter by country
  isActive?: boolean;
  search?: string;      // Search in name or code
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface StatesListResponse {
  states: State[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface State {
  id: number;
  name: string;
  code: string;                    // State/province code
  countryId: number;
  country: {
    id: number;
    name: string;
    code: string;
  };
  type: 'state' | 'province' | 'territory' | 'region';
  capital?: string;
  latitude?: number;
  longitude?: number;
  area?: number;                   // Area in square kilometers
  population?: number;
  timezones: string[];
  isActive: boolean;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/states`

**Purpose:** Create a new state/province

**Request Body:**
```typescript
interface CreateStateDto {
  name: string;                    // Required: 2-100 chars
  code: string;                    // Required: 2-5 chars
  countryId: number;               // Required: valid country ID
  type?: 'state' | 'province' | 'territory' | 'region';  // Default: 'state'
  capital?: string;
  latitude?: number;               // -90 to 90
  longitude?: number;              // -180 to 180
  area?: number;                   // Positive number
  population?: number;             // Positive number
  timezones?: string[];            // Array of timezone names
  isActive?: boolean;              // Default: true
}
```

**Response:**
```typescript
interface StateResponse extends State {
  // Same as State interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/states/:id`

**Purpose:** Get details of a specific state

**Path Parameters:**
```typescript
interface StatePathParams {
  id: number;  // State ID
}
```

**Response:**
```typescript
interface StateResponse extends State {
  // Same as State interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/states/:id`

**Purpose:** Update an existing state

**Path Parameters:**
```typescript
interface StatePathParams {
  id: number;  // State ID
}
```

**Request Body:**
```typescript
interface UpdateStateDto {
  name?: string;                   // 2-100 chars
  code?: string;                   // 2-5 chars
  countryId?: number;              // Valid country ID
  type?: 'state' | 'province' | 'territory' | 'region';
  capital?: string;
  latitude?: number;               // -90 to 90
  longitude?: number;              // -180 to 180
  area?: number;                   // Positive number
  population?: number;             // Positive number
  timezones?: string[];
  isActive?: boolean;
}
```

**Response:**
```typescript
interface StateResponse extends State {
  // Same as State interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/geography/states/:id`

**Purpose:** Delete a state

**Path Parameters:**
```typescript
interface StatePathParams {
  id: number;  // State ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/countries/:countryId/states`

**Purpose:** Get all states for a specific country

**Path Parameters:**
```typescript
interface CountryStatesParams {
  countryId: number;  // Country ID
}
```

**Query Parameters:**
```typescript
interface CountryStatesQueryParams {
  isActive?: boolean;
  type?: 'state' | 'province' | 'territory' | 'region';
}
```

**Response:**
```typescript
interface CountryStatesResponse extends Array<State> {
  // Array of State objects for the country
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

## Cities Endpoints

### `GET /admin/geography/cities`

**Purpose:** List cities with pagination and filters

**Query Parameters:**
```typescript
interface CitiesQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  countryId?: number;   // Filter by country
  stateId?: number;     // Filter by state
  isActive?: boolean;
  search?: string;      // Search in name
  sortBy?: 'name' | 'population' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface CitiesListResponse {
  cities: City[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface City {
  id: number;
  name: string;
  stateId: number;
  state: {
    id: number;
    name: string;
    code: string;
    country: {
      id: number;
      name: string;
      code: string;
    };
  };
  latitude: number;               // Required: -90 to 90
  longitude: number;              // Required: -180 to 180
  timezone: string;               // Required: timezone name
  population?: number;
  area?: number;                  // Area in square kilometers
  elevation?: number;             // Elevation in meters
  isCapital?: boolean;            // Is capital of state/country
  isActive: boolean;
  createdAt: string;              // ISO date string
  updatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/cities`

**Purpose:** Create a new city

**Request Body:**
```typescript
interface CreateCityDto {
  name: string;                    // Required: 2-100 chars
  stateId: number;                 // Required: valid state ID
  latitude: number;                // Required: -90 to 90
  longitude: number;               // Required: -180 to 180
  timezone: string;                // Required: valid timezone name
  population?: number;             // Optional: positive number
  area?: number;                   // Optional: positive number
  elevation?: number;              // Optional: elevation in meters
  isCapital?: boolean;             // Optional: default false
  isActive?: boolean;              // Optional: default true
}
```

**Response:**
```typescript
interface CityResponse extends City {
  // Same as City interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/cities/:id`

**Purpose:** Get details of a specific city

**Path Parameters:**
```typescript
interface CityPathParams {
  id: number;  // City ID
}
```

**Response:**
```typescript
interface CityResponse extends City {
  // Same as City interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/cities/:id`

**Purpose:** Update an existing city

**Path Parameters:**
```typescript
interface CityPathParams {
  id: number;  // City ID
}
```

**Request Body:**
```typescript
interface UpdateCityDto {
  name?: string;                   // 2-100 chars
  stateId?: number;                // Valid state ID
  latitude?: number;               // -90 to 90
  longitude?: number;              // -180 to 180
  timezone?: string;               // Valid timezone name
  population?: number;             // Positive number
  area?: number;                   // Positive number
  elevation?: number;              // Elevation in meters
  isCapital?: boolean;
  isActive?: boolean;
}
```

**Response:**
```typescript
interface CityResponse extends City {
  // Same as City interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/geography/cities/:id`

**Purpose:** Delete a city

**Path Parameters:**
```typescript
interface CityPathParams {
  id: number;  // City ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/states/:stateId/cities`

**Purpose:** Get all cities for a specific state

**Path Parameters:**
```typescript
interface StateCitiesParams {
  stateId: number;  // State ID
}
```

**Query Parameters:**
```typescript
interface StateCitiesQueryParams {
  isActive?: boolean;
  isCapital?: boolean;
}
```

**Response:**
```typescript
interface StateCitiesResponse extends Array<City> {
  // Array of City objects for the state
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

## Service Zones Endpoints

### `GET /admin/geography/zones`

**Purpose:** List service zones with pagination and filters

**Query Parameters:**
```typescript
interface ZonesQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  cityId?: number;      // Filter by city
  zoneType?: 'pickup' | 'dropoff' | 'both';
  isActive?: boolean;
  search?: string;      // Search in name
  sortBy?: 'name' | 'zoneType' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ZonesListResponse {
  zones: ServiceZone[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  cityId: number;
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      country: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
  zoneType: 'pickup' | 'dropoff' | 'both';
  geoJson: any;                   // GeoJSON geometry object
  centerLatitude: number;         // Zone center latitude
  centerLongitude: number;        // Zone center longitude
  radiusMeters?: number;          // For circular zones
  areaSquareKm?: number;          // Calculated area
  isActive: boolean;
  priority: number;               // Zone priority (higher = more important)
  serviceTierIds?: number[];      // Associated ride tier IDs
  restrictions?: string[];        // Zone-specific restrictions
  createdAt: string;              // ISO date string
  updatedAt: string;              // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/zones`

**Purpose:** Create a new service zone

**Request Body:**
```typescript
interface CreateServiceZoneDto {
  name: string;                    // Required: 2-100 chars
  description?: string;            // Optional
  cityId: number;                  // Required: valid city ID
  zoneType: 'pickup' | 'dropoff' | 'both';  // Required
  geoJson: any;                    // Required: valid GeoJSON geometry
  centerLatitude: number;          // Required: -90 to 90
  centerLongitude: number;         // Required: -180 to 180
  radiusMeters?: number;           // Optional: for circular zones
  areaSquareKm?: number;           // Optional: auto-calculated if not provided
  isActive?: boolean;              // Optional: default true
  priority?: number;               // Optional: 1-100, default 1
  serviceTierIds?: number[];       // Optional: ride tier IDs
  restrictions?: string[];         // Optional: restriction descriptions
}
```

**Response:**
```typescript
interface ServiceZoneResponse extends ServiceZone {
  // Same as ServiceZone interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/zones/:id`

**Purpose:** Get details of a specific service zone

**Path Parameters:**
```typescript
interface ZonePathParams {
  id: number;  // Service zone ID
}
```

**Response:**
```typescript
interface ServiceZoneResponse extends ServiceZone {
  // Same as ServiceZone interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/geography/zones/:id`

**Purpose:** Update an existing service zone

**Path Parameters:**
```typescript
interface ZonePathParams {
  id: number;  // Service zone ID
}
```

**Request Body:**
```typescript
interface UpdateServiceZoneDto {
  name?: string;                   // 2-100 chars
  description?: string;
  cityId?: number;                 // Valid city ID
  zoneType?: 'pickup' | 'dropoff' | 'both';
  geoJson?: any;                   // Valid GeoJSON geometry
  centerLatitude?: number;         // -90 to 90
  centerLongitude?: number;        // -180 to 180
  radiusMeters?: number;           // For circular zones
  areaSquareKm?: number;           // Auto-calculated if not provided
  isActive?: boolean;
  priority?: number;               // 1-100
  serviceTierIds?: number[];       // Ride tier IDs
  restrictions?: string[];         // Restriction descriptions
}
```

**Response:**
```typescript
interface ServiceZoneResponse extends ServiceZone {
  // Same as ServiceZone interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/geography/zones/:id`

**Purpose:** Delete a service zone

**Path Parameters:**
```typescript
interface ZonePathParams {
  id: number;  // Service zone ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/cities/:cityId/zones`

**Purpose:** Get all zones for a specific city

**Path Parameters:**
```typescript
interface CityZonesParams {
  cityId: number;  // City ID
}
```

**Query Parameters:**
```typescript
interface CityZonesQueryParams {
  zoneType?: 'pickup' | 'dropoff' | 'both';
  isActive?: boolean;
}
```

**Response:**
```typescript
interface CityZonesResponse extends Array<ServiceZone> {
  // Array of ServiceZone objects for the city
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/zones/point-in-zone`

**Purpose:** Check if a point is within a service zone

**Request Body:**
```typescript
interface PointInZoneDto {
  latitude: number;               // Required: -90 to 90
  longitude: number;              // Required: -180 to 180
  cityId?: number;                // Optional: filter by city
  zoneType?: 'pickup' | 'dropoff' | 'both';  // Optional: filter by zone type
}
```

**Response:**
```typescript
interface PointInZoneResponse {
  point: {
    latitude: number;
    longitude: number;
  };
  zones: Array<{
    id: number;
    name: string;
    zoneType: string;
    cityId: number;
    cityName: string;
    isWithinZone: boolean;
    distance?: number;             // Distance to zone boundary in meters (if outside)
  }>;
  nearestZone?: {
    id: number;
    name: string;
    zoneType: string;
    distance: number;              // Distance in meters
  };
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/geography/zones/create-city-zones`

**Purpose:** Create standard zones for a city

**Request Body:**
```typescript
interface CreateCityZonesDto {
  cityId: number;                 // Required: valid city ID
  zones: Array<{
    name: string;                 // Zone name
    zoneType: 'pickup' | 'dropoff' | 'both';
    centerLatitude: number;       // -90 to 90
    centerLongitude: number;      // -180 to 180
    radiusMeters: number;         // Zone radius in meters
    priority?: number;            // Zone priority
  }>;
}
```

**Response:**
```typescript
interface CreateCityZonesResponse {
  created: number;        // Number of zones created
  zones: ServiceZone[];   // Array of created zones
  skipped: Array<{        // Zones that were skipped
    name: string;
    reason: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/geography/zones/analytics`

**Purpose:** Get geography analytics and statistics

**Query Parameters:**
```typescript
interface GeographyAnalyticsQueryParams {
  countryId?: number;    // Optional: filter by country
  stateId?: number;      // Optional: filter by state
  cityId?: number;       // Optional: filter by city
}
```

**Response:**
```typescript
interface GeographyAnalyticsResponse {
  countries: {
    total: number;
    active: number;
  };
  states: {
    total: number;
    active: number;
  };
  cities: {
    total: number;
    active: number;
  };
  zones: {
    total: number;
    active: number;
    byType: Record<string, number>;  // pickup, dropoff, both
  };
  coverage: {
    totalAreaKm2: number;           // Total covered area
    averageZoneSizeKm2: number;     // Average zone size
    largestZone: {
      id: number;
      name: string;
      areaKm2: number;
    };
    smallestZone: {
      id: number;
      name: string;
      areaKm2: number;
    };
  };
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

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

Geography endpoints are rate limited:
- Read operations: 100 requests per minute
- Write operations: 50 requests per minute
- Bulk operations: 10 requests per minute
- Analytics endpoints: 50 requests per minute</content>
</xai:function_call






