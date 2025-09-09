# API de Búsqueda de Usuarios

## 📋 Descripción

La API de búsqueda de usuarios proporciona un endpoint flexible y poderoso para buscar usuarios con múltiples filtros, paginación y ordenamiento personalizado.

## 🚀 Endpoint Principal

```
GET /api/user
```

## 📊 Parámetros de Búsqueda

### Paginación
- `page`: Número de página (mínimo: 1, por defecto: 1)
- `limit`: Elementos por página (mínimo: 1, máximo: 100, por defecto: 10)

### Filtros de Texto (búsqueda parcial, case-insensitive)
- `name`: Buscar por nombre
- `email`: Buscar por email
- `phone`: Buscar por teléfono
- `city`: Buscar por ciudad
- `state`: Buscar por estado
- `country`: Buscar por país

### Filtros Exactos
- `userType`: Tipo de usuario ('user' o 'admin')
- `adminRole`: Rol de administrador ('super_admin', 'admin', 'moderator', 'support')
- `isActive`: Estado activo (true/false)
- `emailVerified`: Email verificado (true/false)
- `phoneVerified`: Teléfono verificado (true/false)
- `identityVerified`: Identidad verificada (true/false)
- `gender`: Género ('male', 'female', 'other', 'prefer_not_to_say')
- `preferredLanguage`: Idioma preferido

### Filtros de Fecha
- `createdFrom`: Fecha de creación desde (YYYY-MM-DD)
- `createdTo`: Fecha de creación hasta (YYYY-MM-DD)
- `lastLoginFrom`: Último login desde (YYYY-MM-DD)
- `lastLoginTo`: Último login hasta (YYYY-MM-DD)

### Ordenamiento
- `sortBy`: Campo para ordenar ('id', 'name', 'email', 'createdAt', 'updatedAt', 'lastLogin')
- `sortOrder`: Dirección del orden ('asc', 'desc', por defecto: 'desc')

## 📝 Ejemplos de Uso

### 1. Obtener todos los usuarios (sin filtros)
```bash
GET /api/user
```

### 2. Búsqueda básica por nombre
```bash
GET /api/user?name=Juan
```

### 3. Búsqueda por email
```bash
GET /api/user?email=juan@
```

### 4. Usuarios de una ciudad específica
```bash
GET /api/user?city=Caracas
```

### 5. Solo usuarios administradores
```bash
GET /api/user?userType=admin
```

### 6. Usuarios activos con email verificado
```bash
GET /api/user?isActive=true&emailVerified=true
```

### 7. Usuarios registrados en un rango de fechas
```bash
GET /api/user?createdFrom=2024-01-01&createdTo=2024-12-31
```

### 8. Usuarios con paginación personalizada
```bash
GET /api/user?page=2&limit=20
```

### 9. Búsqueda múltiple con ordenamiento
```bash
GET /api/user?name=Mar&city=Caracas&sortBy=name&sortOrder=asc&page=1&limit=10
```

### 10. Administradores ordenados por fecha de creación
```bash
GET /api/user?userType=admin&sortBy=createdAt&sortOrder=desc
```

## 📤 Respuesta de Ejemplo

```json
{
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+58412123456",
      "city": "Caracas",
      "state": "Miranda",
      "country": "Venezuela",
      "isActive": true,
      "userType": "user",
      "adminRole": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z",
      "emailVerified": true,
      "phoneVerified": false,
      "identityVerified": true,
      "gender": "male",
      "preferredLanguage": "es",
      "profileImage": null,
      "wallet": {
        "balance": 25.50
      },
      "_count": {
        "rides": 12,
        "deliveryOrders": 5,
        "ratings": 8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "applied": ["name", "city"],
    "searchTerm": "Juan"
  }
}
```

## 🔍 Endpoint Específico por Email

Para búsquedas exactas por email, también está disponible:

```
GET /api/user/email/{email}
```

Ejemplo:
```bash
GET /api/user/email/juan@example.com
```

## 🎯 Casos de Uso Comunes

### Dashboard de Administradores
```bash
# Ver todos los administradores activos
GET /api/user?userType=admin&isActive=true&sortBy=lastLogin&sortOrder=desc
```

### Gestión de Usuarios
```bash
# Usuarios sin verificar email
GET /api/user?emailVerified=false&sortBy=createdAt&sortOrder=desc
```

### Análisis Geográfico
```bash
# Usuarios por ciudad
GET /api/user?city=Caracas&page=1&limit=50
```

### Reportes de Actividad
```bash
# Usuarios activos recientemente
GET /api/user?isActive=true&lastLoginFrom=2024-01-01&sortBy=lastLogin&sortOrder=desc
```

## ⚡ Optimizaciones

- **Búsqueda eficiente**: Usa índices de base de datos para búsquedas rápidas
- **Paginación optimizada**: Evita cargar todos los registros en memoria
- **Filtros dinámicos**: Solo aplica filtros cuando se proporcionan parámetros
- **Ordenamiento flexible**: Soporta múltiples campos de ordenamiento
- **Conteo paralelo**: Ejecuta conteo y búsqueda simultáneamente

## 🔐 Consideraciones de Seguridad

- El endpoint puede requerir autenticación según la configuración
- Los administradores pueden ver información sensible
- Se recomienda usar HTTPS en producción
- Implementar rate limiting para prevenir abuso

## 📊 Información Adicional

- **Máximo de resultados por página**: 100
- **Tiempo de respuesta típico**: < 500ms para consultas simples
- **Soporte de case-insensitive**: Para campos de texto
- **Formato de fechas**: YYYY-MM-DD
- **Zona horaria**: UTC para todas las fechas
