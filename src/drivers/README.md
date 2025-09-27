# 🚗 Drivers Module Documentation

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
</p>

<p align="center">
  Comprehensive driver management system for ride-sharing and delivery platform
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
  - [Driver Search & Discovery](#driver-search--discovery)
  - [Driver Registration](#driver-registration)
  - [Document Management](#document-management)
  - [Status Management](#status-management)
  - [Ride Management](#ride-management)
  - [Profile Management](#profile-management)
  - [Vehicle Management](#vehicle-management)
  - [Payment Methods](#payment-methods)
  - [Driver Verification](#driver-verification)
  - [Work Zone Management](#work-zone-management)
  - [Driver Payments](#driver-payments)
  - [Statistics & Analytics](#statistics--analytics)
  - [Bulk Operations](#bulk-operations)
- [Data Transfer Objects (DTOs)](#-data-transfer-objects-dtos)
- [Security & Permissions](#-security--permissions)
- [Error Handling](#-error-handling)
- [Examples](#-examples)
- [Database Schema](#-database-schema)

---

## 📖 Overview

The Drivers Module is a comprehensive system for managing drivers (conductors) in a ride-sharing and delivery platform. It provides full CRUD operations, verification workflows, vehicle management, payment processing, and real-time status tracking.

### Key Features

- **Driver Registration & Verification**: Complete onboarding process with document upload
- **Vehicle Management**: Multiple vehicles per driver with document verification
- **Payment Methods**: Flexible payment method management for earnings
- **Work Zone Assignment**: Geographic zone assignment for ride distribution
- **Real-time Status Tracking**: Online/offline status with location updates
- **Comprehensive Analytics**: Driver performance metrics and statistics
- **Bulk Operations**: Administrative tools for managing multiple drivers
- **Advanced Search & Filtering**: Powerful search capabilities with pagination

### Business Logic

- Driver verification workflow with document approval/rejection
- Automatic ride assignment based on location and availability
- Earnings calculation and payment processing
- Performance tracking with ratings and completion rates
- Zone-based ride distribution for operational efficiency

---

## 🏗️ Architecture

### File Structure

```
src/drivers/
├── drivers.controller.ts      # Main API controller
├── drivers.service.ts         # Business logic layer
├── drivers.module.ts          # Module configuration
├── guards/
│   └── driver.guard.ts        # Driver-specific authorization
└── dto/                       # Data Transfer Objects
    ├── register-driver.dto.ts
    ├── search-drivers.dto.ts
    ├── update-driver-status.dto.ts
    ├── create-vehicle.dto.ts
    ├── update-driver-profile.dto.ts
    ├── driver-profile.dto.ts
    ├── driver-statistics.dto.ts
    └── ...
```

### Dependencies

- **PrismaService**: Database operations
- **NotificationsService**: Push notifications and alerts
- **Auth Guards**: JWT authentication and authorization
- **Validation Pipes**: Request validation and transformation

### Design Patterns

- **Repository Pattern**: Data access through Prisma ORM
- **DTO Pattern**: Structured data transfer objects
- **Guard Pattern**: Route protection and authorization
- **Service Layer**: Business logic separation

---

## 🚀 API Endpoints

All endpoints are prefixed with `/api/driver` and require appropriate authentication.

### Driver Search & Discovery

#### 1. Search Drivers
```http
GET /api/driver
```

**Description**: Advanced driver search with filtering, sorting, and pagination.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `firstName` (string): Filter by first name (partial match)
- `lastName` (string): Filter by last name (partial match)
- `carModel` (string): Filter by vehicle model
- `licensePlate` (string): Filter by license plate
- `status` (enum): Driver status - `online`, `offline`, `busy`, `unavailable`
- `verificationStatus` (enum): Verification status - `pending`, `approved`, `rejected`, `under_review`
- `canDoDeliveries` (boolean): Filter delivery-capable drivers
- `carSeats` (number): Filter by vehicle seating capacity
- `vehicleTypeId` (number): Filter by vehicle type ID
- `sortBy` (enum): Sort field - `id`, `firstName`, `lastName`, `status`, `verificationStatus`, `createdAt`, `updatedAt`
- `sortOrder` (enum): Sort direction - `asc`, `desc`
- `createdFrom` (date): Filter by creation date from (YYYY-MM-DD)
- `createdTo` (date): Filter by creation date to (YYYY-MM-DD)

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "profileImageUrl": "https://example.com/profile.jpg",
      "status": "online",
      "verificationStatus": "approved",
      "canDoDeliveries": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "vehicleType": {
        "id": 1,
        "name": "car",
        "displayName": "Car"
      },
      "_count": {
        "rides": 150,
        "deliveryOrders": 25
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "applied": ["status", "verificationStatus"],
    "searchTerm": "John"
  }
}
```

#### 2. Get Driver by ID
```http
GET /api/driver/id/:id
```

**Description**: Retrieve complete driver information by ID.

**Path Parameters**:
- `id` (number): Driver unique identifier

**Response (200)**:
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "status": "online",
  "verificationStatus": "approved",
  "canDoDeliveries": true,
  "vehicles": [
    {
      "id": 1,
      "make": "Toyota",
      "model": "Camry",
      "licensePlate": "ABC-123",
      "seatingCapacity": 4,
      "status": "active",
      "isDefault": true
    }
  ]
}
```

### Driver Registration

#### 3. Register Driver
```http
POST /api/driver/register
```

**Description**: Register a new driver in the system.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "profileImageUrl": "https://example.com/profile.jpg"
}
```

**Response (201)**:
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "status": "offline",
  "verificationStatus": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Document Management

#### 4. Upload Document
```http
POST /api/driver/documents
```

**Description**: Upload verification documents for a driver.

**Request Body**:
```json
{
  "driverId": 1,
  "documentType": "license",
  "documentUrl": "https://storage.example.com/docs/license.jpg"
}
```

**Response (201)**:
```json
{
  "id": 1,
  "driverId": 1,
  "documentType": "license",
  "documentUrl": "https://storage.example.com/docs/license.jpg",
  "verificationStatus": "pending",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

### Status Management

#### 5. Update Driver Status (Admin)
```http
PUT /api/driver/:driverId/status
```

**Description**: Update driver availability status (admin only).

**Path Parameters**:
- `driverId` (number): Driver ID

**Request Body**:
```json
{
  "status": "suspended",
  "reason": "Driver requested suspension",
  "notes": "Will return on January 15th",
  "suspensionEndDate": "2024-01-15"
}
```

**Response (200)**:
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "status": "suspended",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Ride Management

#### 6. Get Ride Requests
```http
GET /api/driver/ride-requests
```

**Description**: Get available ride requests for online drivers.

**Response (200)**:
```json
{
  "data": [
    {
      "ride_id": 123,
      "origin_address": "123 Main St, City",
      "destination_address": "456 Oak Ave, City",
      "fare_price": 25.50,
      "tier_name": "UberX"
    }
  ]
}
```

#### 7. Get Driver Rides History
```http
GET /api/driver/:driverId/rides
```

**Description**: Get complete ride history for a driver.

**Path Parameters**:
- `driverId` (number): Driver ID

**Query Parameters**:
- `status` (string): Filter by ride status
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter
- `limit` (number): Results limit
- `offset` (number): Results offset

**Response (200)**:
```json
{
  "data": [
    {
      "rideId": 123,
      "originAddress": "123 Main St",
      "destinationAddress": "456 Oak Ave",
      "farePrice": 25.50,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "name": "Jane Smith",
        "clerkId": "user_123"
      }
    }
  ],
  "summary": {
    "totalRides": 150,
    "totalEarnings": 3750.00,
    "averageRating": 4.8,
    "completedRides": 145,
    "cancelledRides": 5
  }
}
```

### Profile Management

#### 8. Get Driver Profile
```http
GET /api/driver/profile/:id
```

**Description**: Get complete driver profile with statistics and related data.

**Path Parameters**:
- `id` (number): Driver ID

**Response (200)**:
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "status": "online",
  "verificationStatus": "approved",
  "canDoDeliveries": true,
  "averageRating": 4.8,
  "totalRides": 150,
  "totalEarnings": 3750.00,
  "vehicles": [
    {
      "id": 1,
      "make": "Toyota",
      "model": "Camry",
      "licensePlate": "ABC-123",
      "isDefault": true
    }
  ],
  "paymentMethods": [
    {
      "id": 1,
      "methodType": "bank_transfer",
      "bankName": "Bank of America",
      "isDefault": true
    }
  ]
}
```

#### 9. Update Driver Profile
```http
PUT /api/driver/profile/:id
```

**Description**: Update driver personal and professional information.

**Path Parameters**:
- `id` (number): Driver ID

**Request Body**:
```json
{
  "phone": "+1987654321",
  "address": "123 New Address St",
  "city": "New City",
  "bankAccountNumber": "1234567890",
  "bankName": "New Bank"
}
```

### Vehicle Management

#### 10. Create Vehicle
```http
POST /api/driver/:driverId/vehicles
```

**Description**: Add a new vehicle to a driver profile.

**Path Parameters**:
- `driverId` (number): Driver ID

**Request Body**:
```json
{
  "vehicleTypeId": 1,
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "licensePlate": "ABC-123",
  "seatingCapacity": 4,
  "hasAC": true,
  "fuelType": "gasoline",
  "insuranceProvider": "Geico",
  "frontImageUrl": "https://example.com/front.jpg"
}
```

#### 11. Get Driver Vehicles
```http
GET /api/driver/:driverId/vehicles
```

**Description**: Retrieve all vehicles associated with a driver.

#### 12. Update Vehicle
```http
PUT /api/driver/vehicles/:vehicleId
```

**Description**: Update vehicle information.

**Path Parameters**:
- `vehicleId` (number): Vehicle ID

#### 13. Delete Vehicle
```http
DELETE /api/driver/vehicles/:vehicleId
```

**Description**: Remove a vehicle from driver profile.

#### 14. Upload Vehicle Document
```http
POST /api/driver/vehicles/documents
```

**Description**: Upload verification documents for a vehicle.

### Payment Methods

#### 15. Create Payment Method
```http
POST /api/driver/:driverId/payment-methods
```

**Description**: Add a payment method for driver earnings.

#### 16. Get Driver Payment Methods
```http
GET /api/driver/:driverId/payment-methods
```

**Description**: Retrieve all payment methods for a driver.

#### 17. Update Payment Method
```http
PUT /api/driver/payment-methods/:methodId
```

#### 18. Delete Payment Method
```http
DELETE /api/driver/payment-methods/:methodId
```

### Driver Verification

#### 19. Update Driver Verification Status
```http
PUT /api/driver/:driverId/verification
```

**Description**: Approve, reject, or request additional documents for driver verification.

### Work Zone Management

#### 20. Assign Work Zone
```http
POST /api/driver/:driverId/work-zones
```

**Description**: Assign a work zone to a driver for ride assignments.

#### 21. Remove Work Zone
```http
DELETE /api/driver/:driverId/work-zones/:zoneId
```

### Driver Payments

#### 22. Create Driver Payment
```http
POST /api/driver/:driverId/payments
```

**Description**: Record a payment or earnings for a driver.

#### 23. Get Driver Payments
```http
GET /api/driver/:driverId/payments
```

**Description**: Retrieve payment history for a driver.

#### 24. Process Driver Payment
```http
PUT /api/driver/payments/:paymentId/process
```

### Statistics & Analytics

#### 25. Get Driver Statistics
```http
GET /api/driver/:driverId/statistics
```

**Description**: Retrieve comprehensive statistics and metrics for a driver.

#### 26. Get Drivers Statistics Summary
```http
GET /api/driver/statistics/summary
```

**Description**: Retrieve overall statistics for all drivers.

### Bulk Operations

#### 27. Bulk Verify Drivers
```http
POST /api/driver/bulk/verify
```

**Description**: Verify multiple drivers at once.

#### 28. Bulk Update Status
```http
POST /api/driver/bulk/status
```

**Description**: Update status for multiple drivers at once.

---

## 📋 Data Transfer Objects (DTOs)

### SearchDriversDto
Advanced search parameters for driver filtering.

```typescript
export class SearchDriversDto {
  // Pagination
  page?: number = 1;
  limit?: number = 10;

  // Filters
  firstName?: string;
  lastName?: string;
  carModel?: string;
  licensePlate?: string;
  status?: 'online' | 'offline' | 'busy' | 'unavailable';
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'under_review';
  canDoDeliveries?: boolean;
  carSeats?: number;
  vehicleTypeId?: number;

  // Sorting
  sortBy?: 'id' | 'firstName' | 'lastName' | 'status' | 'verificationStatus' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Date filters
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
}
```

### RegisterDriverDto
Driver registration data.

```typescript
export class RegisterDriverDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
}
```

### UpdateDriverStatusDto
Driver status update information.

```typescript
export class UpdateDriverStatusDto {
  status: string;
  reason?: string;
  notes?: string;
  suspensionEndDate?: string;
}
```

### DriverProfileDto
Complete driver profile response.

```typescript
export class DriverProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  verificationStatus: string;
  canDoDeliveries: boolean;
  averageRating: number;
  totalRides: number;
  totalEarnings: number;
  vehicles: Vehicle[];
  paymentMethods: PaymentMethod[];
  documents: Document[];
  recentRides: Ride[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔐 Security & Permissions

### Authentication
- **JWT Token Required**: All endpoints require valid JWT authentication
- **Driver Guard**: Specific endpoints require driver role verification
- **Admin Permissions**: Administrative endpoints require admin role

### Authorization Levels

#### Public Endpoints
- None - All endpoints require authentication

#### Driver Endpoints
- `GET /api/driver/profile/:id` - Driver can only access their own profile
- `PUT /api/driver/profile/:id` - Driver can only update their own profile
- `GET /api/driver/ride-requests` - Requires driver role

#### Admin Endpoints
- `PUT /api/driver/:driverId/status` - Admin only
- `PUT /api/driver/:driverId/verification` - Admin only
- `POST /api/driver/bulk/*` - Admin only

### Data Validation
- **Input Sanitization**: All inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries via Prisma
- **XSS Protection**: Input validation and output encoding

### Audit Logging
- **Critical Operations**: All verification, status changes, and payments are logged
- **Admin Actions**: Administrative operations include user tracking
- **Data Changes**: Profile and vehicle updates are tracked

---

## 🚨 Error Handling

### HTTP Status Codes

#### 2xx Success
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

#### 4xx Client Errors
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors

#### 5xx Server Errors
- `500 Internal Server Error` - Unexpected server error

### Common Error Responses

#### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": [
    "firstName must be longer than or equal to 2 characters",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

#### Not Found Error (404)
```json
{
  "statusCode": 404,
  "message": "Driver not found",
  "error": "Not Found"
}
```

#### Forbidden Error (403)
```json
{
  "statusCode": 403,
  "message": "Driver can only access their own profile",
  "error": "Forbidden"
}
```

---

## 💡 Examples

### Register New Driver
```bash
curl -X POST http://localhost:3000/api/driver/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  }'
```

### Search Drivers with Filters
```bash
curl "http://localhost:3000/api/driver?page=1&limit=10&status=online&canDoDeliveries=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Driver Profile
```bash
curl -X PUT http://localhost:3000/api/driver/profile/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phone": "+1987654321",
    "bankAccountNumber": "1234567890",
    "bankName": "Bank of America"
  }'
```

### Add Vehicle to Driver
```bash
curl -X POST http://localhost:3000/api/driver/1/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "vehicleTypeId": 1,
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "licensePlate": "ABC-123",
    "seatingCapacity": 4
  }'
```

### Admin: Update Driver Status
```bash
curl -X PUT http://localhost:3000/api/driver/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "status": "suspended",
    "reason": "Driver requested suspension",
    "suspensionEndDate": "2024-01-15"
  }'
```

---

## 🗄️ Database Schema

### Driver Table
```sql
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  profile_image_url VARCHAR(255),
  date_of_birth TIMESTAMP,
  gender VARCHAR(20),
  status VARCHAR(20) DEFAULT 'offline',
  verification_status VARCHAR(20) DEFAULT 'pending',
  can_do_deliveries BOOLEAN DEFAULT false,
  current_latitude DECIMAL(9,6),
  current_longitude DECIMAL(9,6),
  last_location_update TIMESTAMP,
  location_accuracy DECIMAL(5,2),
  is_location_active BOOLEAN DEFAULT false,
  preferred_work_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  work_schedule JSONB,
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  tax_id VARCHAR(20),
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  suspension_reason TEXT,
  suspension_end_date TIMESTAMP,
  last_status_change TIMESTAMP,
  status_changed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  last_active TIMESTAMP
);
```

### Vehicle Table
```sql
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_type_id INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(17) UNIQUE,
  seating_capacity INTEGER DEFAULT 4,
  has_ac BOOLEAN DEFAULT true,
  has_gps BOOLEAN DEFAULT true,
  fuel_type VARCHAR(20) DEFAULT 'gasoline',
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  insurance_expiry_date TIMESTAMP,
  front_image_url VARCHAR(255),
  side_image_url VARCHAR(255),
  back_image_url VARCHAR(255),
  interior_image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  verification_status VARCHAR(20) DEFAULT 'pending',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Driver Payment Methods Table
```sql
CREATE TABLE driver_payment_methods (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  method_type VARCHAR(20) NOT NULL,
  account_number VARCHAR(50),
  account_name VARCHAR(100),
  bank_name VARCHAR(100),
  routing_number VARCHAR(20),
  swift_code VARCHAR(20),
  wallet_address VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Related Tables
- `driver_documents` - Driver verification documents
- `driver_location_history` - Location tracking
- `driver_payments` - Payment records
- `driver_verification_history` - Verification audit trail
- `driver_work_zones` - Work zone assignments
- `vehicle_documents` - Vehicle verification documents
- `vehicle_change_history` - Vehicle change audit

---

## 📝 Notes

### Business Rules
- Drivers must be verified before accepting rides
- Only one default vehicle per driver
- Payment methods must be verified before use
- Work zones affect ride assignment algorithms
- Status changes trigger real-time notifications

### Performance Considerations
- Search endpoints use database indexes for optimal performance
- Pagination prevents large result sets
- Location-based queries use geospatial optimizations
- Caching implemented for frequently accessed data

### Integration Points
- **Notifications Service**: Real-time alerts and push notifications
- **Ride Service**: Ride assignment and tracking
- **Payment Service**: Earnings processing and payouts
- **Admin Panel**: Driver management interface

---

<p align="center">
  <strong>🚗 Complete Driver Management System</strong><br>
  Built with NestJS, TypeScript, and PostgreSQL for enterprise-grade ride-sharing platforms
</p>
