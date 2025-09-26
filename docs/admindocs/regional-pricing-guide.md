# 🌍 Guía de Multiplicadores Regionales - Pricing Geográfico

## 🎯 Descripción General

El sistema de **Multiplicadores Regionales** permite ajustar precios automáticamente según la ubicación geográfica. Desde países hasta zonas específicas, cada nivel geográfico puede tener sus propios multiplicadores que se aplican sobre las tarifas base y los multiplicadores por tier.

## 🏗️ Arquitectura Jerárquica de Pricing Regional

### Jerarquía Geográfica Completa
```
🌍 País (Country)
├── 🏛️ Estado/Provincia (State)
    ├── 🏙️ Ciudad (City)
        └── 🎯 Zona de Servicio (Service Zone)
```

### Multiplicadores por Nivel
```
Precio Final = Precio Base × Tier Multipliers × Regional Multipliers × Dynamic Multipliers
```

Donde **Regional Multipliers** incluye:
- País × Estado × Ciudad × Zona de Servicio

## 💰 Multiplicadores por País

### Modelo de País con Pricing
```prisma
model Country {
  // ... existing fields ...

  // Pricing configuration
  pricingMultiplier Decimal @default(1.0) @map("pricing_multiplier") @db.Decimal(3, 2)

  // Currency and economic factors
  currencyCode      String   @map("currency_code") @db.VarChar(3)
  currencyName      String?  @map("currency_name") @db.VarChar(50)
  vatRate          Decimal? @map("vat_rate") @db.Decimal(5, 2)

  // Regional service configurations
  businessHours     Json?    @map("business_hours")
  publicHolidays    Json?    @map("public_holidays")
  timeRestrictions  Json?    @map("time_restrictions")
  regionalSettings  Json?    @map("regional_settings")
}
```

### Ejemplos de Multiplicadores por País
```json
[
  {
    "name": "United States",
    "isoCode2": "US",
    "currencyCode": "USD",
    "pricingMultiplier": 1.0,    // Base reference
    "vatRate": 8.25
  },
  {
    "name": "Canada",
    "isoCode2": "CA",
    "currencyCode": "CAD",
    "pricingMultiplier": 1.1,    // 10% more than US
    "vatRate": 5.0
  },
  {
    "name": "United Kingdom",
    "isoCode2": "GB",
    "currencyCode": "GBP",
    "pricingMultiplier": 1.3,    // 30% more than US
    "vatRate": 20.0
  },
  {
    "name": "Japan",
    "isoCode2": "JP",
    "currencyCode": "JPY",
    "pricingMultiplier": 0.8,    // 20% less than US
    "vatRate": 10.0
  }
]
```

## 🏛️ Multiplicadores por Estado/Provincia

### Modelo de Estado con Pricing
```prisma
model State {
  // ... existing fields ...

  // Geographic data
  latitude     Decimal? @db.Decimal(9, 6)
  longitude    Decimal? @db.Decimal(9, 6)
  timezone     String?  @db.VarChar(50)

  // Pricing configuration
  pricingMultiplier Decimal @default(1.0) @map("pricing_multiplier") @db.Decimal(3, 2)
  serviceFee       Decimal? @map("service_fee") @db.Decimal(5, 2)

  // Regional configurations
  stateBusinessHours Json? @map("state_business_hours")
  stateHolidays     Json? @map("state_holidays")
  localRestrictions Json? @map("local_restrictions")
  stateSettings     Json? @map("state_settings")
}
```

### Ejemplos de Multiplicadores por Estado
```json
[
  {
    "name": "California",
    "code": "CA",
    "countryId": 1,
    "pricingMultiplier": 1.2,    // 20% more than national average
    "serviceFee": 2.5,           // Additional $2.50 service fee
    "stateSettings": {
      "highDemandArea": true,
      "environmentalFee": 1.0
    }
  },
  {
    "name": "Texas",
    "code": "TX",
    "countryId": 1,
    "pricingMultiplier": 0.9,    // 10% less than national average
    "serviceFee": 1.5,           // Lower service fee
    "stateSettings": {
      "largeState": true,
      "ruralAreas": true
    }
  },
  {
    "name": "New York",
    "code": "NY",
    "countryId": 1,
    "pricingMultiplier": 1.4,    // 40% more than national average
    "serviceFee": 3.0,           // Higher service fee for premium market
    "stateSettings": {
      "premiumMarket": true,
      "congestionCharge": true
    }
  }
]
```

## 🏙️ Multiplicadores por Ciudad

### Modelo de Ciudad con Pricing
```prisma
model City {
  // ... existing fields ...

  // Geographic data
  latitude     Decimal @db.Decimal(9, 6)
  longitude    Decimal @db.Decimal(9, 6)
  timezone     String  @db.VarChar(50)

  // Pricing configuration
  pricingMultiplier Decimal @default(1.0) @map("pricing_multiplier") @db.Decimal(3, 2)
  serviceFee       Decimal? @map("service_fee") @db.Decimal(5, 2)

  // Service zones and restrictions
  serviceRadius     Int @default(50)
  restrictedAreas   Json?
  premiumZones      Json?

  // Local configurations
  cityBusinessHours Json? @map("city_business_hours")
  cityHolidays     Json? @map("city_holidays")
  municipalLaws    Json? @map("municipal_laws")
  citySettings     Json? @map("city_settings")
}
```

### Ejemplos de Multiplicadores por Ciudad
```json
[
  {
    "name": "Los Angeles",
    "stateId": 1,
    "pricingMultiplier": 1.3,    // 30% more than state average
    "serviceFee": 1.5,           // Additional city fee
    "serviceRadius": 75,         // Larger service area
    "premiumZones": ["hollywood", "beverly_hills", "downtown"],
    "citySettings": {
      "trafficCongestion": "high",
      "touristDestination": true,
      "environmentalZone": true
    }
  },
  {
    "name": "Houston",
    "stateId": 2,
    "pricingMultiplier": 0.95,   // 5% less than state average
    "serviceFee": 1.0,           // Lower city fee
    "serviceRadius": 60,         // Standard service area
    "citySettings": {
      "largeCity": true,
      "airport": "iah",
      "businessDistrict": true
    }
  },
  {
    "name": "New York City",
    "stateId": 3,
    "pricingMultiplier": 1.5,    // 50% more than state average
    "serviceFee": 2.5,           // Premium city fee
    "serviceRadius": 25,         // Smaller service area (dense city)
    "premiumZones": ["manhattan", "brooklyn_heights", "long_island_city"],
    "citySettings": {
      "congestionPricing": true,
      "peakHourSurcharge": true,
      "bridgeTollIntegration": true
    }
  }
]
```

## 🎯 Multiplicadores por Zona de Servicio

### Modelo de Zona de Servicio con Pricing
```prisma
model ServiceZone {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(100)
  cityId      Int      @map("city_id")

  // Geographic boundaries
  boundaries  Json     // GeoJSON polygon
  centerLat   Decimal  @map("center_lat") @db.Decimal(9, 6)
  centerLng   Decimal  @map("center_lng") @db.Decimal(9, 6)

  // Zone settings
  isActive          Boolean  @default(true) @map("is_active")
  pricingMultiplier Decimal  @default(1.0) @map("pricing_multiplier") @db.Decimal(3, 2)
  maxDrivers        Int?
  minDrivers        Int?

  // Operational settings
  peakHours         Json?
  demandMultiplier  Decimal @default(1.0) @map("demand_multiplier") @db.Decimal(3, 2)
  zoneType          String  @default("regular") @map("zone_type")
}
```

### Tipos de Zonas Especiales
```json
[
  {
    "name": "LAX Airport",
    "cityId": 1,
    "zoneType": "airport",
    "pricingMultiplier": 2.0,    // 100% surcharge for airports
    "demandMultiplier": 1.5,     // High demand area
    "peakHours": {
      "morning": ["05:00-09:00"],
      "evening": ["17:00-21:00"]
    }
  },
  {
    "name": "Times Square",
    "cityId": 3,
    "zoneType": "tourist",
    "pricingMultiplier": 1.8,    // 80% surcharge for tourist areas
    "demandMultiplier": 1.3,     // Popular destination
    "restrictedAreas": ["pedestrian_only"]
  },
  {
    "name": "Wall Street",
    "cityId": 3,
    "zoneType": "business",
    "pricingMultiplier": 1.4,    // 40% surcharge for business district
    "demandMultiplier": 1.2,     // Business hours demand
    "peakHours": {
      "weekday": ["07:00-09:00", "17:00-19:00"]
    }
  },
  {
    "name": "Central Park",
    "cityId": 3,
    "zoneType": "recreational",
    "pricingMultiplier": 1.1,    // 10% surcharge for parks
    "demandMultiplier": 0.9,     // Lower demand in recreational areas
    "restrictedAreas": ["no_private_vehicles"]
  }
]
```

## 💰 Cálculo de Precios Regionales

### Fórmula Completa de Pricing
```
Precio Final = Precio Base × Tier Multipliers × Regional Multipliers × Dynamic Multipliers

Regional Multipliers = País × Estado × Ciudad × Zona
```

### Ejemplo Práctico Completo
```javascript
// Ride desde LAX Airport a Downtown LA
const pricing = {
  basePrice: 1099, // $10.99 (calculado anteriormente)

  tierMultipliers: {
    tier: 1.0,      // UberX
    surge: 1.2,     // 20% surge
    demand: 1.0,
    luxury: 1.0,
    comfort: 1.0
  },

  regionalMultipliers: {
    country: 1.0,   // USA (base)
    state: 1.2,     // California (+20%)
    city: 1.3,      // Los Angeles (+30%)
    zone: 2.0       // LAX Airport (+100%)
  },

  dynamicMultipliers: {
    surge: 1.5,     // Airport surge
    demand: 1.2     // High demand
  }
};

// Cálculo paso a paso
const tierPrice = basePrice *
                 pricing.tierMultipliers.tier *
                 pricing.tierMultipliers.surge *
                 pricing.tierMultipliers.demand *
                 pricing.tierMultipliers.luxury *
                 pricing.tierMultipliers.comfort;
// = $10.99 × 1.0 × 1.2 × 1.0 × 1.0 × 1.0 = $13.19

const regionalPrice = tierPrice *
                     pricing.regionalMultipliers.country *
                     pricing.regionalMultipliers.state *
                     pricing.regionalMultipliers.city *
                     pricing.regionalMultipliers.zone;
// = $13.19 × 1.0 × 1.2 × 1.3 × 2.0 = $41.02

const finalPrice = regionalPrice *
                  pricing.dynamicMultipliers.surge *
                  pricing.dynamicMultipliers.demand;
// = $41.02 × 1.5 × 1.2 = $73.84

// Resultado final: $73.84 para un viaje desde LAX
```

## 🚀 Endpoints de Gestión Regional

### Gestión por País
```
GET    /admin/geography/countries           # Listar países con pricing
POST   /admin/geography/countries           # Crear país con pricing
GET    /admin/geography/countries/:id       # Detalles con pricing
PATCH  /admin/geography/countries/:id       # Actualizar pricing
```

### Gestión por Estado
```
GET    /admin/geography/states              # Listar estados con pricing
POST   /admin/geography/states              # Crear estado con pricing
GET    /admin/geography/states/:id          # Detalles con pricing
PATCH  /admin/geography/states/:id          # Actualizar pricing
```

### Gestión por Ciudad
```
GET    /admin/geography/cities               # Listar ciudades con pricing
POST   /admin/geography/cities               # Crear ciudad con pricing
GET    /admin/geography/cities/:id           # Detalles con pricing
PATCH  /admin/geography/cities/:id           # Actualizar pricing
```

### Gestión de Zonas
```
GET    /admin/geography/service-zones        # Listar zonas con pricing
POST   /admin/geography/service-zones        # Crear zona con pricing
GET    /admin/geography/service-zones/:id    # Detalles con pricing
PATCH  /admin/geography/service-zones/:id    # Actualizar pricing
```

## 📊 Análisis Regional

### Resumen por País
```json
{
  "countryPricing": {
    "name": "United States",
    "pricingMultiplier": 1.0,
    "averageRidePrice": 24.50,
    "totalRides": 125000,
    "revenue": 3062500,
    "topStates": [
      {
        "name": "California",
        "pricingMultiplier": 1.2,
        "contribution": 35
      },
      {
        "name": "New York",
        "pricingMultiplier": 1.4,
        "contribution": 28
      }
    ]
  }
}
```

### Análisis por Ciudad
```json
{
  "cityPricingAnalysis": {
    "name": "New York City",
    "pricingMultiplier": 1.5,
    "zoneBreakdown": {
      "manhattan": {
        "pricingMultiplier": 1.8,
        "averagePrice": 45.00,
        "rideCount": 25000
      },
      "brooklyn": {
        "pricingMultiplier": 1.2,
        "averagePrice": 28.00,
        "rideCount": 18000
      },
      "queens": {
        "pricingMultiplier": 1.1,
        "averagePrice": 22.00,
        "rideCount": 12000
      }
    }
  }
}
```

## ⚙️ Estrategias de Pricing Regional

### Por Tipo de Área
- **Ciudades Grandes**: Multiplicadores altos (1.3x - 1.5x)
- **Áreas Suburbanas**: Multiplicadores medios (1.0x - 1.2x)
- **Áreas Rurales**: Multiplicadores bajos (0.8x - 1.0x)
- **Zonas Turísticas**: Multiplicadores premium (1.5x - 2.0x)

### Por Tipo de Zona Especial
- **Aeropuertos**: 1.5x - 2.5x (alta demanda, acceso limitado)
- **Centros Comerciales**: 1.3x - 1.8x (alta demanda peatonal)
- **Centros de Negocios**: 1.2x - 1.6x (demanda en horas laborales)
- **Áreas Recreativas**: 0.9x - 1.1x (demanda variable)

### Factores de Ajuste
- **Demanda Local**: Población, turismo, eventos
- **Competencia**: Presencia de competidores locales
- **Costos Operativos**: Combustible, seguros, mantenimiento
- **Regulaciones**: Impuestos locales, restricciones

## 🔄 Optimización Dinámica

### Ajustes Automáticos
```typescript
function optimizeRegionalPricing(region, marketData) {
  const { demandLevel, competitorPrices, operationalCosts } = marketData;

  // Ajuste por demanda
  if (demandLevel > 0.8) {
    region.pricingMultiplier *= 1.1; // +10% en alta demanda
  }

  // Ajuste por competencia
  if (competitorPrices.average < region.averagePrice * 0.9) {
    region.pricingMultiplier *= 0.95; // -5% si somos 10% más caros
  }

  // Ajuste por costos
  if (operationalCosts > region.averageCosts * 1.2) {
    region.pricingMultiplier *= 1.05; // +5% para cubrir costos
  }
}
```

### Eventos Especiales
```json
{
  "eventPricing": {
    "name": "Super Bowl Week",
    "city": "New Orleans",
    "dateRange": ["2024-02-01", "2024-02-15"],
    "multiplierAdjustments": {
      "hotels_district": 2.5,    // Zona hotelera
      "superdome_area": 3.0,     // Área del estadio
      "french_quarter": 1.8,     // Barrio turístico
      "airport": 2.2             // Aeropuerto
    },
    "automaticRevert": true      // Revertir después del evento
  }
}
```

## 📈 Reportes y Analytics

### Dashboard Regional
```json
{
  "regionalDashboard": {
    "totalRevenue": 15420000,
    "averageMultiplier": 1.25,
    "topPerformingRegions": [
      {
        "name": "Manhattan, NY",
        "revenue": 3200000,
        "averagePrice": 42.50,
        "rideCount": 75300
      },
      {
        "name": "Los Angeles, CA",
        "revenue": 2800000,
        "averagePrice": 38.75,
        "rideCount": 72300
      }
    ],
    "underperformingRegions": [
      {
        "name": "Rural Texas",
        "revenue": 450000,
        "averagePrice": 18.50,
        "rideCount": 24300,
        "recommendation": "Consider lowering prices or increasing service area"
      }
    ]
  }
}
```

## 🌟 Beneficios Estratégicos

### Para la Plataforma
- ✅ **Optimización de Ingresos**: Precios adaptados a cada mercado
- ✅ **Equidad Regional**: Consideración de costos y demanda locales
- ✅ **Escalabilidad Global**: Fácil expansión a nuevos mercados
- ✅ **Competitividad Local**: Ajustes según competencia regional

### Para los Usuarios
- ✅ **Precios Justos**: Tarifas que reflejan condiciones locales
- ✅ **Accesibilidad**: Precios ajustados a poder adquisitivo local
- ✅ **Transparencia**: Entendimiento de por qué varían los precios
- ✅ **Confiabilidad**: Servicio consistente en todas las ubicaciones

### Para los Drivers
- ✅ **Compensación Equitativa**: Precios que cubren costos operativos
- ✅ **Oportunidades Balanceadas**: Demanda distribuida geográficamente
- ✅ **Planificación**: Predicción de ingresos por zona
- ✅ **Eficiencia**: Optimización de rutas y zonas de trabajo

---

**🌍 Los multiplicadores regionales convierten el pricing global en una experiencia verdaderamente localizada, maximizando ingresos mientras mantienen la equidad y satisfacción en todos los mercados.**
