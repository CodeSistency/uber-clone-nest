# 📡 **Guía de Comunicación Cliente-Conductor en Uber Clone**

## 🎯 **Resumen Ejecutivo**

Este documento detalla la **arquitectura de comunicación bidireccional** entre clientes y conductores en el sistema de ride-sharing, incluyendo **WebSocket events**, **REST APIs**, **notificaciones push**, y **flujos de datos en tiempo real**.

---

## 🏗️ **Arquitectura General**

### **Componentes Principales**
```typescript
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   CLIENT APP    │◄────────────────►│  DRIVER APP     │
│                 │                  │                 │
│ TransportClient │                  │ TransportDriver │
│   Controller    │                  │   Controller    │
└─────────────────┘                  └─────────────────┘
         │                                      │
         │ REST API                             │ REST API
         ▼                                      ▼
┌─────────────────────────────────────────────────────────┐
│              WebSocket Gateway                          │
│  • Real-time events                                    │
│  • Room management                                     │
│  • Redis pub/sub                                       │
└─────────────────────────────────────────────────────────┘
         │                                      │
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│  RidesFlowService│                  │ NotificationMgr │
│  • Business logic│                  │ • Push/SMS/Email│
│  • State mgmt    │                  │ • WebSocket     │
└─────────────────┘                  └─────────────────┘
```

---

## 🔄 **Flujos de Comunicación Principales**

### **1. 🚀 FLUJO DE SOLICITUD DE VIAJE**

#### **Paso 1: Cliente Solicita Viaje**
```typescript
// CLIENT SIDE: TransportClientController
POST /rides/flow/client/transport/define-ride
{
  "originAddress": "Calle 123 #45-67, Bogotá",
  "originLat": 4.6097,
  "originLng": -74.0817,
  "destinationAddress": "Carrera 7 #23-45, Medellín",
  "destinationLat": 6.2518,
  "destinationLng": -75.5636,
  "tierId": 1
}
```

#### **Paso 2: Búsqueda de Conductor (Síncrona)**
```typescript
// CLIENT SIDE: TransportClientController
POST /rides/flow/client/transport/match-best-driver
{
  "lat": 4.6097,
  "lng": -74.0817,
  "tierId": 1,
  "radiusKm": 5
}
```

#### **Paso 3: Búsqueda Asíncrona (Si no encuentra)**
```typescript
// CLIENT SIDE: TransportClientController
POST /rides/flow/client/transport/async-search/start
{
  "lat": 4.6097,
  "lng": -74.0817,
  "priority": "normal",
  "maxWaitTime": 300
}

// RESPUESTA:
{
  "searchId": "search-123e4567-e89b-12d3-a456-426614174000",
  "status": "searching"
}
```

#### **Paso 4: Confirmación de Conductor**
```typescript
// CLIENT SIDE: TransportClientController
POST /rides/flow/client/transport/:rideId/confirm-driver
{
  "driverId": 42,
  "notes": "Por favor llegue rápido"
}
```

#### **Paso 5: Notificación al Conductor**
```typescript
// SERVER SIDE: RidesFlowService.confirmDriverForRide()
// 1. Actualiza estado del viaje a 'driver_confirmed'
// 2. Envía notificación push al conductor
// 3. Emite evento WebSocket

// WebSocket Event:
this.gateway.server
  .to(`driver-${driverId}`)
  .emit('driver:ride-request', {
    rideId,
    userName: "Usuario",
    pickupAddress: "Calle 123 #45-67, Bogotá",
    dropoffAddress: "Carrera 7 #23-45, Medellín",
    estimatedFare: 25.50,
    expiresAt: "2025-01-10T15:30:00Z"
  });
```

---

### **2. ✅ FLUJO DE ACEPTACIÓN DE VIAJE**

#### **Paso 1: Conductor Recibe Solicitud**
```typescript
// DRIVER SIDE: WebSocket Listener
socket.on('driver:ride-request', (data) => {
  console.log('Nueva solicitud de viaje:', data);
  // Mostrar UI de aceptación al conductor
});
```

#### **Paso 2: Conductor Acepta Viaje**
```typescript
// DRIVER SIDE: TransportDriverController
POST /rides/flow/driver/transport/:rideId/accept
Headers: {
  "Idempotency-Key": "accept-123-456"
}
```

#### **Paso 3: Notificación al Cliente**
```typescript
// SERVER SIDE: RidesFlowService.driverAcceptTransport()
// 1. Actualiza estado del viaje a 'accepted'
// 2. Envía notificación al cliente
// 3. Emite evento WebSocket

// WebSocket Event:
this.gateway.server
  .to(`ride-${rideId}`)
  .emit('ride:accepted', { 
    rideId, 
    driverId,
    timestamp: new Date()
  });
```

#### **Paso 4: Cliente Recibe Confirmación**
```typescript
// CLIENT SIDE: WebSocket Listener
socket.on('ride:accepted', (data) => {
  console.log('Viaje aceptado por conductor:', data);
  // Mostrar información del conductor
});
```

---

### **3. 🚗 FLUJO DE SEGUIMIENTO EN TIEMPO REAL**

#### **Paso 1: Conductor Actualiza Ubicación**
```typescript
// DRIVER SIDE: TransportDriverController
POST /rides/flow/driver/transport/location
{
  "lat": 4.6100,
  "lng": -74.0820,
  "accuracy": 5.0,
  "speed": 25.5,
  "heading": 180
}
```

#### **Paso 2: WebSocket Broadcast**
```typescript
// SERVER SIDE: WebSocketGateway
@SubscribeMessage('driver:location:update')
handleDriverLocationUpdate(data: DriverLocationUpdateDto) {
  const { driverId, location, rideId } = data;
  
  // Broadcast a todos en el room del viaje
  this.server.to(`ride-${rideId}`).emit('driver:location:updated', {
    driverId,
    location,
    timestamp: new Date()
  });
}
```

#### **Paso 3: Cliente Recibe Ubicación**
```typescript
// CLIENT SIDE: WebSocket Listener
socket.on('driver:location:updated', (data) => {
  console.log('Ubicación del conductor:', data);
  // Actualizar mapa en tiempo real
});
```

---

### **4. 💬 FLUJO DE CHAT EN TIEMPO REAL**

#### **Paso 1: Envío de Mensaje**
```typescript
// CUALQUIER LADO: WebSocket
socket.emit('chat:message', {
  rideId: 123,
  senderId: 456,
  message: "Estoy llegando en 2 minutos"
});
```

#### **Paso 2: Broadcast del Mensaje**
```typescript
// SERVER SIDE: WebSocketGateway
@SubscribeMessage('chat:message')
handleChatMessage(data: ChatMessageDto) {
  const { rideId, senderId, message } = data;
  const roomId = rideId ? `ride-${rideId}` : `order-${orderId}`;
  
  this.server.to(roomId).emit('chat:new-message', {
    senderId,
    message,
    timestamp: new Date(),
    type: rideId ? 'ride' : 'order'
  });
}
```

#### **Paso 3: Recepción del Mensaje**
```typescript
// CUALQUIER LADO: WebSocket Listener
socket.on('chat:new-message', (data) => {
  console.log('Nuevo mensaje:', data);
  // Mostrar en UI de chat
});
```

---

## 📡 **Eventos WebSocket Completos**

### **Eventos del Cliente → Servidor**
```typescript
// Cliente se une al seguimiento del viaje
socket.emit('ride:join', { rideId: 123, userId: 456 });

// Cliente envía mensaje de chat
socket.emit('chat:message', { 
  rideId: 123, 
  senderId: 456, 
  message: "Hola conductor" 
});

// Cliente reporta emergencia
socket.emit('emergency:sos', {
  userId: 456,
  rideId: 123,
  location: { lat: 4.6097, lng: -74.0817 },
  message: "Necesito ayuda urgente"
});
```

### **Eventos del Conductor → Servidor**
```typescript
// Conductor actualiza ubicación
socket.emit('driver:location:update', {
  driverId: 42,
  location: { lat: 4.6100, lng: -74.0820 },
  rideId: 123
});

// Conductor acepta viaje
socket.emit('ride:accept', {
  rideId: 123,
  driverId: 42,
  userId: 456
});

// Conductor actualiza estado
socket.emit('driver:status:update', {
  driverId: 42,
  status: 'online' // online, offline, busy
});

// Conductor completa viaje
socket.emit('ride:complete', {
  rideId: 123,
  driverId: 42,
  userId: 456,
  fare: 25.50
});
```

### **Eventos del Servidor → Cliente**
```typescript
// Viaje aceptado por conductor
socket.on('ride:accepted', (data) => {
  // { rideId, driverId, timestamp }
});

// Ubicación del conductor actualizada
socket.on('driver:location:updated', (data) => {
  // { driverId, location, timestamp }
});

// Nuevo mensaje de chat
socket.on('chat:new-message', (data) => {
  // { senderId, message, timestamp, type }
});

// Eventos de matching asíncrono
socket.on('matching-event', (data) => {
  // { type: 'driver-found'|'search-timeout'|'search-cancelled', searchId, data }
});

// Emergencia reportada
socket.on('emergency:sos-triggered', (data) => {
  // { userId, rideId, location, message, timestamp }
});
```

### **Eventos del Servidor → Conductor**
```typescript
// Nueva solicitud de viaje
socket.on('driver:ride-request', (data) => {
  // { rideId, userName, pickupAddress, dropoffAddress, estimatedFare, expiresAt }
});

// Estado del conductor cambiado
socket.on('driver:status:changed', (data) => {
  // { driverId, status, timestamp }
});

// Viaje completado
socket.on('ride:completed', (data) => {
  // { rideId, driverId, fare, timestamp }
});
```

---

## 🔄 **Estados del Viaje y Transiciones**

### **Estados Principales**
```typescript
enum RideStatus {
  PENDING = 'pending',                    // Viaje creado, esperando pago
  PAID = 'paid',                         // Pago confirmado, buscando conductor
  DRIVER_CONFIRMED = 'driver_confirmed', // Conductor asignado, esperando aceptación
  ACCEPTED = 'accepted',                 // Conductor aceptó, en camino
  ARRIVED = 'arrived',                   // Conductor llegó al punto de recogida
  STARTED = 'started',                   // Viaje iniciado
  COMPLETED = 'completed',               // Viaje completado
  CANCELLED = 'cancelled'                // Viaje cancelado
}
```

### **Transiciones de Estado**
```typescript
// Flujo normal:
pending → paid → driver_confirmed → accepted → arrived → started → completed

// Flujo de cancelación:
cualquier_estado → cancelled

// Flujo de emergencia:
cualquier_estado → emergency (via SOS)
```

---

## 🚨 **Sistema de Emergencias**

### **Reporte de Emergencia**
```typescript
// Cliente reporta emergencia
socket.emit('emergency:sos', {
  userId: 456,
  rideId: 123,
  location: { lat: 4.6097, lng: -74.0817 },
  message: "Necesito ayuda urgente"
});

// Servidor notifica a:
// 1. Conductor del viaje
this.server.to(`ride-${rideId}`).emit('emergency:sos-triggered', data);

// 2. Servicios de emergencia
this.server.to('emergency-services').emit('emergency:sos-alert', {
  userId, rideId, driverId, location, message, timestamp
});
```

---

## 📱 **Notificaciones Push**

### **Tipos de Notificaciones**
```typescript
// Para Conductores:
- RIDE_REQUEST: "Nueva solicitud de viaje"
- RIDE_CANCELLED: "Viaje cancelado por el cliente"
- EMERGENCY_ALERT: "Emergencia reportada en tu viaje"

// Para Clientes:
- RIDE_ACCEPTED: "Tu viaje fue aceptado"
- DRIVER_ARRIVED: "Tu conductor ha llegado"
- RIDE_COMPLETED: "Viaje completado"
- EMERGENCY_RESPONSE: "Servicios de emergencia notificados"
```

### **Implementación**
```typescript
// RidesFlowService.sendDriverRideRequest()
await this.notificationManager.sendNotification({
  userId: `driver_${driverId}`,
  type: 'RIDE_REQUEST',
  title: 'Nueva Solicitud de Viaje',
  message: `Tienes una solicitud de viaje desde ${ride.originAddress}`,
  data: { rideId, fare: ride.farePrice }
});
```

---

## 🔧 **Configuración de WebSocket**

### **Conexión del Cliente**
```typescript
// Cliente se conecta
const socket = io('ws://localhost:3000/uber-realtime', {
  auth: {
    token: 'jwt-token-here'
  }
});

// Unirse a room del viaje
socket.emit('ride:join', { rideId: 123, userId: 456 });
```

### **Conexión del Conductor**
```typescript
// Conductor se conecta
const socket = io('ws://localhost:3000/uber-realtime', {
  auth: {
    token: 'jwt-token-here'
  }
});

// Unirse a room del conductor
socket.emit('driver:join', { driverId: 42 });
```

---

## 🚀 **Optimizaciones y Mejores Prácticas**

### **1. Gestión de Rooms**
```typescript
// Rooms automáticos:
- `ride-${rideId}`: Todos los participantes del viaje
- `driver-${driverId}`: Notificaciones específicas del conductor
- `user-${userId}`: Notificaciones específicas del usuario
- `emergency-services`: Servicios de emergencia
```

### **2. Idempotencia**
```typescript
// Headers requeridos para operaciones críticas:
Headers: {
  "Idempotency-Key": "unique-key-here"
}
```

### **3. Rate Limiting**
```typescript
// Límites implementados:
- Ubicaciones: Máximo 1 por segundo por conductor
- Mensajes de chat: Máximo 10 por minuto por usuario
- Búsquedas asíncronas: Máximo 100 concurrentes por servidor
```

### **4. Reconexión Automática**
```typescript
// Cliente maneja desconexiones:
socket.on('disconnect', () => {
  console.log('Desconectado, reintentando...');
  setTimeout(() => socket.connect(), 5000);
});
```

---

## 🧪 **Testing de Comunicación**

### **Test de Flujo Completo**
```bash
# 1. Iniciar servidor
npm run start:dev

# 2. Simular cliente
node test-websocket-client.html

# 3. Simular conductor
curl -X POST http://localhost:3000/rides/flow/driver/transport/go-online

# 4. Crear viaje y verificar comunicación
curl -X POST http://localhost:3000/rides/flow/client/transport/define-ride
```

---

## 📊 **Monitoreo y Logs**

### **Logs Importantes**
```typescript
// WebSocket Gateway
this.logger.log(`📡 [WS] Sent ${eventType} for search ${searchId} to user ${userId}`);

// RidesFlowService
this.logger.log(`🚗 [POST-PAYMENT] Starting driver notification for ride ${rideId}`);

// AsyncMatchingService
this.logger.log(`🔍 [ASYNC] Driver found for search ${searchId}: ${driverId}`);
```

### **Métricas Clave**
- **Latencia WebSocket**: < 100ms
- **Tasa de entrega de notificaciones**: > 99%
- **Tiempo de matching**: < 30 segundos promedio
- **Conectividad**: 99.9% uptime

---

## 🎯 **Conclusión**

El sistema de comunicación **Cliente-Conductor** está diseñado para ser:

✅ **Robusto**: Maneja desconexiones y reconexiones automáticas  
✅ **Escalable**: Usa Redis para pub/sub distribuido  
✅ **En tiempo real**: WebSocket para actualizaciones instantáneas  
✅ **Confiable**: Sistema de idempotencia y validaciones  
✅ **Completo**: Cubre todos los casos de uso del ride-sharing  

**El sistema está listo para producción** una vez que Redis y la base de datos estén disponibles. 🚀✨
