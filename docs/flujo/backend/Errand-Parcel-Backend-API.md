Errand & Parcel - Backend Flow API
Índice de Endpoints
- Errand Cliente: create, :id/join, :id/status, :id/cancel
- Errand Conductor: :id/accept, :id/update-shopping, :id/start, :id/complete
- Parcel Cliente: create, :id/join, :id/status, :id/cancel
- Parcel Conductor: :id/accept, :id/pickup, :id/deliver

cURL (Errand)
Create
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/errand/create \
  -d '{"description":"Comprar...","pickupAddress":"...","pickupLat":10.5,"pickupLng":-66.9,"dropoffAddress":"...","dropoffLat":10.49,"dropoffLng":-66.91}'

# ERROR EXAMPLES - Edge Cases
# Invalid address format
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/errand/create \
  -d '{"description":"Buy groceries","pickupAddress":"","pickupLat":91,"pickupLng":-66.9,"dropoffAddress":"Home","dropoffLat":10.49,"dropoffLng":-66.91}'
# Response: {"statusCode":400,"message":"Invalid latitude range"}

# Missing required fields
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/errand/create \
  -d '{"description":"Buy groceries"}'
# Response: {"statusCode":400,"message":"pickupAddress is required"}

# Duplicate errand creation (idempotency test)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/errand/create \
  -d '{"description":"Buy same items","pickupAddress":"Store A","pickupLat":10.5,"pickupLng":-66.9,"dropoffAddress":"Home","dropoffLat":10.49,"dropoffLng":-66.91}'

Complete (idempotent)
curl -X POST -H "Authorization: Bearer $DRIVER_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  http://localhost:3000/rides/flow/driver/errand/1/complete

cURL (Parcel)
Create
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:3000/rides/flow/client/parcel/create \
  -d '{"pickupAddress":"...","pickupLat":10.5,"pickupLng":-66.9,"dropoffAddress":"...","dropoffLat":10.49,"dropoffLng":-66.91,"type":"documents"}'

Deliver with proof (idempotent)
curl -X POST -H "Authorization: Bearer $DRIVER_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  http://localhost:3000/rides/flow/driver/parcel/1/deliver \
  -d '{"photoUrl":"https://.../proof.jpg"}'

Resumen
- Autenticación: Bearer JWT.
- Namespaces:
  - Errand (cliente): `rides/flow/client/errand/...`
  - Errand (conductor): `rides/flow/driver/errand/...`
  - Parcel (cliente): `rides/flow/client/parcel/...`
  - Parcel (conductor): `rides/flow/driver/parcel/...`
- WS rooms: `errand-{id}`, `parcel-{id}`.
- Notificaciones: push en cambios clave.

Errand (Cliente)
1) Crear
POST rides/flow/client/errand/create
Body: { description, itemsList?, pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng }
Response 200: { data: { id, status: 'requested', ... } }

2) Unirse
POST rides/flow/client/errand/:id/join → { ok, room: 'errand-1' }

3) Estado
GET rides/flow/client/errand/:id/status → { data: { id, status, itemsCost, driverId? } }

4) Cancelar
POST rides/flow/client/errand/:id/cancel → { ok: true }

Errand (Conductor)
1) Aceptar
POST rides/flow/driver/errand/:id/accept → { data: { id, status: 'accepted', driverId } }

2) Actualizar compra
POST rides/flow/driver/errand/:id/update-shopping
Body: { itemsCost, notes? }
Response: { data: { id, itemsCost, status: 'shopping_in_progress' } }

3) Iniciar entrega
POST rides/flow/driver/errand/:id/start → { data: { id, status: 'en_route' } }

4) Completar
POST rides/flow/driver/errand/:id/complete → { data: { id, status: 'completed' } }

Idempotencia (errand)
- En `accept`, `complete` enviar header `Idempotency-Key: <uuid>`.
- TTL 5 minutos.

Parcel (Cliente)
1) Crear
POST rides/flow/client/parcel/create
Body: { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, type, description? }
Response: { data: { id, status: 'requested', ... } }

2) Unirse
POST rides/flow/client/parcel/:id/join → { ok, room: 'parcel-1' }

3) Estado
GET rides/flow/client/parcel/:id/status → { data: { id, status, driverId?, proof? } }

4) Cancelar
POST rides/flow/client/parcel/:id/cancel → { ok: true }

Parcel (Conductor)
1) Aceptar
POST rides/flow/driver/parcel/:id/accept → { data: { id, status: 'accepted', driverId } }

2) Recoger
POST rides/flow/driver/parcel/:id/pickup → { data: { id, status: 'picked_up' } }

3) Entregar con prueba
POST rides/flow/driver/parcel/:id/deliver
Body: { signatureImageUrl?, photoUrl? }
Response: { data: { id, status: 'delivered', proof } }

Idempotencia (parcel)
- En `accept`, `pickup`, `deliver` enviar header `Idempotency-Key: <uuid>`.
- TTL 5 minutos.

WS & Notificaciones

## WebSocket Events - Detailed Payloads

### Errand Events

#### Errand Status Events
```javascript
// Event: errand:created
{
  "id": 123,
  "status": "requested",
  "description": "Comprar víveres y medicamentos",
  "pickupAddress": "Supermercado Éxito, Calle 123",
  "dropoffAddress": "Casa del cliente, Calle 45",
  "estimatedCost": 0,
  "timestamp": "2025-09-10T15:30:00.000Z"
}

// Event: errand:accepted
{
  "id": 123,
  "status": "accepted",
  "driverId": 99,
  "driverInfo": {
    "firstName": "Carlos",
    "lastName": "Martínez",
    "rating": 4.7,
    "vehicle": "Carro"
  },
  "estimatedArrival": "2025-09-10T15:45:00.000Z",
  "timestamp": "2025-09-10T15:35:00.000Z"
}

// Event: errand:shopping_update
{
  "id": 123,
  "status": "shopping_in_progress",
  "shoppingUpdate": {
    "itemsCost": 85.50,
    "notes": "Encontré todos los productos solicitados. El paracetamol estaba en promoción.",
    "photos": [
      "https://storage.example.com/shopping-receipt-123.jpg"
    ]
  },
  "timestamp": "2025-09-10T16:00:00.000Z"
}

// Event: errand:started
{
  "id": 123,
  "status": "en_route",
  "message": "Saliendo hacia su dirección con las compras",
  "totalCost": 87.50,
  "timestamp": "2025-09-10T16:05:00.000Z"
}

// Event: errand:completed
{
  "id": 123,
  "status": "completed",
  "finalCost": 87.50,
  "serviceFee": 15.00,
  "totalAmount": 102.50,
  "timestamp": "2025-09-10T16:25:00.000Z"
}
```

#### Errand Chat Events
```javascript
// Event: errand:chat:message
{
  "errandId": 123,
  "senderId": 456,
  "senderType": "customer",
  "message": "¿Encontraste el medicamento específico que te mencioné?",
  "timestamp": "2025-09-10T15:55:00.000Z"
}

// Broadcast: errand:chat:new-message
{
  "errandId": 123,
  "senderId": 99,
  "senderType": "driver",
  "message": "Sí, conseguí la marca que especificaste. También estaba en oferta.",
  "timestamp": "2025-09-10T15:55:30.000Z"
}
```

### Parcel Events

#### Parcel Status Events
```javascript
// Event: parcel:created
{
  "id": 456,
  "status": "requested",
  "pickupAddress": "Oficina Principal, Calle 100",
  "dropoffAddress": "Sucursal Norte, Av. Principal",
  "type": "documents",
  "description": "Documentos legales urgentes",
  "timestamp": "2025-09-10T14:30:00.000Z"
}

// Event: parcel:accepted
{
  "id": 456,
  "status": "accepted",
  "driverId": 88,
  "driverInfo": {
    "firstName": "Ana",
    "lastName": "López",
    "rating": 4.9,
    "vehicle": "Moto"
  },
  "estimatedPickupTime": "2025-09-10T14:45:00.000Z",
  "timestamp": "2025-09-10T14:35:00.000Z"
}

// Event: parcel:picked_up
{
  "id": 456,
  "status": "picked_up",
  "pickupTime": "2025-09-10T14:50:00.000Z",
  "proofOfPickup": {
    "photoUrl": "https://storage.example.com/pickup-proof-456.jpg",
    "signature": null
  },
  "timestamp": "2025-09-10T14:50:00.000Z"
}

// Event: parcel:delivered
{
  "id": 456,
  "status": "delivered",
  "deliveryTime": "2025-09-10T15:15:00.000Z",
  "proofOfDelivery": {
    "photoUrl": "https://storage.example.com/delivery-proof-456.jpg",
    "signatureUrl": "https://storage.example.com/signature-456.png",
    "recipientName": "María González"
  },
  "finalPrice": 25.00,
  "timestamp": "2025-09-10T15:15:00.000Z"
}
```

#### Driver Location Updates
```javascript
// Event: driver:location:update (for both errand and parcel)
{
  "serviceId": 123,
  "serviceType": "errand", // or "parcel"
  "driverId": 99,
  "location": {
    "lat": 10.4980,
    "lng": -66.9000,
    "accuracy": 4.2,
    "speed": 35.5,
    "heading": 90.0,
    "timestamp": "2025-09-10T16:10:00.000Z"
  },
  "status": "en_route",
  "estimatedArrival": "2025-09-10T16:20:00.000Z",
  "distance": 1.8 // km
}
```

- Notificaciones push en aceptación, actualizaciones de compras, cambios de estado y finalización.
- Templates específicos para cada tipo de evento (errand vs parcel).

Notas
- Estos flujos usan orquestación en memoria para prototipado; se puede persistir en Prisma con un modelo `ServiceRequest` en el futuro.


