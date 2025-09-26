# 💰 Guía de Base Pricing - Tarifas Globales

## 🎯 Descripción General

El sistema de **Base Pricing** establece las tarifas fundamentales que sirven como base para todo el sistema de precios dinámicos de Uber Clone. Estas tarifas base se combinan con multiplicadores regionales y dinámicos para calcular el precio final de cada viaje.

## 📋 Arquitectura de Pricing

### Jerarquía de Precios
```
Tarifa Base (RideTier)
├── País × Multiplicador Regional
├── Estado × Multiplicador Local
├── Ciudad × Multiplicador Urbano
└── Zona × Multiplicador Específico
    └── Demanda × Multiplicador Dinámico
        └── Surge × Multiplicador Temporal
```

### Componentes Base
- **Base Fare**: Tarifa mínima por viaje
- **Per Minute Rate**: Costo por minuto de viaje
- **Per Mile Rate**: Costo por milla/kilómetro recorrido

## 🏗️ Modelo de Tarifas Base

### Estructura RideTier
```prisma
model RideTier {
  id            Int     @id @default(autoincrement())
  name          String  @db.VarChar(50)          // Nombre del tier (UberX, Premium)
  baseFare      Decimal @db.Decimal(10, 2)       // Tarifa base en centavos
  perMinuteRate Decimal @db.Decimal(10, 2)       // Centavos por minuto
  perMileRate   Decimal @db.Decimal(10, 2)       // Centavos por milla
  imageUrl      String?                           // URL de imagen del tier
  // ... relaciones
}
```

### Ejemplos de Tiers
```json
{
  "name": "UberX",
  "baseFare": 250,      // $2.50
  "perMinuteRate": 15,  // $0.15/min
  "perMileRate": 120    // $1.20/mile
}
```

## 🚀 Endpoints de Gestión

### CRUD de Tarifas
```
GET    /admin/pricing/ride-tiers           # Listar todas las tarifas
POST   /admin/pricing/ride-tiers           # Crear nueva tarifa
GET    /admin/pricing/ride-tiers/:id       # Obtener tarifa específica
PATCH  /admin/pricing/ride-tiers/:id       # Actualizar tarifa
DELETE /admin/pricing/ride-tiers/:id       # Eliminar tarifa
```

### Funciones Avanzadas
```
POST  /admin/pricing/ride-tiers/calculate-pricing    # Calcular precio completo
POST  /admin/pricing/ride-tiers/validate-pricing     # Validar configuración
GET   /admin/pricing/ride-tiers/summary/overview     # Resumen de pricing
POST  /admin/pricing/ride-tiers/bulk-update          # Actualización masiva
```

## 💰 Cálculo de Precios

### Fórmula Base
```
Precio Total = Base Fare + (Duración × Per Minute Rate) + (Distancia × Per Mile Rate)
```

### Ejemplo Práctico
```javascript
const ride = {
  distance: 5.2,    // 5.2 millas
  duration: 15,     // 15 minutos
  tier: {
    baseFare: 250,      // $2.50
    perMinuteRate: 15,  // $0.15/min
    perMileRate: 120    // $1.20/mile
  }
};

const basePrice = ride.tier.baseFare +
                 (ride.duration * ride.tier.perMinuteRate) +
                 (ride.distance * ride.tier.perMileRate);

// Resultado: 250 + (15×15) + (5.2×120) = 250 + 225 + 624 = $1,099 ($10.99)
```

## 🛡️ Validaciones de Pricing

### Reglas de Negocio
- **Base Fare**: Mínimo 50¢, máximo 5,000¢ ($50)
- **Per Minute**: Mínimo 5¢, máximo 200¢
- **Per Mile**: Mínimo 20¢, máximo 500¢
- **Nombres únicos**: No se permiten tiers duplicados

### Validación Competitiva
```json
{
  "isValid": true,
  "warnings": ["Precio parece competitivo"],
  "comparison": {
    "existingTier": { "name": "UberXL", "baseFare": 350 },
    "differences": { "baseFare": -50 },
    "competitiveness": "more_competitive"
  }
}
```

## 📊 Análisis y Reportes

### Resumen de Pricing
```json
{
  "totalTiers": 5,
  "activeTiers": 5,
  "totalRides": 15420,
  "averageBaseFare": 287.5,
  "priceRanges": {
    "lowest": 200,
    "highest": 500
  }
}
```

### Métricas por Tier
Cada tier incluye:
- Número total de rides
- Ingresos promedio
- Utilización por hora/día
- Ratings promedio

## ⚡ Operaciones Masivas

### Actualización Porcentual
```bash
POST /admin/pricing/ride-tiers/bulk-update
{
  "tierIds": [1, 2, 3],
  "adjustmentType": "percentage",
  "adjustmentValue": 10,
  "field": "baseFare"
}
// Aumenta baseFare en 10% para tiers 1, 2, 3
```

### Actualización Fija
```bash
POST /admin/pricing/ride-tiers/bulk-update
{
  "tierIds": [1, 2, 3],
  "adjustmentType": "fixed",
  "adjustmentValue": 50,
  "field": "perMileRate"
}
// Aumenta perMileRate en 50¢ para tiers 1, 2, 3
```

## 🔄 Integración con Pricing Regional

### Multiplicadores Jerárquicos
```json
{
  "countryMultiplier": 1.0,    // USA
  "stateMultiplier": 1.2,      // California (+20%)
  "cityMultiplier": 1.3,       // Los Angeles (+30%)
  "zoneMultiplier": 1.5,       // Downtown (+50%)
  "totalRegional": 2.34        // Multiplicador total
}
```

### Cálculo Completo
```javascript
const finalPrice = calculateBasePrice(ride) *
                  regionalMultipliers.totalRegional *
                  surgeMultiplier *
                  demandMultiplier +
                  serviceFees +
                  taxes;
```

## 📋 Archivo de Ejemplo

### Estructura CSV
```csv
name,baseFare,perMinuteRate,perMileRate,imageUrl
UberX,250,15,120,https://example.com/uberx.png
UberXL,350,20,150,https://example.com/uberxl.png
Premium,500,25,200,https://example.com/premium.png
```

## 🚨 Consideraciones Importantes

### Impacto en la Plataforma
- **Cambios de precio**: Afectan inmediatamente a todos los usuarios
- **Competitividad**: Precios demasiado altos pueden reducir demanda
- **Rentabilidad**: Precios demasiado bajos pueden afectar ingresos

### Estrategias de Pricing
- **Mercados premium**: Ciudades grandes, horas pico
- **Mercados sensibles**: Áreas rurales, competidores agresivos
- **Testing A/B**: Probar precios en mercados piloto

### Monitoreo Continuo
- **KPIs de precio**: Conversión, retención, satisfacción
- **Análisis competitivo**: Comparación con mercado
- **Ajustes dinámicos**: Respuesta a cambios en demanda

## 🌟 Mejores Prácticas

### Diseño de Tiers
1. **UberX**: Opción económica, volumen alto
2. **UberXL**: Para grupos, precio medio
3. **Premium**: Servicio de lujo, precio alto

### Actualizaciones de Precio
- **Horarios off-peak**: Descuentos para aumentar demanda
- **Eventos especiales**: Ajustes temporales para conciertos/deportes
- **Condiciones climáticas**: Aumentos durante lluvia/nieve

### Comunicación
- **Transparencia**: Usuarios deben entender el pricing
- **Notificaciones**: Avisar de cambios importantes
- **Soporte**: Explicar lógica de precios dinámicos

---

**💰 Las tarifas base son el fundamento de todo el sistema de monetización. Una configuración correcta maximiza ingresos mientras mantiene la competitividad y satisfacción del usuario.**
