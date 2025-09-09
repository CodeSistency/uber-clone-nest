Flow API Overview

Base URL
- Local: http://localhost:3000
- Swagger: http://localhost:3000/api

Auth & Headers
- Authorization: Bearer <jwt>
- Content-Type: application/json
- Idempotency-Key: <uuid> (opcional en acciones sensibles; recomendado en acciones de conductor)

Namespaces
- Transporte: `rides/flow/client/transport`, `rides/flow/driver/transport`
- Delivery: `rides/flow/client/delivery`, `rides/flow/driver/delivery`
- Errand: `rides/flow/client/errand`, `rides/flow/driver/errand`
- Parcel: `rides/flow/client/parcel`, `rides/flow/driver/parcel`
- Driver: `rides/flow/driver/availability`

Real-time (WebSocket)
- Namespace: /uber-realtime
- Rooms: `ride-{rideId}`, `order-{orderId}`, `errand-{id}`, `parcel-{id}`
- Eventos: ver cada documento específico (accepted, arrived, started, completed, picked_up, delivered, cancelled, driver:location:update)

Pagos (Stripe)
- Confirm-payment (method=card) retorna `clientSecret` y `paymentIntentId`.
- Webhook (Stripe Controller) debe procesar updates a estados de pago.

Errores Comunes
- 400: Validación (DTOs), parámetros inválidos
- 401: JWT inválido/ausente
- 403: DriverGuard/propiedad de recurso
- 404: Recurso no encontrado o no autorizado
- 409: Conflicto (p.ej. ride ya aceptado)
- 429: Rate limit
- 500: Error interno

Buenas Prácticas
- Enviar `Idempotency-Key` en acciones de aceptación, inicio, completado, pickup/deliver.
- Unirse a rooms WS tras crear/aceptar para recibir updates en tiempo real.
- Validar preferencia de pago (cash/card/wallet) antes de iniciar viaje/delivery.


