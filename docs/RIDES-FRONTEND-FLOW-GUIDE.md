# 🚗 **Guía Completa del Flujo Frontend - Sistema de Rides**

## 📋 **Resumen Ejecutivo**

Esta guía documenta el flujo completo que debe implementar el frontend para interactuar con el sistema de rides. Desde la configuración inicial hasta la finalización del viaje, cubriendo todos los estados, eventos y endpoints necesarios.

---

## 🏗️ **Arquitectura General**

### **Componentes Principales**
- **WebSocket**: Comunicación en tiempo real para eventos del ride
- **REST API**: Endpoints para acciones principales
- **Push Notifications**: Notificaciones nativas del dispositivo
- **Estado Local**: Gestión del estado del ride en el frontend

### **Estados del Ride**
```
idle → defining → searching → driver_found → accepted → driver_arrived → in_progress → completed/cancelled
```

---

## 🔧 **FASE 1: Configuración Inicial**

### **1.1 Conexión WebSocket**
**Propósito**: Establecer comunicación bidireccional en tiempo real
- **Namespace**: `/uber-realtime`
- **Protocolo**: Socket.IO
- **Reconección**: Automática con manejo de estados

**Eventos a manejar**:
- `connect`: Conexión establecida
- `disconnect`: Conexión perdida
- `ride:joined`: Confirmación de unión a sala

### **1.2 Configuración de Notificaciones Push**
**Propósito**: Recibir alertas nativas del dispositivo
- **Tipos soportados**: `ride_accepted`, `ride_arrived`, `ride_started`, `ride_completed`
- **Plataformas**: iOS (APNs), Android (FCM)

### **1.3 Estado Inicial de la App**
**Propósito**: Preparar la interfaz para nuevos rides
- **Estado**: `idle`
- **UI**: Mostrar mapa, opciones de origen/destino
- **Permisos**: Ubicación GPS, notificaciones

---

## 🚗 **FASE 2: Definición del Viaje**

### **2.1 Selección de Origen y Destino**
**Usuario selecciona puntos en el mapa**
- **Validación**: Direcciones válidas, dentro de zona de servicio
- **Cálculo**: Distancia aproximada, tiempo estimado

### **2.2 Selección de Tier y Opciones**
**Usuario elige tipo de servicio**
- **Tiers disponibles**: Economy, Comfort, Premium
- **Opciones adicionales**: Mascotas, equipaje especial
- **Validación**: Compatibilidad con ubicación

### **2.3 Creación del Ride**
**Endpoint**: `POST /rides/flow/client/transport/define-ride`

**Request Body**:
```json
{
  "origin_address": "Calle 123 #45-67, Bogotá, Colombia",
  "origin_latitude": 4.6097100,
  "origin_longitude": -74.0817500,
  "destination_address": "Carrera 7 #23-45, Medellín, Colombia",
  "destination_latitude": 6.2518400,
  "destination_longitude": -75.5635900,
  "minutes": 25,
  "tierId": 1
}
```

**Response Exitosa (201)**:
```json
{
  "data": {
    "rideId": 123,
    "status": "pending",
    "estimatedPrice": 15.50,
    "createdAt": "2025-09-25T02:00:00.000Z"
  }
}
```

**Acciones Inmediatas del Frontend**:
1. **Unirse a sala WebSocket**: `socket.emit('ride:join', { rideId: 123, userId: userId })`
2. **Cambiar estado UI**: `defining → searching`
3. **Mostrar indicador**: "Buscando el mejor conductor para ti..."

### **2.4 Evento: Ride Requested**
**WebSocket Event**: `ride:requested`

**Payload**:
```json
{
  "rideId": 123,
  "userId": 456,
  "timestamp": "2025-09-25T02:00:05.000Z"
}
```

**Acciones del Frontend**:
- Confirmar que el ride fue registrado en el sistema
- Mantener UI en estado "searching"

---

## 🔍 **FASE 3: Matching Automático**

### **3.1 Solicitud de Matching**
**Endpoint**: `POST /rides/flow/client/transport/match-best-driver`

**Request Body**:
```json
{
  "lat": 4.6097100,
  "lng": -74.0817500,
  "tierId": 1,
  "radiusKm": 5
}
```

**Response Exitosa (201)**:
```json
{
  "data": {
    "matchedDriver": {
      "driverId": 789,
      "firstName": "Carlos",
      "lastName": "Rodriguez",
      "rating": 4.8,
      "totalRides": 1250,
      "vehicle": {
        "model": "Toyota Camry 2020",
        "licensePlate": "ABC-123",
        "color": "Negro"
      },
      "location": {
        "distance": 2.5,
        "estimatedArrival": 8
      },
      "matchScore": 85.3
    },
    "matchScore": 85.3,
    "estimatedArrival": 8
  }
}
```

**Response Sin Conductores (404)**:
```json
{
  "error": "NO_DRIVERS_AVAILABLE",
  "message": "No hay conductores disponibles en el área"
}
```

### **3.2 Estados Durante Matching**
- **UI State**: `searching`
- **Indicador**: Spinner con mensaje "Buscando conductor..."
- **Timeout**: Máximo 30 segundos de búsqueda

### **3.3 Confirmación del Conductor**
**Endpoint**: `POST /rides/flow/client/transport/{rideId}/confirm-driver`

**Request Body**:
```json
{
  "driverId": 789,
  "notes": "Por favor llegue por la entrada principal"
}
```

**Response (200)**:
```json
{
  "data": {
    "rideId": 123,
    "driverId": 789,
    "status": "driver_confirmed",
    "message": "Conductor confirmado, esperando aceptación"
  }
}
```

**Acciones del Frontend**:
- Cambiar UI a "Esperando confirmación del conductor..."
- Mostrar detalles del conductor confirmado
- Preparar para evento de aceptación

---

## 🚙 **FASE 4: Espera y Aceptación**

### **4.1 Evento: Conductor Acepta**
**WebSocket Event**: `ride:accepted`

**Payload**:
```json
{
  "rideId": 123,
  "driverId": 789,
  "driverName": "Carlos Rodriguez",
  "estimatedArrivalMinutes": 8,
  "timestamp": "2025-09-25T02:01:00.000Z"
}
```

**Acciones del Frontend**:
1. **Cambiar estado UI**: `accepted`
2. **Mostrar información**: Nombre del conductor, tiempo estimado, vehículo
3. **Iniciar tracking**: Mostrar mapa con ubicación del conductor
4. **Push Notification**: "Tu conductor Carlos está en camino"

### **4.2 Tracking del Conductor**
**WebSocket Event**: `driver:location:updated` (Opcional)

**Payload**:
```json
{
  "driverId": 789,
  "location": {
    "lat": 4.6200000,
    "lng": -74.0900000
  },
  "timestamp": "2025-09-25T02:02:00.000Z"
}
```

**Acciones del Frontend**:
- Actualizar posición del conductor en el mapa
- Recalcular tiempo estimado de llegada
- Mostrar ruta del conductor hacia el punto de recogida

### **4.3 Evento: Conductor Llegó**
**WebSocket Event**: `ride:arrived`

**Payload**:
```json
{
  "rideId": 123,
  "driverId": 789,
  "timestamp": "2025-09-25T02:08:00.000Z"
}
```

**Acciones del Frontend**:
1. **Cambiar estado UI**: `driver_arrived`
2. **Mostrar mensaje**: "Tu conductor ha llegado"
3. **Push Notification**: "Tu conductor Carlos ha llegado al punto de recogida"
4. **Botón principal**: "Estoy listo" para iniciar el viaje

---

## 🏁 **FASE 5: Viaje en Progreso**

### **5.1 Inicio del Viaje**
**El conductor inicia el viaje desde su app**

**WebSocket Event**: `ride:started`

**Payload**:
```json
{
  "rideId": 123,
  "driverId": 789,
  "timestamp": "2025-09-25T02:10:00.000Z"
}
```

**Acciones del Frontend**:
1. **Cambiar estado UI**: `in_progress`
2. **Ocultar botón**: "Estoy listo"
3. **Mostrar indicadores**: Tiempo transcurrido, distancia recorrida
4. **Push Notification**: "Viaje iniciado - ¡Buen viaje!"

### **5.2 Tracking Durante el Viaje**
**WebSocket Events**:
- `driver:location:updated`: Posición actual del conductor
- `chat:new-message`: Mensajes entre pasajero y conductor

### **5.3 Chat con el Conductor**
**WebSocket Event**: `chat:new-message`

**Enviar mensaje**:
```javascript
socket.emit('chat:message', {
  rideId: 123,
  senderId: 456,
  message: "Por favor deténgase en la próxima gasolinera"
});
```

**Recibir mensaje**:
```json
{
  "senderId": 789,
  "message": "Claro, nos detenemos en 2 minutos",
  "timestamp": "2025-09-25T02:15:00.000Z",
  "type": "ride"
}
```

---

## ✅ **FASE 6: Finalización del Viaje**

### **6.1 Evento: Viaje Completado**
**WebSocket Event**: `ride:completed`

**Payload**:
```json
{
  "rideId": 123,
  "driverId": 789,
  "fare": 18.50,
  "timestamp": "2025-09-25T02:35:00.000Z"
}
```

**Acciones del Frontend**:
1. **Cambiar estado UI**: `completed`
2. **Mostrar resumen**: Distancia recorrida, tiempo total, tarifa final
3. **Push Notification**: "Viaje completado - Tarifa: $18.50"
4. **Solicitar calificación**: Mostrar modal de rating

### **6.2 Calificación del Conductor**
**Endpoint**: `POST /rides/flow/client/transport/{rideId}/rate`

**Request Body**:
```json
{
  "rating": 5,
  "comment": "Excelente conductor, muy amable y puntual"
}
```

**Response (200)**:
```json
{
  "data": {
    "rideId": 123,
    "rating": 5,
    "comment": "Excelente conductor, muy amable y puntual",
    "message": "Calificación enviada exitosamente"
  }
}
```

---

## ❌ **FASE 7: Estados Especiales y Errores**

### **7.1 Cancelación del Viaje**

#### **Cancelación por Usuario**
**Endpoint**: `POST /rides/flow/client/transport/{rideId}/cancel`

**Request Body**:
```json
{
  "reason": "Cambio de planes, ya no necesito el viaje"
}
```

#### **Cancelación por Conductor**
**WebSocket Event**: `ride:cancelled`

**Payload**:
```json
{
  "rideId": 123,
  "reason": "Vehículo averiado en el motor",
  "timestamp": "2025-09-25T02:05:00.000Z"
}
```

**Acciones del Frontend**:
1. **Cambiar estado UI**: `cancelled`
2. **Mostrar mensaje**: Razón de la cancelación
3. **Push Notification**: "Viaje cancelado"
4. **Procesar reembolso**: Si aplica

### **7.2 Rechazo del Conductor**
**Después de confirmar conductor, puede rechazar**

**WebSocket Event**: `ride:rejected`

**Payload**:
```json
{
  "rideId": 123,
  "driverId": 789,
  "reason": "Estoy muy lejos del punto de recogida",
  "timestamp": "2025-09-25T02:01:30.000Z"
}
```

**Acciones del Frontend**:
- Volver al estado `searching`
- Mostrar mensaje: "El conductor no pudo aceptar, buscando otro..."
- Reiniciar proceso de matching automáticamente

### **7.3 Timeout de Matching**
**Si no se encuentra conductor en 30 segundos**
- Mostrar opciones: "Buscar con radio mayor", "Cambiar tier", "Cancelar"
- Mantener UI en estado `searching`

### **7.4 Errores de Red**
**Manejo de desconexiones WebSocket**
- **Reconección automática**: Intentar reconectar cada 5 segundos
- **Restaurar estado**: Volver a unirse a salas del ride activo
- **Sincronización**: Consultar estado actual del ride vía API

---

## 📊 **Estados del UI Detallados**

### **Estados Principales**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    idle     │ -> │  defining   │ -> │  searching  │
│             │    │             │    │             │
│ - Mapa      │    │ - Origen/   │    │ - Spinner   │
│ - Opciones  │    │   Destino   │    │ - Mensaje   │
└─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│driver_found │ -> │  accepted   │ -> │driver_arrived│
│             │    │             │    │             │
│ - Detalles  │    │ - Tiempo ETA│    │ - Botón     │
│ - Confirmar │    │ - Tracking  │    │   "Listo"   │
└─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ in_progress │ -> │ completed   │    │ cancelled   │
│             │    │             │    │             │
│ - Tiempo    │    │ - Resumen   │    │ - Razón     │
│ - Distancia │    │ - Calificar │    │ - Reembolso │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Indicadores de Estado**
- **idle**: "Selecciona origen y destino"
- **defining**: "Configurando tu viaje..."
- **searching**: "Buscando el mejor conductor..."
- **driver_found**: "Conductor encontrado - Esperando confirmación"
- **accepted**: "Carlos está en camino - 8 min"
- **driver_arrived**: "Tu conductor ha llegado"
- **in_progress**: "Viaje en curso - 15 min"
- **completed**: "Viaje completado - $18.50"
- **cancelled**: "Viaje cancelado"

---

## 📡 **Eventos WebSocket Completos**

### **Eventos de Salida (Frontend → Backend)**
```
ride:join              → Unirse a sala del ride
chat:message           → Enviar mensaje
```

### **Eventos de Entrada (Backend → Frontend)**
```
ride:requested         → Ride registrado en sistema
ride:accepted          → Conductor aceptó el viaje
ride:arrived           → Conductor llegó al punto de recogida
ride:started           → Viaje iniciado
ride:completed         → Viaje finalizado
ride:cancelled         → Viaje cancelado
driver:location:updated → Ubicación del conductor actualizada
chat:new-message       → Nuevo mensaje recibido
ride:rejected          → Conductor rechazó el viaje
```

### **Formato de Eventos**
```json
{
  "event": "ride:accepted",
  "data": {
    "rideId": 123,
    "driverId": 789,
    "driverName": "Carlos Rodriguez",
    "estimatedArrivalMinutes": 8,
    "timestamp": "2025-09-25T02:01:00.000Z"
  }
}
```

---

## 📱 **Notificaciones Push**

### **Momentos de Envío**
1. **Ride Accepted**: Inmediatamente cuando conductor acepta
2. **Driver Arrived**: Cuando conductor marca llegada
3. **Ride Started**: Al iniciar el viaje
4. **Ride Completed**: Al finalizar el viaje
5. **Ride Cancelled**: Si se cancela el viaje

### **Contenido de Notificaciones**
```json
{
  "type": "ride_accepted",
  "title": "¡Conductor encontrado!",
  "body": "Carlos Rodriguez está en camino - 8 minutos",
  "data": {
    "rideId": 123,
    "driverId": 789,
    "action": "open_ride_details"
  }
}
```

### **Acciones en Notificación**
- **open_ride_details**: Abrir pantalla del ride activo
- **open_chat**: Abrir chat del conductor
- **rate_driver**: Abrir pantalla de calificación

---

## 🔄 **Manejo de Estados Concurrentes**

### **Máximo 1 Ride Activo**
- Usuario no puede tener más de 1 ride activo simultáneamente
- Si intenta crear nuevo ride mientras tiene uno activo → Error

### **Reconección WebSocket**
```javascript
socket.on('disconnect', () => {
  showConnectionLostMessage();

  socket.on('connect', () => {
    hideConnectionLostMessage();

    // Restaurar estado si hay ride activo
    if (activeRideId) {
      socket.emit('ride:join', { rideId: activeRideId, userId: userId });
    }
  });
});
```

### **Sincronización de Estado**
**Al reconectar, consultar estado actual vía API**
- `GET /rides/flow/client/transport/{rideId}/status`
- Actualizar UI según estado real del ride

---

## ⚠️ **Manejo de Errores**

### **Errores de Red**
- **Retry automático**: Para requests fallidos
- **Offline mode**: Permitir algunas acciones sin conexión
- **Sincronización**: Al recuperar conexión, sincronizar estado

### **Errores de Validación**
- **Direcciones inválidas**: Mostrar mensaje específico
- **Fuera de zona**: Mostrar zonas disponibles
- **Sin conductores**: Sugerir opciones alternativas

### **Timeouts**
- **Matching timeout**: 30 segundos máximo
- **Ride timeout**: Cancelar automáticamente después de X horas
- **Payment timeout**: 5 minutos para completar pago

---

## 🎯 **Flujo Óptimo Recomendado**

### **Experiencia del Usuario Ideal**
1. **Apertura**: Conexión WebSocket automática
2. **Configuración**: Selección rápida de origen/destino
3. **Matching**: Resultados en < 10 segundos
4. **Confirmación**: Proceso de aceptación/rechazo fluido
5. **Viaje**: Tracking en tiempo real
6. **Finalización**: Calificación simple y rápida

### **KPIs a Monitorear**
- **Tiempo de matching**: < 15 segundos promedio
- **Tasa de aceptación**: > 80%
- **Cancelaciones**: < 5%
- **Calificación promedio**: > 4.5 estrellas

---

## 📋 **Checklist de Implementación**

### **Funcionalidades Core**
- [ ] Conexión WebSocket automática
- [ ] Estados del UI correctamente manejados
- [ ] Todos los eventos WebSocket implementados
- [ ] Notificaciones push configuradas
- [ ] Manejo de errores y timeouts
- [ ] Cancelación de rides
- [ ] Sistema de calificación

### **Experiencia de Usuario**
- [ ] Interfaz intuitiva y responsiva
- [ ] Indicadores de carga apropiados
- [ ] Mensajes de error claros
- [ ] Funcionalidad offline básica
- [ ] Reconección automática

### **Testing**
- [ ] Flujo completo end-to-end
- [ ] Manejo de desconexiones
- [ ] Diferentes escenarios de error
- [ ] Performance con múltiples usuarios

---

**Este documento proporciona una guía completa para implementar el flujo del sistema de rides desde el frontend, asegurando una experiencia de usuario fluida y robusta.** 🚀
