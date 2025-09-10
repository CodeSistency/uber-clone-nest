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
- Eventos principales: accepted, arrived, started, completed, picked_up, delivered, cancelled, driver:location:update
- Eventos adicionales: chat:messages, emergency:sos, payment:status, shopping:updates

## WebSocket Event Categories

### Transport Events
- `ride:requested` → Nuevo viaje solicitado
- `ride:accepted` → Conductor aceptó el viaje
- `ride:arrived` → Conductor llegó al origen
- `ride:started` → Viaje iniciado
- `ride:completed` → Viaje finalizado
- `ride:cancelled` → Viaje cancelado
- `driver:location:update` → Actualización de ubicación

### Delivery Events
- `order:created` → Pedido creado
- `order:accepted` → Courier aceptó el pedido
- `order:picked_up` → Pedido recogido del restaurante
- `order:delivered` → Pedido entregado al cliente
- `order:modified` → Pedido modificado (ítems agregados/eliminados)
- `courier:location:update` → Actualización de ubicación del courier

### Errand Events
- `errand:created` → Encargo solicitado
- `errand:accepted` → Conductor aceptó el encargo
- `errand:shopping_update` → Actualización de costos de compras
- `errand:started` → Conductor salió con las compras
- `errand:completed` → Encargo finalizado

### Parcel Events
- `parcel:created` → Envío solicitado
- `parcel:accepted` → Conductor aceptó el envío
- `parcel:picked_up` → Paquete recogido
- `parcel:delivered` → Paquete entregado con prueba

### Common Events
- `chat:message` → Nuevo mensaje en chat
- `emergency:sos` → Alerta de emergencia
- `payment:status` → Cambio en estado de pago

Sistema de Pagos Venezolano

## Métodos de Pago Soportados
- **Efectivo** - Sin referencia bancaria requerida
- **Transferencia bancaria** - Referencia 20 dígitos
- **Pago móvil** - Referencia 20 dígitos
- **Zelle** - Sin referencia (confirmación directa)
- **Bitcoin** - Dirección de wallet

## Tipos de Pago

### Pago Único
```json
POST /rides/flow/client/transport/{rideId}/confirm-payment
{
  "method": "transfer",
  "bankCode": "0102"
}
```
- Genera una referencia bancaria de 20 dígitos
- Válida por 24 horas
- Un solo método de pago para todo el monto

### Pagos Múltiples
```json
POST /payments/initiate-multiple
{
  "serviceType": "ride",
  "serviceId": 123,
  "totalAmount": 250.00,
  "payments": [
    { "method": "transfer", "amount": 100.00, "bankCode": "0102" },
    { "method": "pago_movil", "amount": 100.00, "bankCode": "0105" },
    { "method": "cash", "amount": 50.00 }
  ]
}
```

## Escenarios de Uso

### Escenario Personal - Pago Flexible
- Usuario combina métodos según disponibilidad
- Ejemplo: Transferencia (60%) + Efectivo (40%)
- Ideal para usuarios con múltiples opciones

### Escenario Empresarial - Pagos Grandes
- Divisiones en múltiples referencias bancarias
- Seguimiento individual de cada pago
- Mejor control financiero para empresas

### Escenario de Emergencia - Pago Rápido
- Pago mínimo requerido para activar servicio
- Métodos más rápidos disponibles (pago móvil, efectivo)
- Opción de completar pago restante después

## Estados de Pago
- `pending` - Esperando confirmación
- `pending_reference` - Referencia generada, esperando pago
- `incomplete` - Grupo de pagos parcialmente completado
- `complete` - Todos los pagos confirmados
- `cancelled` - Pago cancelado por usuario
- `expired` - Referencia bancaria expirada

## Grupos de Pagos
- UUID único para seguimiento
- Estado individual por método de pago
- Progreso en tiempo real
- Cancelación completa o parcial disponible

Errores Comunes
- 400: Validación (DTOs), parámetros inválidos
- 401: JWT inválido/ausente
- 403: DriverGuard/propiedad de recurso
- 404: Recurso no encontrado o no autorizado
- 409: Conflicto (p.ej. ride ya aceptado)
- 429: Rate limit
- 500: Error interno

Buenas Prácticas

## Desarrollo y Testing
- Enviar `Idempotency-Key` en acciones de aceptación, inicio, completado, pickup/deliver
- Unirse a rooms WS tras crear/aceptar para recibir updates en tiempo real
- Validar método de pago venezolano antes de iniciar servicios
- Monitorear expiración de referencias bancarias (24 horas máximo)

## Manejo de Errores
- Implementar retry logic con exponential backoff para llamadas de red
- Manejar desconexiones WebSocket con reconexión automática
- Validar datos de entrada tanto en cliente como servidor
- Loggear errores para debugging sin exponer información sensible

## Troubleshooting Común

### WebSocket Issues
```javascript
// Reconexión automática
socket.on('disconnect', () => {
  setTimeout(() => socket.connect(), 1000);
});

// Verificar conexión
socket.on('connect', () => {
  console.log('Connected to real-time service');
});
```

### Payment Issues
```bash
# Verificar estado de referencia
GET /payments/reference/{referenceNumber}

# Re-generar referencia expirada
POST /rides/flow/client/transport/{rideId}/confirm-payment
```

### Rate Limiting
```javascript
// Implementar backoff
let retryCount = 0;
const maxRetries = 3;

function makeRequest() {
  fetch('/api/endpoint')
    .then(response => {
      if (response.status === 429) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(makeRequest, Math.pow(2, retryCount) * 1000);
        }
      }
    });
}
```

## Optimización de Performance
- Usar compresión para payloads WebSocket grandes
- Implementar pagination para listas largas (drivers, orders)
- Cachear datos estáticos (tiers, vehicle types)
- Optimizar queries de base de datos con índices apropiados

## Pagos Múltiples - Mejores Prácticas
- **Pagos múltiples:** Usar cuando el monto sea alto (>50 USD) o usuario prefiera combinar métodos
- **Grupos de pagos:** Consultar estado regularmente para mostrar progreso al usuario
- **Confirmación parcial:** Confirmar cada pago inmediatamente después de realizarlo
- **Cancelación:** Cancelar grupo completo si usuario cambia de opinión antes de confirmar pagos


