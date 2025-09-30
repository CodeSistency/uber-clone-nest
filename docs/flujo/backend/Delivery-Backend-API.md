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

# ERROR EXAMPLES - Edge Cases
# Store not found
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/create-order \
  -d '{"storeId":999,"items":[{"productId":1,"quantity":1}]}'
# Response: {"statusCode":404,"message":"Store not found"}

# Product out of stock
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/create-order \
  -d '{"storeId":1,"items":[{"productId":999,"quantity":1}]}'
# Response: {"statusCode":400,"message":"Product not available"}

# Invalid payment method combination
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/delivery/123/confirm-payment \
  -d '{"method":"transfer"}'
# Response: {"statusCode":400,"message":"bankCode is required for transfer payments"}

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

## WebSocket Events - Detailed Payloads

### Order Status Events
```javascript
// Event: order:created
{
  "orderId": 123,
  "status": "pending",
  "storeId": 5,
  "totalPrice": 45.50,
  "deliveryAddress": "Calle 123 #45-67, Bogotá",
  "estimatedDeliveryTime": "2025-09-10T16:30:00.000Z",
  "timestamp": "2025-09-10T15:30:00.000Z"
}

// Event: order:accepted
{
  "orderId": 123,
  "status": "accepted",
  "courierId": 99,
  "courierInfo": {
    "firstName": "María",
    "lastName": "García",
    "rating": 4.9,
    "vehicle": "Moto"
  },
  "estimatedPickupTime": "2025-09-10T15:45:00.000Z",
  "timestamp": "2025-09-10T15:35:00.000Z"
}

// Event: order:picked_up
{
  "orderId": 123,
  "status": "picked_up",
  "pickupTime": "2025-09-10T15:50:00.000Z",
  "message": "Pedido recogido del restaurante",
  "timestamp": "2025-09-10T15:50:00.000Z"
}

// Event: order:delivered
{
  "orderId": 123,
  "status": "delivered",
  "deliveryTime": "2025-09-10T16:15:00.000Z",
  "finalPrice": 47.50,
  "tip": 2.00,
  "rating": 5,
  "timestamp": "2025-09-10T16:15:00.000Z"
}
```

### Courier Location Updates
```javascript
// Event: courier:location:update
{
  "orderId": 123,
  "courierId": 99,
  "location": {
    "lat": 10.4980,
    "lng": -66.9000,
    "accuracy": 3.5,
    "timestamp": "2025-09-10T15:55:00.000Z"
  },
  "status": "en_route",
  "estimatedArrival": "2025-09-10T16:05:00.000Z",
  "distance": 2.3 // km
}
```

### Order Chat Events
```javascript
// Event: order:chat:message
{
  "orderId": 123,
  "senderId": 456,
  "senderType": "customer",
  "message": "¿El pedido incluye cubiertos?",
  "timestamp": "2025-09-10T15:40:00.000Z"
}

// Broadcast: order:chat:new-message
{
  "orderId": 123,
  "senderId": 99,
  "senderType": "courier",
  "message": "Sí, incluye cubiertos desechables",
  "timestamp": "2025-09-10T15:40:30.000Z"
}
```

### Order Modification Events
```javascript
// Event: order:modified
{
  "orderId": 123,
  "modificationType": "item_added",
  "modifiedBy": "customer",
  "changes": {
    "addedItems": [
      {
        "productId": 25,
        "name": "Salsa Extra",
        "quantity": 1,
        "price": 2.00
      }
    ],
    "priceDifference": 2.00
  },
  "newTotal": 47.50,
  "timestamp": "2025-09-10T15:42:00.000Z"
}
```

- `NotificationsService` para push/SMS/email con templates específicos por evento.


