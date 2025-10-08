# Pricing Module - Guía Completa de Administración

Esta guía explica cómo consumir todos los endpoints del módulo de pricing desde el panel de administración, incluyendo tiers de pricing y reglas temporales.

## 📋 Información General

**Módulo:** Pricing Management
**Base URLs:**
- Ride Tiers: `/admin/pricing/ride-tiers`
- Temporal Rules: `/admin/pricing/temporal-rules`

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

## 🔄 CAMBIOS RECIENTES

### v1.1.0 - Mejoras en Ride Tiers
- ✅ **Campo `minimunFare`**: Nuevo campo que establece la tarifa mínima garantizada para cada tier
- ✅ **Vehicle Types completos**: Los endpoints ahora retornan IDs completos de tipos de vehículos asociados:
  ```json
  "vehicleTypes": [
    { "id": 1, "name": "car", "displayName": "Carro" },
    { "id": 2, "name": "motorcycle", "displayName": "Moto" }
  ]
  ```
- ✅ **Validaciones mejoradas**: Validación que `minimunFare ≤ baseFare`
- ✅ **Seed actualizado**: Tiers estándar incluyen tarifas mínimas apropiadas

### Beneficios para el Frontend:
- **Precios garantizados**: El `minimunFare` asegura que los usuarios vean un precio mínimo claro
- **Gestión de vehículos**: IDs completos permiten mejor manejo de asociaciones en la UI
- **Compatibilidad**: Todos los endpoints existentes mantienen compatibilidad hacia atrás

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Ride Tiers (Niveles de Servicio)
Sistema jerárquico de precios basado en tipos de vehículo y niveles de calidad:
- **Economy**: Precios básicos (ej: UberX)
- **Comfort**: Precios medios con comodidades (ej: UberXL)
- **Premium**: Precios altos con lujo (ej: Uber Black)

### Temporal Rules (Reglas Temporales)
Sistema dinámico de pricing basado en tiempo y ubicación:
- **Horarios pico**: Multiplicadores por demanda alta
- **Días especiales**: Reglas para fines de semana, feriados
- **Zonas geográficas**: Ajustes regionales
- **Temporadas**: Reglas estacionales

---

# 🏷️ RIDE TIERS MANAGEMENT

## 📝 CREAR TIERS

### Crear un nuevo tier

**MÉTODO:** `POST /admin/pricing/ride-tiers`

**DESCRIPCIÓN:** Crea un nuevo nivel de servicio con configuración completa de pricing.

**ENVÍO:**
```json
{
  "name": "Premium Plus",
  "baseFare": 600,
  "minimunFare": 550,
  "perMinuteRate": 35,
  "perKmRate": 180,
  "imageUrl": "https://example.com/premium-plus.png",
  "tierMultiplier": 2.2,
  "surgeMultiplier": 1.0,
  "demandMultiplier": 1.0,
  "luxuryMultiplier": 1.5,
  "comfortMultiplier": 2.0,
  "minPassengers": 1,
  "maxPassengers": 4,
  "isActive": true,
  "priority": 5,
  "vehicleTypeIds": [1, 4]
}
```

**RECIBE:**
```json
{
  "id": 7,
  "name": "Premium Plus",
  "baseFare": 600,
  "minimunFare": 550,
  "perMinuteRate": 35,
  "perKmRate": 180,
  "imageUrl": "https://example.com/premium-plus.png",
  "tierMultiplier": 2.2,
  "surgeMultiplier": 1,
  "demandMultiplier": 1,
  "luxuryMultiplier": 1.5,
  "comfortMultiplier": 2,
  "minPassengers": 1,
  "maxPassengers": 4,
  "isActive": true,
  "priority": 5,
  "ridesCount": 0,
  "vehicleTypes": [
    { "id": 1, "name": "car", "displayName": "Carro" },
    { "id": 4, "name": "truck", "displayName": "Camión" }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos o configuración de precio inválida
- `409`: Nombre duplicado

---

### Crear tiers estándar

**MÉTODO:** `POST /admin/pricing/ride-tiers/create-standard-tiers`

**DESCRIPCIÓN:** Crea automáticamente los tiers estándar de Uber (UberX, UberXL, Comfort, Uber Black).

**ENVÍO:** Body vacío

**RECIBE:**
```json
{
  "message": "Standard tiers and combinations creation completed",
  "created": 4,
  "combinations": 6,
  "errors": 0,
  "tiers": [
    {
      "id": 4,
      "name": "UberX",
      "baseFare": 250,
      // ... otros campos
    }
  ],
  "createdCombinations": [
    {
      "tierId": 4,
      "vehicleTypeId": 1,
      // ... otros campos
    }
  ],
  "errorMessages": []
}
```

---

## 📖 LEER TIERS

### Listar todos los tiers

**MÉTODO:** `GET /admin/pricing/ride-tiers`

**DESCRIPCIÓN:** Obtiene una lista paginada de todos los tiers con opciones de filtrado.

**PARÁMETROS DE CONSULTA (opcionales):**
```
?page=1&limit=20&search=premium&isActive=true&sortBy=name&sortOrder=asc
```

**RECIBE:**
```json
{
  "tiers": [
    {
      "id": 4,
      "name": "UberX",
      "baseFare": 250,
      "minimunFare": 200,
      "perMinuteRate": 15,
      "perKmRate": 80,
      "tierMultiplier": 1,
      "isActive": true,
      "ridesCount": 1250,
      "vehicleTypes": [
        { "id": 1, "name": "car", "displayName": "Carro" },
        { "id": 2, "name": "motorcycle", "displayName": "Moto" }
      ]
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### Obtener detalles de un tier específico

**MÉTODO:** `GET /admin/pricing/ride-tiers/{id}`

**DESCRIPCIÓN:** Obtiene información completa de un tier específico.

**RECIBE:**
```json
{
  "id": 4,
  "name": "UberX",
  "baseFare": 250,
  "minimunFare": 200,
  "perMinuteRate": 15,
  "perKmRate": 80,
  "imageUrl": "https://example.com/uberx.png",
  "tierMultiplier": 1,
  "surgeMultiplier": 1,
  "demandMultiplier": 1,
  "luxuryMultiplier": 1,
  "comfortMultiplier": 1,
  "minPassengers": 1,
  "maxPassengers": 4,
  "isActive": true,
  "priority": 10,
  "ridesCount": 1250,
  "vehicleTypes": [
    { "id": 1, "name": "car", "displayName": "Carro" },
    { "id": 2, "name": "motorcycle", "displayName": "Moto" }
  ],
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-10T08:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `404`: Tier no encontrado

---

### Obtener resumen de pricing

**MÉTODO:** `GET /admin/pricing/ride-tiers/summary/overview`

**DESCRIPCIÓN:** Proporciona estadísticas generales de todos los tiers.

**RECIBE:**
```json
{
  "summary": {
    "totalTiers": 6,
    "activeTiers": 6,
    "totalRides": 3750,
    "averageBaseFare": 383.33,
    "priceRanges": {
      "lowest": 250,
      "highest": 800
    },
    "tierDistribution": {
      "economy": 2,
      "comfort": 2,
      "premium": 1,
      "luxury": 1
    },
    "tiers": [
      {
        "id": 4,
        "name": "UberX",
        "baseFare": 250,
        "tierMultiplier": 1,
        "ridesCount": 1250,
        "isActive": true
      }
    ]
  }
}
```

---

### Obtener tipos de vehículo

**MÉTODO:** `POST /admin/pricing/ride-tiers/vehicle-types`

**DESCRIPCIÓN:** Lista todos los tipos de vehículo disponibles para asociar con tiers.

**ENVÍO:** Body vacío

**RECIBE:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "motorcycle",
      "displayName": "Moto",
      "icon": "🏍️",
      "isActive": true
    },
    {
      "id": 2,
      "name": "bicycle",
      "displayName": "Bicicleta",
      "icon": "🚲",
      "isActive": true
    },
    {
      "id": 4,
      "name": "car",
      "displayName": "Carro",
      "icon": "🚗",
      "isActive": true
    },
    {
      "id": 3,
      "name": "truck",
      "displayName": "Camión",
      "icon": "🚚",
      "isActive": true
    }
  ],
  "count": 4,
  "message": "Vehicle types retrieved successfully"
}
```

---

## ✏️ MODIFICAR TIERS

### Actualizar un tier

**MÉTODO:** `PATCH /admin/pricing/ride-tiers/{id}`

**DESCRIPCIÓN:** Modifica la configuración de un tier existente.

**ENVÍO:**
```json
{
  "name": "UberX Plus",
  "baseFare": 275,
  "perMinuteRate": 17,
  "tierMultiplier": 1.1,
  "priority": 9
}
```

**RECIBE:** El tier actualizado (mismo formato que GET)

**ERRORES POSIBLES:**
- `404`: Tier no encontrado
- `409`: Nombre duplicado
- `400`: Configuración inválida

---

### Actualización masiva de tiers

**MÉTODO:** `POST /admin/pricing/ride-tiers/bulk-update`

**DESCRIPCIÓN:** Actualiza múltiples tiers aplicando ajustes porcentuales o fijos.

**ENVÍO:**
```json
{
  "tierIds": [4, 5, 6],
  "adjustmentType": "percentage",
  "adjustmentValue": 15,
  "field": "baseFare"
}
```

**RECIBE:**
```json
{
  "message": "Bulk pricing update completed",
  "results": [
    {
      "tierId": 4,
      "success": true,
      "data": {
        "id": 4,
        "name": "UberX",
        "baseFare": 287, // 250 * 1.15
        // ... otros campos
      }
    }
  ],
  "successful": 3,
  "failed": 0
}
```

---

## 🗑️ ELIMINAR TIERS

### Eliminar un tier

**MÉTODO:** `DELETE /admin/pricing/ride-tiers/{id}`

**DESCRIPCIÓN:** Elimina un tier del sistema (solo si no tiene rides asociados).

**RECIBE:** `200 OK` con mensaje de confirmación

**ERRORES POSIBLES:**
- `404`: Tier no encontrado
- `409`: No se puede eliminar (tiene rides asociados)

---

### Cambiar estado activo/inactivo de un tier

**MÉTODO:** `PATCH /admin/pricing/ride-tiers/{id}/toggle-status`

**DESCRIPCIÓN:** Alterna el estado activo de un tier de pricing entre activo e inactivo.

**ENVÍO:** Body vacío

**RECIBE:**
```json
{
  "id": 4,
  "name": "UberX",
  "baseFare": 250,
  "perMinuteRate": 15,
  "perKmRate": 80,
  "isActive": false, // Estado cambiado
  "ridesCount": 1250,
  // ... otros campos
}
```

**ERRORES POSIBLES:**
- `404`: Tier no encontrado

---

## 🧮 HERRAMIENTAS DE PRICING

### Calcular precio de ride

**MÉTODO:** `POST /admin/pricing/ride-tiers/calculate-pricing`

**DESCRIPCIÓN:** Calcula el precio total de un ride considerando todos los factores.

**NOTA SOBRE `minimunFare`:** El campo `minimunFare` establece el precio mínimo garantizado para el tier. El precio calculado nunca será menor a este valor, asegurando rentabilidad mínima para los conductores.

**ENVÍO:**
```json
{
  "tierId": 4,
  "distance": 12.5,
  "duration": 25,
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "zoneId": 10,
  "surgeMultiplier": 1.3
}
```

**RECIBE:**
```json
{
  "tier": {
    "id": 4,
    "name": "UberX",
    "baseFare": 250,
    "minimunFare": 200,
    "perMinuteRate": 15,
    "perKmRate": 80,
    "tierMultiplier": 1
  },
  "basePricing": {
    "baseFare": 250,
    "distanceCost": 1000,
    "timeCost": 375,
    "subtotal": 1625,
    "tierAdjustedTotal": 1625
  },
  "regionalMultipliers": {
    "countryMultiplier": 1.1,
    "stateMultiplier": 1.0,
    "cityMultiplier": 1.05,
    "zoneMultiplier": 1.2,
    "totalMultiplier": 1.386
  },
  "dynamicPricing": {
    "surgeMultiplier": 1.3,
    "demandMultiplier": 1.0,
    "totalDynamicMultiplier": 1.3
  },
  "finalPricing": {
    "baseAmount": 2250.25,
    "regionalAdjustments": 625.25,
    "dynamicAdjustments": 975.25,
    "serviceFees": 292,
    "taxes": 233,
    "totalAmount": 3375.5
  },
  "metadata": {
    "currency": "USD",
    "distanceUnit": "kilometers",
    "calculationTimestamp": "2024-01-15T10:30:00.000Z",
    "appliedRules": ["country_pricing_multiplier", "surge_pricing"]
  }
}
```

---

### Validar configuración de pricing

**MÉTODO:** `POST /admin/pricing/ride-tiers/validate-pricing`

**DESCRIPCIÓN:** Valida una configuración de pricing y opcionalmente la compara con un tier existente.

**ENVÍO:**
```json
{
  "tier": {
    "name": "Test Premium",
    "baseFare": 500,
    "perMinuteRate": 25,
    "perKmRate": 120
  },
  "compareWithTierId": 4
}
```

**RECIBE:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": ["Total for typical ride seems too high, may reduce demand"],
  "comparison": {
    "existingTier": {
      "id": 4,
      "name": "UberX",
      "baseFare": 250,
      "perMinuteRate": 15,
      "perKmRate": 80
    },
    "differences": {
      "baseFare": 250,
      "perMinuteRate": 10,
      "perKmRate": 40
    },
    "competitiveness": "more_expensive"
  }
}
```

---

# 📅 TEMPORAL RULES MANAGEMENT

## 📝 CREAR REGLAS TEMPORALES

### Crear una nueva regla temporal

**MÉTODO:** `POST /admin/pricing/temporal-rules`

**DESCRIPCIÓN:** Crea una regla de pricing basada en tiempo, fecha o temporada.

**ENVÍO:**
```json
{
  "name": "Fin de Semana Nocturno",
  "ruleType": "time_range",
  "startTime": "22:00",
  "endTime": "06:00",
  "daysOfWeek": [5, 6, 0], // Viernes, Sábado, Domingo
  "multiplier": 1.8,
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "isActive": true,
  "priority": 10,
  "description": "Aumento nocturno fines de semana"
}
```

**RECIBE:**
```json
{
  "id": 12,
  "name": "Fin de Semana Nocturno",
  "ruleType": "time_range",
  "startTime": "22:00:00",
  "endTime": "06:00:00",
  "daysOfWeek": [5, 6, 0],
  "multiplier": 1.8,
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "isActive": true,
  "priority": 10,
  "description": "Aumento nocturno fines de semana",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `409`: Nombre duplicado

---

### Crear reglas temporales estándar

**MÉTODO:** `POST /admin/pricing/temporal-rules/create-standard-rules`

**DESCRIPCIÓN:** Crea automáticamente reglas estándar para horarios pico, nocturnos, etc.

**ENVÍO:**
```json
{
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "includeWeekendRules": true,
  "includeHolidayRules": true
}
```

**RECIBE:**
```json
{
  "message": "Standard temporal rules created successfully",
  "created": 8,
  "rules": [
    {
      "id": 13,
      "name": "Morning Peak",
      "ruleType": "time_range",
      "startTime": "07:00:00",
      "endTime": "09:00:00",
      "multiplier": 1.4
    }
  ],
  "errors": []
}
```

---

## 📖 LEER REGLAS TEMPORALES

### Listar reglas temporales

**MÉTODO:** `GET /admin/pricing/temporal-rules`

**DESCRIPCIÓN:** Obtiene una lista paginada de reglas temporales con opciones de filtrado.

**PARÁMETROS DE CONSULTA:**
```
?page=1&limit=20&ruleType=time_range&isActive=true&countryId=1
```

**RECIBE:**
```json
{
  "rules": [
    {
      "id": 12,
      "name": "Fin de Semana Nocturno",
      "ruleType": "time_range",
      "startTime": "22:00:00",
      "endTime": "06:00:00",
      "multiplier": 1.8,
      "isActive": true,
      "priority": 10
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### Obtener detalles de regla específica

**MÉTODO:** `GET /admin/pricing/temporal-rules/{id}`

**DESCRIPCIÓN:** Obtiene información completa de una regla temporal.

**RECIBE:** Objeto completo de la regla temporal

---

### Obtener resumen de reglas temporales

**MÉTODO:** `GET /admin/pricing/temporal-rules/summary/overview`

**DESCRIPCIÓN:** Proporciona estadísticas de todas las reglas temporales activas.

**RECIBE:**
```json
{
  "summary": {
    "totalActiveRules": 12,
    "rulesByType": {
      "time_range": 8,
      "day_of_week": 2,
      "date_specific": 1,
      "seasonal": 1
    },
    "rulesByScope": {
      "global": 3,
      "country": 4,
      "state": 3,
      "city": 2,
      "zone": 0
    },
    "averageMultiplier": 1.45,
    "highestMultiplier": 2.2,
    "lowestMultiplier": 1.1
  }
}
```

---

## ✏️ MODIFICAR REGLAS TEMPORALES

### Actualizar regla temporal

**MÉTODO:** `PATCH /admin/pricing/temporal-rules/{id}`

**DESCRIPCIÓN:** Modifica una regla temporal existente.

**ENVÍO:**
```json
{
  "name": "Fin de Semana Nocturno - Actualizado",
  "multiplier": 2.0,
  "description": "Aumento incrementado"
}
```

**RECIBE:** La regla actualizada

---

### Actualización masiva de reglas

**MÉTODO:** `POST /admin/pricing/temporal-rules/bulk-update`

**DESCRIPCIÓN:** Actualiza múltiples reglas temporales al mismo tiempo.

**ENVÍO:**
```json
{
  "ruleIds": [12, 13, 14],
  "updates": {
    "isActive": false,
    "multiplier": 1.0
  }
}
```

**RECIBE:**
```json
{
  "updated": 3,
  "results": [
    { "ruleId": 12, "success": true },
    { "ruleId": 13, "success": true },
    { "ruleId": 14, "success": true }
  ]
}
```

---

## 🗑️ ELIMINAR REGLAS TEMPORALES

### Eliminar regla temporal

**MÉTODO:** `DELETE /admin/pricing/temporal-rules/{id}`

**DESCRIPCIÓN:** Elimina una regla temporal del sistema.

**RECIBE:** `200 OK` con mensaje de confirmación

---

### Cambiar estado activo/inactivo de una regla temporal

**MÉTODO:** `PATCH /admin/pricing/temporal-rules/{id}/toggle-status`

**DESCRIPCIÓN:** Alterna el estado activo de una regla temporal de pricing entre activa e inactiva.

**ENVÍO:** Body vacío

**RECIBE:**
```json
{
  "id": 12,
  "name": "Fin de Semana Nocturno",
  "ruleType": "time_range",
  "startTime": "22:00:00",
  "endTime": "06:00:00",
  "multiplier": 1.8,
  "isActive": false, // Estado cambiado
  "priority": 10,
  // ... otros campos
}
```

**ERRORES POSIBLES:**
- `404`: Regla temporal no encontrada

---

## 🧮 HERRAMIENTAS TEMPORALES

### Evaluar reglas aplicables

**MÉTODO:** `POST /admin/pricing/temporal-rules/evaluate`

**DESCRIPCIÓN:** Evalúa qué reglas temporales aplican para una fecha/hora y ubicación específicas.

**ENVÍO:**
```json
{
  "dateTime": "2024-01-15T23:30:00Z",
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "zoneId": 10
}
```

**RECIBE:**
```json
{
  "applicableRules": [
    {
      "id": 12,
      "name": "Fin de Semana Nocturno",
      "multiplier": 1.8,
      "ruleType": "time_range",
      "priority": 10
    }
  ],
  "effectiveMultiplier": 1.8,
  "evaluationContext": {
    "dateTime": "2024-01-15T23:30:00.000Z",
    "dayOfWeek": 1,
    "hour": 23,
    "location": {
      "countryId": 1,
      "stateId": 5,
      "cityId": 25,
      "zoneId": 10
    }
  }
}
```

---

### Simular cálculo completo de precio

**MÉTODO:** `POST /admin/pricing/temporal-rules/simulate-pricing`

**DESCRIPCIÓN:** Simula el cálculo completo de precio incluyendo tier + reglas temporales.

**ENVÍO:**
```json
{
  "tierId": 4,
  "distance": 15,
  "duration": 30,
  "dateTime": "2024-01-15T08:30:00Z",
  "countryId": 1,
  "cityId": 25
}
```

**RECIBE:**
```json
{
  "temporalEvaluation": {
    "applicableRules": [
      {
        "id": 5,
        "name": "Morning Peak",
        "multiplier": 1.4
      }
    ],
    "effectiveMultiplier": 1.4
  },
  "note": "Complete pricing simulation requires integration with RideTiersService.calculatePricing method"
}
```

---

## 📋 RESUMEN DE ENDPOINTS

### Ride Tiers Controller (`/admin/pricing/ride-tiers`)
1. `POST /` - Crear tier
2. `GET /` - Listar tiers
3. `GET /:id` - Obtener detalles
4. `PATCH /:id` - Actualizar tier
5. `PATCH /:id/toggle-status` - Cambiar estado activo/inactivo
6. `DELETE /:id` - Eliminar tier
7. `POST /calculate-pricing` - Calcular precio
8. `POST /validate-pricing` - Validar configuración
9. `POST /create-standard-tiers` - Crear tiers estándar
10. `GET /summary/overview` - Resumen de pricing
11. `POST /vehicle-types` - Obtener tipos de vehículo
12. `POST /bulk-update` - Actualización masiva

### Temporal Rules Controller (`/admin/pricing/temporal-rules`)
1. `POST /` - Crear regla temporal
2. `GET /` - Listar reglas temporales
3. `GET /:id` - Obtener detalles de regla
4. `PATCH /:id` - Actualizar regla temporal
5. `PATCH /:id/toggle-status` - Cambiar estado activo/inactivo
6. `DELETE /:id` - Eliminar regla temporal
7. `POST /evaluate` - Evaluar reglas aplicables
8. `POST /create-standard-rules` - Crear reglas temporales estándar
9. `POST /bulk-update` - Actualización masiva de reglas
10. `GET /summary/overview` - Resumen de reglas temporales
11. `POST /simulate-pricing` - Simular cálculo completo

**Total: 23 endpoints** (12 para tiers + 11 para reglas temporales)

---

## 📋 CAMPOS Y VALIDACIONES

### Campos requeridos para Ride Tiers:
- `name`: 3-50 caracteres
- `baseFare`: 50-10000 centavos
- `minimunFare`: 0-10000 centavos (debe ser ≤ baseFare)
- `perMinuteRate`: 5-200 centavos
- `perKmRate`: 20-500 centavos

### Campos opcionales para Ride Tiers:
- `vehicleTypeIds`: Array de IDs de tipos de vehículos asociados
- `tierMultiplier`: Multiplicador base del tier (1.0 por defecto)
- `surgeMultiplier`: Multiplicador de surge pricing (1.0 por defecto)
- `demandMultiplier`: Multiplicador basado en demanda (1.0 por defecto)
- `luxuryMultiplier`: Multiplicador de servicio luxury (1.0 por defecto)
- `comfortMultiplier`: Multiplicador de características de comfort (1.0 por defecto)
- `imageUrl`: URL de imagen del tier
- `minPassengers`: Número mínimo de pasajeros (1 por defecto)
- `maxPassengers`: Número máximo de pasajeros (4 por defecto)
- `isActive`: Estado activo del tier (true por defecto)
- `priority`: Prioridad de display (1 por defecto)

### Campos requeridos para Temporal Rules:
- `name`: 3-100 caracteres
- `ruleType`: time_range, day_of_week, date_specific, seasonal
- `multiplier`: 1.0-10.0

### Tipos de reglas temporales:
- `time_range`: Requiere `startTime`, `endTime`
- `day_of_week`: Requiere `daysOfWeek` array
- `date_specific`: Requiere `specificDate`
- `seasonal`: Requiere `seasonStart`, `seasonEnd`

---

## 🧪 TESTING

### Script de pruebas completo:
```bash
node test-pricing-endpoints.js
```

### Verificación de estadísticas reales:
```bash
node test-pricing-stats.js
```

---

## 📊 RESPUESTAS ESTANDARIZADAS

### Formato estándar de respuesta:
```json
{
  "data": {
    // Contenido específico del endpoint
  },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/admin/pricing/..."
}
```

### Formato de respuesta de pricing:
```json
{
  "tier": { /* información del tier */ },
  "basePricing": { /* cálculos base */ },
  "regionalMultipliers": { /* ajustes regionales */ },
  "dynamicPricing": { /* ajustes dinámicos */ },
  "finalPricing": { /* precio final */ },
  "metadata": { /* información adicional */ }
}
```

---

## 🔧 CONFIGURACIÓN

### Headers requeridos:
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Permisos requeridos:
- `PRICING_READ`: Para consultas
- `PRICING_WRITE`: Para modificaciones

---

## 💡 USO PRÁCTICO

### 1. Configurar pricing básico:
```bash
# Crear tiers estándar
POST /admin/pricing/ride-tiers/create-standard-tiers

# Crear reglas temporales
POST /admin/pricing/temporal-rules/create-standard-rules
{
  "countryId": 1,
  "includeWeekendRules": true
}
```

### 2. Verificar configuración:
```bash
# Validar tier
POST /admin/pricing/ride-tiers/validate-pricing

# Evaluar reglas temporales
POST /admin/pricing/temporal-rules/evaluate
{
  "dateTime": "2024-01-15T08:30:00Z"
}
```

### 3. Calcular precio:
```bash
POST /admin/pricing/ride-tiers/calculate-pricing
{
  "tierId": 4,
  "distance": 10,
  "duration": 20,
  "dateTime": "2024-01-15T08:30:00Z",
  "countryId": 1
}
```

### 4. Actualizaciones masivas:
```bash
# Aumentar precios en 10%
POST /admin/pricing/ride-tiers/bulk-update
{
  "tierIds": [4, 5, 6],
  "adjustmentType": "percentage",
  "adjustmentValue": 10,
  "field": "baseFare"
}
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Jerarquía de reglas**: Las reglas temporales se aplican en orden de prioridad (mayor primero)
2. **Multiplicadores**: Se acumulan (tierMultiplier * temporalMultiplier * regionalMultipliers)
3. **Zonas geográficas**: Las reglas más específicas (zona > ciudad > estado > país) tienen prioridad
4. **Cálculos en tiempo real**: Los precios se calculan dinámicamente en cada solicitud
5. **Auditoría**: Todos los cambios quedan registrados para trazabilidad
6. **Rendimiento**: Los cálculos están optimizados con índices en las consultas de BD

---

Esta documentación cubre completamente la gestión de pricing del sistema Uber Clone, permitiendo configuración flexible de precios dinámicos basados en múltiples factores.


