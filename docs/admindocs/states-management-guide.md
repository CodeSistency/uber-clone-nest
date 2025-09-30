# 🗺️ Guía de Gestión de Estados/Provincias

## 🎯 Descripción General

El módulo de geografía incluye gestión completa de estados y provincias, con jerarquía dependiente de países. Cada estado puede tener configuraciones específicas de pricing y operación.

## 📋 Estructura de Datos

### Campos Principales
- `name`: Nombre completo del estado/provincia
- `code`: Código oficial (ej: "CA", "TX", "ON")
- `countryId`: ID del país al que pertenece
- `latitude/longitude`: Coordenadas geográficas del centro
- `timezone`: Zona horaria específica
- `isActive`: Estado operativo
- `pricingMultiplier`: Multiplicador de precios
- `serviceFee`: Tarifa adicional de servicio

### Campos Opcionales
- `capital`: Ciudad capital del estado
- `population`: Población del estado
- `areaKm2`: Área en kilómetros cuadrados

## 🚀 Endpoints Disponibles

### Gestión de Estados
```
GET    /admin/geography/states           # Listar con filtros
POST   /admin/geography/states           # Crear estado
GET    /admin/geography/states/:id       # Obtener detalles
PATCH  /admin/geography/states/:id       # Actualizar estado
DELETE /admin/geography/states/:id       # Eliminar estado
PATCH  /admin/geography/states/:id/toggle-status # Cambiar estado
```

### Endpoints Especializados
```
GET /admin/geography/states/by-country/:countryId  # Estados por país
GET /admin/geography/states/stats/by-country       # Estadísticas agrupadas
```

## 📊 Filtros y Búsqueda

### Filtros Disponibles
- **Búsqueda**: Por nombre o código
- **País**: Filtrar por countryId
- **Estado**: Activo/inactivo
- **Ordenamiento**: name, code, createdAt
- **Paginación**: page, limit

### Ejemplos de Uso
```bash
# Estados de Estados Unidos
GET /admin/geography/states?countryId=1&isActive=true

# Búsqueda por nombre
GET /admin/geography/states?search=California

# Estados ordenados por población
GET /admin/geography/states?sortBy=population&sortOrder=desc
```

## 📋 Archivo de Ejemplo CSV

Se incluye `docs/states-example.csv` con estados de países previamente importados.

### Estructura del CSV
```csv
countryId,name,code,latitude,longitude,timezone,capital,population,areaKm2,pricingMultiplier,serviceFee
1,California,CA,36.7783,-119.4179,America/Los_Angeles,Sacramento,39538223,423967,1.2,2.5
```

**Nota**: `countryId` debe corresponder a IDs de países ya existentes en la base de datos.

## ⚙️ Configuraciones de Pricing

### Multiplicadores por Estado
Cada estado puede tener:
- **pricingMultiplier**: Factor base para precios (ej: 1.2 = 20% más)
- **serviceFee**: Cargo adicional fijo (ej: 2.5 USD)

### Ejemplo de Cálculo
```
Precio Base: $10.00
Estado con multiplier 1.2: $12.00
Más serviceFee $2.50: $14.50 total
```

## 🔗 Relaciones y Dependencias

### Jerarquía Geográfica
```
País (Country)
  └── Estados (States)
      └── Ciudades (Cities)
          └── Zonas de Servicio (ServiceZones)
```

### Restricciones
- **Unicidad**: name + countryId deben ser únicos
- **Unicidad**: code + countryId deben ser únicos
- **Dependencias**: No se puede eliminar estado con ciudades asociadas
- **Referencial**: countryId debe existir en tabla countries

## 📈 Estadísticas y Reportes

### Estadísticas por País
```json
{
  "stats": [
    {
      "countryId": 1,
      "countryName": "United States",
      "countryCode": "US",
      "statesCount": 50
    }
  ]
}
```

### Información Detallada por Estado
Cada estado incluye:
- Información básica (name, code, coordinates)
- Metadata (population, area, capital)
- Configuraciones operativas (pricing, fees)
- Estadísticas (número de ciudades)

## 🔒 Permisos y Seguridad

### Permisos Requeridos
- `GEOGRAPHY_READ`: Para consultar estados
- `GEOGRAPHY_WRITE`: Para crear/editar/eliminar estados

### Validaciones de Seguridad
- Verificación de existencia del país padre
- Validación de coordenadas geográficas
- Límites en valores numéricos
- Sanitización de datos de entrada

## 📊 Casos de Uso

### 1. Configuración Inicial
```bash
# 1. Importar países
POST /admin/geography/countries/bulk-import

# 2. Crear estados para cada país
POST /admin/geography/states
{
  "name": "California",
  "code": "CA",
  "countryId": 1,
  "pricingMultiplier": 1.2
}
```

### 2. Pricing Regional
```bash
# Obtener estados con pricing
GET /admin/geography/states?countryId=1

# Configurar multiplicadores
PATCH /admin/geography/states/1
{
  "pricingMultiplier": 1.3,
  "serviceFee": 3.0
}
```

### 3. Monitoreo Geográfico
```bash
# Estados por país
GET /admin/geography/states/by-country/1

# Estadísticas generales
GET /admin/geography/states/stats/by-country
```

## ⚠️ Consideraciones Importantes

### Orden de Importación
1. **Primero países**: Importar países antes de estados
2. **Después estados**: Crear estados referenciando countryId
3. **Finalmente ciudades**: Crear ciudades referenciando stateId

### Datos Sensibles
- Coordenadas GPS son datos públicos
- Información poblacional debe ser precisa
- Configuraciones de pricing afectan ingresos

### Performance
- Estados se cargan con paginación
- Índices optimizados por countryId e isActive
- Consultas filtradas por país para mejor rendimiento

---

**📝 Nota**: Los estados son componentes críticos del sistema de pricing regional. Una configuración correcta permite precios dinámicos basados en ubicación geográfica.
