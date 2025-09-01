# 🚀 **Uber Clone - Real-Time Communication Systems**

## 📡 **Two Real-Time Systems Implemented**

This implementation provides **two different approaches** for real-time communication, allowing you to compare and choose the best solution for your use case.

---

## 🔌 **1. WebSocket System**

### **Architecture**
- **Framework**: Socket.IO with NestJS WebSocket Gateway
- **Connection**: Persistent WebSocket connections
- **Use Case**: Real-time bidirectional communication

### **Features**
✅ **Persistent Connections** - Clients stay connected continuously
✅ **Low Latency** - Instant message delivery
✅ **Bidirectional** - Server can push updates to clients
✅ **Auto-reconnection** - Handles network issues gracefully
✅ **Room-based** - Users join specific ride rooms
✅ **Event-driven** - Subscribe to specific events

### **WebSocket Events**

#### **Driver Events**
```javascript
// Driver location updates
socket.emit('driver:location:update', {
  driverId: 1,
  location: { lat: 40.7128, lng: -74.0060 },
  rideId: 123
});

// Driver status changes
socket.emit('driver:status:update', {
  driverId: 1,
  status: 'online' // online, offline, in_ride
});
```

#### **Ride Events**
```javascript
// User joins ride tracking
socket.emit('ride:join', {
  rideId: 123,
  userId: 'user_456'
});

// Driver accepts ride
socket.emit('ride:accept', {
  rideId: 123,
  driverId: 1
});

// Ride completion
socket.emit('ride:complete', {
  rideId: 123,
  driverId: 1
});
```

#### **Communication Events**
```javascript
// Send chat message
socket.emit('chat:message', {
  rideId: 123,
  senderId: 'user_456',
  message: 'Hello driver!'
});

// Emergency SOS
socket.emit('emergency:sos', {
  userId: 'user_456',
  rideId: 123,
  location: { lat: 40.7128, lng: -74.0060 },
  message: 'Need help!'
});
```

### **WebSocket Client Example**
```javascript
import io from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3000/uber-realtime');

// Join ride tracking
socket.emit('ride:join', { rideId: 123, userId: 'user_456' });

// Listen for driver location updates
socket.on('driver:location:updated', (data) => {
  console.log('Driver location:', data.location);
  updateMap(data.location);
});

// Listen for ride status changes
socket.on('ride:accepted', (data) => {
  console.log('Driver accepted ride:', data.driverId);
  showDriverInfo(data.driverId);
});
```

---

## 🔴 **2. Redis Pub/Sub System**

### **Architecture**
- **Framework**: Redis Pub/Sub with NestJS services
- **Connection**: Redis message broker
- **Use Case**: Cross-service communication and data streaming

### **Features**
✅ **Scalable** - Works across multiple servers/instances
✅ **Persistent** - Messages can be stored and replayed
✅ **Complex Routing** - Advanced message routing patterns
✅ **High Throughput** - Optimized for high-volume messaging
✅ **Reliable Delivery** - Guaranteed message delivery
✅ **Fallback Support** - Works without Redis (in-memory)

### **Redis Channels**

#### **Driver Location Channel**
```javascript
// Publish driver location
await redis.publish('driver:locations', {
  driverId: 1,
  location: { lat: 40.7128, lng: -74.0060 },
  timestamp: new Date(),
  rideId: 123
});
```

#### **Ride Updates Channel**
```javascript
// Publish ride updates
await redis.publish('ride:updates', {
  rideId: 123,
  type: 'location',
  data: { driverLocation: { lat: 40.7128, lng: -74.0060 } },
  timestamp: new Date()
});
```

#### **Emergency Alerts Channel**
```javascript
// Publish emergency alerts
await redis.publish('emergency:alerts', {
  userId: 'user_456',
  rideId: 123,
  location: { lat: 40.7128, lng: -74.0060 },
  message: 'Need help!',
  timestamp: new Date()
});
```

### **Redis Service Usage**
```typescript
import { LocationTrackingService } from './location-tracking.service';

export class RideService {
  constructor(private locationService: LocationTrackingService) {}

  async updateDriverLocation(driverId: number, location: any) {
    // Update via Redis Pub/Sub
    await this.locationService.updateDriverLocation(driverId, location);
  }

  async subscribeToRide(rideId: number, userId: string) {
    // Subscribe user to ride updates
    await this.locationService.subscribeToRide(rideId, userId);
  }
}
```

---

## 🆚 **WebSocket vs Redis Comparison**

| Feature | WebSocket | Redis Pub/Sub |
|---------|-----------|---------------|
| **Connection Type** | Persistent TCP | Message Broker |
| **Latency** | Ultra Low (< 10ms) | Low (10-100ms) |
| **Scalability** | Single Server | Multi-Server |
| **Persistence** | No | Yes (optional) |
| **Complexity** | Simple | Advanced |
| **Use Case** | Real-time UI updates | Cross-service communication |
| **Reconnection** | Automatic | Manual |
| **Browser Support** | Native WebSocket | Requires Redis client |

---

## 🧪 **Testing Both Systems**

### **Health Check Endpoints**
```bash
# WebSocket system status
GET http://localhost:3000/api/realtime/health/websocket

# Redis system status
GET http://localhost:3000/api/realtime/health/redis

# System comparison
GET http://localhost:3000/api/realtime/comparison
```

### **Test Endpoints**
```bash
# Test driver location via Redis
POST http://localhost:3000/api/realtime/test/driver-location
{
  "driverId": 1,
  "location": { "lat": 40.7128, "lng": -74.0060 },
  "rideId": 123
}

# Test ride subscription via Redis
POST http://localhost:3000/api/realtime/test/ride-subscribe
{
  "rideId": 123,
  "userId": "user_456"
}

# Test emergency alert via Redis
POST http://localhost:3000/api/realtime/test/emergency-alert
{
  "userId": "user_456",
  "rideId": 123,
  "location": { "lat": 40.7128, "lng": -74.0060 },
  "message": "Need help!"
}
```

---

## 🚀 **Getting Started**

### **1. Environment Setup**
```env
# For Redis (optional)
REDIS_URL="redis://localhost:6379"

# For WebSocket
# No additional config needed - runs on same port as HTTP server
```

### **2. Start Application**
```bash
npm run start:dev
```

### **3. Test WebSocket Connection**
```javascript
// In browser console or client app
const socket = io('http://localhost:3000/uber-realtime');
socket.on('connect', () => console.log('Connected to WebSocket'));
```

### **4. Test Redis Connection**
```bash
# Check Redis health
GET http://localhost:3000/api/realtime/health/redis
```

---

## 📊 **Production Considerations**

### **WebSocket Scaling**
- Use **Redis adapter** for Socket.IO clustering
- Implement **load balancer** sticky sessions
- Consider **WebSocket connection limits**

### **Redis Production Setup**
- Use **Redis Cluster** for high availability
- Implement **message persistence** if needed
- Set up **monitoring** for Redis performance

### **Hybrid Approach**
For production, you might want to use **both systems**:
- **WebSocket**: For real-time UI updates
- **Redis**: For cross-service communication

---

## 🎯 **Choosing the Right System**

### **Use WebSocket When:**
- ✅ You need real-time UI updates
- ✅ Low latency is critical
- ✅ You have browser-based clients
- ✅ Simple pub/sub patterns
- ✅ Single server deployment

### **Use Redis Pub/Sub When:**
- ✅ You need cross-service communication
- ✅ You have multiple server instances
- ✅ Message persistence is required
- ✅ Complex routing patterns
- ✅ High-throughput scenarios

---

## 🔧 **Configuration**

### **WebSocket Configuration**
```typescript
// In websocket.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/uber-realtime',
})
```

### **Redis Configuration**
```typescript
// In redis-pubsub.service.ts
constructor(private configService: ConfigService) {
  const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
}
```

---

## 📚 **API Documentation**

- **Swagger UI**: http://localhost:3000/api
- **WebSocket Events**: Documented in this file
- **Redis Channels**: Documented in service files
- **Health Checks**: Available via REST endpoints

---

## 🎉 **Both Systems Ready!**

You now have **two complete real-time communication systems**:

1. **WebSocket System** - Perfect for real-time UI updates
2. **Redis Pub/Sub System** - Ideal for cross-service communication

**Choose the one that best fits your architecture needs, or use both for maximum flexibility! 🚀**
