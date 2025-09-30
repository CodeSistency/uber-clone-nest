# API de Búsqueda de Conductores

## 📋 Descripción

La API de búsqueda de conductores proporciona un endpoint flexible y poderoso para buscar conductores con múltiples filtros, paginación y ordenamiento personalizado.

## 🚀 Endpoint Principal

```
GET /api/driver
```

## 📊 Parámetros de Búsqueda

### Paginación
- `page`: Número de página (mínimo: 1, por defecto: 1)
- `limit`: Elementos por página (mínimo: 1, máximo: 100, por defecto: 10)

### Filtros de Texto (búsqueda parcial, case-insensitive)
- `firstName`: Buscar por nombre
- `lastName`: Buscar por apellido
- `carModel`: Buscar por modelo de carro
- `licensePlate`: Buscar por placa de carro

### Filtros Exactos
- `status`: Estado del conductor ('online', 'offline', 'busy', 'unavailable')
- `verificationStatus`: Estado de verificación ('pending', 'approved', 'rejected', 'under_review')
- `canDoDeliveries`: Puede hacer entregas (true/false)
- `carSeats`: Número de asientos del carro
- `vehicleTypeId`: ID del tipo de vehículo

### Filtros de Fecha
- `createdFrom`: Fecha de creación desde (YYYY-MM-DD)
- `createdTo`: Fecha de creación hasta (YYYY-MM-DD)
- `updatedFrom`: Fecha de actualización desde (YYYY-MM-DD)
- `updatedTo`: Fecha de actualización hasta (YYYY-MM-DD)

### Ordenamiento
- `sortBy`: Campo para ordenar ('id', 'firstName', 'lastName', 'status', 'verificationStatus', 'createdAt', 'updatedAt')
- `sortOrder`: Dirección del orden ('asc', 'desc', por defecto: 'desc')

## 📝 Ejemplos de Uso

### 1. Obtener todos los conductores (sin filtros)
```bash
GET /api/driver
```

### 2. Búsqueda básica por nombre
```bash
GET /api/driver?firstName=Juan
```

### 3. Búsqueda por apellido
```bash
GET /api/driver?lastName=Pérez
```

### 4. Conductores por modelo de carro
```bash
GET /api/driver?carModel=Toyota
```

### 5. Solo conductores en línea
```bash
GET /api/driver?status=online
```

### 6. Conductores verificados
```bash
GET /api/driver?verificationStatus=approved
```

### 7. Conductores que pueden hacer entregas
```bash
GET /api/driver?canDoDeliveries=true
```

### 8. Conductores con carros de 4 asientos
```bash
GET /api/driver?carSeats=4
```

### 9. Conductores registrados en un rango de fechas
```bash
GET /api/driver?createdFrom=2024-01-01&createdTo=2024-12-31
```

### 10. Búsqueda múltiple con ordenamiento
```bash
GET /api/driver?firstName=Mar&status=online&sortBy=firstName&sortOrder=asc&page=1&limit=10
```

### 11. Conductores por tipo de vehículo
```bash
GET /api/driver?vehicleTypeId=1
```

## 📤 Respuesta de Ejemplo

```json
{
  "data": [
    {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "profileImageUrl": "https://example.com/profile.jpg",
      "carImageUrl": "https://example.com/car.jpg",
      "carModel": "Toyota Camry",
      "licensePlate": "ABC-123",
      "carSeats": 4,
      "status": "online",
      "verificationStatus": "approved",
      "canDoDeliveries": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z",
      "vehicleType": {
        "id": 1,
        "name": "car",
        "displayName": "Carro"
      },
      "documents": [
        {
          "id": 1,
          "documentType": "license",
          "verificationStatus": "approved",
          "uploadedAt": "2024-01-15T10:30:00Z"
        }
      ],
      "_count": {
        "rides": 15,
        "deliveryOrders": 8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "applied": ["firstName", "status"],
    "searchTerm": "Juan"
  }
}
```

## 🔍 Endpoint Específico por ID

Para búsquedas exactas por ID, también está disponible:

```
GET /api/driver/id/{id}
```

Ejemplo:
```bash
GET /api/driver/id/1
```

## 🎯 Casos de Uso Comunes

### Dashboard de Administración
```bash
# Ver conductores en línea
GET /api/driver?status=online&sortBy=updatedAt&sortOrder=desc
```

### Gestión de Verificación
```bash
# Conductores pendientes de verificación
GET /api/driver?verificationStatus=pending&sortBy=createdAt&sortOrder=asc
```

### Reportes de Flota
```bash
# Conductores por tipo de vehículo
GET /api/driver?vehicleTypeId=1&page=1&limit=50
```

### Análisis de Disponibilidad
```bash
# Conductores disponibles para entregas
GET /api/driver?status=online&canDoDeliveries=true
```

### Búsqueda por Vehículo
```bash
# Conductores con carros Toyota
GET /api/driver?carModel=Toyota&sortBy=firstName&sortOrder=asc
```

## ⚡ Optimizaciones

- **Búsqueda eficiente**: Usa índices de base de datos para búsquedas rápidas
- **Paginación optimizada**: Evita cargar todos los registros en memoria
- **Filtros dinámicos**: Solo aplica filtros cuando se proporcionan parámetros
- **Ordenamiento flexible**: Soporta múltiples campos de ordenamiento
- **Conteo paralelo**: Ejecuta conteo y búsqueda simultáneamente
- **Relaciones optimizadas**: Incluye información de tipo de vehículo y documentos

## 🔐 Consideraciones de Seguridad

- El endpoint puede requerir autenticación según la configuración
- Los administradores pueden ver información sensible de conductores
- Se recomienda usar HTTPS en producción
- Implementar rate limiting para prevenir abuso

## 📊 Información Adicional

- **Máximo de resultados por página**: 100
- **Tiempo de respuesta típico**: < 500ms para consultas simples
- **Soporte de case-insensitive**: Para campos de texto
- **Formato de fechas**: YYYY-MM-DD
- **Zona horaria**: UTC para todas las fechas

## 🚗 Estados de Conductor

### Status
- `online`: Conductor disponible para viajes
- `offline`: Conductor desconectado
- `busy`: Conductor ocupado en un viaje
- `unavailable`: Conductor temporalmente no disponible

### Verification Status
- `pending`: Documentos enviados, esperando revisión
- `approved`: Conductor verificado y aprobado
- `rejected`: Documentos rechazados
- `under_review`: Documentos en proceso de revisión

### Tipos de Vehículo
Los tipos de vehículo se definen en la tabla `vehicle_types` y pueden incluir:
- Carro
- Moto
- Bicicleta
- Camión

Cada conductor puede estar asociado a un tipo de vehículo específico.
