Transporte - Backend Flow API
Índice de Endpoints
- Cliente
  - POST rides/flow/client/transport/define-ride
  - POST rides/flow/client/transport/:rideId/select-vehicle
  - POST rides/flow/client/transport/:rideId/request-driver
  - POST rides/flow/client/transport/:rideId/confirm-payment
  - POST rides/flow/client/transport/:rideId/join
  - GET  rides/flow/client/transport/:rideId/status
  - POST rides/flow/client/transport/:rideId/cancel
  - POST rides/flow/client/transport/:rideId/rate
- Conductor
  - GET  rides/flow/driver/transport/available
  - POST rides/flow/driver/transport/:rideId/accept
  - POST rides/flow/driver/transport/:rideId/arrived
  - POST rides/flow/driver/transport/:rideId/start
  - POST rides/flow/driver/transport/:rideId/complete

cURL de ejemplo (Cliente)
Define ride
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/transport/define-ride \
  -d '{
    "originAddress":"Av. Ppal 123","originLat":10.5,"originLng":-66.91,
    "destinationAddress":"Calle 45","destinationLat":10.49,"destinationLng":-66.90,
    "minutes":25,"tierId":1
  }'

Confirm payment (card)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/transport/123/confirm-payment \
  -d '{"method":"card"}'

cURL de ejemplo (Conductor)
List available
curl -H "Authorization: Bearer $DRIVER_TOKEN" \
  http://localhost:3000/rides/flow/driver/transport/available

Accept (idempotent)
curl -X POST \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  http://localhost:3000/rides/flow/driver/transport/123/accept


Resumen
- Autenticación: Bearer JWT en todos los endpoints.
- Espacio de nombres: `rides/flow/client/transport/...` (cliente) y `rides/flow/driver/transport/...` (conductor).
- Tiempo real: rooms `ride-{rideId}`; eventos WS `ride:requested|accepted|arrived|started|completed|cancelled`, `driver:location:updated`.
- Notificaciones: push/SMS en cambios de estado vía `NotificationsService`.

1) Cliente - Definir viaje (crear ride)
Endpoint
POST rides/flow/client/transport/define-ride

Body
{
  "originAddress": "Av. Principal 123",
  "originLat": 10.5001,
  "originLng": -66.9170,
  "destinationAddress": "Calle Secundaria 45",
  "destinationLat": 10.4980,
  "destinationLng": -66.9000,
  "minutes": 25,
  "tierId": 1,
  "vehicleTypeId": 1
}

Response 200
{
  "data": {
    "rideId": 123,
    "originAddress": "...",
    "destinationAddress": "...",
    "originLatitude": 10.5001,
    "originLongitude": -66.917,
    "destinationLatitude": 10.498,
    "destinationLongitude": -66.9,
    "rideTime": 25,
    "farePrice": 0,
    "paymentStatus": "pending",
    "userId": 5,
    "tierId": 1,
    "requestedVehicleTypeId": 1,
    "createdAt": "2025-09-05T12:00:00.000Z"
  }
}

Efectos
- Crea registro en BD (`Ride`).
- Notifica a conductores cercanos (puede ocurrir en un paso posterior con request-driver).
- Emite WS: `ride:requested` al room `ride-123`.

2) Cliente - Seleccionar vehículo/tier
Endpoint
POST rides/flow/client/transport/:rideId/select-vehicle

Body
{
  "tierId": 2,
  "vehicleTypeId": 1
}

Response 200
{
  "data": {
    "rideId": 123,
    "tierId": 2,
    "requestedVehicleTypeId": 1,
    "tier": { "id": 2, "name": "UberXL" },
    "requestedVehicleType": { "id": 1, "displayName": "Carro" }
  }
}

Efectos
- Actualiza `tierId` y/o `requestedVehicleTypeId`.
- Emite WS: `ride:updated`.

3) Cliente - Solicitar conductor (matching)
Endpoint
POST rides/flow/client/transport/:rideId/request-driver

Driver - Listado de viajes disponibles
GET rides/flow/driver/transport/available
Response 200: { data: [ { rideId, originAddress, destinationAddress, tier, requestedVehicleType, user: { id, name } } ] }

Response 200
{ "ok": true }

Efectos
- Notifica a conductores cercanos (`notifyNearbyDrivers`).

4) Cliente - Confirmar pago
Endpoint
POST rides/flow/client/transport/:rideId/confirm-payment

Body
{
  "method": "cash" | "card",
  "clientSecret": "opcional-para-stripe"
}

Response 200 (cash)
{
  "data": {
    "rideId": 123,
    "paymentStatus": "pending"
  }
}

Response 200 (card)
{
  "data": {
    "rideId": 123,
    "paymentStatus": "pending",
    "clientSecret": "pi_123_secret_...",
    "paymentIntentId": "pi_123"
  }
}

Efectos
- Marca/inicia el flujo de pago. Para tarjeta, integrar con Stripe posteriormente.
- Emite WS: `ride:payment:initiated`.

5) Cliente - Unirse al tracking en tiempo real
Endpoint
POST rides/flow/client/transport/:rideId/join

Idempotencia (conductores)
- En `accept`, `start`, `complete` enviar header `Idempotency-Key: <uuid>` para evitar duplicados.
- Respuesta repetida devuelve el mismo payload del primer intento dentro de 5 minutos.

Response 200
{ "ok": true, "room": "ride-123", "userId": 5 }

Efectos
- En WS usar evento `ride:join` (namespace `/uber-realtime`).

6) Cliente - Consultar estado
Endpoint
GET rides/flow/client/transport/:rideId/status

Response 200
{
  "data": {
    "rideId": 123,
    "driver": { "id": 99, "firstName": "..." },
    "tier": { "id": 2, "name": "UberXL" },
    "requestedVehicleType": { "id": 1, "displayName": "Carro" },
    "ratings": []
  }
}

7) Cliente - Cancelar
Endpoint
POST rides/flow/client/transport/:rideId/cancel

Body
{ "reason": "El cliente no puede esperar" }

Response 200
{ "ok": true }

Efectos
- Notifica estado `cancelled` (push/SMS) y emite WS `ride:cancelled`.

8) Cliente - Calificar
Endpoint
POST rides/flow/client/transport/:rideId/rate

Body
{ "rating": 5, "comment": "Excelente servicio" }

Response 200
{ "data": { "id": 555, "rideId": 123, "ratingValue": 5, "comment": "Excelente servicio" } }

Conductor - Flujo de acciones
Requisitos
- Autenticado (JWT) y pasar `DriverGuard`.

1) Aceptar viaje
Endpoint
POST rides/flow/driver/transport/:rideId/accept

Response 200
{ "data": { "rideId": 123, "driverId": 99 } }

Efectos
- Asigna `driverId` al ride, notifica `accepted`, emite WS `ride:accepted`.

2) Llegó al punto de origen
Endpoint
POST rides/flow/driver/transport/:rideId/arrived

Response 200
{ "ok": true }

Efectos
- Notifica `arrived`, emite WS `ride:arrived`.

3) Iniciar viaje
Endpoint
POST rides/flow/driver/transport/:rideId/start

Response 200
{ "ok": true }

Efectos
- Notifica `in_progress`, emite WS `ride:started`.

4) Completar viaje
Endpoint
POST rides/flow/driver/transport/:rideId/complete

Body
{ "fare": 15.75 }

Response 200
{ "data": { "rideId": 123, "farePrice": 15.75, "paymentStatus": "paid" } }

Efectos
- Actualiza `farePrice` y `paymentStatus`, notifica `completed`, emite WS `ride:completed`.

Autorización y Seguridad
- Todos los endpoints usan `JwtAuthGuard`.
- Driver endpoints además usan `DriverGuard` (verifica que `req.user.id` corresponda a un driver válido).
- Ownership: el servicio utiliza `req.user.id`; se recomienda reforzar con validaciones adicionales en capa de servicio según reglas del negocio.

Eventos WebSocket Relacionados
- driver:location:update → broadcast a `ride-{rideId}` con ubicación del conductor.
- ride:join → añade usuario al tracking.
- ride:accept|arrived|started|completed|cancelled → broadcast de estado a room del ride.

Notas de Integración
- Pagos con Stripe: `confirm-payment` está preparado para integrar PaymentIntent (usar `clientSecret`).
- Notificaciones: `NotificationsService.notifyRideStatusUpdate` envía push/SMS y persiste en BD.
- Escalabilidad: usar adapter Redis del gateway para múltiples instancias.


