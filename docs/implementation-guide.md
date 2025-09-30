# 🚀 Uber Clone API - Implementation Guide

## 📋 Overview

This document provides a comprehensive guide to the implemented Uber Clone API with real-time communication systems. All endpoints and features have been successfully implemented and tested.

---

## 🗄️ Database Schema

### Core Tables Implemented

#### Users Management
```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  clerk_id VARCHAR(50) UNIQUE
)
```

#### Drivers & Vehicles
```sql
drivers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  profile_image_url TEXT,
  car_image_url TEXT,
  car_model VARCHAR(100),
  license_plate VARCHAR(20) UNIQUE,
  car_seats INT,
  status VARCHAR(20) DEFAULT 'offline',
  verification_status VARCHAR(20) DEFAULT 'pending',
  can_do_deliveries BOOLEAN DEFAULT false
)
```

#### Rides & Pricing
```sql
rides (
  ride_id SERIAL PRIMARY KEY,
  origin_address VARCHAR(255),
  destination_address VARCHAR(255),
  origin_latitude DECIMAL(9,6),
  origin_longitude DECIMAL(9,6),
  destination_latitude DECIMAL(9,6),
  destination_longitude DECIMAL(9,6),
  ride_time INT,
  fare_price DECIMAL(10,2),
  payment_status VARCHAR(20),
  driver_id INT REFERENCES drivers(id),
  user_id VARCHAR(100),
  tier_id INT REFERENCES ride_tiers(id),
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

ride_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  base_fare DECIMAL(10,2),
  per_minute_rate DECIMAL(10,2),
  per_mile_rate DECIMAL(10,2),
  image_url TEXT
)
```

#### Payments & Wallet
```sql
wallets (
  id SERIAL PRIMARY KEY,
  user_clerk_id VARCHAR(50) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

wallet_transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES wallets(id),
  amount DECIMAL(10,2),
  transaction_type VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Promotions
```sql
promotions (
  id SERIAL PRIMARY KEY,
  promo_code VARCHAR(50) UNIQUE,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true
)
```

#### Communication & Safety
```sql
chat_messages (
  id SERIAL PRIMARY KEY,
  ride_id INT REFERENCES rides(ride_id),
  order_id INT REFERENCES delivery_orders(order_id),
  sender_clerk_id VARCHAR(50),
  message_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_clerk_id VARCHAR(50),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20)
)
```

---

## 🔗 API Endpoints

### 👥 User Management

#### Create User
```http
POST /api/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_2abc123def456"
}
```

#### Get User by Clerk ID
```http
GET /api/user/clerk/{clerkId}
```

#### Update User
```http
PUT /api/user/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated.email@example.com"
}
```

#### Get User Rides
```http
GET /api/user/{clerkId}/rides
```

#### Get User Delivery Orders
```http
GET /api/user/{clerkId}/orders
```

### 🚗 Driver Management

#### Get All Drivers
```http
GET /api/driver
```

#### Register Driver
```http
POST /api/driver/register
Content-Type: application/json

{
  "firstName": "Alex",
  "lastName": "Rodriguez",
  "email": "alex.r@example.com",
  "clerkId": "user_2driverclerkid",
  "carModel": "Toyota Camry",
  "licensePlate": "ABC-1234",
  "carSeats": 4,
  "profileImageUrl": "https://example.com/profile.jpg",
  "carImageUrl": "https://example.com/car.jpg"
}
```

#### Upload Driver Documents
```http
POST /api/driver/documents
Content-Type: application/json

{
  "driverId": 1,
  "documentType": "license",
  "documentUrl": "https://example.com/license.pdf"
}
```

#### Update Driver Status
```http
PUT /api/driver/{driverId}/status
Content-Type: application/json

{
  "status": "online"
}
```

#### Get Ride Requests
```http
GET /api/driver/ride-requests
```

### 🚕 Ride Management

#### Create Ride
```http
POST /api/ride/create
Content-Type: application/json

{
  "origin_address": "123 Main St, New York, NY",
  "destination_address": "456 Broadway, New York, NY",
  "origin_latitude": 40.7128,
  "origin_longitude": -74.0060,
  "destination_latitude": 40.7589,
  "destination_longitude": -73.9851,
  "ride_time": 25,
  "fare_price": 15.75,
  "payment_status": "completed",
  "driver_id": 1,
  "user_id": "user_2abc123def456",
  "tier_id": 1
}
```

#### Get User Ride History
```http
GET /api/ride/{userId}
```

#### Schedule Future Ride
```http
POST /api/ride/schedule
Content-Type: application/json

{
  "origin_address": "555 5th Ave, New York, NY",
  "destination_address": "888 Madison Ave, New York, NY",
  "origin_latitude": 40.7549,
  "origin_longitude": -73.9840,
  "destination_latitude": 40.7744,
  "destination_longitude": -73.9653,
  "ride_time": 30,
  "tier_id": 2,
  "scheduled_for": "2024-12-25T14:00:00Z",
  "user_id": "user_2ghi789jkl012"
}
```

#### Get Fare Estimate
```http
GET /api/ride/estimate?tierId=1&minutes=20&miles=5
```

#### Accept Ride (Driver)
```http
POST /api/ride/{rideId}/accept
Content-Type: application/json

{
  "driverId": 1
}
```

#### Rate Completed Ride
```http
POST /api/ride/{rideId}/rate
Content-Type: application/json

{
  "ratedByClerkId": "user_2abc123def456",
  "ratedClerkId": "driver_clerk_id_1",
  "ratingValue": 5,
  "comment": "Great ride!"
}
```

### 💰 Wallet Management

#### Get User Wallet
```http
GET /api/user/wallet?userId=user_2abc123def456
```

#### Add Funds to Wallet
```http
POST /api/user/wallet
Content-Type: application/json

{
  "userClerkId": "user_2abc123def456",
  "amount": 50.00,
  "description": "Wallet top-up"
}
```

### 🎫 Promotions

#### Apply Promo Code
```http
POST /api/promo/apply
Content-Type: application/json

{
  "promoCode": "WELCOME10",
  "rideAmount": 25.00
}
```

#### Get Active Promotions
```http
GET /api/promo/active
```

### 🆘 Safety & Emergency

#### Get Emergency Contacts
```http
GET /api/user/emergency-contacts?userId=user_2abc123def456
```

#### Add Emergency Contact
```http
POST /api/user/emergency-contacts
Content-Type: application/json

{
  "userClerkId": "user_2abc123def456",
  "contactName": "Jane Doe",
  "contactPhone": "+15551234567"
}
```

#### Send SOS Alert
```http
POST /api/safety/sos
Content-Type: application/json

{
  "userClerkId": "user_2abc123def456",
  "rideId": 1,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "emergencyType": "medical",
  "message": "I need help."
}
```

### 💬 Chat System

#### Get Ride Messages
```http
GET /api/chat/{rideId}/messages
```

#### Send Ride Message
```http
POST /api/chat/{rideId}/messages
Content-Type: application/json

{
  "senderClerkId": "user_2abc123def456",
  "messageText": "I'll be there in 2 minutes."
}
```

#### Get Order Messages
```http
GET /api/chat/order/{orderId}/messages
```

#### Send Order Message
```http
POST /api/chat/order/{orderId}/messages
Content-Type: application/json

{
  "senderClerkId": "user_2abc123def456",
  "messageText": "Order update."
}
```

### 💳 Stripe Payments

#### Create Payment Intent
```http
POST /api/stripe/create
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "amount": 15.75
}
```

#### Confirm Payment
```http
POST /api/stripe/pay
Content-Type: application/json

{
  "payment_method_id": "pm_...",
  "payment_intent_id": "pi_...",
  "customer_id": "cus_..."
}
```

#### Create Refund
```http
POST /api/stripe/refund
Content-Type: application/json

{
  "paymentIntentId": "pi_...",
  "amount": 15.75
}
```

---

## 🔌 Real-Time Communication

### WebSocket System

#### Connection
```javascript
const socket = io('http://localhost:3000/uber-realtime');
```

#### Driver Location Updates
```javascript
// Driver sends location
socket.emit('driver:location:update', {
  driverId: 1,
  location: { lat: 40.7128, lng: -74.0060 },
  rideId: 123
});

// Client receives updates
socket.on('driver:location:updated', (data) => {
  console.log('New location:', data.location);
});
```

#### Ride Management
```javascript
// Join ride tracking
socket.emit('ride:join', {
  rideId: 123,
  userId: 'user_456'
});

// Listen for ride events
socket.on('ride:accepted', (data) => {
  console.log('Ride accepted by driver:', data.driverId);
});
```

#### Chat System
```javascript
// Send message
socket.emit('chat:message', {
  rideId: 123,
  senderId: 'user_456',
  message: 'Hello driver!'
});

// Receive messages
socket.on('chat:new-message', (data) => {
  console.log(`${data.senderId}: ${data.message}`);
});
```

#### Emergency System
```javascript
// Send SOS
socket.emit('emergency:sos', {
  userId: 'user_456',
  rideId: 123,
  location: { lat: 40.7128, lng: -74.0060 },
  message: 'Need help!'
});

// Receive emergency alerts
socket.on('emergency:sos-triggered', (data) => {
  console.log('Emergency alert:', data);
});
```

### Redis Pub/Sub System

#### Location Tracking
```javascript
// Update driver location
await redis.publish('driver:locations', {
  driverId: 1,
  location: { lat: 40.7128, lng: -74.0060 },
  timestamp: new Date(),
  rideId: 123
});
```

#### Ride Updates
```javascript
// Subscribe to ride updates
await redis.subscribe(`ride:${rideId}`);

// Publish ride updates
await redis.publish(`ride:${rideId}`, {
  type: 'location',
  data: { driverLocation: location },
  timestamp: new Date()
});
```

---

## 🧪 Testing Endpoints

### Health Checks
```bash
# WebSocket system health
GET /api/realtime/health/websocket

# Redis system health
GET /api/realtime/health/redis

# System comparison
GET /api/realtime/comparison
```

### Test Real-Time Features
```bash
# Test driver location via Redis
POST /api/realtime/test/driver-location

# Test ride subscription
POST /api/realtime/test/ride-subscribe

# Test emergency alert
POST /api/realtime/test/emergency-alert

# Get driver location
GET /api/realtime/driver/1/location
```

---

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uber_clone_db?schema=public"

# Stripe (Optional)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
PORT=3000
```

### Database Setup
```bash
# Reset database (if needed)
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### Start Application
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 📊 API Response Formats

### Success Response
```json
{
  "data": {
    // Response data
  },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 🚀 Access Points

- **API Base URL**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **WebSocket Endpoint**: ws://localhost:3000/uber-realtime
- **Test Client**: `test-websocket-client.html`

---

## 🎯 Quick Start

1. **Setup Database**: Configure PostgreSQL connection
2. **Run Migrations**: `npx prisma migrate dev --name init`
3. **Start App**: `npm run start:dev`
4. **Test API**: Visit http://localhost:3000/api
5. **Test WebSocket**: Open `test-websocket-client.html`

---

## 📚 Additional Documentation

- `README-API-Implementation.md` - Complete implementation details
- `README-ANALYSIS.md` - Project analysis and architecture
- `REALTIME-DOCUMENTATION.md` - Real-time systems guide
- `DATABASE-SETUP.md` - Database configuration guide

---

**🎉 All endpoints and real-time features are fully implemented and ready for use!**
