# Pricing Module - Endpoints Documentation

Este módulo maneja toda la funcionalidad de pricing del sistema Uber Clone, incluyendo tiers de pricing y reglas temporales.

## 📋 Estructura del Módulo

### Controladores
- **RideTiersController** (`/admin/pricing/ride-tiers`) - Gestiona tiers de pricing
- **TemporalPricingController** (`/admin/pricing/temporal-rules`) - Gestiona reglas temporales

### Servicios
- **RideTiersService** - Lógica de negocio para tiers
- **TemporalPricingService** - Lógica de negocio para reglas temporales

### DTOs
- **ride-tier.dto.ts** - DTOs para tiers de pricing
- **temporal-pricing.dto.ts** - DTOs para reglas temporales

## 🔐 Permisos Requeridos

Todos los endpoints requieren autenticación de admin con los siguientes permisos:

- `PRICING_READ` - Para operaciones de lectura
- `PRICING_WRITE` - Para operaciones de escritura/modificación

## 📚 Endpoints de Ride Tiers

### Base URL: `/admin/pricing/ride-tiers`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/` | Crear nuevo tier | PRICING_WRITE |
| GET | `/` | Listar todos los tiers | PRICING_READ |
| GET | `/:id` | Obtener tier específico | PRICING_READ |
| PATCH | `/:id` | Actualizar tier | PRICING_WRITE |
| DELETE | `/:id` | Eliminar tier | PRICING_WRITE |
| POST | `/calculate-pricing` | Calcular precio de ride | PRICING_READ |
| POST | `/validate-pricing` | Validar configuración de pricing | PRICING_READ |
| POST | `/create-standard-tiers` | Crear tiers estándar | PRICING_WRITE |
| GET | `/summary/overview` | Resumen general de pricing | PRICING_READ |
| POST | `/vehicle-types` | Obtener tipos de vehículo | PRICING_READ |
| POST | `/bulk-update` | Actualización masiva de tiers | PRICING_WRITE |

### Ejemplos de Uso

#### Crear un nuevo tier
```bash
POST /admin/pricing/ride-tiers
{
  "name": "Premium",
  "baseFare": 500,
  "perMinuteRate": 30,
  "perKmRate": 150,
  "tierMultiplier": 2.0
}
```

#### Obtener tipos de vehículo
```bash
POST /admin/pricing/ride-tiers/vehicle-types
# Body vacío
```

#### Actualización masiva
```bash
POST /admin/pricing/ride-tiers/bulk-update
{
  "tierIds": [1, 2, 3],
  "adjustmentType": "percentage",
  "adjustmentValue": 10,
  "field": "baseFare"
}
```

## 📚 Endpoints de Reglas Temporales

### Base URL: `/admin/pricing/temporal-rules`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/` | Crear regla temporal | PRICING_WRITE |
| GET | `/` | Listar reglas temporales | PRICING_READ |
| GET | `/:id` | Obtener regla específica | PRICING_READ |
| PATCH | `/:id` | Actualizar regla temporal | PRICING_WRITE |
| DELETE | `/:id` | Eliminar regla temporal | PRICING_WRITE |
| POST | `/evaluate` | Evaluar reglas aplicables | PRICING_READ |
| POST | `/create-standard-rules` | Crear reglas estándar | PRICING_WRITE |
| POST | `/bulk-update` | Actualización masiva | PRICING_WRITE |
| GET | `/summary/overview` | Resumen de reglas | PRICING_READ |
| POST | `/simulate-pricing` | Simular cálculo completo | PRICING_READ |

### Tipos de Reglas Temporales

- **time_range**: Reglas basadas en rangos de horario
- **day_of_week**: Reglas específicas para días de la semana
- **date_specific**: Reglas para fechas específicas
- **seasonal**: Reglas estacionales

### Ejemplos de Uso

#### Crear regla de horario pico
```bash
POST /admin/pricing/temporal-rules
{
  "name": "Horario Pico Mañana",
  "ruleType": "time_range",
  "startTime": "07:00",
  "endTime": "09:00",
  "multiplier": 1.5,
  "isActive": true
}
```

#### Evaluar reglas aplicables
```bash
POST /admin/pricing/temporal-rules/evaluate
{
  "dateTime": "2024-01-15T08:30:00Z",
  "countryId": 1,
  "cityId": 25
}
```

## 🧪 Testing

Para probar todos los endpoints, usa el script `test-pricing-endpoints.js`:

```bash
node test-pricing-endpoints.js
```

## 📊 Respuestas Estandarizadas

Todas las respuestas siguen el formato estándar:

```json
{
  "data": {
    // Contenido específico del endpoint
  },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/admin/pricing/..."
}
```

## 🔧 Configuración

Los endpoints están protegidos con guards de autenticación y permisos. Asegúrate de incluir el header de autorización:

```
Authorization: Bearer <admin-jwt-token>
```

## 📈 Funcionalidades

### Ride Tiers
- Gestión completa de niveles de servicio
- Cálculos de precio dinámicos
- Validación de configuraciones
- Actualizaciones masivas
- Asociación con tipos de vehículo

### Reglas Temporales
- Pricing dinámico basado en tiempo
- Reglas geográficas (país, estado, ciudad, zona)
- Evaluación de reglas aplicables
- Simulación de precios completos
- Gestión masiva de reglas
