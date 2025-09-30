# 🏙️ Guía de Gestión de Ciudades

## 🎯 Descripción General

El módulo de gestión de ciudades proporciona control completo sobre las áreas metropolitanas con coordenadas GPS precisas, límites geográficos y configuraciones operativas avanzadas. Cada ciudad puede tener pricing específico, zonas restringidas y áreas premium.

## 📋 Estructura de Datos

### Campos Geográficos
- `latitude/longitude`: Coordenadas GPS del centro de la ciudad
- `boundaries`: Límites geográficos (GeoJSON Polygon)
- `serviceRadius`: Radio de cobertura en kilómetros
- `timezone`: Zona horaria específica de la ciudad

### Campos Operativos
- `pricingMultiplier`: Multiplicador de precios base
- `serviceFee`: Cargo adicional de servicio
- `restrictedAreas`: Zonas donde no se permite servicio
- `premiumZones`: Áreas de alta demanda con pricing especial

### Campos Demográficos
- `population`: Población total
- `areaKm2`: Área en kilómetros cuadrados
- `elevation`: Elevación sobre el nivel del mar
- `postalCodes`: Códigos postales asociados

## 🚀 Endpoints Disponibles

### Gestión de Ciudades
```
GET    /admin/geography/cities           # Listar con filtros avanzados
POST   /admin/geography/cities           # Crear ciudad con coordenadas
GET    /admin/geography/cities/:id       # Obtener detalles completos
PATCH  /admin/geography/cities/:id       # Actualizar configuración
DELETE /admin/geography/cities/:id       # Eliminar ciudad
PATCH  /admin/geography/cities/:id/toggle-status # Cambiar estado
```

### Endpoints Especializados
```
GET /admin/geography/cities/by-state/:stateId     # Ciudades por estado
GET /admin/geography/cities/stats/by-state        # Estadísticas agrupadas
```

## 📊 Filtros y Búsqueda Avanzada

### Filtros Jerárquicos
- **Estado**: Filtrar por stateId específico
- **País**: Filtrar por countryId (a través del estado)
- **Estado Activo**: Solo ciudades operativas
- **Búsqueda**: Por nombre de ciudad

### Ordenamiento Flexible
- **name**: Nombre de la ciudad
- **createdAt**: Fecha de creación
- **population**: Por población

### Ejemplos de Uso Avanzado
```bash
# Ciudades de California ordenadas por población
GET /admin/geography/cities?stateId=1&sortBy=population&sortOrder=desc

# Ciudades activas de Estados Unidos
GET /admin/geography/cities?countryId=1&isActive=true

# Búsqueda de ciudades grandes
GET /admin/geography/cities?search=York&limit=50
```

## 📋 Archivo de Ejemplo CSV

Se incluye `docs/cities-example.csv` con ciudades de múltiples países.

### Estructura del CSV
```csv
stateId,name,latitude,longitude,timezone,serviceRadius,population,areaKm2,elevation,pricingMultiplier,serviceFee,restrictedAreas,premiumZones,postalCodes
1,Los Angeles,34.0522,-118.2437,America/Los_Angeles,60,3976322,1302,89,1.3,1.5,airport,military_zone,downtown,stadium,90001,90002,90003
```

**Nota**: `stateId` debe corresponder a IDs de estados ya existentes.

## ⚙️ Configuraciones de Pricing Granular

### Sistema de Multiplicadores
Cada ciudad puede tener:
- **pricingMultiplier**: Factor base (ej: Los Ángeles 1.3x = 30% más)
- **serviceFee**: Cargo fijo adicional (ej: $1.50 por viaje)
- **Zonas Premium**: Multiplicadores extra en áreas específicas

### Cálculo de Precios por Ciudad
```
Precio Base: $10.00
Ciudad con multiplier 1.3: $13.00
Más serviceFee $1.50: $14.50
Más zona premium 1.2: $17.40 total
```

### Zonas Especiales

#### Restricted Areas
```json
{
  "restrictedAreas": ["airport", "military_zone", "hospital"]
}
```
- **airport**: Aeropuertos con restricciones de seguridad
- **military_zone**: Bases militares
- **hospital**: Complejos hospitalarios

#### Premium Zones
```json
{
  "premiumZones": ["downtown", "stadium", "financial_district"]
}
```
- **downtown**: Centro comercial
- **stadium**: Estadios deportivos
- **financial_district**: Distritos financieros

## 🗺️ Gestión de Límites Geográficos

### Formato GeoJSON
```json
{
  "boundaries": {
    "type": "Polygon",
    "coordinates": [[
      [-118.6682, 34.1858],
      [-118.1553, 34.1858],
      [-118.1553, 33.9019],
      [-118.6682, 33.9019],
      [-118.6682, 34.1858]
    ]]
  }
}
```

### Casos de Uso de Boundaries
- **Zoning preciso**: Definir exactamente dónde opera la plataforma
- **Pricing dinámico**: Diferentes tarifas dentro de la misma ciudad
- **Compliance**: Cumplir con regulaciones locales
- **Optimización**: Mejorar algoritmos de matching

## 🔗 Relaciones y Dependencias

### Jerarquía Completa
```
Países (Country)
├── Estados (State)
    ├── Ciudades (City) ← Actual
        ├── Zonas de Servicio (ServiceZone) ← Próximo
```

### Validaciones de Integridad
- ✅ **Estado Padre**: stateId debe existir y ser válido
- ✅ **Coordenadas GPS**: Validación de lat/lng (-90/+90, -180/+180)
- ✅ **Radio de Servicio**: Entre 1-500 km
- ✅ **Unicidad**: name + stateId deben ser únicos
- ✅ **Dependencias**: No eliminar ciudad con zonas de servicio activas

## 📈 Estadísticas y Analytics

### Estadísticas por Estado
```json
{
  "stats": [
    {
      "stateId": 1,
      "stateName": "California",
      "stateCode": "CA",
      "countryName": "United States",
      "countryCode": "US",
      "citiesCount": 12
    }
  ]
}
```

### Métricas por Ciudad
Cada ciudad incluye:
- Información geográfica completa
- Configuraciones de pricing
- Conteo de zonas de servicio
- Estadísticas demográficas

## 🔒 Permisos y Seguridad

### Permisos Requeridos
- `GEOGRAPHY_READ`: Consultar ciudades y estadísticas
- `GEOGRAPHY_WRITE`: Crear/editar/eliminar ciudades

### Validaciones de Seguridad
- Verificación de existencia del estado padre
- Validación de coordenadas geográficas
- Sanitización de datos GeoJSON
- Límites en arrays de zonas

## 📊 Casos de Uso

### 1. Configuración Inicial por Ciudad
```bash
# 1. Importar estados
POST /admin/geography/states

# 2. Crear ciudades con coordenadas
POST /admin/geography/cities
{
  "name": "Los Angeles",
  "stateId": 1,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "pricingMultiplier": 1.3,
  "serviceRadius": 60,
  "premiumZones": ["downtown", "hollywood"]
}
```

### 2. Pricing Dinámico por Zonas
```bash
# Obtener ciudades con pricing
GET /admin/geography/cities?stateId=1

# Configurar zona premium
PATCH /admin/geography/cities/1
{
  "premiumZones": ["downtown", "stadium", "airport"],
  "pricingMultiplier": 1.4
}
```

### 3. Monitoreo Geográfico
```bash
# Ciudades por estado
GET /admin/geography/cities/by-state/1

# Estadísticas completas
GET /admin/geography/cities/stats/by-state
```

## ⚠️ Consideraciones Importantes

### Orden de Importación
1. **Primero países**: Importar países
2. **Después estados**: Crear estados por país
3. **Finalmente ciudades**: Crear ciudades por estado

### Datos Críticos
- **Coordenadas GPS**: Precisión crítica para matching
- **Límites geográficos**: Afectan cobertura de servicio
- **Pricing**: Impacta directamente en ingresos
- **Zonas restringidas**: Importante para compliance

### Performance
- Consultas optimizadas por stateId
- Índices geográficos para búsquedas GPS
- Paginación eficiente para grandes datasets
- Cache de estadísticas por estado

## 🌍 Integración con Sistema de Pricing

### Jerarquía de Multiplicadores
```
País (Country) → Estado (State) → Ciudad (City) → Zona (ServiceZone)
1.0x          → 1.2x          → 1.3x          → 1.1x          = 1.716x total
```

### Aplicación de Precios
```typescript
const finalPrice = basePrice
  * countryMultiplier
  * stateMultiplier
  * cityMultiplier
  * zoneMultiplier
  + cityServiceFee
  + zoneServiceFee;
```

---

**📝 Nota**: Las ciudades son el núcleo del sistema de pricing geográfico. Una configuración precisa permite precios dinámicos basados en ubicación urbana específica, maximizando tanto ingresos como cobertura de servicio. 🏙️
