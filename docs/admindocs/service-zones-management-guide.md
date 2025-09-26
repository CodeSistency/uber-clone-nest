# 🎯 Guía de Gestión de Zonas de Servicio

## 🎯 Descripción General

El sistema de **Zonas de Servicio** proporciona control granular sobre la cobertura geográfica de la plataforma. Cada zona define áreas específicas dentro de las ciudades con configuraciones operativas, de pricing y restricciones propias.

## 📋 Arquitectura de Zonas

### Tipos de Zona
- **regular**: Zonas estándar con pricing base
- **premium**: Zonas de alta demanda con pricing elevado
- **restricted**: Zonas con acceso limitado o restricciones

### Estructura Jerárquica
```
País → Estado → Ciudad → Zona de Servicio
                    └── Múltiples zonas por ciudad
```

## 🗺️ Geometrías y Límites

### Formato GeoJSON
```json
{
  "type": "Polygon",
  "coordinates": [[
    [longitude1, latitude1],
    [longitude2, latitude2],
    [longitude3, latitude3],
    [longitude4, latitude4],
    [longitude1, latitude1]  // Cerrar el polígono
  ]]
}
```

### Centroide de Zona
Cada zona tiene coordenadas centrales calculadas para:
- Optimización de búsquedas GPS
- Cálculos de distancia
- Referencia geográfica

## ⚙️ Configuraciones Operativas

### Gestión de Conductores
```json
{
  "maxDrivers": 50,     // Máximo de conductores simultáneos
  "minDrivers": 10      // Mínimo requerido para operación
}
```

### Horarios Pico
```json
{
  "peakHours": {
    "weekdays": ["07:00-09:00", "17:00-19:00"],
    "weekends": ["10:00-22:00"]
  }
}
```

### Pricing Dinámico
```json
{
  "pricingMultiplier": 1.5,    // Multiplicador base
  "demandMultiplier": 1.8      // Factor de demanda adicional
}
```

## 🚀 Endpoints Disponibles

### Gestión de Zonas
```
GET    /admin/geography/service-zones           # Listar con filtros avanzados
POST   /admin/geography/service-zones           # Crear zona con geometría
GET    /admin/geography/service-zones/:id       # Detalles completos
PATCH  /admin/geography/service-zones/:id       # Actualizar configuración
DELETE /admin/geography/service-zones/:id       # Eliminar zona
PATCH  /admin/geography/service-zones/:id/toggle-status # Cambiar estado
```

### Validación y Análisis
```
POST  /admin/geography/service-zones/validate-geometry    # Validar geometría
GET   /admin/geography/service-zones/coverage-analysis/city/:id # Análisis de cobertura
GET   /admin/geography/service-zones/pricing-matrix/city/:id   # Matriz de pricing
POST  /admin/geography/service-zones/bulk-update-status        # Actualización masiva
```

### Consultas Especializadas
```
GET /admin/geography/service-zones/by-city/:id  # Zonas por ciudad
```

## 📊 Filtros y Consultas Avanzadas

### Filtros Jerárquicos
- **Ciudad**: Filtrar por cityId específico
- **Estado**: Filtrar por stateId (a través de ciudad)
- **Tipo**: regular, premium, restricted
- **Estado**: Activo/inactivo

### Ordenamiento
- **name**: Nombre de la zona
- **createdAt**: Fecha de creación
- **zoneType**: Tipo de zona
- **pricingMultiplier**: Por pricing

### Ejemplos de Filtrado
```bash
# Zonas premium de Los Angeles
GET /admin/geography/service-zones?cityId=1&zoneType=premium&isActive=true

# Zonas ordenadas por pricing
GET /admin/geography/service-zones?sortBy=pricingMultiplier&sortOrder=desc

# Zonas por estado
GET /admin/geography/service-zones?stateId=1
```

## 🛡️ Validación de Geometrías

### Validaciones Automáticas
- ✅ **Formato GeoJSON**: Estructura correcta
- ✅ **Coordenadas**: Rangos válidos (-180/+180, -90/+90)
- ✅ **Topología**: Polígonos cerrados y válidos
- ✅ **Solapamientos**: Detección de zonas superpuestas
- ✅ **Área**: Validación de tamaño razonable

### Resultado de Validación
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "Zone covers large area, consider splitting"
  ],
  "coverage": {
    "areaKm2": 25.3,
    "overlapPercentage": 0,
    "gapPercentage": 0
  }
}
```

### Validación en Tiempo Real
```bash
POST /admin/geography/service-zones/validate-geometry
{
  "zoneData": { /* datos de zona */ },
  "cityId": 1,
  "excludeZoneId": 5  // Para actualizaciones
}
```

## 📈 Análisis de Cobertura

### Métricas por Ciudad
```json
{
  "cityId": 1,
  "cityName": "Los Angeles",
  "totalCoverage": 85.5,
  "overlappingArea": 2.3,
  "uncoveredArea": 12.2,
  "coverageByType": {
    "regular": 65.0,
    "premium": 20.5,
    "restricted": 0.0
  },
  "issues": [
    "Zone 1 overlaps with Zone 2"
  ],
  "recommendations": [
    "Add zone for uncovered area in northwest"
  ]
}
```

### Interpretación de Métricas
- **totalCoverage**: Porcentaje de ciudad cubierta
- **overlappingArea**: Zonas redundantes
- **uncoveredArea**: Áreas sin servicio
- **coverageByType**: Distribución por tipo de zona

## 💰 Sistema de Pricing por Zona

### Matriz de Pricing
```json
{
  "cityId": 1,
  "zones": [
    {
      "id": 1,
      "name": "Downtown LA",
      "type": "premium",
      "pricingMultiplier": 1.5,
      "demandMultiplier": 1.8,
      "maxDrivers": 50,
      "minDrivers": 10
    }
  ]
}
```

### Cálculo de Precios Dinámicos
```typescript
const finalPrice = basePrice
  * countryMultiplier    // País
  * stateMultiplier      // Estado
  * cityMultiplier       // Ciudad
  * zoneMultiplier       // Zona específica
  * demandMultiplier     // Factor de demanda
  + cityServiceFee       // Cargo por ciudad
  + zoneServiceFee;      // Cargo por zona
```

### Ejemplo Práctico
```
Base Price: $10.00
USA (1.0x) × California (1.2x) × Los Angeles (1.3x) × Downtown (1.5x) × High Demand (1.8x)
= $42.12 total
```

## ⚡ Operaciones Masivas

### Actualización Bulk de Estado
```bash
POST /admin/geography/service-zones/bulk-update-status
{
  "zoneIds": [1, 2, 3, 5, 8],
  "isActive": false
}
```

**Respuesta:**
```json
{
  "message": "Bulk status update completed",
  "results": [
    { "zoneId": 1, "success": true, "data": {...} },
    { "zoneId": 2, "success": false, "error": "Zone not found" }
  ],
  "successful": 4,
  "failed": 1
}
```

## 📋 Archivo de Ejemplo CSV

Se incluye `docs/service-zones-example.csv` con zonas de ejemplo.

### Estructura del CSV
```csv
cityId,name,zoneType,boundaries,centerLat,centerLng,pricingMultiplier,maxDrivers,minDrivers,demandMultiplier,peakHours
1,Downtown LA,premium,"{""type"":""Polygon""...}",34.04,-118.24,1.5,50,10,1.8,"{""weekdays"":[""07:00-09:00""]}"
```

**Nota**: Las geometrías GeoJSON deben estar correctamente formateadas.

## 🔗 Integración con Matching

### Algoritmos de Asignación
- **Zona Primaria**: Punto de recogida determina zona
- **Capacidad**: Respetar límites maxDrivers/minDrivers
- **Pricing**: Aplicar multiplicadores específicos
- **Disponibilidad**: Solo conductores en zona activa

### Optimización de Rutas
- **Intra-zona**: Rutas dentro de misma zona
- **Inter-zona**: Rutas entre zonas adyacentes
- **Capacidad**: Redistribución automática por demanda

## 📊 Monitoreo y Analytics

### KPIs por Zona
- **Cobertura**: Área efectiva vs total
- **Utilización**: Viajes por zona
- **Rentabilidad**: Ingresos vs costos
- **Satisfacción**: Ratings por zona

### Reportes Automatizados
- **Cobertura Diaria**: Cambios en áreas cubiertas
- **Performance**: Métricas por tipo de zona
- **Alertas**: Zonas con baja cobertura o sobrecarga

## ⚠️ Consideraciones Técnicas

### Performance
- **Índices Geoespaciales**: Optimización de consultas GPS
- **Cache**: Coordenadas y límites en memoria
- **Paginación**: Grandes datasets de zonas
- **Validación**: Checks en tiempo real vs batch

### Escalabilidad
- **Sharding**: Zonas por región geográfica
- **PostGIS**: Para análisis geoespacial avanzado
- **CDN**: Distribución de geometrías estáticas
- **Microservicios**: Separación por continente/país

### Seguridad
- **Validación**: Sanitización de geometrías
- **Rate Limiting**: Prevención de abuso de APIs
- **Auditoría**: Logs de cambios en zonas críticas
- **Backup**: Recuperación de configuraciones

## 🌟 Casos de Uso Avanzados

### 1. Pricing Dinámico por Demanda
```bash
# Zona premium durante evento
PATCH /admin/geography/service-zones/1
{
  "demandMultiplier": 2.5,
  "maxDrivers": 100
}
```

### 2. Restricciones Temporales
```bash
# Zona restringida por construcción
PATCH /admin/geography/service-zones/5
{
  "zoneType": "restricted",
  "isActive": false
}
```

### 3. Expansión de Servicio
```bash
# Nueva zona residencial
POST /admin/geography/service-zones
{
  "name": "New Residential Area",
  "cityId": 1,
  "zoneType": "regular",
  "boundaries": { /* geometría */ },
  "pricingMultiplier": 1.1
}
```

### 4. Análisis de Mercado
```bash
# Matriz completa de pricing
GET /admin/geography/service-zones/pricing-matrix/city/1

# Cobertura por ciudad
GET /admin/geography/service-zones/coverage-analysis/city/1
```

## 🔄 Próximos Pasos

### E6.2: Configuración Regional Completa
- ✅ **T6.2.1**: Zonas de Servicio ✅ (Completado)
- ⏳ **T6.2.2**: Configuraciones Locales
- ⏳ **T6.2.3**: Pricing Dinámico por Zona

### E6.3: Sistema de Pricing Granular
- ⏳ **T6.3.1**: Algoritmos de Multiplicadores
- ⏳ **T6.3.2**: Integración con Demanda
- ⏳ **T6.3.3**: Testing de Precisión

---

**🎯 Las zonas de servicio proporcionan el control más granular sobre operaciones, pricing y cobertura geográfica, permitiendo una plataforma ultra-personalizada por ubicación.**
