# API Documentation

This document provides a detailed overview of all the API endpoints available in the application.

---

## 1. User Management

### `POST /api/user`

Creates a new user record in the database after they have successfully signed up via Clerk.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_2abc123def456"
}
```

**Responses:**
- `201 Created`: User created successfully.
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "clerk_id": "user_2abc123def456"
      }
    ]
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

---

## 2. Driver Management

### `GET /api/driver`

Retrieves a list of all drivers from the database.

**Responses:**
- `200 OK`: Returns an array of driver objects.
  ```json
  {
    "data": [
      {
        "id": 1,
        "first_name": "Alex",
        "last_name": "Rodriguez",
        "car_model": "Toyota Camry",
        // ... other driver fields
      }
    ]
  }
  ```
- `500 Internal Server Error`: Database error.

### `POST /api/driver/register`

Registers a new driver in the system.

**Request Body:**
```json
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

**Responses:**
- `201 Created`: Driver created successfully.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

### `POST /api/driver/documents`

Uploads a verification document for a driver.

**Request Body:**
```json
{
  "driverId": 1,
  "documentType": "license",
  "documentUrl": "https://example.com/license.pdf"
}
```

**Responses:**
- `201 Created`: Document uploaded successfully.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

### `PUT /api/driver/{driverId}/status`

Updates a driver's availability status.

**Path Parameters:**
- `driverId`: The unique ID of the driver.

**Request Body:**
```json
{
  "status": "online"
}
```

**Responses:**
- `200 OK`: Status updated successfully.
- `400 Bad Request`: Missing or invalid status.
- `404 Not Found`: Driver not found.
- `500 Internal Server Error`: Database error.

### `GET /api/driver/ride-requests`

Fetches all available ride requests for an online driver.

**Responses:**
- `200 OK`: Returns an array of available ride requests.
  ```json
  {
    "data": [
      {
        "ride_id": 3,
        "origin_address": "555 5th Ave, New York, NY",
        "destination_address": "888 Madison Ave, New York, NY",
        "fare_price": "22.50",
        "tier_name": "Premium",
        // ... other ride fields
      }
    ]
  }
  ```
- `500 Internal Server Error`: Database error.

---

## 3. Ride Management

### `POST /api/ride/create`

Creates a new ride record.

**Request Body:**
```json
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
  "user_id": "user_2abc123def456"
}
```

**Responses:**
- `201 Created`: Ride created successfully.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

### `GET /api/ride/{id}`

Retrieves the ride history for a specific user.

**Path Parameters:**
- `id`: The Clerk ID of the user (`user_...`).

**Responses:**
- `200 OK`: Returns an array of the user's past rides.
- `400 Bad Request`: User ID is missing.
- `500 Internal Server Error`: Database error.

### `POST /api/ride/schedule`

Schedules a ride for a future date and time.

**Request Body:**
```json
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

**Responses:**
- `201 Created`: Ride scheduled successfully.
- `400 Bad Request`: Missing fields or invalid tier ID.
- `500 Internal Server Error`: Database error.

### `GET /api/ride/estimate`

Provides a fare estimate based on route and ride tier.

**Query Parameters:**
- `tierId`: The ID of the `ride_tier`.
- `minutes`: Estimated duration of the ride.
- `miles`: Estimated distance of the ride.

**Example URL:** `/api/ride/estimate?tierId=1&minutes=20&miles=5`

**Responses:**
- `200 OK`: Returns the fare calculation.
  ```json
  {
    "data": {
      "tier": "Economy",
      "baseFare": 2.5,
      "perMinuteRate": 0.25,
      "perMileRate": 1.25,
      "estimatedMinutes": 20,
      "estimatedMiles": 5,
      "totalFare": 13.75
    }
  }
  ```
- `400 Bad Request`: Missing required parameters.
- `500 Internal Server Error`: Database error.

### `POST /api/ride/{rideId}/accept`

Allows a driver to accept an available ride request.

**Path Parameters:**
- `rideId`: The unique ID of the ride.

**Request Body:**
```json
{
  "driverId": 1
}
```

**Responses:**
- `200 OK`: Ride accepted successfully.
- `400 Bad Request`: Missing fields.
- `404 Not Found`: Ride is not available or doesn't exist.
- `409 Conflict`: Ride was already accepted by another driver.
- `500 Internal Server Error`: Database error.

### `POST /api/ride/{rideId}/rate`

Submits a rating for a completed ride.

**Path Parameters:**
- `rideId`: The unique ID of the ride.

**Request Body:**
```json
{
  "ratedByClerkId": "user_2abc123def456",
  "ratedClerkId": "driver_clerk_id_1",
  "ratingValue": 5,
  "comment": "Great ride!"
}
```

**Responses:**
- `201 Created`: Rating submitted successfully.
- `400 Bad Request`: Missing fields or invalid rating value.
- `404 Not Found`: Ride not found.
- `500 Internal Server Error`: Database error.

---

## 4. Wallet & Promotions

### `GET /api/user/wallet`

Retrieves a user's wallet balance and transaction history. Creates a wallet if one doesn't exist.

**Query Parameters:**
- `userId`: The Clerk ID of the user.

**Example URL:** `/api/user/wallet?userId=user_2abc123def456`

**Responses:**
- `200 OK`: Returns wallet and transaction data.
- `400 Bad Request`: User ID is missing.
- `500 Internal Server Error`: Database error.

### `POST /api/user/wallet`

Adds funds to a user's wallet.

**Request Body:**
```json
{
  "userClerkId": "user_2abc123def456",
  "amount": 50.00,
  "description": "Wallet top-up"
}
```

**Responses:**
- `200 OK`: Funds added successfully.
- `400 Bad Request`: Missing fields.
- `500 Internal Server Error`: Database error.

### `POST /api/promo/apply`

Applies a promo code and calculates the discount.

**Request Body:**
```json
{
  "promoCode": "WELCOME10",
  "rideAmount": 25.00
}
```

**Responses:**
- `200 OK`: Returns discount details.
  ```json
  {
    "data": {
      "promoCode": "WELCOME10",
      "discountAmount": 2.5,
      "discountPercentage": 10,
      "originalAmount": 25.00,
      "finalAmount": 22.50
    }
  }
  ```
- `400 Bad Request`: Missing fields or invalid promo code.
- `500 Internal Server Error`: Database error.

---

## 5. Safety & Communication

### `GET /api/user/emergency-contacts`

Retrieves a user's emergency contacts.

**Query Parameters:**
- `userId`: The Clerk ID of the user.

**Example URL:** `/api/user/emergency-contacts?userId=user_2abc123def456`

**Responses:**
- `200 OK`: Returns an array of contacts.
- `400 Bad Request`: User ID is missing.
- `500 Internal Server Error`: Database error.

### `POST /api/user/emergency-contacts`

Adds a new emergency contact for a user.

**Request Body:**
```json
{
  "userClerkId": "user_2abc123def456",
  "contactName": "Jane Doe",
  "contactPhone": "+15551234567"
}
```

**Responses:**
- `201 Created`: Contact added successfully.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

### `GET /api/chat/{rideId}/messages`

Retrieves the chat history for a specific ride.

**Path Parameters:**
- `rideId`: The unique ID of the ride.

**Responses:**
- `200 OK`: Returns an array of chat messages.
- `400 Bad Request`: Ride ID is missing.
- `500 Internal Server Error`: Database error.

### `POST /api/chat/{rideId}/messages`

Sends a new message in the chat for a ride.

**Path Parameters:**
- `rideId`: The unique ID of the ride.

**Request Body:**
```json
{
  "senderClerkId": "user_2abc123def456",
  "messageText": "I'll be there in 2 minutes."
}
```

**Responses:**
- `201 Created`: Message sent successfully.
- `400 Bad Request`: Missing fields.
- `500 Internal Server Error`: Database error.

### `POST /api/safety/sos`

Triggers an emergency SOS alert. (Note: This is a simulation endpoint).

**Request Body:**
```json
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

**Responses:**
- `200 OK`: Alert sent successfully.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Database error.

---

## 6. Payments (Stripe)

### `POST /api/(stripe)/create`

Creates a Stripe payment intent.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "amount": "15.75"
}
```

**Responses:**
- `200 OK`: Returns payment intent details.
  ```json
  {
    "paymentIntent": { ... },
    "ephemeralKey": { ... },
    "customer": "cus_..."
  }
  ```
- `400 Bad Request`: Missing required fields.

### `POST /api/(stripe)/pay`

Confirms a Stripe payment.

**Request Body:**
```json
{
  "payment_method_id": "pm_...",
  "payment_intent_id": "pi_...",
  "customer_id": "cus_..."
}
```

**Responses:**
- `200 OK`: Payment successful.
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: Stripe error.
