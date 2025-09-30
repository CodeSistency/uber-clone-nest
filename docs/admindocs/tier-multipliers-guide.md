# 🎯 Guía de Multiplicadores por Tier - Pricing Dinámico

## 🎯 Descripción General

El sistema de **Multiplicadores por Tier** permite configurar precios diferenciados para cada nivel de servicio. Desde Economy hasta Luxury, cada tier tiene sus propios multiplicadores que se aplican sobre las tarifas base para crear experiencias de precio personalizadas.

## 🏗️ Arquitectura de Multiplicadores

### Jerarquía de Multiplicadores por Tier
```
Tarifa Base (RideTier)
├── Multiplicador de Tier (1.0x - 2.5x)
├── Multiplicador de Surge (1.0x - 10.0x)
├── Multiplicador de Demanda (1.0x - 5.0x)
├── Multiplicador de Lujo (1.0x - 3.0x)
└── Multiplicador de Confort (1.0x - 2.0x)
    └── Precio Final del Tier
```

### Tipos de Multiplicadores
- **Tier Multiplier**: Multiplicador base específico del nivel de servicio
- **Surge Multiplier**: Multiplicador para horas pico y alta demanda
- **Demand Multiplier**: Multiplicador basado en demanda del mercado
- **Luxury Multiplier**: Multiplicador para servicios premium
- **Comfort Multiplier**: Multiplicador para características de confort

## 📋 Niveles de Servicio Estándar

### Economy Tier (UberX)
```json
{
  "name": "UberX",
  "tierMultiplier": 1.0,     // Base economy
  "surgeMultiplier": 1.0,    // Standard surge
  "demandMultiplier": 1.0,   // Standard demand
  "luxuryMultiplier": 1.0,   // No luxury features
  "comfortMultiplier": 1.0,  // Basic comfort
  "minPassengers": 1,
  "maxPassengers": 4,
  "priority": 10              // Highest display priority
}
```

### Comfort Tier (UberXL)
```json
{
  "name": "UberXL",
  "tierMultiplier": 1.3,     // 30% more than economy
  "surgeMultiplier": 1.0,
  "demandMultiplier": 1.0,
  "luxuryMultiplier": 1.0,
  "comfortMultiplier": 1.2,  // Extra comfort features
  "minPassengers": 1,
  "maxPassengers": 6,        // More passengers
  "priority": 9
}
```

### Premium Tier (Comfort)
```json
{
  "name": "Comfort",
  "tierMultiplier": 1.8,     // 80% more than economy
  "surgeMultiplier": 1.0,
  "demandMultiplier": 1.0,
  "luxuryMultiplier": 1.0,
  "comfortMultiplier": 1.5,  // Premium comfort
  "minPassengers": 1,
  "maxPassengers": 4,
  "priority": 8
}
```

### Luxury Tier (Uber Black)
```json
{
  "name": "Uber Black",
  "tierMultiplier": 2.5,     // 150% more than economy
  "surgeMultiplier": 1.0,
  "demandMultiplier": 1.0,
  "luxuryMultiplier": 1.8,  // Luxury features
  "comfortMultiplier": 2.0,  // Maximum comfort
  "minPassengers": 1,
  "maxPassengers": 4,
  "priority": 7               // Lower display priority
}
```

## 💰 Cálculo de Precios por Tier

### Fórmula Completa
```
Precio del Tier = Precio Base × Tier Multiplier × Surge × Demand × Luxury × Comfort
```

### Ejemplo Práctico - UberX
```javascript
const basePrice = calculateBasePrice(ride); // $10.99

const tierPrice = basePrice *
                 1.0 *  // tierMultiplier (UberX = economy)
                 1.2 *  // surgeMultiplier (20% surge)
                 1.0 *  // demandMultiplier
                 1.0 *  // luxuryMultiplier
                 1.0;   // comfortMultiplier

// Resultado: $10.99 × 1.2 = $13.19
```

### Ejemplo Práctico - Uber Black
```javascript
const basePrice = calculateBasePrice(ride); // $10.99

const tierPrice = basePrice *
                 2.5 *  // tierMultiplier (Uber Black = luxury)
                 1.2 *  // surgeMultiplier (20% surge)
                 1.1 *  // demandMultiplier (10% demand)
                 1.8 *  // luxuryMultiplier (80% luxury premium)
                 2.0;   // comfortMultiplier (100% comfort premium)

// Resultado: $10.99 × 2.5 × 1.2 × 1.1 × 1.8 × 2.0 = $129.41
```

## 🚀 Endpoints de Gestión

### CRUD de Tiers
```
GET    /admin/pricing/ride-tiers           # Listar todos los tiers
POST   /admin/pricing/ride-tiers           # Crear nuevo tier
GET    /admin/pricing/ride-tiers/:id       # Detalles específicos
PATCH  /admin/pricing/ride-tiers/:id       # Actualizar tier
DELETE /admin/pricing/ride-tiers/:id       # Eliminar tier
```

### Funcionalidades Especiales
```
POST  /admin/pricing/ride-tiers/calculate-pricing    # Calcular precio completo
POST  /admin/pricing/ride-tiers/validate-pricing     # Validar configuración
POST  /admin/pricing/ride-tiers/create-standard-tiers # Crear tiers estándar
POST  /admin/pricing/ride-tiers/bulk-update          # Actualizaciones masivas
GET   /admin/pricing/ride-tiers/summary/overview     # Resumen de pricing
```

## 🛠️ Creación de Tiers Estándar

### Endpoint para Tiers Predefinidos
```bash
POST /admin/pricing/ride-tiers/create-standard-tiers
```

### Tiers Creados Automáticamente
1. **UberX** - Economy básico
2. **UberXL** - Comfort para grupos
3. **Comfort** - Premium intermedio
4. **Uber Black** - Luxury completo

### Respuesta de Creación
```json
{
  "message": "Standard tiers creation completed",
  "created": 4,
  "errors": 0,
  "tiers": [
    {
      "id": 1,
      "name": "UberX",
      "tierMultiplier": 1.0,
      "baseFare": 250,
      "perMinuteRate": 15,
      "perMileRate": 120
    }
  ],
  "errorMessages": []
}
```

## 📊 Validación y Testing

### Validación de Configuración
```bash
POST /admin/pricing/ride-tiers/validate-pricing
{
  "tier": {
    "name": "Custom Tier",
    "baseFare": 300,
    "perMinuteRate": 20,
    "perMileRate": 150,
    "tierMultiplier": 1.5
  },
  "compareWithTierId": 1  // Comparar con UberX
}
```

### Respuesta de Validación
```json
{
  "isValid": true,
  "errors": [],
  "warnings": ["Tier multiplier seems high"],
  "comparison": {
    "existingTier": {
      "name": "UberX",
      "tierMultiplier": 1.0
    },
    "differences": {
      "tierMultiplier": 0.5
    },
    "competitiveness": "more_expensive"
  }
}
```

## ⚙️ Configuración de Multiplicadores

### Rango de Valores Recomendados
```typescript
const multiplierRanges = {
  tierMultiplier: { min: 0.5, max: 5.0 },     // 50% descuento a 5x precio
  surgeMultiplier: { min: 1.0, max: 10.0 },   // Sin surge a 10x surge
  demandMultiplier: { min: 1.0, max: 5.0 },   // Sin demanda a 5x demanda
  luxuryMultiplier: { min: 1.0, max: 3.0 },   // Sin lujo a 3x lujo
  comfortMultiplier: { min: 1.0, max: 2.0 }   // Sin confort a 2x confort
};
```

### Ejemplos de Configuración Personalizada
```json
{
  "name": "Eco-Friendly",
  "tierMultiplier": 1.1,     // 10% más que economy
  "surgeMultiplier": 0.9,    // 10% descuento en surge
  "demandMultiplier": 1.0,
  "luxuryMultiplier": 1.0,
  "comfortMultiplier": 1.0,
  "priority": 5              // Baja prioridad de display
}
```

## 📈 Operaciones Masivas

### Actualización de Multiplicadores
```bash
POST /admin/pricing/ride-tiers/bulk-update
{
  "tierIds": [1, 2, 3],
  "adjustmentType": "percentage",
  "adjustmentValue": 10,
  "field": "tierMultiplier"  // Campo a actualizar
}
# Aumenta tierMultiplier en 10% para tiers seleccionados
```

### Resultado de Operación Masiva
```json
{
  "message": "Bulk pricing update completed",
  "results": [
    {
      "tierId": 1,
      "success": true,
      "data": { "tierMultiplier": 1.1 }
    }
  ],
  "successful": 3,
  "failed": 0
}
```

## 📋 Modelo de Base de Datos

### Estructura RideTier Extendida
```prisma
model RideTier {
  id            Int     @id @default(autoincrement())
  name          String  @db.VarChar(50)

  // Base pricing
  baseFare      Decimal @db.Decimal(10, 2)
  perMinuteRate Decimal @db.Decimal(10, 2)
  perMileRate   Decimal @db.Decimal(10, 2)
  imageUrl      String? @db.VarChar(255)

  // Tier-specific multipliers
  tierMultiplier     Decimal @default(1.0) @db.Decimal(3, 2)
  surgeMultiplier    Decimal @default(1.0) @db.Decimal(3, 2)
  demandMultiplier   Decimal @default(1.0) @db.Decimal(3, 2)
  luxuryMultiplier   Decimal @default(1.0) @db.Decimal(3, 2)
  comfortMultiplier  Decimal @default(1.0) @db.Decimal(3, 2)

  // Operational settings
  minPassengers      Int @default(1)
  maxPassengers      Int @default(4)
  isActive          Boolean @default(true) @map("is_active")
  priority          Int @default(1)

  // Relations
  rides         Ride[]
  vehicleTypes  TierVehicleType[]

  @@map("ride_tiers")
}
```

## 🔍 Análisis y Reportes

### Resumen de Tiers
```json
{
  "totalTiers": 4,
  "activeTiers": 4,
  "totalRides": 1250,
  "averageTierMultiplier": 1.7,
  "tierDistribution": {
    "economy": 1,    // UberX
    "comfort": 1,    // UberXL
    "premium": 1,    // Comfort
    "luxury": 1      // Uber Black
  }
}
```

### Métricas por Tier
Cada tier incluye:
- Número total de rides
- Ingresos promedio por ride
- Utilización por hora del día
- Ratings promedio de usuarios
- Tasa de cancelación

## 🌟 Estrategias de Pricing por Tier

### Posicionamiento de Mercado
- **Economy**: Atracción de volumen masivo
- **Comfort**: Equilibrio precio/valor
- **Premium**: Experiencia superior
- **Luxury**: Exclusividad máxima

### Optimización Dinámica
```javascript
// Lógica de ajuste automático
function optimizeTierPricing(tier, marketConditions) {
  if (marketConditions.highDemand) {
    tier.surgeMultiplier *= 1.5;  // Aumentar en demanda alta
  }

  if (marketConditions.lowSupply) {
    tier.demandMultiplier *= 1.2; // Compensar baja oferta
  }

  if (tier.name === 'UberX' && marketConditions.peakHour) {
    tier.tierMultiplier *= 1.3;   // UberX más caro en hora pico
  }
}
```

### Testing A/B
```json
{
  "experiment": "tier_pricing_test",
  "variants": [
    {
      "name": "control",
      "tierMultiplier": 1.0
    },
    {
      "name": "variant_a",
      "tierMultiplier": 1.1  // 10% más caro
    },
    {
      "name": "variant_b",
      "tierMultiplier": 0.9  // 10% más barato
    }
  ],
  "metrics": ["conversion_rate", "average_fare", "user_satisfaction"]
}
```

## 🚨 Consideraciones Estratégicas

### Impacto en la Plataforma
- **Diferenciación**: Tiers claros mejoran la experiencia de usuario
- **Monetización**: Precios más altos en tiers premium
- **Competitividad**: Mantener equilibrio con competidores
- **Escalabilidad**: Fácil agregar nuevos tiers

### Experiencia de Usuario
- **Claridad**: Precios transparentes por tier
- **Elección**: Opciones para diferentes presupuestos
- **Valor Percibido**: Cada tier ofrece valor proporcional
- **Lealtad**: Usuarios eligen tiers según preferencias

### Operaciones
- **Asignación**: Drivers pueden elegir tiers preferidos
- **Capacidad**: Diferentes tiers requieren diferentes vehículos
- **Mantenimiento**: Tiers premium necesitan más mantenimiento
- **Soporte**: Diferentes niveles de servicio al cliente

---

**🎯 Los multiplicadores por tier convierten las tarifas base en experiencias de precio personalizadas, permitiendo que cada nivel de servicio tenga su propia estrategia de monetización mientras mantiene la consistencia general del sistema.**
