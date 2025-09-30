# Config Module - API Endpoints Reference

Frontend reference documentation for Config module endpoints (API Keys & Feature Flags).

## API Keys Endpoints

### `GET /admin/config/api-keys`

**Purpose:** List API keys with pagination and filters

**Query Parameters:**
```typescript
interface ApiKeysQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  service?: 'stripe' | 'twilio' | 'firebase' | 'google_maps' | 'sendgrid' | 'aws' | 'azure' | 'google_analytics';
  environment?: 'development' | 'staging' | 'production';
  keyType?: 'secret' | 'public' | 'private_key' | 'access_token' | 'refresh_token' | 'webhook_secret';
  isActive?: boolean;
  search?: string;      // Search in name or description
  sortBy?: 'name' | 'service' | 'environment' | 'createdAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ApiKeysListResponse {
  keys: ApiKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiKey {
  id: number;
  name: string;
  service: string;
  environment: string;
  keyType: string;
  description?: string;
  expiresAt?: string;     // ISO date string
  lastRotated?: string;   // ISO date string
  isActive: boolean;
  isPrimary: boolean;
  accessLevel: 'read' | 'write' | 'admin' | 'full';
  usageCount: number;
  rateLimit?: number;
  tags: string[];
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/api-keys`

**Purpose:** Create a new API key

**Request Body:**
```typescript
interface CreateApiKeyDto {
  name: string;                    // Required: 3-100 chars
  service: 'stripe' | 'twilio' | 'firebase' | 'google_maps' | 'sendgrid' | 'aws' | 'azure' | 'google_analytics';  // Required
  environment: 'development' | 'staging' | 'production';  // Required
  keyType: 'secret' | 'public' | 'private_key' | 'access_token' | 'refresh_token' | 'webhook_secret';  // Required
  keyValue: string;                // Required: min 10 chars
  description?: string;            // Optional
  expiresAt?: string;              // Optional: ISO date string
  rotationPolicy?: 'manual' | 'auto_30d' | 'auto_90d' | 'auto_1y';  // Optional, default: 'manual'
  isPrimary?: boolean;             // Optional, default: false
  accessLevel?: 'read' | 'write' | 'admin' | 'full';  // Optional, default: 'read'
  rateLimit?: number;              // Optional: 1-10000 requests/min
  tags?: string[];                 // Optional: string array
}
```

**Response:**
```typescript
interface ApiKeyResponse extends ApiKey {
  // Same as ApiKey interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/api-keys/:id`

**Purpose:** Get details of a specific API key

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Response:**
```typescript
interface ApiKeyResponse extends ApiKey {
  // Same as ApiKey interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/config/api-keys/:id`

**Purpose:** Update an existing API key

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Request Body:**
```typescript
interface UpdateApiKeyDto {
  name?: string;                   // Optional: 3-100 chars
  description?: string;            // Optional
  expiresAt?: string;              // Optional: ISO date string
  rotationPolicy?: 'manual' | 'auto_30d' | 'auto_90d' | 'auto_1y';  // Optional
  accessLevel?: 'read' | 'write' | 'admin' | 'full';  // Optional
  rateLimit?: number;              // Optional: 1-10000 requests/min
  tags?: string[];                 // Optional: string array
  isPrimary?: boolean;             // Optional
}
```

**Response:**
```typescript
interface ApiKeyResponse extends ApiKey {
  // Same as ApiKey interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/config/api-keys/:id`

**Purpose:** Delete an API key

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`

---

### `POST /admin/config/api-keys/:id/toggle`

**Purpose:** Toggle API key active status

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Request Body:**
```typescript
interface ToggleApiKeyDto {
  active: boolean;  // New active status
}
```

**Response:**
```typescript
interface ApiKeyResponse extends ApiKey {
  // Same as ApiKey interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/api-keys/:id/rotate`

**Purpose:** Rotate an API key (generate new value)

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Request Body:**
```typescript
interface RotateApiKeyDto {
  reason?: string;  // Optional reason for rotation
}
```

**Response:**
```typescript
interface ApiKeyResponse extends ApiKey {
  // Same as ApiKey interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/api-keys/service/:service/:environment`

**Purpose:** Get API keys for specific service and environment

**Path Parameters:**
```typescript
interface ServiceEnvironmentParams {
  service: string;      // Service name
  environment: string;  // Environment name
}
```

**Response:**
```typescript
interface ApiKeysResponse extends Array<ApiKey> {
  // Array of ApiKey objects
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/api-keys/:id/decrypt`

**Purpose:** Get decrypted API key value (admin only)

**Path Parameters:**
```typescript
interface ApiKeyPathParams {
  id: number;  // API key ID
}
```

**Response:**
```typescript
interface DecryptedApiKeyResponse {
  decryptedKey: string;  // The actual decrypted API key value
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/api-keys/bulk-update`

**Purpose:** Bulk update multiple API keys

**Request Body:**
```typescript
interface BulkApiKeyUpdateDto {
  keyIds: number[];    // Array of API key IDs to update
  updates: {
    isActive?: boolean;
    environment?: 'development' | 'staging' | 'production';
    accessLevel?: 'read' | 'write' | 'admin' | 'full';
    rotationPolicy?: 'manual' | 'auto_30d' | 'auto_90d' | 'auto_1y';
    tags?: string[];
  };
}
```

**Response:**
```typescript
interface BulkUpdateResponse {
  updated: number;      // Number of successfully updated keys
  failed: number;       // Number of failed updates
  errors?: Array<{      // Optional: errors for failed updates
    keyId: number;
    error: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/api-keys/create-standard-keys`

**Purpose:** Create standard API keys for common services

**Request Body:**
```typescript
interface CreateStandardApiKeysDto {
  services: Array<'stripe' | 'twilio' | 'firebase' | 'google_maps' | 'sendgrid' | 'aws' | 'azure' | 'google_analytics'>;
  environments: Array<'development' | 'staging' | 'production'>;
  includeWebhooks?: boolean;    // Optional: include webhook keys
  includePublic?: boolean;      // Optional: include public keys
}
```

**Response:**
```typescript
interface StandardKeysResponse {
  created: number;      // Number of keys created
  keys: ApiKey[];       // Array of created API keys
  skipped: Array<{      // Keys that were skipped (already exist)
    service: string;
    environment: string;
    reason: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/api-keys/analytics/overview`

**Purpose:** Get API keys analytics and statistics

**Response:**
```typescript
interface ApiKeysAnalyticsResponse {
  analytics: {
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    expiringSoon: number;     // Keys expiring in next 30 days
    expired: number;          // Already expired keys
    byService: Record<string, {
      total: number;
      active: number;
      primary: number;
    }>;
    byEnvironment: Record<string, {
      total: number;
      active: number;
    }>;
    byKeyType: Record<string, {
      total: number;
      active: number;
    }>;
    usageStats: {
      totalUsage: number;
      averageUsage: number;
      mostUsed: Array<{
        name: string;
        usage: number;
      }>;
      leastUsed: Array<{
        name: string;
        usage: number;
      }>;
    };
  };
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/api-keys/rotation/stats`

**Purpose:** Get API key rotation statistics

**Response:**
```typescript
interface RotationStatsResponse {
  totalKeys: number;
  keysNeedingRotation: number;    // Keys that need rotation based on policy
  autoRotationEnabled: number;    // Keys with auto-rotation enabled
  manualRotationOnly: number;     // Keys requiring manual rotation
  recentlyRotated: number;        // Keys rotated in last 30 days
  rotationSchedule: Array<{       // Upcoming rotation schedule
    keyId: number;
    keyName: string;
    nextRotation: string;         // ISO date string
    rotationType: 'auto' | 'manual';
  }>;
  rotationHistory: Array<{        // Recent rotation history
    keyId: number;
    keyName: string;
    rotatedAt: string;            // ISO date string
    rotationType: 'auto' | 'manual';
    reason?: string;
  }>;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/api-keys/rotation/bulk-rotate`

**Purpose:** Rotate multiple API keys that need rotation

**Response:**
```typescript
interface BulkRotationResponse {
  message: string;
  totalKeys: number;
  successful: number;
  failed: number;
  results: Array<{
    id: number;
    name: string;
    success: boolean;
    error?: string;
  }>;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

## Feature Flags Endpoints

### `GET /admin/config/feature-flags`

**Purpose:** List feature flags with pagination and filters

**Query Parameters:**
```typescript
interface FeatureFlagsQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  category?: 'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system';
  isEnabled?: boolean;
  isActive?: boolean;
  search?: string;      // Search in name or description
  sortBy?: 'name' | 'category' | 'rolloutPercentage' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface FeatureFlagsListResponse {
  flags: FeatureFlag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FeatureFlag {
  id: number;
  name: string;
  key: string;          // Unique identifier (lowercase, underscores)
  description?: string;
  category: 'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system';
  isEnabled: boolean;
  isActive: boolean;
  rolloutPercentage: number;  // 0-100
  config?: any;         // Additional configuration object
  userRoles?: string[]; // Target user roles
  userIds?: string[];   // Target user IDs
  environments?: string[]; // Target environments
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  createdBy?: string;
  updatedBy?: string;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags`

**Purpose:** Create a new feature flag

**Request Body:**
```typescript
interface CreateFeatureFlagDto {
  name: string;         // Required: 3-100 chars, human readable
  key: string;          // Required: 3-50 chars, lowercase with underscores only
  description?: string; // Optional
  category: 'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system';  // Required
  isEnabled?: boolean;  // Optional, default: false
  rolloutPercentage?: number;  // Optional, default: 100, range: 0-100
  config?: any;         // Optional: additional configuration
  userRoles?: string[]; // Optional: target user roles
  userIds?: string[];   // Optional: target user IDs
  environments?: string[]; // Optional: target environments
}
```

**Response:**
```typescript
interface FeatureFlagResponse extends FeatureFlag {
  // Same as FeatureFlag interface above
}
```

**Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/feature-flags/:id`

**Purpose:** Get details of a specific feature flag

**Path Parameters:**
```typescript
interface FeatureFlagPathParams {
  id: number;  // Feature flag ID
}
```

**Response:**
```typescript
interface FeatureFlagResponse extends FeatureFlag {
  // Same as FeatureFlag interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/feature-flags/key/:key`

**Purpose:** Get feature flag by unique key

**Path Parameters:**
```typescript
interface FeatureFlagKeyParams {
  key: string;  // Feature flag unique key
}
```

**Response:**
```typescript
interface FeatureFlagResponse extends FeatureFlag {
  // Same as FeatureFlag interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `PATCH /admin/config/feature-flags/:id`

**Purpose:** Update an existing feature flag

**Path Parameters:**
```typescript
interface FeatureFlagPathParams {
  id: number;  // Feature flag ID
}
```

**Request Body:**
```typescript
interface UpdateFeatureFlagDto {
  name?: string;        // Optional: 3-100 chars
  description?: string; // Optional
  category?: 'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system';
  isEnabled?: boolean;
  rolloutPercentage?: number;  // Optional: 0-100
  config?: any;         // Optional: additional configuration
  userRoles?: string[]; // Optional: target user roles
  userIds?: string[];   // Optional: target user IDs
  environments?: string[]; // Optional: target environments
}
```

**Response:**
```typescript
interface FeatureFlagResponse extends FeatureFlag {
  // Same as FeatureFlag interface above
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `401 Unauthorized`, `403 Forbidden`

---

### `DELETE /admin/config/feature-flags/:id`

**Purpose:** Delete a feature flag

**Path Parameters:**
```typescript
interface FeatureFlagPathParams {
  id: number;  // Feature flag ID
}
```

**Response:** `204 No Content`

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`

---

### `POST /admin/config/feature-flags/:id/toggle`

**Purpose:** Toggle feature flag enabled status

**Path Parameters:**
```typescript
interface FeatureFlagPathParams {
  id: number;  // Feature flag ID
}
```

**Request Body:**
```typescript
interface ToggleFeatureFlagDto {
  enabled: boolean;  // New enabled status
}
```

**Response:**
```typescript
interface FeatureFlagResponse extends FeatureFlag {
  // Same as FeatureFlag interface above
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/evaluate`

**Purpose:** Evaluate a feature flag for specific user/context

**Request Body:**
```typescript
interface FeatureFlagEvaluationDto {
  key: string;                     // Required: Feature flag key
  userId?: string;                 // Optional: User ID for targeting
  userRole?: string;               // Optional: User role for targeting
  environment?: string;            // Optional: Environment
  attributes?: Record<string, any>; // Optional: Additional context attributes
}
```

**Response:**
```typescript
interface FeatureFlagEvaluationResultDto {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  reason: string;                  // Explanation of why it was enabled/disabled
}
```

**Status Codes:** `200 OK`, `404 Not Found`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/create-standard-flags`

**Purpose:** Create standard feature flags for common categories

**Request Body:**
```typescript
interface CreateStandardFeatureFlagsDto {
  categories: Array<'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system'>;
  environments?: Array<'development' | 'staging' | 'production'>;
  rolloutPercentage?: number;       // Default rollout percentage for new flags
  includeAdminFlags?: boolean;      // Include admin-specific flags
  includeNotificationFlags?: boolean; // Include notification-related flags
}
```

**Response:**
```typescript
interface StandardFlagsResponse {
  created: number;        // Number of flags created
  flags: FeatureFlag[];   // Array of created feature flags
  skipped: Array<{        // Flags that were skipped (already exist)
    key: string;
    reason: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/bulk-update`

**Purpose:** Bulk update multiple feature flags

**Request Body:**
```typescript
interface BulkFeatureFlagUpdateDto {
  flagIds: number[];     // Array of feature flag IDs to update
  updates: {
    category?: 'payments' | 'rides' | 'admin' | 'notifications' | 'geography' | 'pricing' | 'system';
    isEnabled?: boolean;
    rolloutPercentage?: number;  // 0-100
    userRoles?: string[];
    userIds?: string[];
    environments?: string[];
  };
}
```

**Response:**
```typescript
interface BulkFlagUpdateResponse {
  updated: number;        // Number of successfully updated flags
  failed: number;         // Number of failed updates
  errors?: Array<{        // Optional: errors for failed updates
    flagId: number;
    error: string;
  }>;
}
```

**Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/feature-flags/categories/overview`

**Purpose:** Get feature flags analytics by category

**Response:**
```typescript
interface CategoriesOverviewResponse {
  overview: Record<string, {
    total: number;
    enabled: number;
    disabled: number;
    active: number;
    averageRollout: number;
  }>;
  totalFlags: number;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/feature-flags/rollout/status`

**Purpose:** Get rollout status and distribution

**Response:**
```typescript
interface RolloutStatusResponse {
  rolloutStatus: {
    totalEnabled: number;
    fullRollout: number;      // 100% rollout
    partialRollout: number;   // 1-99% rollout
    zeroRollout: number;      // 0% rollout
    averageRolloutPercentage: number;
    rolloutDistribution: Record<string, number>;  // Distribution by percentage ranges
  };
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `GET /admin/config/feature-flags/cache/stats`

**Purpose:** Get feature flag cache statistics

**Response:**
```typescript
interface CacheStatsResponse {
  cacheStats: {
    totalEvaluations: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;           // Percentage
    averageResponseTime: number; // milliseconds
    cacheSize: number;         // Number of cached entries
    lastCleanup: string;       // ISO date string
    expiredEntries: number;    // Number of expired entries waiting cleanup
  };
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/cache/warmup`

**Purpose:** Warm up feature flag cache

**Response:**
```typescript
interface CacheWarmupResponse {
  message: string;
  flagsLoaded: number;
  cacheSize: number;
  duration: number;  // milliseconds
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/cache/clear`

**Purpose:** Clear all feature flag cache

**Response:**
```typescript
interface CacheClearResponse {
  message: string;
  entriesCleared: number;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/cache/clear/:key`

**Purpose:** Clear cache for specific feature flag

**Path Parameters:**
```typescript
interface FeatureFlagKeyParams {
  key: string;  // Feature flag key
}
```

**Response:**
```typescript
interface CacheClearKeyResponse {
  message: string;
  key: string;
  cleared: boolean;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/cache/cleanup`

**Purpose:** Clean up expired cache entries

**Response:**
```typescript
interface CacheCleanupResponse {
  message: string;
  expiredEntriesRemoved: number;
  activeEntriesRemaining: number;
}
```

**Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

---

### `POST /admin/config/feature-flags/public/evaluate`

**Purpose:** Public feature flag evaluation (no auth required)

**Request Body:**
```typescript
interface FeatureFlagEvaluationDto {
  key: string;                     // Required: Feature flag key
  userId?: string;                 // Optional: User ID for targeting
  userRole?: string;               // Optional: User role for targeting
  environment?: string;            // Optional: Environment
  attributes?: Record<string, any>; // Optional: Additional context attributes
}
```

**Response:**
```typescript
interface FeatureFlagEvaluationResultDto {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  reason: string;                  // Explanation of why it was enabled/disabled
}
```

**Status Codes:** `200 OK`, `404 Not Found`

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

Admin endpoints are rate limited:
- API Keys operations: 100 requests per minute
- Feature Flags operations: 100 requests per minute
- Bulk operations: 10 requests per minute</content>
</xai:function_call


