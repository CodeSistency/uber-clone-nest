Delivery - Backend Flow API
Índice de Endpoints
- Cliente
  - POST rides/flow/client/delivery/create-order
  - POST rides/flow/client/delivery/:orderId/confirm-payment
  - POST rides/flow/client/delivery/:orderId/join
  - GET  rides/flow/client/delivery/:orderId/status
  - POST rides/flow/client/delivery/:orderId/cancel
- Conductor
  - GET  rides/flow/driver/delivery/available
  - POST rides/flow/driver/delivery/:orderId/accept
  - POST rides/flow/driver/delivery/:orderId/pickup
  - POST rides/flow/driver/delivery/:orderId/deliver

cURL (Cliente)
Create order
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/create-order \
  -d '{"storeId":1,"items":[{"productId":10,"quantity":2}],"deliveryAddress":"123 Main","deliveryLatitude":10.5,"deliveryLongitude":-66.9}'

Confirm payment (Venezuelan system)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/123/confirm-payment \
  -d '{"method":"transfer","bankCode":"0102"}'

# For cash payment (no reference needed)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/123/confirm-payment \
  -d '{"method":"cash"}'

cURL (Conductor)
List available
curl -H "Authorization: Bearer $DRIVER_TOKEN" http://localhost:3000/rides/flow/driver/delivery/available

Pickup (idempotent)
curl -X POST -H "Authorization: Bearer $DRIVER_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  http://localhost:3000/rides/flow/driver/delivery/123/pickup

Resumen
- Autenticación: Bearer JWT.
- Espacio de nombres: `rides/flow/client/delivery/...` (cliente) y `rides/flow/driver/delivery/...` (conductor).
- Tiempo real: rooms `order-{orderId}` con eventos `order:created|accepted|picked_up|delivered|cancelled`.
- Notificaciones: a cliente, conductor y tienda en cambios clave.

Cliente
1) Crear pedido
POST rides/flow/client/delivery/create-order
Body: CreateOrderDto (ver src/orders/dto/create-order.dto.ts)
Response 200: { data: { orderId, totalPrice, status: 'pending', ... } }
Efectos: Crea registro, items, emite WS `order:created`.

2) Confirmar pago (Sistema Venezolano)
POST rides/flow/client/delivery/:orderId/confirm-payment
Body: { method: 'cash' | 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin', bankCode?: string }
Response 200 (cash): { data: { orderId, paymentStatus: 'pending', paymentMethod: 'cash' } }
Response 200 (transfer/pago_movil/zelle/bitcoin):
{
  "data": {
    "orderId": 123,
    "paymentStatus": "pending_reference",
    "reference": {
      "referenceNumber": "12345678901234567890",
      "bankCode": "0102",
      "amount": 35.50,
      "expiresAt": "2025-09-10T15:30:00.000Z",
      "instructions": "Realice la transferencia al banco..."
    }
  }
}
Efectos: Para efectivo marca como pendiente. Para pagos electrónicos genera referencia bancaria de 20 dígitos que expira en 24 horas.

3) Unirse al tracking
POST rides/flow/client/delivery/:orderId/join
Response 200: { ok: true, room: 'order-123', userId }

4) Estado
GET rides/flow/client/delivery/:orderId/status
Response 200: { data: { orderId, status, courier, store, orderItems, ratings } }

5) Cancelar
POST rides/flow/client/delivery/:orderId/cancel
Body: { reason?: string }
Response 200: { ok: true }
Efectos: Notifica y emite WS `order:cancelled`.

Conductor
Requisitos: JwtAuthGuard + DriverGuard.

1) Aceptar
POST rides/flow/driver/delivery/:orderId/accept
Response 200: { data: { orderId, courierId, status: 'accepted' } }
Efectos: Asigna courier, pone driver en busy, notifica.

2) Recogido en tienda
POST rides/flow/driver/delivery/:orderId/pickup
Response 200: { data: { orderId, status: 'picked_up' } }
Efectos: Notifica y WS `order:picked_up`.

3) Entregado
POST rides/flow/driver/delivery/:orderId/deliver
Response 200: { data: { orderId, status: 'delivered' } }
Efectos: Libera driver a online, notifica y WS `order:delivered`.

4) Ver pedidos disponibles
GET rides/flow/driver/delivery/available
Response 200: { data: [ { orderId, store: { id, name }, _count: { orderItems }, ... } ] }
Efectos: Lista pedidos pendientes sin courier asignado.

Idempotencia (conductores)
- En `accept`, `pickup`, `deliver` enviar header `Idempotency-Key: <uuid>`.
- Respuesta repetida devuelve el mismo payload del primer intento (TTL 5 minutos).

WS y Notificaciones
- order:status y ubicación se pueden emitir desde WebSocket gateway según driver updates.
- `NotificationsService` para push/SMS/email.


