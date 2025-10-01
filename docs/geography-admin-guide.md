# Geography - Guía de Consumo para Administradores

Esta guía explica cómo consumir los endpoints de gestión de geografía desde el panel de administración.

## 📋 Información General

**Base URL:** `/admin/geography`

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

---

## 🌍 GESTIÓN DE PAÍSES (COUNTRIES)

### Crear un nuevo país

**MÉTODO:** `POST /admin/geography/countries`

**DESCRIPCIÓN:** Crea un nuevo país en el sistema de geografía con toda su información regional.

**ENVÍO:**
```json
{
  "name": "United States",
  "isoCode2": "US",
  "isoCode3": "USA",
  "numericCode": 840,
  "phoneCode": "+1",
  "currencyCode": "USD",
  "currencyName": "United States Dollar",
  "currencySymbol": "$",
  "timezone": "America/New_York",
  "continent": "North America",
  "region": "Americas",
  "subregion": "Northern America",
  "vatRate": 8.25,
  "corporateTaxRate": 21.0,
  "incomeTaxRate": 37.0,
  "isActive": true,
  "requiresVerification": false,
  "supportedLanguages": ["en", "es"],
  "flag": "🇺🇸",
  "capital": "Washington D.C.",
  "population": 331900000,
  "areaKm2": 9833517
}
```

**RECIBE:**
```json
{
  "id": 1,
  "name": "United States",
  "isoCode2": "US",
  "isoCode3": "USA",
  "numericCode": 840,
  "phoneCode": "+1",
  "currencyCode": "USD",
  "currencyName": "United States Dollar",
  "currencySymbol": "$",
  "timezone": "America/New_York",
  "continent": "North America",
  "region": "Americas",
  "subregion": "Northern America",
  "vatRate": 8.25,
  "corporateTaxRate": 21.0,
  "incomeTaxRate": 37.0,
  "isActive": true,
  "requiresVerification": false,
  "supportedLanguages": ["en", "es"],
  "flag": "🇺🇸",
  "capital": "Washington D.C.",
  "population": 331900000,
  "areaKm2": 9833517,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "statesCount": 0
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `409`: País ya existe (código ISO duplicado)

---

### Listar países con filtros

**MÉTODO:** `GET /admin/geography/countries`

**DESCRIPCIÓN:** Obtiene una lista paginada de países con opciones avanzadas de filtrado.

**PARÁMETROS DE CONSULTA (opcionales):**
```
?page=1&limit=20&continent=Europe&isActive=true&search=United&sortBy=name&sortOrder=asc
```

**RECIBE:**
```json
{
  "countries": [
    {
      "id": 1,
      "name": "United States",
      "isoCode2": "US",
      "continent": "North America",
      "isActive": true,
      "statesCount": 50
    }
  ],
  "total": 195,
  "page": 1,
  "limit": 20,
  "totalPages": 10
}
```

---

### Obtener detalles de un país

**MÉTODO:** `GET /admin/geography/countries/{id}`

**DESCRIPCIÓN:** Obtiene la información completa de un país específico.

**RECIBE:** La respuesta completa del país (mismo formato que creación)

**ERRORES POSIBLES:**
- `404`: País no encontrado

---

### Actualizar un país

**MÉTODO:** `PATCH /admin/geography/countries/{id}`

**DESCRIPCIÓN:** Modifica la información de un país existente.

**ENVÍO:** Los campos a actualizar (mismo formato que creación, todos opcionales)

**RECIBE:** El país actualizado

**ERRORES POSIBLES:**
- `404`: País no encontrado
- `409`: Conflicto de códigos únicos

---

### Eliminar un país

**MÉTODO:** `DELETE /admin/geography/countries/{id}`

**DESCRIPCIÓN:** Elimina un país del sistema (solo si no tiene estados asociados).

**RECIBE:** `200 OK` (sin respuesta body)

**ERRORES POSIBLES:**
- `404`: País no encontrado
- `409`: No se puede eliminar - tiene dependencias

---

### Cambiar estado activo/inactivo

**MÉTODO:** `PATCH /admin/geography/countries/{id}/toggle-status`

**DESCRIPCIÓN:** Alterna el estado operativo de un país.

**RECIBE:** El país con el estado actualizado

---

### Importar países desde CSV

**MÉTODO:** `POST /admin/geography/countries/bulk-import`

**DESCRIPCIÓN:** Carga masiva de países desde un archivo CSV con validación y manejo de errores.

**ENVÍO:** Form-data con archivo CSV

**RECIBE:**
```json
{
  "totalProcessed": 195,
  "successful": 180,
  "failed": 15,
  "skipped": 5,
  "errors": [
    {
      "row": 5,
      "field": "isoCode2",
      "value": "INVALID",
      "error": "Invalid ISO code format"
    }
  ],
  "skippedRecords": [
    {
      "row": 10,
      "reason": "Country already exists",
      "data": { "name": "United States", "isoCode2": "US" }
    }
  ],
  "duration": 2500
}
```

**ERRORES POSIBLES:**
- `400`: Archivo inválido o datos incorrectos

---

### Estadísticas por continente

**MÉTODO:** `GET /admin/geography/countries/stats/by-continent`

**DESCRIPCIÓN:** Obtiene el conteo de países activos por continente.

**RECIBE:**
```json
{
  "stats": [
    {
      "continent": "Europe",
      "totalCountries": 44,
      "activeCountries": 42
    },
    {
      "continent": "Asia",
      "totalCountries": 48,
      "activeCountries": 45
    }
  ]
}
```

---

## 🏛️ GESTIÓN DE ESTADOS/PROVINCIAS (STATES)

### Crear un nuevo estado/provincia

**MÉTODO:** `POST /admin/geography/states`

**DESCRIPCIÓN:** Crea un nuevo estado o provincia en el sistema de geografía.

**ENVÍO:**
```json
{
  "name": "California",
  "code": "CA",
  "countryId": 1,
  "latitude": 36.7783,
  "longitude": -119.4179,
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "pricingMultiplier": 1.2,
  "serviceFee": 2.5,
  "capital": "Sacramento",
  "population": 39538223,
  "areaKm2": 423967
}
```

**RECIBE:**
```json
{
  "id": 1,
  "name": "California",
  "code": "CA",
  "countryId": 1,
  "latitude": 36.7783,
  "longitude": -119.4179,
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "pricingMultiplier": 1.2,
  "serviceFee": 2.5,
  "capital": "Sacramento",
  "population": 39538223,
  "areaKm2": 423967,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "country": {
    "id": 1,
    "name": "United States",
    "isoCode2": "US"
  },
  "citiesCount": 0
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `404`: País no encontrado
- `409`: Estado ya existe (código duplicado en el país)

---

### Listar estados con filtros

**MÉTODO:** `GET /admin/geography/states`

**DESCRIPCIÓN:** Obtiene una lista paginada de estados con opciones de filtrado.

**PARÁMETROS DE CONSULTA (opcionales):**
```
?page=1&limit=20&countryId=1&isActive=true&search=California&sortBy=name&sortOrder=asc
```

**RECIBE:**
```json
{
  "states": [
    {
      "id": 1,
      "name": "California",
      "code": "CA",
      "countryName": "United States",
      "isActive": true,
      "citiesCount": 58
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### Obtener estados por país

**MÉTODO:** `GET /admin/geography/states/by-country/{countryId}`

**DESCRIPCIÓN:** Lista todos los estados activos de un país específico.

**PARÁMETROS DE CONSULTA:**
```
?activeOnly=true
```

**RECIBE:** Array de estados (mismo formato que listar)

---

### Estadísticas de estados por país

**MÉTODO:** `GET /admin/geography/states/stats/by-country`

**DESCRIPCIÓN:** Obtiene el conteo de estados activos agrupados por país.

**RECIBE:**
```json
{
  "stats": [
    {
      "countryId": 1,
      "countryName": "United States",
      "totalStates": 50,
      "activeStates": 49
    }
  ]
}
```

---

## 🏙️ GESTIÓN DE CIUDADES (CITIES)

### Crear una nueva ciudad

**MÉTODO:** `POST /admin/geography/cities`

**DESCRIPCIÓN:** Crea una nueva ciudad con coordenadas GPS y límites geográficos.

**ENVÍO:**
```json
{
  "name": "Los Angeles",
  "stateId": 1,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "pricingMultiplier": 1.3,
  "serviceFee": 1.5,
  "serviceRadius": 50,
  "population": 3976322,
  "areaKm2": 1302,
  "elevation": 89,
  "postalCodes": ["90001", "90002", "90003"],
  "restrictedAreas": ["airport", "military_zone"],
  "premiumZones": ["downtown", "stadium"],
  "boundaries": {
    "type": "Polygon",
    "coordinates": [[[ ... ]]]
  }
}
```

**RECIBE:**
```json
{
  "id": 1,
  "name": "Los Angeles",
  "stateId": 1,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "pricingMultiplier": 1.3,
  "serviceFee": 1.5,
  "serviceRadius": 50,
  "population": 3976322,
  "areaKm2": 1302,
  "elevation": 89,
  "postalCodes": ["90001", "90002", "90003"],
  "restrictedAreas": ["airport", "military_zone"],
  "premiumZones": ["downtown", "stadium"],
  "boundaries": { "type": "Polygon", "coordinates": [[[ ... ]]] },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "state": {
    "id": 1,
    "name": "California",
    "code": "CA",
    "country": {
      "id": 1,
      "name": "United States",
      "isoCode2": "US"
    }
  },
  "serviceZonesCount": 0
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `404`: Estado no encontrado
- `409`: Ciudad ya existe (conflicto de nombre en el estado)

---

### Listar ciudades con filtros

**MÉTODO:** `GET /admin/geography/cities`

**DESCRIPCIÓN:** Obtiene una lista paginada de ciudades con opciones avanzadas de filtrado.

**PARÁMETROS DE CONSULTA (opcionales):**
```
?page=1&limit=20&stateId=1&countryId=1&isActive=true&search=Los Angeles&sortBy=name&sortOrder=asc
```

**RECIBE:**
```json
{
  "cities": [
    {
      "id": 1,
      "name": "Los Angeles",
      "stateName": "California",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "isActive": true,
      "population": 3976322
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### Obtener ciudades por estado

**MÉTODO:** `GET /admin/geography/cities/by-state/{stateId}`

**DESCRIPCIÓN:** Lista todas las ciudades activas de un estado específico.

**PARÁMETROS DE CONSULTA:**
```
?activeOnly=true
```

**RECIBE:** Array de ciudades (mismo formato que listar)

---

### Estadísticas de ciudades por estado

**MÉTODO:** `GET /admin/geography/cities/stats/by-state`

**DESCRIPCIÓN:** Obtiene el conteo de ciudades activas agrupadas por estado y país.

**RECIBE:**
```json
{
  "stats": [
    {
      "stateId": 1,
      "stateName": "California",
      "countryName": "United States",
      "totalCities": 58,
      "activeCities": 57
    }
  ]
}
```

---

### Obtener detalles de una ciudad

**MÉTODO:** `GET /admin/geography/cities/{id}`

**DESCRIPCIÓN:** Obtiene la información completa de una ciudad específica incluyendo límites geográficos.

**RECIBE:** La respuesta completa de la ciudad (mismo formato que creación)

**ERRORES POSIBLES:**
- `404`: Ciudad no encontrada

---

### Actualizar una ciudad

**MÉTODO:** `PATCH /admin/geography/cities/{id}`

**DESCRIPCIÓN:** Actualiza la información de una ciudad existente incluyendo coordenadas y límites.

**ENVÍO:** Los campos a actualizar (mismo formato que creación, todos opcionales)

**RECIBE:** La ciudad actualizada

**ERRORES POSIBLES:**
- `404`: Ciudad no encontrada
- `409`: Conflicto de datos únicos

---

### Eliminar una ciudad

**MÉTODO:** `DELETE /admin/geography/cities/{id}`

**DESCRIPCIÓN:** Elimina una ciudad del sistema (solo si no tiene zonas de servicio asociadas).

**RECIBE:** `200 OK` (sin respuesta body)

**ERRORES POSIBLES:**
- `404`: Ciudad no encontrada
- `409`: No se puede eliminar - tiene dependencias

---

### Cambiar estado activo/inactivo

**MÉTODO:** `PATCH /admin/geography/cities/{id}/toggle-status`

**DESCRIPCIÓN:** Alterna el estado operativo de una ciudad.

**RECIBE:** La ciudad con el estado actualizado

---

## 📊 CAMPOS EN LISTAS (OPTIMIZADOS)

### Campos en lista de Países (6 campos):
- `id`: ID único del país
- `name`: Nombre completo del país
- `isoCode2`: Código ISO de 2 letras
- `continent`: Continente
- `isActive`: Estado operativo
- `statesCount`: Número de estados/provincias

### Campos en lista de Estados (6 campos):
- `id`: ID único del estado
- `name`: Nombre completo del estado
- `code`: Código del estado
- `countryName`: Nombre del país
- `isActive`: Estado operativo
- `citiesCount`: Número de ciudades

### Campos en lista de Ciudades (7 campos):
- `id`: ID único de la ciudad
- `name`: Nombre completo de la ciudad
- `stateName`: Nombre del estado
- `latitude`: Latitud del centro
- `longitude`: Longitud del centro
- `isActive`: Estado operativo
- `population`: Población

### Campos requeridos para crear País:
- `name`: 1-100 caracteres
- `isoCode2`: 2 caracteres (ISO 3166-1 alpha-2)
- `currencyCode`: 3 caracteres (ISO 4217)
- `timezone`: IANA timezone válido
- `continent`: Continente válido

### Campos requeridos para crear Estado:
- `name`: 1-100 caracteres
- `code`: 1-10 caracteres
- `countryId`: ID de país existente

### Campos requeridos para crear Ciudad:
- `name`: 1-100 caracteres
- `stateId`: ID de estado existente
- `latitude`: -90 a 90
- `longitude`: -180 a 180

### Continentes válidos:
- `Africa`, `Antarctica`, `Asia`, `Europe`, `North America`, `Oceania`, `South America`

### Tipos de zona de servicio:
- `regular`: Zona estándar
- `premium`: Zona de alta demanda/precio premium
- `restricted`: Zona con restricciones de acceso

### Validaciones geográficas:
- Coordenadas GPS válidas
- GeoJSON válido para límites
- Radio de servicio entre 1-500 km
- Elevación en metros (opcional)

---

## 🔧 USO PRÁCTICO

### 1. Configurar un nuevo país con estados y ciudades:

**Crear país:**
```json
POST /admin/geography/countries
{
  "name": "Mexico",
  "isoCode2": "MX",
  "isoCode3": "MEX",
  "phoneCode": "+52",
  "currencyCode": "MXN",
  "currencyName": "Mexican Peso",
  "currencySymbol": "$",
  "timezone": "America/Mexico_City",
  "continent": "North America",
  "isActive": true
}
```

**Crear estado:**
```json
POST /admin/geography/states
{
  "name": "Jalisco",
  "code": "JAL",
  "countryId": 2,
  "isActive": true,
  "pricingMultiplier": 1.1
}
```

**Crear ciudad:**
```json
POST /admin/geography/cities
{
  "name": "Guadalajara",
  "stateId": 3,
  "latitude": 20.6597,
  "longitude": -103.3496,
  "isActive": true,
  "serviceRadius": 40
}
```

### 2. Verificar cobertura geográfica:

**Estadísticas por continente:**
```json
GET /admin/geography/countries/stats/by-continent
```

**Ciudades por estado:**
```json
GET /admin/geography/cities/stats/by-state
```

### 3. Importar datos masivos:

**Subir archivo CSV de países:**
```json
POST /admin/geography/countries/bulk-import
Content-Type: multipart/form-data
// Archivo CSV con columnas: name,isoCode2,isoCode3,numericCode,phoneCode,currencyCode,timezone,continent
```

### 4. Gestionar zonas de servicio:

**Crear zona premium:**
```json
POST /admin/geography/service-zones
{
  "name": "Centro Histórico",
  "cityId": 1,
  "zoneType": "premium",
  "boundaries": { "type": "Polygon", "coordinates": [[[ ... ]]] },
  "centerLat": 20.6597,
  "centerLng": -103.3496,
  "pricingMultiplier": 1.5,
  "demandMultiplier": 2.0
}
```

### 5. Filtrar datos específicos:

**Ciudades activas de un estado:**
```json
GET /admin/geography/cities/by-state/1?activeOnly=true
```

**Estados de un país:**
```json
GET /admin/geography/states/by-country/1?activeOnly=true
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Jerarquía geográfica**: Los datos siguen una jerarquía estricta: País → Estado → Ciudad → Zona de Servicio

2. **Dependencias**: No se puede eliminar un elemento si tiene elementos hijos activos

3. **Coordenadas GPS**: Las coordenadas son críticas para el funcionamiento del sistema de matching y rutas

4. **Límites geográficos**: Los límites en formato GeoJSON son opcionales pero recomendados para zonas de servicio precisas

5. **Multiplicadores de precio**: Estos afectan directamente los cálculos de tarifa en tiempo real

6. **Importación masiva**: Los archivos CSV deben tener codificación UTF-8 y separadores de coma

7. **Zonas restringidas**: Las áreas marcadas como restringidas no permitirán operaciones de servicio

8. **Horarios de negocio**: Los países pueden tener configuraciones de horario que afectan la disponibilidad del servicio

9. **Verificación requerida**: Algunos países pueden requerir verificación adicional para usuarios o conductores

10. **Auditoría**: Todas las operaciones quedan registradas para seguimiento de cambios

11. **Optimización Máxima**: Los endpoints de listas paginadas retornan solo 6-8 campos esenciales para máxima velocidad y mínimo uso de recursos. Para información completa (configuraciones, límites geográficos, etc.), utiliza los endpoints de detalles por ID.

Esta documentación cubre todas las operaciones necesarias para gestionar la geografía desde el panel de administración.

