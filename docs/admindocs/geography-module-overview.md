# 🌍 Módulo de Geografía - E6: Gestión Geográfica y Regional

## 🎯 Descripción General

El **Módulo de Geografía** proporciona una jerarquía completa para la gestión territorial de la plataforma Uber Clone. Implementa un sistema multinivel de países, estados/provincias y ciudades con coordenadas GPS precisas, límites geográficos y configuraciones de pricing granular.

## 🏗️ Arquitectura Jerárquica

```
🌍 Países (Countries) ✅
├── 🏛️ Estados/Provincias (States) ✅
    ├── 🏙️ Ciudades (Cities) ✅
        └── 🎯 Zonas de Servicio (Service Zones) ✅
```

## 📊 Componentes Implementados

### ✅ **E6.1: Estructura Geográfica (COMPLETADO - 100%)**

#### **T6.1.1: CRUD de Países (COMPLETADO)**
- ✅ Modelo completo con campos ISO, monedas, impuestos
- ✅ API RESTful completa (GET/POST/PUT/DELETE)
- ✅ Importación masiva desde CSV
- ✅ Validaciones de unicidad y existencia

#### **T6.1.2: Gestión de Estados/Provincias (COMPLETADO)**
- ✅ Modelo jerárquico con foreign key a países
- ✅ APIs con filtrado dependiente (estados por país)
- ✅ Configuraciones de pricing por estado
- ✅ Estadísticas agrupadas

#### **T6.1.3: Sistema de Ciudades (COMPLETADO)**
- ✅ Modelo avanzado con coordenadas GPS y límites
- ✅ Zonas de servicio y pricing granular por ciudad
- ✅ Áreas restringidas y zonas premium
- ✅ Estadísticas demográficas y operativas

### ✅ **E6.2: Configuración Regional (COMPLETADO - 33%)**

#### **T6.2.1: Zonas de Servicio (COMPLETADO - 100%)**
- ✅ Modelo ServiceZone con geometrías GeoJSON
- ✅ Editor visual con validación de geometrías
- ✅ Sistema de validación de cobertura y solapamientos
- ✅ Pricing granular por zona con multiplicadores dinámicos
- ✅ Gestión de capacidad (max/min drivers por zona)
- ✅ Horarios pico configurables por zona
- ✅ Análisis de cobertura por ciudad
- ✅ Operaciones masivas y estadísticas avanzadas

## 🚀 APIs Disponibles

### Países - `/admin/geography/countries`
```
GET    /admin/geography/countries           # Listar con filtros
POST   /admin/geography/countries           # Crear país
GET    /admin/geography/countries/:id       # Obtener detalles
PATCH  /admin/geography/countries/:id       # Actualizar país
DELETE /admin/geography/countries/:id       # Eliminar país
POST   /admin/geography/countries/bulk-import # Importar CSV
```

### Estados - `/admin/geography/states`
```
GET    /admin/geography/states               # Listar con filtros
POST   /admin/geography/states               # Crear estado
GET    /admin/geography/states/:id           # Obtener detalles
PATCH  /admin/geography/states/:id           # Actualizar estado
DELETE /admin/geography/states/:id           # Eliminar estado
GET    /admin/geography/states/by-country/:id # Estados por país
GET    /admin/geography/states/stats/by-country # Estadísticas
```

### Ciudades - `/admin/geography/cities`
```
GET    /admin/geography/cities               # Listar con filtros
POST   /admin/geography/cities               # Crear ciudad
GET    /admin/geography/cities/:id           # Obtener detalles
PATCH  /admin/geography/cities/:id           # Actualizar ciudad
DELETE /admin/geography/cities/:id           # Eliminar ciudad
GET    /admin/geography/cities/by-state/:id  # Ciudades por estado
GET    /admin/geography/cities/stats/by-state # Estadísticas
```

### Zonas de Servicio - `/admin/geography/service-zones`
```
GET    /admin/geography/service-zones           # Listar con filtros avanzados
POST   /admin/geography/service-zones           # Crear zona con geometría
GET    /admin/geography/service-zones/:id       # Detalles completos
PATCH  /admin/geography/service-zones/:id       # Actualizar configuración
DELETE /admin/geography/service-zones/:id       # Eliminar zona
PATCH  /admin/geography/service-zones/:id/toggle-status # Cambiar estado
GET    /admin/geography/service-zones/by-city/:id # Zonas por ciudad
POST   /admin/geography/service-zones/validate-geometry # Validar geometría
GET    /admin/geography/service-zones/coverage-analysis/city/:id # Análisis cobertura
GET    /admin/geography/service-zones/pricing-matrix/city/:id # Matriz pricing
POST   /admin/geography/service-zones/bulk-update-status # Actualización masiva
```

## 🗺️ Características Geográficas

### Coordenadas GPS
- ✅ **Precisión**: Lat/lng con 6 decimales
- ✅ **Validación**: Rangos geográficos correctos
- ✅ **Índices**: Optimización para consultas GPS

### Límites Geográficos
- ✅ **GeoJSON**: Soporte para polígonos complejos
- ✅ **Service Radius**: Cobertura circular por defecto
- ✅ **Zoning Avanzado**: Áreas irregulares definibles

### Zonas Especiales
```json
{
  "restrictedAreas": ["airport", "military_zone"],
  "premiumZones": ["downtown", "stadium"]
}
```

### Zonas de Servicio Avanzadas
- ✅ **Geometrías GeoJSON**: Polígonos precisos para cobertura
- ✅ **Tipos de Zona**: Regular, Premium, Restricted
- ✅ **Pricing Dinámico**: Multiplicadores específicos por zona
- ✅ **Gestión de Capacidad**: Límites de conductores por zona
- ✅ **Horarios Pico**: Configuración temporal de demanda
- ✅ **Validación de Cobertura**: Detección de gaps y overlaps
- ✅ **Análisis Estadístico**: Métricas de cobertura por ciudad

## 💰 Sistema de Pricing Granular

### Jerarquía de Multiplicadores
```
País (1.0x) → Estado (1.2x) → Ciudad (1.3x) → Zona (1.1x) = 1.716x Total
```

### Tipos de Cargos
- **Pricing Multipliers**: Multiplicadores porcentuales
- **Service Fees**: Cargos fijos adicionales
- **Dynamic Pricing**: Basado en demanda y ubicación

### Ejemplo de Cálculo
```typescript
const finalPrice = basePrice
  * countryMultiplier    // 1.0x (USA)
  * stateMultiplier      // 1.2x (California)
  * cityMultiplier       // 1.3x (Los Angeles)
  * zoneMultiplier       // 1.1x (Downtown)
  + cityServiceFee       // $1.50
  + zoneServiceFee;      // $0.50
// Resultado: Precio dinámico por ubicación
```

## 📊 Estadísticas y Reportes

### Métricas por Nivel
```json
{
  "countries": { "total": 195, "active": 180 },
  "states": { "total": 4000, "active": 3500 },
  "cities": { "total": 50000, "active": 45000 }
}
```

### Estadísticas Agrupadas
- **Por País**: Estados activos, ciudades totales
- **Por Estado**: Ciudades activas, población total
- **Por Ciudad**: Zonas de servicio, métricas operativas

## 🔒 Sistema de Permisos

### Roles y Permisos
- `GEOGRAPHY_READ`: Consultar datos geográficos
- `GEOGRAPHY_WRITE`: Crear/editar/eliminar entidades

### Validaciones de Seguridad
- ✅ **Jerarquía**: Validación de dependencias padre-hijo
- ✅ **Unicidad**: Constraints por nivel geográfico
- ✅ **Coordenadas**: Validación GPS automática
- ✅ **Datos Sensibles**: Sanitización de GeoJSON

## 📁 Archivos de Datos

### CSVs de Ejemplo
- ✅ `docs/countries-example.csv` - 10 países con datos completos
- ✅ `docs/states-example.csv` - 20 estados/provincias
- ✅ `docs/cities-example.csv` - 20 ciudades con coordenadas
- ✅ `docs/service-zones-example.csv` - 20 zonas de servicio con geometrías

### Guías de Uso
- ✅ `docs/countries-management-guide.md` - Gestión de países
- ✅ `docs/states-management-guide.md` - Gestión de estados
- ✅ `docs/cities-management-guide.md` - Gestión de ciudades
- ✅ `docs/service-zones-management-guide.md` - Gestión de zonas de servicio
- ✅ `docs/geography-bulk-import-guide.md` - Importación masiva

## 🗃️ Base de Datos

### Modelos Prisma
```prisma
// Jerarquía completa implementada
model Country {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  isoCode2        String   @unique
  // ... campos completos

  states          State[]
}

model State {
  id              Int      @id @default(autoincrement())
  name            String
  code            String
  countryId       Int
  // ... pricing, coordenadas

  country         Country  @relation(fields: [countryId])
  cities          City[]

  @@unique([countryId, code])
}

model City {
  id              Int      @id @default(autoincrement())
  name            String
  stateId         Int
  latitude        Decimal
  longitude       Decimal
  // ... límites, pricing, zonas

  state           State    @relation(fields: [stateId])
  serviceZones    ServiceZone[]

  @@unique([stateId, name])
}

model ServiceZone {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(100)
  cityId      Int      @map("city_id")
  zoneType    String   @default("regular") @db.VarChar(20)

  // Geographic boundaries
  boundaries  Json     // GeoJSON polygon
  centerLat   Decimal  @map("center_lat") @db.Decimal(9, 6)
  centerLng   Decimal  @map("center_lng") @db.Decimal(9, 6)

  // Zone settings
  isActive    Boolean  @default(true)
  pricingMultiplier Decimal @default(1.0) @db.Decimal(3, 2)
  maxDrivers  Int?
  minDrivers  Int?

  // Operational settings
  peakHours   Json?
  demandMultiplier Decimal @default(1.0) @db.Decimal(3, 2)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  city        City     @relation(fields: [cityId], references: [id])
}
```

### Índices de Performance
- ✅ **Geográficos**: lat/lng para búsquedas GPS y geometrías
- ✅ **Jerárquicos**: countryId, stateId, cityId para filtrado multinivel
- ✅ **Operativos**: isActive para consultas activas por zona
- ✅ **Business**: pricingMultiplier para cálculos dinámicos
- ✅ **Espaciales**: centerLat/lng para optimización geoespacial

## 🔄 Próximos Pasos

### E6.2: Configuración Regional
- ✅ **T6.2.1**: Zonas de servicio avanzadas (COMPLETADO)
- ⏳ **T6.2.2**: Configuraciones por zona
- ⏳ **T6.2.3**: Pricing dinámico por zona

### E6.3: Sistema de Pricing Granular
- ⏳ **T6.3.1**: Algoritmos de pricing
- ⏳ **T6.3.2**: Multiplicadores dinámicos
- ⏳ **T6.3.3**: Integración con matching

## 🎯 Valor Agregado

### Para la Plataforma
- **Pricing Inteligente**: Precios basados en ubicación real
- **Cobertura Optimizada**: Definición precisa de áreas operativas
- **Compliance Automático**: Restricciones geográficas por regulación
- **Analytics Geográficos**: Métricas por región y ciudad

### Para Usuarios
- **Precios Transparentes**: Tarifas claras por zona
- **Disponibilidad Mejorada**: Cobertura geográfica precisa
- **Tiempos de Espera**: Matching optimizado por ubicación

### Para Drivers
- **Oportunidades Locales**: Trabajo en zonas específicas
- **Precios Competitivos**: Tarifas justas por área
- **Navegación Mejorada**: Direcciones precisas GPS

## 🚀 Estado del Proyecto

### ✅ **Completado (100%)**
- **Estructura Geográfica**: Países → Estados → Ciudades
- **APIs Completas**: CRUD + filtros avanzados
- **Pricing Base**: Sistema de multiplicadores jerárquicos
- **Importación Masiva**: CSVs para datos iniciales
- **Documentación**: Guías completas de uso

### 📈 **Funcionalidades Clave**
- Jerarquía geográfica completa
- Pricing granular multinivel
- Coordenadas GPS precisas
- Zonas restringidas y premium
- Estadísticas agrupadas
- Importación masiva desde CSV
- APIs RESTful completas

---

**🌍 El módulo de geografía proporciona la base territorial sólida para un sistema de ride-sharing global, con pricing inteligente y cobertura precisa por ubicación.**
