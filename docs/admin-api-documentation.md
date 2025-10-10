# Admin API Documentation

This document provides a detailed overview of all the Admin API endpoints available in the Uber Clone system.

---

## 0. System Enums and Status Values

The system uses the following enums for consistent data validation and integrity:

### Ride Status
- `PENDING` - Ride request created, waiting for driver
- `DRIVER_CONFIRMED` - Driver has confirmed the ride
- `ACCEPTED` - Driver has accepted the ride
- `ARRIVED` - Driver has arrived at pickup location
- `IN_PROGRESS` - Ride is currently in progress
- `COMPLETED` - Ride has been completed
- `CANCELLED` - Ride has been cancelled

### Driver Status
- `ONLINE` - Driver is available for rides
- `OFFLINE` - Driver is not available
- `BUSY` - Driver is currently on a ride
- `SUSPENDED` - Driver account is suspended

### Verification Status
- `PENDING` - Verification is pending review
- `VERIFIED` - Verification has been approved
- `REJECTED` - Verification has been rejected

### Payment Status
- `PENDING` - Payment is pending
- `COMPLETED` - Payment has been completed
- `FAILED` - Payment has failed
- `CANCELLED` - Payment has been cancelled

### Vehicle Status
- `ACTIVE` - Vehicle is active and available
- `INACTIVE` - Vehicle is inactive
- `SUSPENDED` - Vehicle is suspended
- `MAINTENANCE` - Vehicle is under maintenance

### Notification Priority
- `LOW` - Low priority notification
- `NORMAL` - Normal priority notification
- `HIGH` - High priority notification
- `URGENT` - Urgent notification

### Rule Type (Temporal Pricing)
- `TIME_RANGE` - Time-based pricing rule
- `DAY_OF_WEEK` - Day of week pricing rule
- `DATE_SPECIFIC` - Specific date pricing rule
- `SEASONAL` - Seasonal pricing rule

### Zone Type
- `REGULAR` - Regular service zone
- `PREMIUM` - Premium service zone
- `RESTRICTED` - Restricted service zone

---

## 1. Admin Authentication

### `POST /admin/auth/login`

Authenticates an admin user and returns JWT tokens with permissions.

**Request Body:**
```json
{
  "email": "admin@uberclone.com",
  "password": "SecurePass123!"
}
```

**Responses:**
- `200 OK`: Login successful.
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@uberclone.com",
      "name": "Admin Principal",
      "role": "super_admin",
      "permissions": ["users:read", "rides:write", "system:config:read"]
    },
    "expires_in": 1640995200
  }
  ```
- `401 Unauthorized`: Invalid credentials.
- `500 Internal Server Error`: Database error.

### `POST /admin/auth/refresh`

Generates a new access token using the refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Responses:**
- `200 OK`: Token refreshed successfully.
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@uberclone.com",
      "name": "Admin Principal",
      "role": "super_admin",
      "permissions": ["users:read", "rides:write", "system:config:read"]
    },
    "expires_in": 1640995200
  }
  ```
- `401 Unauthorized`: Invalid refresh token.
- `500 Internal Server Error`: Database error.

---

## 2. Admin Dashboard

### `GET /admin/dashboard`

Retrieves main dashboard metrics, KPIs and active alerts.

**Responses:**
- `200 OK`: Dashboard data retrieved successfully.
  ```json
  {
    "metrics": {
      "activeRides": 15,
      "completedRidesToday": 245,
      "cancelledRidesToday": 12,
      "totalRidesThisWeek": 1847,
      "revenueToday": 1250.5,
      "revenueThisWeek": 8750.25,
      "averageFare": 18.75,
      "totalTransactions": 245,
      "onlineDrivers": 28,
      "busyDrivers": 15,
      "availableDrivers": 13,
      "averageDriverRating": 4.7,
      "activeUsersToday": 156,
      "newUsersThisWeek": 89,
      "totalUsers": 15420,
      "averageUserRating": 4.2,
      "systemStatus": "healthy",
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "alerts": [
      {
        "id": "low_driver_availability",
        "type": "performance",
        "severity": "high",
        "title": "Baja Disponibilidad de Drivers",
        "message": "Solo 3 drivers están online. Se recomienda aumentar la capacidad.",
        "timestamp": "2024-01-15T10:25:00Z",
        "acknowledged": false
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```
- `401 Unauthorized`: Invalid token.
- `403 Forbidden`: Insufficient permissions.
- `500 Internal Server Error`: Database error.

### `GET /admin/dashboard/metrics`

Retrieves only dashboard metrics without alerts.

**Responses:**
- `200 OK`: Metrics retrieved successfully.
  ```json
  {
    "metrics": {
      "activeRides": 15,
      "completedRidesToday": 245,
      "cancelledRidesToday": 12,
      "totalRidesThisWeek": 1847,
      "revenueToday": 1250.5,
      "revenueThisWeek": 8750.25,
      "averageFare": 18.75,
      "totalTransactions": 245,
      "onlineDrivers": 28,
      "busyDrivers": 15,
      "availableDrivers": 13,
      "averageDriverRating": 4.7,
      "activeUsersToday": 156,
      "newUsersThisWeek": 89,
      "totalUsers": 15420,
      "averageUserRating": 4.2,
      "systemStatus": "healthy",
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

### `GET /admin/dashboard/alerts`

Retrieves only active system alerts.

**Responses:**
- `200 OK`: Alerts retrieved successfully.
  ```json
  {
    "alerts": [
      {
        "id": "low_driver_availability",
        "type": "performance",
        "severity": "high",
        "title": "Baja Disponibilidad de Drivers",
        "message": "Solo 3 drivers están online. Se recomienda aumentar la capacidad.",
        "timestamp": "2024-01-15T10:25:00Z",
        "acknowledged": false
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

---

## 3. User Management

### `GET /admin/users`

Lists users with advanced filters and pagination.

**Query Parameters:**
- `status`: User status filter (active/inactive) - array
- `emailVerified`: Email verification filter - boolean
- `phoneVerified`: Phone verification filter - boolean
- `identityVerified`: Identity verification filter - boolean
- `hasWallet`: Wallet existence filter - boolean
- `dateFrom`: Registration date from - ISO string
- `dateTo`: Registration date to - ISO string
- `minRides`: Minimum number of rides - number
- `maxRides`: Maximum number of rides - number
- `search`: Search in name, email, or phone - string
- `page`: Page number (default: 1) - number
- `limit`: Items per page (default: 20) - number

**Example:** `/admin/users?status=active&emailVerified=true&page=1&limit=20`

**Responses:**
- `200 OK`: Users list retrieved successfully.
  ```json
  {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "isActive": true,
        "emailVerified": true,
        "phoneVerified": false,
        "identityVerified": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "wallet": {
          "balance": 50.0,
          "totalTransactions": 15
        },
        "totalRides": 25,
        "completedRides": 23,
        "cancelledRides": 2,
        "averageRating": 4.7
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
  ```
- `401 Unauthorized`: Invalid token.
- `403 Forbidden`: Insufficient permissions.

### `GET /admin/users/:id`

Retrieves complete details of a specific user.

**Path Parameters:**
- `id`: User unique ID - number

**Responses:**
- `200 OK`: User details retrieved successfully.
  ```json
  {
    "basic": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01T00:00:00Z",
      "gender": "male",
      "isActive": true,
      "emailVerified": true,
      "phoneVerified": false,
      "identityVerified": false,
      "lastLogin": "2024-01-15T09:30:00Z",
      "createdAt": "2024-01-01T10:00:00Z"
    },
    "address": {
      "profileImage": "https://example.com/profile.jpg",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001"
    },
    "preferences": {
      "preferredLanguage": "en",
      "timezone": "America/New_York",
      "currency": "USD"
    },
    "stats": {
      "totalRides": 25,
      "completedRides": 23,
      "cancelledRides": 2,
      "averageRating": 4.7
    },
    "wallet": {
      "balance": 50.0,
      "totalTransactions": 15
    },
    "emergencyContacts": [
      {
        "id": 1,
        "contactName": "Jane Doe",
        "contactPhone": "+1234567891"
      }
    ],
    "recentRides": [
      {
        "id": 123,
        "status": "COMPLETED",
        "createdAt": "2024-01-15T08:00:00Z",
        "farePrice": 25.5
      }
    ]
  }
  ```
- `404 Not Found`: User not found.

### `PUT /admin/users/:id/status`

Updates a user's active status.

**Path Parameters:**
- `id`: User ID - number

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violation of terms of service"
}
```

**Responses:**
- `200 OK`: User status updated successfully.
- `404 Not Found`: User not found.

### `POST /admin/users/:id/wallet/adjust`

Adjusts a user's wallet balance.

**Path Parameters:**
- `id`: User ID - number

**Request Body:**
```json
{
  "amount": 50.0,
  "reason": "Refund for cancelled ride",
  "description": "Administrative adjustment"
}
```

**Responses:**
- `200 OK`: Wallet balance adjusted successfully.
- `404 Not Found`: User not found.

### `POST /admin/users/:id/emergency-contacts`

Adds an emergency contact for a user.

**Path Parameters:**
- `id`: User ID - number

**Request Body:**
```json
{
  "contactName": "Jane Doe",
  "contactPhone": "+1234567891"
}
```

**Responses:**
- `201 Created`: Emergency contact added successfully.
- `404 Not Found`: User not found.

### `DELETE /admin/users/emergency-contacts/:contactId`

Removes an emergency contact from a user.

**Path Parameters:**
- `contactId`: Emergency contact ID - number

**Responses:**
- `200 OK`: Emergency contact removed successfully.
- `404 Not Found`: Contact not found.

### `POST /admin/users/bulk/status`

Updates status for multiple users in bulk.

**Request Body:**
```json
{
  "userIds": [1, 2, 3],
  "isActive": false,
  "reason": "Bulk account maintenance"
}
```

**Responses:**
- `200 OK`: Bulk status update completed successfully.

---

## 4. Driver Management

### `GET /admin/drivers`

Lists drivers with advanced filters and pagination.

**Query Parameters:**
- `status`: Driver status filter (online/offline/busy/suspended) - array
- `verificationStatus`: Verification status filter - array
- `canDoDeliveries`: Delivery capability filter - boolean
- `dateFrom`: Registration date from - ISO string
- `dateTo`: Registration date to - ISO string
- `minRating`: Minimum rating - number
- `maxRating`: Maximum rating - number
- `minRides`: Minimum rides - number
- `maxRides`: Maximum rides - number
- `minEarnings`: Minimum earnings - number
- `maxEarnings`: Maximum earnings - number
- `search`: Search in name, email, phone - string
- `zoneId`: Work zone ID - number
- `page`: Page number (default: 1) - number
- `limit`: Items per page (default: 20) - number

**Responses:**
- `200 OK`: Drivers list retrieved successfully.
  ```json
  {
    "data": {
      "drivers": [
        {
          "id": 8,
          "firstName": "Luis",
          "lastName": "Martinez",
          "email": "luis.driver@example.com",
          "phone": "+58-416-9876543",
          "address": null,
          "city": null,
          "state": null,
          "postalCode": null,
          "profileImageUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=luis",
          "dateOfBirth": null,
          "gender": null,
          "status": "offline",
          "verificationStatus": "approved",
          "canDoDeliveries": true,
          "carSeats": 4,
          "currentLatitude": "10.4806",
          "currentLongitude": "-66.9036",
          "lastLocationUpdate": "2025-09-30T03:02:27.621Z",
          "locationAccuracy": null,
          "isLocationActive": true,
          "preferredWorkZones": [],
          "workSchedule": null,
          "bankAccountNumber": null,
          "bankName": null,
          "taxId": null,
          "averageRating": "4.9",
          "totalRides": 0,
          "totalEarnings": 0,
          "completionRate": 0,
          "suspensionReason": null,
          "suspensionEndDate": null,
          "lastStatusChange": null,
          "statusChangedBy": null,
          "createdAt": "2025-09-30T03:02:27.623Z",
          "updatedAt": "2025-09-30T03:02:27.623Z",
          "lastLogin": null,
          "lastActive": null,
          "workZoneAssignments": [],
          "vehicles": [
            {
              "id": 1,
              "make": "Yamaha",
              "model": "MT-07",
              "year": 2021,
              "color": "Black",
              "licensePlate": "MOT789",
        "status": "ACTIVE",
        "verificationStatus": "VERIFIED",
              "isDefault": true,
              "vehicleType": {
                "id": 1,
                "name": "motorcycle",
                "displayName": "Moto",
                "icon": "🏍️",
                "isActive": true,
                "createdAt": "2025-09-30T03:02:26.801Z",
                "updatedAt": "2025-09-30T03:02:26.801Z"
              },
              "seatingCapacity": 2,
              "fuelType": "gasoline"
            }
          ],
          "completedRides": 0,
          "cancelledRides": 0,
          "currentWorkZone": null
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    },
    "message": "Success",
    "statusCode": 200,
    "timestamp": "2025-09-30T03:23:55.557Z",
    "path": "/admin/drivers?status=offline&status=busy&status=suspended&canDoDeliveries=true&limit=20"
  }
  ```

### `GET /admin/drivers/:id`

Retrieves complete details of a specific driver.

**Path Parameters:**
- `id`: Driver unique ID - number

**Responses:**
- `200 OK`: Driver details retrieved successfully.
  ```json
  {
    "data": {
      "basic": {
        "id": 8,
        "firstName": "Luis",
        "lastName": "Martinez",
        "email": "luis.driver@example.com",
        "phone": "+58-416-9876543",
        "dateOfBirth": null,
        "gender": null,
        "status": "OFFLINE",
        "verificationStatus": "VERIFIED",
        "canDoDeliveries": true,
        "lastActive": null,
        "createdAt": "2025-09-30T03:02:27.623Z"
      },
      "stats": {
        "averageRating": 4.9,
        "totalRides": 0,
        "completedRides": 0,
        "cancelledRides": 0,
        "totalEarnings": 0,
        "completionRate": 0
      },
      "address": {
        "address": null,
        "city": null,
        "state": null,
        "postalCode": null
      },

      // Driver documents (license, ID, etc.)
      "documents": [
        {
          "id": 1,
          "documentType": "license",
          "documentUrl": "https://example.com/docs/driver-license.pdf",
          "uploadedAt": "2025-09-30T03:02:27.621Z",
          "verificationStatus": "verified",
          "verifiedAt": "2025-09-30T03:02:27.622Z",
          "verifiedBy": 1,
          "rejectionReason": null
        }
      ],

      // Vehicles with full details including documents and history
      "vehicles": [
        {
          "id": 1,
          "make": "Yamaha",
          "model": "MT-07",
          "year": 2021,
          "color": "Black",
          "licensePlate": "MOT789",
          "vin": "JH2SC4519LK123456",
          "seatingCapacity": 2,
          "fuelType": "gasoline",
          "hasAC": true,
          "hasGPS": true,
        "status": "ACTIVE",
        "verificationStatus": "VERIFIED",
          "isDefault": true,
          "vehicleType": {
            "id": 1,
            "name": "motorcycle",
            "displayName": "Moto",
            "icon": "🏍️",
            "isActive": true,
            "createdAt": "2025-09-30T03:02:26.801Z",
            "updatedAt": "2025-09-30T03:02:26.801Z"
          },
          "insuranceProvider": "Seguros Venezuela",
          "insurancePolicyNumber": "POL-2021-001",
          "insuranceExpiryDate": "2026-12-31T00:00:00Z",
          "frontImageUrl": "https://example.com/vehicles/1/front.jpg",
          "sideImageUrl": "https://example.com/vehicles/1/side.jpg",
          "backImageUrl": "https://example.com/vehicles/1/back.jpg",
          "interiorImageUrl": "https://example.com/vehicles/1/interior.jpg",
          "documents": [
            {
              "id": 1,
              "documentType": "registration",
              "documentUrl": "https://example.com/docs/vehicle-reg.pdf",
              "uploadedAt": "2025-09-30T03:02:27.621Z",
              "verificationStatus": "verified",
              "verifiedAt": "2025-09-30T03:02:27.622Z",
              "verifiedBy": 1,
              "rejectionReason": null
            }
          ],
          "recentRides": [
            {
              "rideId": 123,
              "status": "COMPLETED",
              "createdAt": "2025-09-29T10:00:00Z",
              "farePrice": 15.50,
              "user": {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com"
              }
            }
          ],
          "recentReports": [],
          "createdAt": "2025-09-30T03:02:27.621Z",
          "updatedAt": "2025-09-30T03:02:27.621Z"
        }
      ],

      // Current active work zone assignment
      "currentWorkZone": {
        "id": 1,
        "name": "Downtown Caracas",
        "city": "Caracas",
        "state": "Distrito Capital",
        "isActive": true
      },

      // All work zone assignments history
      "workZoneAssignments": [
        {
          "id": 1,
          "zoneId": 1,
          "assignedAt": "2025-09-30T03:02:27.623Z",
          "assignedBy": 1,
          "isPrimary": true,
          "status": "active",
          "zone": {
            "id": 1,
            "name": "Downtown Caracas",
            "city": "Caracas",
            "state": "Distrito Capital",
            "isActive": true
          }
        }
      ],

      // Active payment methods for receiving earnings
      "paymentMethods": [
        {
          "id": 1,
          "methodType": "bank_transfer",
          "accountNumber": "1234567890",
          "accountName": "Luis Martinez",
          "bankName": "Banco Nacional",
          "routingNumber": "021000021",
          "isDefault": true,
          "isActive": true,
          "createdAt": "2025-09-30T03:02:27.623Z",
          "updatedAt": "2025-09-30T03:02:27.623Z"
        }
      ],

      // Driver payment/earnings history
      "driverPayments": [
        {
          "id": 1,
          "amount": 150.75,
          "currency": "USD",
          "paymentType": "ride_earning",
          "referenceType": "ride",
          "referenceId": 123,
          "description": "Ride payment - Downtown to Airport",
          "periodStart": "2025-09-29T00:00:00Z",
          "periodEnd": "2025-09-29T23:59:59Z",
          "status": "processed",
          "processedAt": "2025-09-30T02:00:00Z",
          "paymentMethodId": 1,
          "createdAt": "2025-09-30T01:00:00Z",
          "updatedAt": "2025-09-30T02:00:00Z"
        }
      ],

      // Recent rides with full details
      "recentRides": [
        {
          "rideId": 123,
          "originAddress": "Centro de Caracas",
          "destinationAddress": "Aeropuerto Internacional",
          "rideTime": 45,
          "farePrice": 25.50,
          "status": "COMPLETED",
          "paymentStatus": "COMPLETED",
          "userId": 1,
          "tierId": 1,
          "vehicleId": 1,
          "createdAt": "2025-09-29T10:00:00Z",
          "updatedAt": "2025-09-29T11:15:00Z",
          "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890"
          },
          "tier": {
            "id": 1,
            "name": "UberX",
            "baseFare": 2.5,
            "perMinuteRate": 0.25,
            "perMileRate": 1.25
          },
          "vehicle": {
            "id": 1,
            "make": "Yamaha",
            "model": "MT-07",
            "licensePlate": "MOT789",
            "vehicleType": {
              "name": "motorcycle",
              "displayName": "Moto"
            }
          },
          "ratings": [
            {
              "id": 1,
              "ratingValue": 5,
              "comment": "Excelente conductor, muy seguro",
              "createdAt": "2025-09-29T11:20:00Z"
            }
          ],
          "messages": [
            {
              "id": 1,
              "messageText": "¿Dónde te encuentro exactamente?",
              "senderId": 8,
              "createdAt": "2025-09-29T10:05:00Z"
            }
          ],
          "driverRating": 5
        }
      ],

      // Recent delivery orders (if driver does deliveries)
      "recentDeliveryOrders": [
        {
          "orderId": 456,
          "userId": 2,
          "storeId": 1,
          "deliveryAddress": "Av. Principal 123",
          "deliveryLatitude": 10.4806,
          "deliveryLongitude": -66.9036,
          "totalPrice": 35.75,
          "deliveryFee": 5.00,
          "tip": 3.00,
          "status": "COMPLETED",
          "paymentStatus": "COMPLETED",
          "createdAt": "2025-09-29T14:00:00Z",
          "store": {
            "id": 1,
            "name": "Pizza Express",
            "category": "Restaurant",
            "rating": 4.5
          },
          "driverRating": 4
        }
      ],

      // Recent errands (personal tasks)
      "recentErrands": [
        {
          "id": 789,
          "description": "Comprar medicamentos en farmacia",
          "pickupAddress": "Centro Médico Caracas",
          "dropoffAddress": "Av. Universidad",
          "status": "COMPLETED",
          "serviceFee": 12.50,
          "totalAmount": 15.00,
          "createdAt": "2025-09-28T16:00:00Z",
          "messages": [
            {
              "id": 1,
              "messageText": "Los medicamentos están listos",
              "senderId": 8,
              "createdAt": "2025-09-28T16:15:00Z"
            }
          ]
        }
      ],

      // Recent parcels delivery
      "recentParcels": [
        {
          "id": 101,
          "pickupAddress": "Oficina Central",
          "dropoffAddress": "Centro de Distribución",
          "type": "documents",
          "description": "Paquete de documentos importantes",
          "weight": 1.5,
          "status": "COMPLETED",
          "serviceFee": 8.50,
          "totalAmount": 10.00,
          "recipientName": "María González",
          "recipientPhone": "+584169876543",
          "createdAt": "2025-09-28T09:00:00Z",
          "messages": [
            {
              "id": 1,
              "messageText": "Documento entregado exitosamente",
              "senderId": 8,
              "createdAt": "2025-09-28T10:30:00Z"
            }
          ]
        }
      ],

      // Driver reports (issues during rides)
      "driverReports": [
        {
          "id": 1,
          "rideId": 123,
          "vehicleId": 1,
          "reportType": "traffic_jam",
          "description": "Gran congestión de tráfico en la autopista",
          "severity": "medium",
          "locationLat": 10.4806,
          "locationLng": -66.9036,
          "estimatedDelay": 20,
          "requiresCancellation": false,
          "status": "resolved",
          "adminNotes": "Tráfico normal para la hora",
          "reportedAt": "2025-09-29T10:30:00Z",
          "resolvedAt": "2025-09-29T11:00:00Z",
          "ride": {
            "rideId": 123,
            "originAddress": "Centro de Caracas",
            "destinationAddress": "Aeropuerto Internacional",
            "createdAt": "2025-09-29T10:00:00Z"
          },
          "vehicle": {
            "id": 1,
            "make": "Yamaha",
            "model": "MT-07",
            "licensePlate": "MOT789"
          }
        }
      ],

      // Recent location tracking history
      "recentLocationHistory": [
        {
          "id": 1,
          "driverId": 8,
          "latitude": 10.4806,
          "longitude": -66.9036,
          "accuracy": 5.2,
          "speed": 25.5,
          "heading": 90.0,
          "altitude": 850.0,
          "rideId": null,
          "timestamp": "2025-09-30T03:00:00Z",
          "source": "gps"
        }
      ],

      // Vehicle change history for audit trail
      "vehicleHistory": [
        {
          "id": 1,
          "vehicleId": 1,
          "driverId": 8,
          "changeType": "update",
          "oldValue": { "status": "pending" },
          "newValue": { "status": "active" },
          "reason": "Vehicle verification completed",
          "changedBy": 1,
          "changedAt": "2025-09-30T03:02:27.623Z",
          "vehicle": {
            "id": 1,
            "make": "Yamaha",
            "model": "MT-07",
            "licensePlate": "MOT789"
          }
        }
      ],

      // Driver verification status change history
      "verificationHistory": [
        {
          "id": 1,
          "driverId": 8,
          "previousStatus": "pending",
          "newStatus": "approved",
          "changeReason": "All documents verified successfully",
          "additionalNotes": "License and vehicle documents approved",
          "changedBy": 1,
          "changedAt": "2025-09-30T03:02:27.623Z"
        }
      ],

      // Performance statistics by period
      "performanceStats": {
        "todayRides": 2,
        "weekRides": 15,
        "monthRides": 67,
        "todayEarnings": 45.50,
        "weekEarnings": 325.75,
        "monthEarnings": 1450.25,
        "averageResponseTime": 45,
        "customerSatisfaction": 4.8
      }
    },
    "message": "Success",
    "statusCode": 200,
    "timestamp": "2025-09-30T03:25:12.345Z",
    "path": "/admin/drivers/8"
  }
  ```

### `PUT /admin/drivers/:id/status`

Updates a driver's status.

**Path Parameters:**
- `id`: Driver ID - number

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service",
  "suspensionEndDate": "2024-02-01T00:00:00Z"
}
```

**Responses:**
- `200 OK`: Driver status updated successfully.
- `404 Not Found`: Driver not found.

### `PUT /admin/drivers/:id/verification`

Updates a driver's verification status.

**Path Parameters:**
- `id`: Driver ID - number

**Request Body:**
```json
{
  "verificationStatus": "approved",
  "notes": "All documents verified successfully"
}
```

**Responses:**
- `200 OK`: Driver verification updated successfully.
- `404 Not Found`: Driver not found.

### `PUT /admin/drivers/:id/work-zones`

Updates a driver's work zones.

**Path Parameters:**
- `id`: Driver ID - number

**Request Body:**
```json
{
  "zoneIds": [1, 2, 3],
  "primaryZoneId": 1
}
```

**Responses:**
- `200 OK`: Work zones updated successfully.
- `404 Not Found`: Driver not found.

### `POST /admin/drivers/bulk/status`

Updates status for multiple drivers in bulk.

**Request Body:**
```json
{
  "driverIds": [1, 2, 3],
  "status": "suspended",
  "reason": "System maintenance"
}
```

**Responses:**
- `200 OK`: Bulk status update completed successfully.

### `DELETE /admin/drivers/:id`

Deletes a driver from the system.

**Path Parameters:**
- `id`: Driver unique ID - number

**Request Body:**
```json
{
  "reason": "Violation of terms of service",
  "permanent": false
}
```

**Responses:**
- `200 OK`: Driver deleted successfully.
  ```json
  {
    "success": true,
    "message": "Driver soft deleted successfully",
    "driverId": 123,
    "permanent": false,
    "reason": "Violation of terms of service"
  }
  ```
- `404 Not Found`: Driver not found.
- `400 Bad Request`: Cannot delete driver - has active services.

---

## 5. Vehicle Management

### `GET /admin/vehicles`

Lists vehicles with advanced filters and pagination.

**Query Parameters:**
- `status`: Vehicle status filter (ACTIVE/INACTIVE/SUSPENDED/MAINTENANCE) - array
- `verificationStatus`: Verification status filter (PENDING/VERIFIED/REJECTED) - array
- `vehicleTypeId`: Vehicle type ID filter - number
- `driverId`: Driver ID filter - number
- `isDefault`: Default vehicle filter - boolean
- `dateFrom`: Registration date from - ISO string
- `dateTo`: Registration date to - ISO string
- `search`: Search in make, model, licensePlate - string
- `page`: Page number (default: 1) - number
- `limit`: Items per page (default: 20) - number

**Responses:**
- `200 OK`: Vehicles list retrieved successfully.
  ```json
  {
    "vehicles": [
      {
        "id": 1,
        "driverId": 8,
        "vehicleTypeId": 1,
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "color": "White",
        "licensePlate": "ABC123",
        "vin": "1HGBH41JXMN109186",
        "seatingCapacity": 4,
        "hasAC": true,
        "hasGPS": true,
        "fuelType": "gasoline",
        "insuranceProvider": "Seguros Caracas",
        "insurancePolicyNumber": "POL-001234",
        "insuranceExpiryDate": "2024-12-31T00:00:00Z",
        "status": "ACTIVE",
        "verificationStatus": "VERIFIED",
        "isDefault": true,
        "vehicleType": {
          "id": 1,
          "name": "car",
          "displayName": "Carro",
          "icon": "🚗"
        },
        "driver": {
          "id": 8,
          "firstName": "Luis",
          "lastName": "Martinez"
        },
        "createdAt": "2025-09-30T03:02:27.621Z",
        "updatedAt": "2025-09-30T03:02:27.621Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
  ```

### `GET /admin/vehicles/:id`

Retrieves complete details of a specific vehicle.

**Path Parameters:**
- `id`: Vehicle unique ID - number

**Responses:**
- `200 OK`: Vehicle details retrieved successfully.
  ```json
  {
    "basic": {
      "id": 1,
      "driverId": 8,
      "vehicleTypeId": 1,
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "color": "White",
      "licensePlate": "ABC123",
      "vin": "1HGBH41JXMN109186",
      "seatingCapacity": 4,
      "hasAC": true,
      "hasGPS": true,
      "fuelType": "gasoline",
      "status": "ACTIVE",
      "verificationStatus": "VERIFIED",
      "isDefault": true
    },
    "insurance": {
      "provider": "Seguros Caracas",
      "policyNumber": "POL-001234",
      "expiryDate": "2024-12-31T00:00:00Z"
    },
    "images": {
      "frontImageUrl": "https://example.com/vehicles/1/front.jpg",
      "sideImageUrl": "https://example.com/vehicles/1/side.jpg",
      "backImageUrl": "https://example.com/vehicles/1/back.jpg",
      "interiorImageUrl": "https://example.com/vehicles/1/interior.jpg"
    },
    "vehicleType": {
      "id": 1,
      "name": "car",
      "displayName": "Carro",
      "icon": "🚗"
    },
    "driver": {
      "id": 8,
      "firstName": "Luis",
      "lastName": "Martinez",
      "email": "luis.driver@example.com"
    },
    "documents": [
      {
        "id": 1,
        "documentType": "registration",
        "documentUrl": "https://example.com/vehicle-docs/registration.pdf",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2025-09-30T03:02:27.622Z",
        "verifiedBy": 1
      }
    ],
    "recentRides": [
      {
        "rideId": 123,
        "status": "COMPLETED",
        "createdAt": "2025-09-29T10:00:00Z",
        "farePrice": 25.50
      }
    ],
    "changeHistory": [
      {
        "id": 1,
        "changeType": "status_change",
        "oldValue": { "status": "PENDING" },
        "newValue": { "status": "ACTIVE" },
        "reason": "Vehicle verification completed",
        "changedBy": 1,
        "changedAt": "2025-09-30T03:02:27.623Z"
      }
    ]
  }
  ```

### `PUT /admin/vehicles/:id/status`

Updates a vehicle's status.

**Path Parameters:**
- `id`: Vehicle ID - number

**Request Body:**
```json
{
  "status": "SUSPENDED",
  "reason": "Insurance expired"
}
```

**Responses:**
- `200 OK`: Vehicle status updated successfully.
- `404 Not Found`: Vehicle not found.

### `PUT /admin/vehicles/:id/verification`

Updates a vehicle's verification status.

**Path Parameters:**
- `id`: Vehicle ID - number

**Request Body:**
```json
{
  "verificationStatus": "VERIFIED",
  "notes": "All documents verified successfully"
}
```

**Responses:**
- `200 OK`: Vehicle verification updated successfully.
- `404 Not Found`: Vehicle not found.

---

## 6. Vehicle Types Management

### `GET /admin/vehicle-types`

Lists vehicle types with filters.

**Query Parameters:**
- `isActive`: Active status filter - boolean
- `search`: Search in name, displayName - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Vehicle types retrieved successfully.
  ```json
  {
    "vehicleTypes": [
      {
        "id": 1,
        "name": "car",
        "displayName": "Carro",
        "icon": "🚗",
        "isActive": true,
        "createdAt": "2025-09-30T03:02:26.801Z",
        "updatedAt": "2025-09-30T03:02:26.801Z"
      },
      {
        "id": 2,
        "name": "motorcycle",
        "displayName": "Moto",
        "icon": "🏍️",
        "isActive": true,
        "createdAt": "2025-09-30T03:02:26.801Z",
        "updatedAt": "2025-09-30T03:02:26.801Z"
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```

### `POST /admin/vehicle-types`

Creates a new vehicle type.

**Request Body:**
```json
{
  "name": "bicycle",
  "displayName": "Bicicleta",
  "icon": "🚲",
  "isActive": true
}
```

**Responses:**
- `201 Created`: Vehicle type created successfully.

### `PUT /admin/vehicle-types/:id`

Updates a vehicle type.

**Path Parameters:**
- `id`: Vehicle type ID - number

**Request Body:**
```json
{
  "displayName": "Automóvil",
  "icon": "🚙",
  "isActive": true
}
```

**Responses:**
- `200 OK`: Vehicle type updated successfully.
- `404 Not Found`: Vehicle type not found.

### `DELETE /admin/vehicle-types/:id`

Deletes a vehicle type.

**Path Parameters:**
- `id`: Vehicle type ID - number

**Responses:**
- `200 OK`: Vehicle type deleted successfully.
- `404 Not Found`: Vehicle type not found.
- `409 Conflict`: Cannot delete - has associated vehicles.

---

## 7. Ride Management

### `GET /admin/rides`

Lists rides with advanced filters and pagination.

**Query Parameters:**
- `status`: Ride status filter - array
- `driverId`: Driver ID filter - number
- `userId`: User ID filter - number
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `minFare`: Minimum fare - number
- `maxFare`: Maximum fare - number
- `originAddress`: Origin address filter - string
- `destinationAddress`: Destination address filter - string
- `page`: Page number (default: 1) - number
- `limit`: Items per page (default: 20) - number

**Responses:**
- `200 OK`: Rides list retrieved successfully.
  ```json
  {
    "rides": [
      {
        "rideId": 123,
        "createdAt": "2024-01-15T10:30:00Z",
        "status": "COMPLETED",
        "originAddress": "123 Main St, City",
        "destinationAddress": "456 Oak Ave, City",
        "farePrice": 25.5,
        "driver": {
          "id": 1,
          "firstName": "John",
          "lastName": "Doe",
          "averageRating": 4.7
        },
        "user": {
          "id": 1,
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "tier": {
          "id": 1,
          "name": "UberX"
        },
        "messagesCount": 5
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
  ```

### `GET /admin/rides/:id`

Retrieves complete details of a specific ride.

**Path Parameters:**
- `id`: Ride unique ID - number

**Responses:**
- `200 OK`: Ride details retrieved successfully.
  ```json
  {
    "basic": {
      "id": 123,
      "rideId": 123,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:15:00Z",
      "rideTime": 25,
      "farePrice": 25.5,
      "paymentStatus": "completed"
    },
    "locations": {
      "originAddress": "123 Main St, New York, NY",
      "destinationAddress": "456 Oak Ave, New York, NY",
      "originLatitude": 40.7128,
      "originLongitude": -74.0060,
      "destinationLatitude": 40.7589,
      "destinationLongitude": -73.9851
    },
    "driver": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "carModel": "Toyota Camry",
      "licensePlate": "ABC-123",
      "averageRating": 4.7
    },
    "user": {
      "id": 1,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567891"
    },
    "tier": {
      "id": 1,
      "name": "UberX",
      "baseFare": 2.5,
      "perMinuteRate": 0.25,
      "perMileRate": 1.25
    },
    "ratings": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Great ride!",
        "createdAt": "2024-01-15T11:20:00Z"
      }
    ],
    "messages": [
      {
        "id": 1,
        "sender": "user",
        "message": "I'll be there in 2 minutes.",
        "timestamp": "2024-01-15T10:35:00Z"
      }
    ],
    "recentLocations": [
      {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

### `POST /admin/rides/:id/reassign`

Reassigns a ride to a different driver.

**Path Parameters:**
- `id`: Ride ID - number

**Request Body:**
```json
{
  "newDriverId": 2,
  "reason": "Driver requested cancellation due to vehicle issue"
}
```

**Responses:**
- `200 OK`: Ride reassigned successfully.
- `404 Not Found`: Ride or driver not found.
- `400 Bad Request`: Ride cannot be reassigned.

### `POST /admin/rides/:id/cancel`

Cancels a ride administratively.

**Path Parameters:**
- `id`: Ride ID - number

**Request Body:**
```json
{
  "reason": "Customer requested cancellation",
  "refundAmount": 25.5
}
```

**Responses:**
- `200 OK`: Ride cancelled successfully.
- `404 Not Found`: Ride not found.
- `400 Bad Request`: Ride cannot be cancelled.

### `POST /admin/rides/:id/complete`

Manually completes a ride.

**Path Parameters:**
- `id`: Ride ID - number

**Request Body:**
```json
{
  "reason": "GPS tracking lost - customer confirmed arrival"
}
```

**Responses:**
- `200 OK`: Ride completed successfully.
- `404 Not Found`: Ride not found.
- `400 Bad Request`: Ride cannot be completed.

---

## 6. Geography Management

### Countries

#### `POST /admin/geography/countries`

Creates a new country.

**Request Body:**
```json
{
  "name": "United States",
  "code": "US",
  "iso3": "USA",
  "numericCode": "840",
  "phoneCode": "+1",
  "capital": "Washington D.C.",
  "currency": "USD",
  "currencyName": "US Dollar",
  "currencySymbol": "$",
  "region": "Americas",
  "subregion": "Northern America",
  "latitude": 39.8283,
  "longitude": -98.5795,
  "area": 9833517,
  "population": 331000000,
  "continent": "North America",
  "timezones": ["UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00"]
}
```

**Responses:**
- `201 Created`: Country created successfully.
- `409 Conflict`: Country already exists.

#### `GET /admin/geography/countries`

Lists countries with filters.

**Query Parameters:**
- `search`: Search term - string
- `continent`: Continent filter - string
- `region`: Region filter - string
- `isActive`: Active status filter - boolean
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Countries list retrieved successfully.

#### `GET /admin/geography/countries/:id`

Retrieves details of a specific country.

**Path Parameters:**
- `id`: Country ID - number

**Responses:**
- `200 OK`: Country details retrieved successfully.
- `404 Not Found`: Country not found.

#### `PATCH /admin/geography/countries/:id`

Updates a country.

**Path Parameters:**
- `id`: Country ID - number

**Request Body:**
```json
{
  "name": "United States of America",
  "isActive": true
}
```

**Responses:**
- `200 OK`: Country updated successfully.
- `404 Not Found`: Country not found.

#### `DELETE /admin/geography/countries/:id`

Deletes a country.

**Path Parameters:**
- `id`: Country ID - number

**Responses:**
- `200 OK`: Country deleted successfully.
- `404 Not Found`: Country not found.
- `409 Conflict`: Cannot delete - has dependencies.

#### `POST /admin/geography/countries/bulk-import`

Imports countries from CSV file.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file containing country data

**Responses:**
- `201 Created`: Countries imported successfully.
- `400 Bad Request`: Invalid file or data.

### States/Provinces

#### `POST /admin/geography/states`

Creates a new state/province.

**Request Body:**
```json
{
  "name": "California",
  "code": "CA",
  "countryId": 1,
  "latitude": 36.7783,
  "longitude": -119.4179,
  "population": 39500000,
  "area": 423967
}
```

**Responses:**
- `201 Created`: State created successfully.

#### `GET /admin/geography/states`

Lists states with filters.

**Query Parameters:**
- `countryId`: Country ID filter - number
- `search`: Search term - string
- `isActive`: Active status filter - boolean
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: States list retrieved successfully.

### Cities

#### `POST /admin/geography/cities`

Creates a new city.

**Request Body:**
```json
{
  "name": "New York",
  "stateId": 1,
  "countryId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "population": 8500000,
  "timezone": "America/New_York",
  "isCapital": false
}
```

**Responses:**
- `201 Created`: City created successfully.

#### `GET /admin/geography/cities`

Lists cities with filters.

**Query Parameters:**
- `countryId`: Country ID filter - number
- `stateId`: State ID filter - number
- `search`: Search term - string
- `isActive`: Active status filter - boolean
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Cities list retrieved successfully.

### Service Zones

#### `POST /admin/geography/service-zones`

Creates a new service zone.

**Request Body:**
```json
{
  "name": "Downtown Manhattan",
  "cityId": 1,
  "coordinates": [
    {"lat": 40.7128, "lng": -74.0060},
    {"lat": 40.7589, "lng": -73.9851},
    {"lat": 40.7505, "lng": -74.0134}
  ],
  "isActive": true,
  "zoneType": "REGULAR",
  "baseFare": 2.5,
  "perMileRate": 1.25,
  "perMinuteRate": 0.25,
  "minimumFare": 8.0,
  "bookingFee": 2.0
}
```

**Responses:**
- `201 Created`: Service zone created successfully.

#### `GET /admin/geography/service-zones`

Lists service zones with filters.

**Query Parameters:**
- `cityId`: City ID filter - number
- `countryId`: Country ID filter - number
- `search`: Search term - string
- `isActive`: Active status filter - boolean
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Service zones list retrieved successfully.

---

## 7. Pricing Management

### Ride Tiers

#### `POST /admin/pricing/ride-tiers`

Creates a new ride tier.

**Request Body:**
```json
{
  "name": "UberX",
  "description": "Standard ride option",
  "baseFare": 2.5,
  "perMinuteRate": 0.25,
  "perMileRate": 1.25,
  "minimumFare": 8.0,
  "maximumFare": 400.0,
  "bookingFee": 2.0,
  "isActive": true,
  "countryId": 1,
  "stateId": null,
  "cityId": null,
  "serviceZoneId": null,
  "priority": 1,
  "features": ["4 seats", "AC", "GPS tracking"],
  "restrictions": ["No pets", "No smoking"]
}
```

**Responses:**
- `201 Created`: Ride tier created successfully.
- `409 Conflict`: Tier already exists.

#### `GET /admin/pricing/ride-tiers`

Lists ride tiers with filters.

**Query Parameters:**
- `countryId`: Country ID filter - number
- `stateId`: State ID filter - number
- `cityId`: City ID filter - number
- `serviceZoneId`: Service zone ID filter - number
- `isActive`: Active status filter - boolean
- `search`: Search term - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Ride tiers list retrieved successfully.

#### `GET /admin/pricing/ride-tiers/:id`

Retrieves details of a specific ride tier.

**Path Parameters:**
- `id`: Ride tier ID - number

**Responses:**
- `200 OK`: Ride tier details retrieved successfully.
- `404 Not Found`: Ride tier not found.

#### `PATCH /admin/pricing/ride-tiers/:id`

Updates a ride tier.

**Path Parameters:**
- `id`: Ride tier ID - number

**Request Body:**
```json
{
  "baseFare": 3.0,
  "perMinuteRate": 0.30,
  "isActive": true
}
```

**Responses:**
- `200 OK`: Ride tier updated successfully.
- `404 Not Found`: Ride tier not found.

#### `DELETE /admin/pricing/ride-tiers/:id`

Deletes a ride tier.

**Path Parameters:**
- `id`: Ride tier ID - number

**Responses:**
- `200 OK`: Ride tier deleted successfully.
- `404 Not Found`: Ride tier not found.
- `409 Conflict`: Cannot delete - has associated rides.

#### `POST /admin/pricing/ride-tiers/calculate-pricing`

Calculates pricing for a ride scenario.

**Request Body:**
```json
{
  "tierId": 1,
  "distance": 5.5,
  "duration": 20,
  "countryId": 1,
  "stateId": null,
  "cityId": 1,
  "serviceZoneId": 1,
  "isPeakHour": false,
  "isNightTime": false,
  "isWeekend": false,
  "isHoliday": false,
  "trafficMultiplier": 1.2
}
```

**Responses:**
- `200 OK`: Pricing calculation completed.
  ```json
  {
    "tier": {
      "id": 1,
      "name": "UberX",
      "baseFare": 2.5,
      "perMinuteRate": 0.25,
      "perMileRate": 1.25
    },
    "distance": 5.5,
    "duration": 20,
    "baseFare": 2.5,
    "distanceFare": 6.875,
    "timeFare": 5.0,
    "subtotal": 14.375,
    "bookingFee": 2.0,
    "peakHourMultiplier": 1.0,
    "nightTimeMultiplier": 1.0,
    "weekendMultiplier": 1.0,
    "holidayMultiplier": 1.0,
    "trafficMultiplier": 1.2,
    "totalMultiplier": 1.2,
    "totalFare": 19.25,
    "estimatedTaxes": 1.925,
    "finalFare": 21.175
  }
  ```

#### `POST /admin/pricing/ride-tiers/validate-pricing`

Validates pricing configuration.

**Request Body:**
```json
{
  "tier": {
    "name": "UberX",
    "baseFare": 2.5,
    "perMinuteRate": 0.25,
    "perMileRate": 1.25,
    "minimumFare": 8.0,
    "maximumFare": 400.0
  },
  "compareWithTierId": 1
}
```

**Responses:**
- `200 OK`: Validation completed.

#### `POST /admin/pricing/ride-tiers/create-standard-tiers`

Creates standard Uber tiers.

**Responses:**
- `200 OK`: Standard tiers created successfully.

#### `POST /admin/pricing/ride-tiers/bulk-update`

Updates multiple ride tiers.

**Request Body:**
```json
{
  "tierIds": [1, 2, 3],
  "adjustmentType": "percentage",
  "adjustmentValue": 10,
  "field": "baseFare"
}
```

**Responses:**
- `200 OK`: Bulk update completed.

### Temporal Pricing Rules

#### `POST /admin/pricing/temporal-rules`

Creates a temporal pricing rule.

**Request Body:**
```json
{
  "name": "Morning Peak Hours",
  "description": "Higher pricing during morning rush hour",
  "ruleType": "TIME_RANGE",
  "multiplier": 1.5,
  "startTime": "07:00",
  "endTime": "09:30",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "isActive": true,
  "countryId": 1,
  "stateId": null,
  "cityId": 1,
  "zoneId": null,
  "priority": 1
}
```

**Responses:**
- `201 Created`: Temporal rule created successfully.

#### `GET /admin/pricing/temporal-rules`

Lists temporal pricing rules.

**Query Parameters:**
- `ruleType`: Rule type filter - string
- `isActive`: Active status filter - boolean
- `countryId`: Country ID filter - number
- `stateId`: State ID filter - number
- `cityId`: City ID filter - number
- `zoneId`: Zone ID filter - number
- `search`: Search term - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Temporal rules list retrieved successfully.

#### `GET /admin/pricing/temporal-rules/:id`

Retrieves details of a specific temporal rule.

**Path Parameters:**
- `id`: Temporal rule ID - number

**Responses:**
- `200 OK`: Temporal rule details retrieved successfully.
- `404 Not Found`: Temporal rule not found.

#### `PATCH /admin/pricing/temporal-rules/:id`

Updates a temporal pricing rule.

**Path Parameters:**
- `id`: Temporal rule ID - number

**Request Body:**
```json
{
  "multiplier": 1.6,
  "isActive": true
}
```

**Responses:**
- `200 OK`: Temporal rule updated successfully.
- `404 Not Found`: Temporal rule not found.

#### `DELETE /admin/pricing/temporal-rules/:id`

Deletes a temporal pricing rule.

**Path Parameters:**
- `id`: Temporal rule ID - number

**Responses:**
- `200 OK`: Temporal rule deleted successfully.
- `404 Not Found`: Temporal rule not found.

#### `POST /admin/pricing/temporal-rules/evaluate`

Evaluates active temporal rules for a date/time.

**Request Body:**
```json
{
  "dateTime": "2024-01-15T08:00:00Z",
  "countryId": 1,
  "stateId": null,
  "cityId": 1,
  "zoneId": null
}
```

**Responses:**
- `200 OK`: Evaluation completed.
  ```json
  {
    "dateTime": "2024-01-15T08:00:00Z",
    "location": {
      "countryId": 1,
      "cityId": 1
    },
    "activeRules": [
      {
        "id": 1,
        "name": "Morning Peak Hours",
        "ruleType": "TIME_RANGE",
        "multiplier": 1.5,
        "reason": "Within morning peak hours (07:00-09:30)"
      }
    ],
    "effectiveMultiplier": 1.5,
    "ruleCount": 1
  }
  ```

#### `POST /admin/pricing/temporal-rules/create-standard-rules`

Creates standard temporal rules.

**Request Body:**
```json
{
  "countryId": 1,
  "cityId": 1,
  "rules": [
    {
      "type": "morning_peak",
      "multiplier": 1.5
    },
    {
      "type": "evening_peak",
      "multiplier": 1.3
    },
    {
      "type": "night_surcharge",
      "multiplier": 1.2
    },
    {
      "type": "weekend_surcharge",
      "multiplier": 1.1
    }
  ]
}
```

**Responses:**
- `200 OK`: Standard rules created successfully.

#### `POST /admin/pricing/temporal-rules/bulk-update`

Updates multiple temporal rules.

**Request Body:**
```json
{
  "ruleIds": [1, 2, 3],
  "updates": {
    "multiplier": 1.4,
    "isActive": true
  }
}
```

**Responses:**
- `200 OK`: Bulk update completed.

---

## 8. Venezuelan Payment System Management

### Payment References

#### `GET /admin/payments/references`

Lists payment references with filters.

**Query Parameters:**
- `status`: Payment status filter (PENDING/COMPLETED/FAILED/CANCELLED) - array
- `serviceType`: Service type filter (ride/delivery/errand/parcel) - array
- `paymentMethod`: Payment method filter (transfer/pago_movil/zelle/bitcoin/cash) - array
- `bankCode`: Bank code filter - string
- `userId`: User ID filter - number
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `search`: Search in referenceNumber - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Payment references retrieved successfully.
  ```json
  {
    "references": [
      {
        "id": 1,
        "referenceNumber": "12345678901234567890",
        "bankCode": "0102",
        "amount": 25.50,
        "currency": "VES",
        "userId": 1,
        "serviceType": "ride",
        "serviceId": 123,
        "paymentMethod": "transfer",
        "status": "PENDING",
        "isPartial": false,
        "groupId": "group-uuid-123",
        "expiresAt": "2025-01-15T14:00:00Z",
        "confirmedAt": null,
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
  ```

#### `GET /admin/payments/references/:id`

Retrieves details of a specific payment reference.

**Path Parameters:**
- `id`: Payment reference ID - number

**Responses:**
- `200 OK`: Payment reference details retrieved successfully.
  ```json
  {
    "reference": {
      "id": 1,
      "referenceNumber": "12345678901234567890",
      "bankCode": "0102",
      "amount": 25.50,
      "currency": "VES",
      "userId": 1,
      "serviceType": "ride",
      "serviceId": 123,
      "paymentMethod": "transfer",
      "status": "COMPLETED",
      "isPartial": false,
      "groupId": "group-uuid-123",
      "expiresAt": "2025-01-15T14:00:00Z",
      "confirmedAt": "2025-01-15T11:30:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "bankTransactions": [
        {
          "id": 1,
          "bankTransactionId": "TXN123456789",
          "confirmedAmount": 25.50,
          "confirmationTimestamp": "2025-01-15T11:30:00Z",
          "bankResponse": {
            "transactionId": "TXN123456789",
            "status": "confirmed",
            "bankCode": "0102"
          }
        }
      ],
      "paymentGroup": {
        "id": "group-uuid-123",
        "totalAmount": 25.50,
        "paidAmount": 25.50,
        "remainingAmount": 0.00,
        "status": "complete"
      }
    }
  }
  ```

#### `PUT /admin/payments/references/:id/status`

Updates a payment reference status.

**Path Parameters:**
- `id`: Payment reference ID - number

**Request Body:**
```json
{
  "status": "COMPLETED",
  "confirmedAmount": 25.50,
  "bankTransactionId": "TXN123456789",
  "bankResponse": {
    "transactionId": "TXN123456789",
    "status": "confirmed"
  }
}
```

**Responses:**
- `200 OK`: Payment reference status updated successfully.
- `404 Not Found`: Payment reference not found.

### Payment Groups

#### `GET /admin/payments/groups`

Lists payment groups with filters.

**Query Parameters:**
- `status`: Group status filter (incomplete/complete/cancelled/expired) - array
- `serviceType`: Service type filter - array
- `userId`: User ID filter - number
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Payment groups retrieved successfully.

#### `GET /admin/payments/groups/:id`

Retrieves details of a specific payment group.

**Path Parameters:**
- `id`: Payment group ID - string (UUID)

**Responses:**
- `200 OK`: Payment group details retrieved successfully.
  ```json
  {
    "group": {
      "id": "group-uuid-123",
      "userId": 1,
      "serviceType": "ride",
      "serviceId": 123,
      "totalAmount": 50.00,
      "paidAmount": 25.50,
      "remainingAmount": 24.50,
      "status": "incomplete",
      "expiresAt": "2025-01-16T10:00:00Z",
      "completedAt": null,
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "paymentReferences": [
        {
          "id": 1,
          "referenceNumber": "12345678901234567890",
          "amount": 25.50,
          "status": "COMPLETED",
          "paymentMethod": "transfer"
        }
      ]
    }
  }
  ```

### Bank Transactions

#### `GET /admin/payments/bank-transactions`

Lists bank transactions with filters.

**Query Parameters:**
- `bankCode`: Bank code filter - string
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Bank transactions retrieved successfully.

---

## 9. Configuration Management

### API Keys

#### `POST /admin/config/api-keys`

Creates a new API key.

**Request Body:**
```json
{
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "description": "Stripe secret key for production payments",
  "expiresAt": "2025-01-15T00:00:00Z",
  "isPrimary": true,
  "permissions": ["payments:read", "payments:write"],
  "tags": ["production", "critical"]
}
```

**Responses:**
- `201 Created`: API key created successfully.
- `409 Conflict`: API key already exists.

#### `GET /admin/config/api-keys`

Lists API keys with filters.

**Query Parameters:**
- `service`: Service filter - string
- `environment`: Environment filter - string
- `keyType`: Key type filter - string
- `isActive`: Active status filter - boolean
- `isPrimary`: Primary status filter - boolean
- `search`: Search term - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: API keys list retrieved successfully.

#### `GET /admin/config/api-keys/:id`

Retrieves details of a specific API key.

**Path Parameters:**
- `id`: API key ID - number

**Responses:**
- `200 OK`: API key details retrieved successfully.
- `404 Not Found`: API key not found.

#### `GET /admin/config/api-keys/service/:service/:environment`

Retrieves API keys for a specific service and environment.

**Path Parameters:**
- `service`: Service name - string
- `environment`: Environment name - string

**Responses:**
- `200 OK`: API keys retrieved successfully.

#### `GET /admin/config/api-keys/:id/decrypt`

Retrieves decrypted API key value.

**Path Parameters:**
- `id`: API key ID - number

**Responses:**
- `200 OK`: Decrypted key retrieved.
  ```json
  {
    "decryptedKey": "sk_live_..."
  }
  ```
- `400 Bad Request`: API key is inactive.

#### `PATCH /admin/config/api-keys/:id`

Updates an API key.

**Path Parameters:**
- `id`: API key ID - number

**Request Body:**
```json
{
  "description": "Updated description",
  "isActive": true,
  "permissions": ["payments:read", "payments:write", "refunds:write"]
}
```

**Responses:**
- `200 OK`: API key updated successfully.
- `404 Not Found`: API key not found.

#### `DELETE /admin/config/api-keys/:id`

Deletes an API key.

**Path Parameters:**
- `id`: API key ID - number

**Responses:**
- `200 OK`: API key deleted successfully.
- `404 Not Found`: API key not found.

#### `POST /admin/config/api-keys/:id/toggle`

Toggles API key active status.

**Path Parameters:**
- `id`: API key ID - number

**Request Body:**
```json
{
  "active": false
}
```

**Responses:**
- `200 OK`: API key status toggled successfully.

#### `POST /admin/config/api-keys/:id/rotate`

Rotates an API key.

**Path Parameters:**
- `id`: API key ID - number

**Request Body:**
```json
{
  "reason": "Security rotation"
}
```

**Responses:**
- `200 OK`: API key rotated successfully.

#### `POST /admin/config/api-keys/bulk-update`

Updates multiple API keys.

**Request Body:**
```json
{
  "keyIds": [1, 2, 3],
  "updates": {
    "isActive": false,
    "environment": "staging"
  }
}
```

**Responses:**
- `200 OK`: Bulk update completed.

#### `POST /admin/config/api-keys/create-standard-keys`

Creates standard API keys for common services.

**Request Body:**
```json
{
  "services": ["stripe", "twilio", "firebase"],
  "environments": ["development", "staging", "production"]
}
```

**Responses:**
- `200 OK`: Standard API keys created successfully.

#### `GET /admin/config/api-keys/analytics/overview`

Retrieves API keys analytics.

**Responses:**
- `200 OK`: Analytics retrieved successfully.
  ```json
  {
    "analytics": {
      "totalKeys": 25,
      "activeKeys": 22,
      "inactiveKeys": 3,
      "expiringSoon": 2,
      "expired": 1,
      "byService": {
        "stripe": { "total": 3, "active": 3, "primary": 1 },
        "twilio": { "total": 2, "active": 2, "primary": 1 },
        "firebase": { "total": 4, "active": 4, "primary": 1 }
      },
      "byEnvironment": {
        "production": { "total": 9, "active": 9 },
        "staging": { "total": 9, "active": 8 },
        "development": { "total": 7, "active": 5 }
      },
      "byKeyType": {
        "secret": { "total": 15, "active": 14 },
        "public": { "total": 10, "active": 8 }
      },
      "usageStats": {
        "totalUsage": 15420,
        "averageUsage": 617,
        "mostUsed": [
          { "name": "Stripe Prod Key", "usage": 2500 },
          { "name": "Twilio SMS Key", "usage": 1800 }
        ],
        "leastUsed": [
          { "name": "Firebase Test Key", "usage": 5 },
          { "name": "Stripe Test Key", "usage": 12 }
        ]
      }
    }
  }
  ```

#### `GET /admin/config/api-keys/rotation/stats`

Retrieves API key rotation statistics.

**Responses:**
- `200 OK`: Rotation statistics retrieved successfully.

#### `POST /admin/config/api-keys/rotation/bulk-rotate`

Rotates multiple API keys that need rotation.

**Responses:**
- `200 OK`: Bulk rotation completed.

### Feature Flags

#### `POST /admin/config/feature-flags`

Creates a new feature flag.

**Request Body:**
```json
{
  "name": "new_payment_flow",
  "description": "New payment flow with improved UX",
  "isEnabled": false,
  "rolloutPercentage": 0,
  "targeting": {
    "userRoles": ["premium"],
    "userIds": [],
    "environments": ["production"],
    "countries": [1]
  },
  "conditions": {
    "userType": "premium",
    "appVersion": ">=2.0.0"
  },
  "expiresAt": "2024-06-01T00:00:00Z"
}
```

**Responses:**
- `201 Created`: Feature flag created successfully.

#### `GET /admin/config/feature-flags`

Lists feature flags with filters.

**Query Parameters:**
- `isEnabled`: Enabled status filter - boolean
- `search`: Search term - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Feature flags list retrieved successfully.

#### `GET /admin/config/feature-flags/:id`

Retrieves details of a specific feature flag.

**Path Parameters:**
- `id`: Feature flag ID - number

**Responses:**
- `200 OK`: Feature flag details retrieved successfully.
- `404 Not Found`: Feature flag not found.

#### `PATCH /admin/config/feature-flags/:id`

Updates a feature flag.

**Path Parameters:**
- `id`: Feature flag ID - number

**Request Body:**
```json
{
  "rolloutPercentage": 25,
  "isEnabled": true,
  "description": "Updated description"
}
```

**Responses:**
- `200 OK`: Feature flag updated successfully.
- `404 Not Found`: Feature flag not found.

#### `DELETE /admin/config/feature-flags/:id`

Deletes a feature flag.

**Path Parameters:**
- `id`: Feature flag ID - number

**Responses:**
- `200 OK`: Feature flag deleted successfully.
- `404 Not Found`: Feature flag not found.

#### `POST /admin/config/feature-flags/:id/toggle`

Toggles feature flag enabled status.

**Path Parameters:**
- `id`: Feature flag ID - number

**Request Body:**
```json
{
  "enabled": true
}
```

**Responses:**
- `200 OK`: Feature flag status toggled successfully.

#### `GET /admin/config/feature-flags/evaluate/:flagName`

Evaluates a feature flag for a user/context.

**Path Parameters:**
- `flagName`: Feature flag name - string

**Query Parameters:**
- `userId`: User ID - number
- `countryId`: Country ID - number
- `appVersion`: App version - string
- `userType`: User type - string

**Responses:**
- `200 OK`: Feature flag evaluation result.
  ```json
  {
    "flagName": "new_payment_flow",
    "isEnabled": true,
    "rolloutPercentage": 25,
    "userIncluded": true,
    "conditionsMet": true,
    "reason": "User meets all conditions"
  }
  ```

---

## 9. Reports & Analytics

### `POST /admin/reports/generate`

Generates a custom report.

**Request Body:**
```json
{
  "dateFrom": "2024-01-01T00:00:00Z",
  "dateTo": "2024-01-31T23:59:59Z",
  "period": "month",
  "entityType": "rides",
  "groupBy": "day",
  "metrics": ["count", "revenue", "averageFare"]
}
```

**Responses:**
- `200 OK`: Report generated successfully.
  ```json
  {
    "summary": {
      "totalRides": 15420,
      "totalRevenue": 87500.50,
      "averageFare": 22.75,
      "completedRides": 14850,
      "cancelledRides": 570
    },
    "data": [
      {
        "date": "2024-01-01",
        "rides": 485,
        "revenue": 11250.25,
        "averageFare": 23.20
      },
      {
        "date": "2024-01-02",
        "rides": 520,
        "revenue": 11800.00,
        "averageFare": 22.69
      }
    ],
    "charts": {
      "revenueTrend": "base64_encoded_chart",
      "ridesDistribution": "base64_encoded_chart"
    },
    "generatedAt": "2024-01-15T10:30:00Z"
  }
  ```

### `POST /admin/reports/export`

Exports a report in various formats.

**Request Body:**
```json
{
  "dateFrom": "2024-01-01T00:00:00Z",
  "dateTo": "2024-01-31T23:59:59Z",
  "period": "month",
  "entityType": "financial",
  "groupBy": "week",
  "metrics": ["revenue", "transactions", "refunds"],
  "format": "excel"
}
```

**Responses:**
- `200 OK`: Report exported successfully (file download).

### `GET /admin/reports/dashboard/widgets`

Retrieves dashboard widgets data.

**Responses:**
- `200 OK`: Dashboard widgets retrieved successfully.

### `POST /admin/reports/dashboard/custom`

Creates a custom dashboard.

**Request Body:**
```json
{
  "name": "Operations Dashboard",
  "description": "Custom dashboard for operations team",
  "widgets": [
    {
      "type": "metric",
      "title": "Active Rides",
      "metric": "activeRides",
      "refreshInterval": 30
    },
    {
      "type": "chart",
      "title": "Revenue Trend",
      "chartType": "line",
      "dataSource": "revenue",
      "period": "7d"
    }
  ],
  "layout": {
    "columns": 3,
    "rows": 2
  },
  "isPublic": false,
  "sharedWithRoles": ["manager", "supervisor"]
}
```

**Responses:**
- `201 Created`: Custom dashboard created successfully.

### `POST /admin/reports/schedule`

Schedules an automated report.

**Request Body:**
```json
{
  "name": "Weekly Financial Report",
  "description": "Weekly financial summary report",
  "reportConfig": {
    "entityType": "financial",
    "period": "week",
    "metrics": ["revenue", "transactions", "refunds"]
  },
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": 1,
    "time": "09:00",
    "timezone": "America/New_York"
  },
  "recipients": [
    "finance@company.com",
    "ceo@company.com"
  ],
  "format": "pdf",
  "isActive": true
}
```

**Responses:**
- `201 Created`: Report scheduled successfully.

### `GET /admin/reports/scheduled`

Retrieves scheduled reports.

**Responses:**
- `200 OK`: Scheduled reports retrieved successfully.

### `GET /admin/reports/quick/rides`

Quick rides report for current month.

**Responses:**
- `200 OK`: Quick rides report generated.

### `GET /admin/reports/quick/financial`

Quick financial report for current month.

**Responses:**
- `200 OK`: Quick financial report generated.

### `GET /admin/reports/quick/drivers`

Quick drivers performance report.

**Responses:**
- `200 OK`: Quick drivers report generated.

### `GET /admin/reports/quick/users`

Quick users growth report.

**Responses:**
- `200 OK`: Quick users report generated.

### `GET /admin/reports/metrics/overview`

General system metrics overview.

**Responses:**
- `200 OK`: System metrics overview retrieved.
  ```json
  {
    "overview": {
      "totalRides": 15420,
      "activeRides": 15,
      "totalUsers": 8500,
      "activeDrivers": 285,
      "todayRevenue": 1250.50,
      "pendingPayments": 0
    },
    "trends": {
      "ridesGrowth": 12.5,
      "revenueGrowth": 8.3,
      "userGrowth": 15.2,
      "driverGrowth": 5.7
    },
    "health": {
      "systemStatus": "healthy",
      "lastBackup": "2024-01-15T02:00:00Z",
      "activeAlerts": 0,
      "uptime": 99.9
    }
  }
  ```

---

## 10. Notifications Management

### `GET /admin/notifications`

Lists notifications with filters.

**Query Parameters:**
- `type`: Notification type filter - string
- `status`: Status filter - string
- `priority`: Priority filter - string
- `userId`: User ID filter - number
- `driverId`: Driver ID filter - number
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `search`: Search term - string
- `page`: Page number - number
- `limit`: Items per page - number

**Responses:**
- `200 OK`: Notifications list retrieved successfully.

### `POST /admin/notifications/send`

Sends a custom notification.

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "The system will be under maintenance tonight from 2 AM to 4 AM EST",
  "type": "announcement",
  "priority": "HIGH",
  "targetAudience": {
    "userType": "all",
    "countries": [1],
    "userIds": null
  },
  "channels": ["push", "email", "sms"],
  "scheduledFor": "2024-01-15T14:00:00Z",
  "expiresAt": "2024-01-16T04:00:00Z"
}
```

**Responses:**
- `201 Created`: Notification sent successfully.

### `POST /admin/notifications/bulk-send`

Sends bulk notifications.

**Request Body:**
```json
{
  "notifications": [
    {
      "title": "Welcome to Uber Clone",
      "message": "Welcome! Your account has been activated.",
      "type": "welcome",
      "userId": 1,
      "channels": ["push", "email"]
    }
  ]
}
```

**Responses:**
- `200 OK`: Bulk notifications sent successfully.

### `GET /admin/notifications/templates`

Lists notification templates.

**Responses:**
- `200 OK`: Notification templates retrieved successfully.

### `POST /admin/notifications/templates`

Creates a notification template.

**Request Body:**
```json
{
  "name": "Ride Completed",
  "description": "Template for ride completion notifications",
  "type": "ride_completion",
  "subject": "Your ride has been completed",
  "messageTemplate": "Hi {{userName}}, your ride from {{origin}} to {{destination}} has been completed. Total fare: ${{fare}}",
  "channels": ["push", "email"],
  "variables": ["userName", "origin", "destination", "fare"],
  "isActive": true
}
```

**Responses:**
- `201 Created`: Template created successfully.

### `GET /admin/notifications/analytics`

Retrieves notification analytics.

**Query Parameters:**
- `dateFrom`: Date from - ISO string
- `dateTo`: Date to - ISO string
- `type`: Notification type filter - string
- `channel`: Channel filter - string

**Responses:**
- `200 OK`: Notification analytics retrieved successfully.
  ```json
  {
    "analytics": {
      "totalSent": 15420,
      "totalDelivered": 14850,
      "totalRead": 12500,
      "deliveryRate": 96.3,
      "readRate": 81.1,
      "byType": {
        "ride_request": { "sent": 8500, "delivered": 8200, "read": 7100 },
        "ride_completed": { "sent": 4200, "delivered": 4050, "read": 3800 }
      },
      "byChannel": {
        "push": { "sent": 12400, "delivered": 12000, "read": 10500 },
        "email": { "sent": 8500, "delivered": 8100, "read": 7200 },
        "sms": { "sent": 1200, "delivered": 1180, "read": 1100 }
      }
    }
  }
  ```

---

## Authentication & Authorization

All admin endpoints require authentication using JWT tokens obtained from `/admin/auth/login`. The token must be included in the `Authorization` header as `Bearer <token>`.

### Permission Requirements

Each endpoint requires specific permissions that are validated by the `PermissionsGuard`. The available permissions include:

- `users:read` - Read user data
- `users:write` - Modify user data
- `users:suspend` - Suspend/activate users
- `drivers:read` - Read driver data
- `drivers:write` - Modify driver data
- `drivers:suspend` - Suspend drivers
- `drivers:verify` - Verify driver documents
- `vehicles:read` - Read vehicle data
- `vehicles:write` - Modify vehicle data
- `vehicles:verify` - Verify vehicle documents
- `vehicle-types:read` - Read vehicle types
- `vehicle-types:write` - Modify vehicle types
- `payments:read` - Read payment data
- `payments:write` - Modify payment data
- `payments:verify` - Verify payment references
- `rides:read` - Read ride data
- `rides:write` - Modify ride data
- `rides:cancel` - Cancel rides
- `rides:reassign` - Reassign rides
- `analytics:read` - View analytics and reports
- `reports:export` - Export reports
- `reports:generate` - Generate reports
- `geography:read` - Read geography data
- `geography:write` - Modify geography data
- `system:config:read` - Read system configuration
- `system:config:write` - Modify system configuration

### Error Responses

All endpoints follow consistent error response formats:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting

Admin endpoints are protected by rate limiting to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General admin endpoints: 100 requests per minute
- Bulk operations: 10 requests per minute

---

## Data Export

Several endpoints support data export in multiple formats:
- CSV - For spreadsheet analysis
- Excel (.xlsx) - For detailed reporting
- PDF - For formal reports and documentation

Export endpoints return file download responses with appropriate headers.
