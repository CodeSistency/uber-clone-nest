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
- Eventos WS: `errand:created|accepted|shopping_update|started|completed|cancelled`, `parcel:created|accepted|picked_up|delivered|cancelled`.
- Notificaciones push en aceptación, actualizaciones y finalización.

Notas
- Estos flujos usan orquestación en memoria para prototipado; se puede persistir en Prisma con un modelo `ServiceRequest` en el futuro.


