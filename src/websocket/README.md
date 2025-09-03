# WebSocket Real-Time Communication

## Overview

The WebSocket module provides real-time communication capabilities for the Uber clone application using Socket.IO. It enables real-time features such as:

- Live driver location tracking
- Real-time chat between drivers and passengers
- Ride status updates
- Emergency SOS alerts
- Driver availability status updates

## Connection

Connect to the WebSocket server at: `ws://your-server/uber-realtime`

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/uber-realtime', {
  transports: ['websocket', 'polling']
});
```

## Events

### 1. Driver Location Updates

**Event:** `driver:location:update`

**Purpose:** Update driver's current location in real-time

**Payload:**
```typescript
{
  driverId: number;     // Driver's unique ID
  location: {
    lat: number;        // Latitude coordinate
    lng: number;        // Longitude coordinate
  };
  rideId?: number;      // Optional: Active ride ID
}
```

**Response:** `{ status: 'success', message: 'Location updated' }`

**Emitted Events:**
- `driver:location:updated` (to ride room if rideId provided)

### 2. Join Ride Tracking

**Event:** `ride:join`

**Purpose:** Join a ride room for real-time updates

**Payload:**
```typescript
{
  rideId: number;     // Ride to join
  userId: string;     // User's Clerk ID
}
```

**Response:** `{ status: 'success', message: 'Joined ride tracking' }`

### 3. Ride Acceptance

**Event:** `ride:accept`

**Purpose:** Driver accepts an available ride request

**Payload:**
```typescript
{
  rideId: number;    // Ride being accepted
  driverId: number;  // Accepting driver's ID
  userId: string;    // Passenger's Clerk ID
}
```

**Response:** `{ status: 'success', message: 'Ride accepted' }`

**Emitted Events:**
- `ride:accepted` (to ride room)
- Push/SMS notifications sent to passenger

### 4. Chat Messages

**Event:** `chat:message`

**Purpose:** Send chat messages in ride or order conversations

**Payload:**
```typescript
{
  rideId?: number;   // For ride chat (mutually exclusive with orderId)
  orderId?: number;  // For delivery order chat
  senderId: string;  // Sender's Clerk ID
  message: string;   // Message content
}
```

**Response:** `{ status: 'success', message: 'Message sent' }`

**Emitted Events:**
- `chat:new-message` (to ride/order room)

### 5. Driver Status Updates

**Event:** `driver:status:update`

**Purpose:** Update driver's availability status

**Payload:**
```typescript
{
  driverId: number;  // Driver's ID
  status: string;    // New status: 'online' | 'offline' | 'busy' | 'away'
}
```

**Response:** `{ status: 'success', message: 'Status updated' }`

**Emitted Events:**
- `driver:status:changed` (broadcast to all clients)

### 6. Emergency SOS

**Event:** `emergency:sos`

**Purpose:** Trigger emergency alert during ride

**Payload:**
```typescript
{
  userId: string;    // User's Clerk ID
  rideId: number;    // Ride ID
  location: {
    lat: number;     // Latitude
    lng: number;     // Longitude
  };
  message: string;   // Emergency description
}
```

**Response:** `{ status: 'success', message: 'SOS alert sent' }`

**Emitted Events:**
- `emergency:sos-triggered` (to ride room)
- `emergency:sos-alert` (to emergency services room)
- Push/SMS notifications sent

### 7. Ride Completion

**Event:** `ride:complete`

**Purpose:** Mark ride as completed

**Payload:**
```typescript
{
  rideId: number;    // Completed ride ID
  driverId: number;  // Driver's ID
  userId: string;    // Passenger's Clerk ID
  fare: number;      // Final fare amount
}
```

**Response:** `{ status: 'success', message: 'Ride completed' }`

**Emitted Events:**
- `ride:completed` (to ride room)
- Push/SMS notifications sent to passenger

## Room Structure

- **Ride Rooms:** `ride-{rideId}` - For ride-specific communication
- **Order Rooms:** `order-{orderId}` - For delivery order communication
- **Emergency Services:** `emergency-services` - For emergency alerts

## Error Handling

All events return a standardized response format:

```typescript
{
  status: 'success' | 'error';
  message: string;
  data?: any;  // Optional additional data
}
```

## Security Notes

- All events require proper authentication
- Users can only join rooms for rides/orders they're authorized for
- Emergency events trigger immediate notifications to authorities
- Location data is validated for coordinate ranges

## Usage Examples

### JavaScript Client

```javascript
// Connect and join ride
socket.emit('ride:join', { rideId: 123, userId: 'user_123' });

// Send message
socket.emit('chat:message', {
  rideId: 123,
  senderId: 'user_123',
  message: 'On my way!'
});

// Listen for updates
socket.on('driver:location:updated', (data) => {
  console.log('Driver location:', data);
});

socket.on('chat:new-message', (message) => {
  console.log('New message:', message);
});
```

### React Native Client

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/uber-realtime');

// Handle connection
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

// Handle ride updates
socket.on('ride:accepted', (data) => {
  // Update UI with accepted ride
  updateRideStatus('accepted', data);
});
```
