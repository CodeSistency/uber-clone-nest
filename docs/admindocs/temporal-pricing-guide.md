# ⏰ Guía de Multiplicadores Temporales - Pricing Dinámico por Tiempo

## 🎯 Descripción General

El sistema de **Multiplicadores Temporales** permite ajustar precios automáticamente según factores temporales como hora del día, día de la semana, fechas específicas y temporadas. Este sistema crea pricing dinámico que responde a la demanda y optimiza los ingresos.

## 🏗️ Arquitectura de Pricing Temporal

### Tipos de Reglas Temporales
```
🔥 Surge Pricing → Demanda Alta (hora pico, eventos)
🌙 Night Pricing → Horarios Nocturnos (22:00-06:00)
🎉 Event Pricing → Fechas Especiales (festivos, conciertos)
📅 Seasonal Pricing → Temporadas (vacaciones, Navidad)
🏖️ Weekend Pricing → Fines de Semana
```

### Jerarquía de Aplicación
```
Regla de Mayor Prioridad → Regla de Menor Prioridad
1. Zona Específica + Fecha Específica (Priority 50+)
2. Ciudad + Hora Pico (Priority 30-49)
3. Estado + Festivo (Priority 20-29)
4. País + Fin de Semana (Priority 10-19)
5. Global + Hora Nocturna (Priority 1-9)
```

## 📋 Modelo de Reglas Temporales

### Estructura TemporalPricingRule
```prisma
model TemporalPricingRule {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(100) // Nombre descriptivo
  description   String?  @db.VarChar(255) // Descripción detallada

  // Tipo de regla
  ruleType      String   @default("time_range") // time_range, day_of_week, date_specific, seasonal

  // Condiciones temporales
  startTime     String?  @db.VarChar(5) // HH:MM (07:00)
  endTime       String?  @db.VarChar(5) // HH:MM (09:00)
  daysOfWeek    Json?    // [0,1,2,3,4,5,6] (0=Domingo)
  specificDates Json?    // ["2024-01-01", "2024-12-25"]
  dateRanges    Json?    // [{"start":"2024-06-01", "end":"2024-08-31"}]

  // Multiplicador de precio
  multiplier    Decimal  @default(1.0) @db.Decimal(3, 2) // 1.4 = 40% extra
  priority      Int      @default(1) // Prioridad de aplicación

  // Alcance geográfico
  countryId     Int?     // País específico
  stateId       Int?     // Estado específico
  cityId        Int?     // Ciudad específica
  zoneId        Int?     // Zona específica

  // Configuración operativa
  isActive      Boolean  @default(true) // Regla activa
  autoApply     Boolean  @default(true) // Aplicación automática
}
```

## 🕐 Tipos de Reglas Temporales

### 1. Time Range Rules (Horarios)
```json
{
  "name": "Morning Peak Hours",
  "ruleType": "time_range",
  "startTime": "07:00",
  "endTime": "09:00",
  "daysOfWeek": [1, 2, 3, 4, 5], // Lunes a Viernes
  "multiplier": 1.4,              // 40% extra
  "priority": 20,
  "cityId": 25                     // Solo NYC
}
```

### 2. Day of Week Rules (Días de la Semana)
```json
{
  "name": "Weekend Surcharge",
  "ruleType": "day_of_week",
  "daysOfWeek": [0, 6],           // Sábado y Domingo
  "multiplier": 1.2,              // 20% extra
  "priority": 15,
  "countryId": 1                  // Todo USA
}
```

### 3. Date Specific Rules (Fechas Específicas)
```json
{
  "name": "Christmas Day",
  "ruleType": "date_specific",
  "specificDates": ["2024-12-25"],
  "multiplier": 2.0,              // 100% extra
  "priority": 50,
  "cityId": 25                     // Solo NYC
}
```

### 4. Seasonal Rules (Temporadas)
```json
{
  "name": "Summer Season",
  "ruleType": "seasonal",
  "dateRanges": [{
    "start": "2024-06-01",
    "end": "2024-08-31"
  }],
  "multiplier": 1.1,              // 10% extra
  "priority": 5,
  "stateId": 5                    // Solo California
}
```

## 🚀 Endpoints de Gestión

### CRUD de Reglas Temporales
```
GET    /admin/pricing/temporal-rules           # Listar reglas
POST   /admin/pricing/temporal-rules           # Crear regla
GET    /admin/pricing/temporal-rules/:id       # Detalles específicos
PATCH  /admin/pricing/temporal-rules/:id       # Actualizar regla
DELETE /admin/pricing/temporal-rules/:id       # Eliminar regla
```

### Funcionalidades Avanzadas
```
POST  /admin/pricing/temporal-rules/evaluate             # Evaluar reglas aplicables
POST  /admin/pricing/temporal-rules/create-standard-rules # Crear reglas estándar
POST  /admin/pricing/temporal-rules/bulk-update           # Actualizaciones masivas
GET   /admin/pricing/temporal-rules/summary/overview      # Resumen de reglas
POST  /admin/pricing/temporal-rules/simulate-pricing      # Simular cálculo completo
```

## 📊 Evaluación de Reglas Temporales

### Evaluación por Fecha/Hora
```bash
POST /admin/pricing/temporal-rules/evaluate
{
  "dateTime": "2024-01-15T08:30:00Z",
  "countryId": 1,
  "stateId": 5,
  "cityId": 25,
  "zoneId": 10
}
```

### Respuesta de Evaluación
```json
{
  "evaluatedAt": "2024-01-15T08:30:00Z",
  "dayOfWeek": 1,                    // Lunes
  "time": "08:30",                   // Dentro del rango 07:00-09:00
  "applicableRules": [
    {
      "id": 1,
      "name": "Morning Peak Hours",
      "ruleType": "time_range",
      "multiplier": 1.4,
      "priority": 20
    }
  ],
  "appliedRule": {
    "id": 1,
    "name": "Morning Peak Hours",
    "multiplier": 1.4,
    "priority": 20
  },
  "combinedMultiplier": 1.4,
  "scope": {
    "country": "United States",
    "state": "California",
    "city": "Los Angeles",
    "zone": "LAX Airport"
  }
}
```

## 🛠️ Creación de Reglas Estándar

### Reglas Automáticas por Ubicación
```bash
POST /admin/pricing/temporal-rules/create-standard-rules
{
  "countryId": 1,    // USA
  "stateId": 5,      // California
  "cityId": 25       // Los Angeles
}
```

### Reglas Creadas Automáticamente
```json
{
  "message": "Standard temporal pricing rules creation completed",
  "created": 4,
  "errors": 0,
  "tiers": [
    {
      "id": 1,
      "name": "Morning Peak Hours",
      "ruleType": "time_range",
      "startTime": "07:00",
      "endTime": "09:00",
      "daysOfWeek": [1,2,3,4,5],
      "multiplier": 1.4,
      "priority": 20
    },
    {
      "id": 2,
      "name": "Evening Peak Hours",
      "startTime": "17:00",
      "endTime": "19:00",
      "multiplier": 1.6,
      "priority": 19
    },
    {
      "id": 3,
      "name": "Late Night Hours",
      "startTime": "22:00",
      "endTime": "06:00",
      "multiplier": 1.6,
      "priority": 15
    },
    {
      "id": 4,
      "name": "Weekend Surcharge",
      "ruleType": "day_of_week",
      "daysOfWeek": [0,6],
      "multiplier": 1.2,
      "priority": 10
    }
  ]
}
```

## 💰 Cálculo de Precios Temporales

### Integración con Sistema Completo
```
Precio Final = Precio Base × Tier Multipliers × Regional Multipliers × Temporal Multipliers
```

### Ejemplo Completo de Lunes Mañana
```javascript
// Viaje en hora pico (07:00-09:00) en Manhattan
const pricing = {
  basePrice: 1099,     // $10.99

  tierMultipliers: {
    tier: 1.0,         // UberX
    surge: 1.0,        // No surge adicional
    demand: 1.0,
    luxury: 1.0,
    comfort: 1.0
  },

  regionalMultipliers: {
    country: 1.0,      // USA
    state: 1.4,        // New York (+40%)
    city: 1.5,         // NYC (+50%)
    zone: 1.0          // Manhattan (normal)
  },

  temporalMultipliers: {
    appliedRule: "Morning Peak Hours",
    multiplier: 1.4     // +40% por hora pico
  }
};

// Cálculo paso a paso
const tierPrice = 1099 * 1.0 * 1.0 * 1.0 * 1.0 * 1.0;  // $10.99
const regionalPrice = 10.99 * 1.0 * 1.4 * 1.5 * 1.0;    // $23.18
const finalPrice = 23.18 * 1.4;                          // $32.45

// Resultado: $32.45 (casi 3x el precio base debido a ubicación + hora pico)
```

## ⚙️ Configuración de Prioridades

### Sistema de Prioridades
```typescript
const priorityLevels = {
  eventSpecific: 50,     // Eventos específicos (conciertos, partidos)
  zoneDateSpecific: 45,  // Zona + fecha específica
  cityEvent: 40,         // Ciudad + evento
  airport: 35,           // Aeropuertos
  cityPeak: 30,          // Ciudad + hora pico
  stateHoliday: 25,      // Estado + festivo
  zonePeak: 20,          // Zona + hora pico
  cityHoliday: 15,       // Ciudad + festivo
  weekend: 10,           // Fin de semana general
  nightHours: 5,         // Horas nocturnas
  default: 1             // Regla por defecto
};
```

### Conflictos de Reglas
```json
{
  "evaluation": {
    "dateTime": "2024-07-04T08:30:00Z", // 4 de Julio, mañana
    "location": "New York City",
    "conflictingRules": [
      {
        "name": "Morning Peak Hours",
        "priority": 30,
        "multiplier": 1.4
      },
      {
        "name": "Independence Day",
        "priority": 50,
        "multiplier": 2.0
      }
    ],
    "appliedRule": {
      "name": "Independence Day",
      "priority": 50,
      "multiplier": 2.0
    }
  }
}
```

## 📈 Operaciones Masivas

### Actualización de Multiplicadores
```bash
POST /admin/pricing/temporal-rules/bulk-update
{
  "ruleIds": [1, 2, 3],
  "updates": {
    "multiplier": 1.5,
    "isActive": true
  }
}
```

### Resultado de Operación Masiva
```json
{
  "message": "Bulk update completed",
  "results": [
    {
      "ruleId": 1,
      "success": true,
      "data": { "multiplier": 1.5 }
    }
  ],
  "successful": 3,
  "failed": 0
}
```

## 📊 Análisis y Reportes

### Dashboard de Pricing Temporal
```json
{
  "temporalPricingAnalytics": {
    "activeRules": 25,
    "rulesByType": {
      "time_range": 12,
      "day_of_week": 5,
      "date_specific": 6,
      "seasonal": 2
    },
    "averageMultiplier": 1.35,
    "peakHoursRevenue": 45000,      // Ingresos por horas pico
    "weekendRevenue": 28000,        // Ingresos por fines de semana
    "eventRevenue": 15000,          // Ingresos por eventos
    "topRules": [
      {
        "name": "Morning Peak",
        "applications": 15420,
        "revenueImpact": 32000
      }
    ]
  }
}
```

## 🎯 Estrategias de Pricing Temporal

### Optimización por Demanda
- **Horas Pico**: Aumentar precios durante demanda alta
- **Horas Valle**: Mantener precios atractivos para generar demanda
- **Eventos**: Precios premium durante eventos especiales
- **Temporadas**: Ajustes según patrones estacionales

### Gestión de Capacidad
```json
{
  "capacityBasedPricing": {
    "lowCapacity": {
      "multiplier": 0.8,      // Descuento para atraer más rides
      "condition": "drivers < 50%"
    },
    "normalCapacity": {
      "multiplier": 1.0,      // Precio normal
      "condition": "drivers 50-80%"
    },
    "highCapacity": {
      "multiplier": 1.3,      // Surge pricing
      "condition": "drivers > 80%"
    }
  }
}
```

### Testing A/B de Reglas
```json
{
  "abTest": {
    "experiment": "peak_hour_pricing",
    "variants": [
      {
        "name": "control",
        "peakMultiplier": 1.4
      },
      {
        "name": "variant_a",
        "peakMultiplier": 1.6
      },
      {
        "name": "variant_b",
        "peakMultiplier": 1.2
      }
    ],
    "metrics": [
      "ride_completion_rate",
      "average_price",
      "user_satisfaction",
      "driver_supply"
    ]
  }
}
```

## 🚨 Monitoreo y Alertas

### Alertas Automáticas
```json
{
  "alerts": [
    {
      "type": "high_demand",
      "message": "Demand exceeding capacity by 30%",
      "action": "Increase surge multiplier to 1.8x"
    },
    {
      "type": "low_supply",
      "message": "Driver supply below 60% during peak hours",
      "action": "Reduce pricing or increase incentives"
    },
    {
      "type": "event_impact",
      "message": "Super Bowl event increasing demand by 200%",
      "action": "Apply event-specific pricing rules"
    }
  ]
}
```

## 🌟 Beneficios Estratégicos

### Para la Plataforma
- ✅ **Maximización Dinámica**: Precios que responden a la demanda en tiempo real
- ✅ **Equidad Temporal**: Precios justos según momento del día/semana
- ✅ **Gestión de Capacidad**: Balance óptimo entre oferta y demanda
- ✅ **Experiencia Predictible**: Usuarios conocen cuándo esperar precios más altos

### Para los Usuarios
- ✅ **Transparencia Total**: Entendimiento claro de por qué varían los precios
- ✅ **Planificación**: Pueden elegir horarios con mejores precios
- ✅ **Valor Percibido**: Precios premium durante momentos de alta demanda
- ✅ **Confianza**: Sistema justo y basado en condiciones del mercado

### Para los Drivers
- ✅ **Incentivos Claros**: Precios más altos durante demanda alta
- ✅ **Planificación**: Conocen cuándo esperar mejores compensaciones
- ✅ **Eficiencia**: Pueden optimizar sus horarios de trabajo
- ✅ **Estabilidad**: Sistema predecible de compensación

---

**⏰ Los multiplicadores temporales convierten el pricing estático en un sistema dinámico e inteligente que optimiza ingresos mientras mantiene la equidad y responde automáticamente a las condiciones del mercado.**
