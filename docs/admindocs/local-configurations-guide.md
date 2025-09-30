# 🌍 Guía de Configuraciones Locales

## 🎯 Descripción General

El sistema de **Configuraciones Locales** permite adaptar la plataforma a las particularidades de cada jurisdicción geográfica. Desde monedas y horarios hasta regulaciones específicas, cada nivel geográfico puede tener sus propias reglas operativas.

## 🏗️ Arquitectura Jerárquica de Configuraciones

```
🌍 País (Country)
├── 🏛️ Estado/Provincia (State)
    ├── 🏙️ Ciudad (City)
        └── 🎯 Zona de Servicio (Service Zone)
```

Cada nivel hereda configuraciones del nivel superior pero puede sobreescribirlas.

## 💰 Configuraciones Monetarias y Fiscales

### País - Moneda Base
```json
{
  "currencyCode": "USD",
  "currencyName": "United States Dollar",
  "currencySymbol": "$",
  "vatRate": 8.25,
  "corporateTaxRate": 21.0,
  "incomeTaxRate": 37.0
}
```

### Estado - Ajustes Regionales
```json
{
  "pricingMultiplier": 1.2,
  "serviceFee": 2.5
}
```

### Ciudad - Ajustes Locales
```json
{
  "pricingMultiplier": 1.3,
  "serviceFee": 1.5
}
```

## 🕐 Horarios de Servicio Regionales

### Configuración por País
```json
{
  "businessHours": {
    "monday": "00:00-23:59",
    "tuesday": "00:00-23:59",
    "wednesday": "00:00-23:59",
    "thursday": "00:00-23:59",
    "friday": "00:00-23:59",
    "saturday": "00:00-23:59",
    "sunday": "00:00-23:59"
  },
  "publicHolidays": [
    "2024-01-01", // New Year's Day
    "2024-07-04", // Independence Day
    "2024-12-25"  // Christmas Day
  ],
  "timeRestrictions": {
    "curfew": null,
    "rushHour": ["07:00-09:00", "17:00-19:00"]
  }
}
```

### Configuración por Estado
```json
{
  "stateBusinessHours": {
    "monday": "06:00-22:00",
    "tuesday": "06:00-22:00",
    "wednesday": "06:00-22:00",
    "thursday": "06:00-22:00",
    "friday": "06:00-22:00",
    "saturday": "08:00-22:00",
    "sunday": "08:00-20:00"
  },
  "stateHolidays": [
    "2024-03-17" // St. Patrick's Day (specific to some states)
  ]
}
```

### Configuración por Ciudad
```json
{
  "cityBusinessHours": {
    "monday": "05:00-23:00",
    "tuesday": "05:00-23:00",
    "wednesday": "05:00-23:00",
    "thursday": "05:00-23:00",
    "friday": "05:00-23:00",
    "saturday": "06:00-23:00",
    "sunday": "07:00-21:00"
  },
  "cityHolidays": [
    "2024-02-14" // Valentine's Day (city-specific celebration)
  ]
}
```

## ⚖️ Regulaciones y Restricciones

### País - Regulaciones Nacionales
```json
{
  "legalRequirements": {
    "driverAge": 21,
    "vehicleInspection": "annual",
    "insurance": "required",
    "backgroundCheck": true
  },
  "regionalSettings": {
    "maxFare": 500,
    "minFare": 5,
    "maxTripDistance": 100,
    "maxTripDuration": 180
  }
}
```

### Estado - Regulaciones Estatales
```json
{
  "localRestrictions": {
    "alcoholTransport": "restricted",
    "petTransport": "allowed",
    "maxPassengers": 4
  },
  "stateSettings": {
    "tollIntegration": true,
    "parkingValidation": false
  }
}
```

### Ciudad - Regulaciones Municipales
```json
{
  "municipalLaws": {
    "congestionCharge": true,
    "lowEmissionZone": true,
    "parkingPermits": "required"
  },
  "citySettings": {
    "bikeLanes": true,
    "pedestrianZones": ["downtown", "old_town"]
  }
}
```

## 🎯 Zonas de Servicio - Restricciones Locales

### Áreas Restringidas
```json
{
  "restrictedAreas": [
    "airport",
    "military_base",
    "hospital",
    "school_zone"
  ]
}
```

### Zonas Premium
```json
{
  "premiumZones": [
    "downtown",
    "financial_district",
    "tourist_area",
    "stadium"
  ]
}
```

## 🌐 Idiomas y Localización

### País - Idiomas Oficiales
```json
{
  "supportedLanguages": ["en", "es", "fr"],
  "defaultLanguage": "en",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h"
}
```

### Configuraciones Regionales
```json
{
  "measurementSystem": "imperial", // or "metric"
  "drivingSide": "right", // or "left"
  "addressFormat": "US"
}
```

## 🚀 Endpoints de Configuración

### Gestión por País
```
GET    /admin/geography/countries/:id/config         # Obtener configuraciones
PATCH  /admin/geography/countries/:id/config         # Actualizar configuraciones
POST   /admin/geography/countries/:id/validate-config # Validar configuraciones
```

### Gestión por Estado
```
GET    /admin/geography/states/:id/config             # Obtener configuraciones
PATCH  /admin/geography/states/:id/config             # Actualizar configuraciones
```

### Gestión por Ciudad
```
GET    /admin/geography/cities/:id/config             # Obtener configuraciones
PATCH  /admin/geography/cities/:id/config             # Actualizar configuraciones
```

## 📊 Ejemplos de Configuración

### Estados Unidos
```json
{
  "currencyCode": "USD",
  "businessHours": {
    "monday": "00:00-23:59",
    "sunday": "00:00-23:59"
  },
  "publicHolidays": ["2024-01-01", "2024-07-04", "2024-12-25"],
  "legalRequirements": {
    "driverAge": 21,
    "backgroundCheck": true
  },
  "regionalSettings": {
    "measurementSystem": "imperial",
    "drivingSide": "right"
  }
}
```

### California (Estado)
```json
{
  "stateBusinessHours": {
    "monday": "05:00-23:00",
    "sunday": "06:00-22:00"
  },
  "localRestrictions": {
    "alcoholTransport": "restricted",
    "maxPassengers": 6
  },
  "stateSettings": {
    "tollIntegration": true
  }
}
```

### Los Angeles (Ciudad)
```json
{
  "cityBusinessHours": {
    "monday": "04:00-24:00",
    "sunday": "05:00-23:00"
  },
  "municipalLaws": {
    "congestionCharge": true,
    "lowEmissionZone": true
  },
  "citySettings": {
    "bikeLanes": true,
    "pedestrianZones": ["hollywood", "downtown"]
  }
}
```

## 🔄 Herencia de Configuraciones

### Orden de Prioridad
```
1. Zona de Servicio (más específico)
2. Ciudad
3. Estado
4. País (más general)
```

### Ejemplo de Herencia
```typescript
// Configuración efectiva para una zona en Los Angeles
const effectiveConfig = {
  currency: zone.currency || city.currency || state.currency || country.currency,
  businessHours: zone.businessHours || city.cityBusinessHours || state.stateBusinessHours || country.businessHours,
  pricingMultiplier: zone.pricingMultiplier * city.pricingMultiplier * state.pricingMultiplier * country.pricingMultiplier,
  restrictions: {
    ...country.legalRequirements,
    ...state.localRestrictions,
    ...city.municipalLaws,
    ...zone.restrictions
  }
};
```

## ⚡ Validación de Configuraciones

### Validaciones Automáticas
- ✅ **Horarios**: Formato HH:MM válido
- ✅ **Fechas**: Formato YYYY-MM-DD válido
- ✅ **Coordenadas**: Rangos geográficos válidos
- ✅ **Monedas**: Códigos ISO válidos
- ✅ **Porcentajes**: Valores entre 0-100

### Validación de Conflictos
```json
{
  "isValid": false,
  "errors": [
    "Business hours overlap with restricted hours",
    "Holiday date conflicts with operating schedule"
  ],
  "warnings": [
    "Pricing multiplier seems too high",
    "Consider adding more public holidays"
  ]
}
```

## 📈 Casos de Uso

### 1. Expansión Internacional
```bash
# Configurar México
POST /admin/geography/countries
{
  "name": "Mexico",
  "isoCode2": "MX",
  "currencyCode": "MXN",
  "businessHours": {
    "monday": "06:00-22:00",
    "sunday": "08:00-20:00"
  },
  "publicHolidays": ["2024-01-01", "2024-05-05", "2024-09-16"]
}
```

### 2. Regulaciones Estatales
```bash
# California con regulaciones ambientales
PATCH /admin/geography/states/5
{
  "localRestrictions": {
    "lowEmissionZone": true,
    "carpoolLanes": "required"
  },
  "stateSettings": {
    "environmentalCompliance": true
  }
}
```

### 3. Eventos Especiales
```bash
# Configuración para Super Bowl
PATCH /admin/geography/cities/1
{
  "cityHolidays": ["2024-02-11"],
  "municipalLaws": {
    "eventRestrictions": "super_bowl",
    "trafficControl": true
  }
}
```

## 🔧 Mantenimiento y Actualizaciones

### Actualizaciones Automáticas
- **Festivos**: Actualización anual automática
- **Horarios**: Ajustes por cambios legislativos
- **Regulaciones**: Monitoreo de cambios legales

### Auditoría de Cambios
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "user": "admin@uber.com",
  "action": "UPDATE_COUNTRY_CONFIG",
  "changes": {
    "businessHours.monday": "05:00-23:00 → 04:00-24:00",
    "regionalSettings.maxFare": "500 → 600"
  }
}
```

## 🌟 Beneficios Estratégicos

### Para la Plataforma
- **Cumplimiento Legal**: Adaptación automática a regulaciones locales
- **Experiencia Localizada**: Servicio adaptado a costumbres regionales
- **Optimización de Costos**: Precios ajustados a mercados locales
- **Expansión Global**: Configuración rápida para nuevos mercados

### Para Usuarios
- **Transparencia**: Precios y reglas claras por región
- **Disponibilidad**: Servicio disponible según horarios locales
- **Confianza**: Cumplimiento con regulaciones locales

### Para Conductores
- **Claridad Regulatoria**: Reglas claras y específicas
- **Oportunidades Locales**: Trabajo adaptado a restricciones regionales
- **Compensación Justa**: Precios ajustados a mercados locales

---

**🌍 Las configuraciones locales convierten la plataforma global en una experiencia verdaderamente local, respetando las particularidades culturales, legales y operativas de cada jurisdicción.**
