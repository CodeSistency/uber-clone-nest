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

Sistema de Pagos Venezolano
- **Pago único:** Confirm-payment genera referencias bancarias para pagos electrónicos
- **Pagos múltiples:** POST /payments/initiate-multiple permite dividir pago en múltiples métodos
- Referencias: 20 dígitos, expiran en 24 horas, válidas para bancos venezolanos (0102, 0105, 0196, 0108)
- Métodos soportados: efectivo, transferencia, pago móvil, Zelle, Bitcoin
- Grupos de pagos: UUID único para seguimiento de pagos múltiples
- Estados: incomplete/complete/cancelled/expired para grupos de pagos
- Confirmación manual: usuario confirma cada pago realizado después de efectuarlo externamente

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
- Validar método de pago venezolano (cash/transfer/pago_movil/zelle/bitcoin) antes de iniciar viaje/delivery.
- Para pagos electrónicos: proporcionar código de banco (bankCode) cuando se requiera.
- Monitorear expiración de referencias bancarias (24 horas máximo).
- **Pagos múltiples:** Usar cuando el monto sea alto (>50 USD) o usuario prefiera combinar métodos.
- **Grupos de pagos:** Consultar estado regularmente para mostrar progreso al usuario.
- **Confirmación parcial:** Confirmar cada pago inmediatamente después de realizarlo.
- **Cancelación:** Cancelar grupo completo si usuario cambia de opinión antes de confirmar pagos.


