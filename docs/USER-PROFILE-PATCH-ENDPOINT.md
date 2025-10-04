# 📝 **Endpoint PATCH /api/user/profile**

## 🎯 **Resumen**

Endpoint para actualizar el perfil del usuario autenticado usando el método PATCH. Permite actualizaciones parciales con validación completa y sanitización de datos.

---

## 🔗 **Información del Endpoint**

- **Método**: `PATCH`
- **URL**: `/api/user/profile`
- **Autenticación**: Requerida (JWT Bearer Token)
- **Content-Type**: `application/json`

---

## 🔐 **Autenticación**

```http
Authorization: Bearer <jwt-token>
```

**Ejemplo:**
```http
Authorization: Bearer dev-test-token
```

---

## 📋 **Parámetros del Body**

Todos los parámetros son **opcionales** (actualización parcial):

| Campo | Tipo | Validación | Descripción | Ejemplo |
|-------|------|------------|-------------|---------|
| `name` | string | 2-100 caracteres | Nombre completo del usuario | `"Juan Carlos Pérez"` |
| `email` | string | Email válido | Dirección de email (única) | `"juan@example.com"` |
| `phone` | string | Formato internacional | Número de teléfono | `"+584141234567"` |
| `dateOfBirth` | string | Fecha YYYY-MM-DD | Fecha de nacimiento | `"1990-05-15"` |
| `gender` | string | Enum válido | Género del usuario | `"male"` |
| `profileImage` | string | URL válida | URL de imagen de perfil | `"https://example.com/profile.jpg"` |
| `address` | string | Máx 255 caracteres | Dirección del usuario | `"Calle 123, Edificio ABC"` |
| `city` | string | Máx 100 caracteres | Ciudad | `"Caracas"` |
| `state` | string | Máx 100 caracteres | Estado/Provincia | `"Miranda"` |
| `country` | string | Máx 100 caracteres | País | `"Venezuela"` |
| `postalCode` | string | Máx 20 caracteres | Código postal | `"1010"` |
| `preferredLanguage` | string | Enum válido | Idioma preferido | `"es"` |
| `timezone` | string | Máx 50 caracteres | Zona horaria | `"America/Caracas"` |
| `currency` | string | Enum válido | Moneda preferida | `"USD"` |

### **Valores Enum Válidos**

#### **Gender**
- `male`
- `female`
- `other`
- `prefer_not_to_say`

#### **Preferred Language**
- `es` (Español)
- `en` (English)
- `pt` (Português)
- `fr` (Français)

#### **Currency**
- `USD` (US Dollar)
- `EUR` (Euro)
- `VES` (Venezuelan Bolívar)
- `COP` (Colombian Peso)
- `BRL` (Brazilian Real)

---

## 📤 **Ejemplos de Uso**

### **1. Actualización Básica**
```http
PATCH /api/user/profile
Authorization: Bearer dev-test-token
Content-Type: application/json

{
  "name": "Juan Carlos Pérez",
  "city": "Caracas",
  "country": "Venezuela"
}
```

### **2. Actualización Completa**
```http
PATCH /api/user/profile
Authorization: Bearer dev-test-token
Content-Type: application/json

{
  "name": "María González",
  "email": "maria.gonzalez@example.com",
  "phone": "+584141234567",
  "dateOfBirth": "1985-03-15",
  "gender": "female",
  "profileImage": "https://example.com/profile.jpg",
  "address": "Calle 123, Edificio ABC, Apartamento 4B",
  "city": "Caracas",
  "state": "Miranda",
  "country": "Venezuela",
  "postalCode": "1010",
  "preferredLanguage": "es",
  "timezone": "America/Caracas",
  "currency": "USD"
}
```

### **3. Actualización Mínima**
```http
PATCH /api/user/profile
Authorization: Bearer dev-test-token
Content-Type: application/json

{
  "city": "Valencia"
}
```

---

## 📥 **Respuestas**

### **✅ 200 - Actualización Exitosa**
```json
{
  "id": 1,
  "name": "Juan Carlos Pérez",
  "email": "juan.perez@example.com",
  "phone": "+584141234567",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "gender": "male",
  "profileImage": "https://example.com/profile.jpg",
  "address": "Calle 123, Centro",
  "city": "Caracas",
  "state": "Miranda",
  "country": "Venezuela",
  "postalCode": "1010",
  "preferredLanguage": "es",
  "timezone": "America/Caracas",
  "currency": "USD",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "wallet": {
    "balance": 150.50
  },
  "emergencyContacts": [
    {
      "id": 1,
      "contactName": "María Pérez",
      "contactPhone": "+584141234568"
    }
  ]
}
```

### **❌ 400 - Datos Inválidos**
```json
{
  "statusCode": 400,
  "message": [
    "Name must be at least 2 characters long",
    "Please provide a valid email address",
    "Phone number must be in international format (e.g., +584141234567)"
  ],
  "error": "Bad Request"
}
```

### **❌ 401 - No Autenticado**
```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido",
  "error": "Unauthorized"
}
```

### **❌ 404 - Usuario No Encontrado**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### **❌ 409 - Email Ya Existe**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### **❌ 500 - Error Interno**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 🔧 **Características Técnicas**

### **Validaciones Implementadas**
- ✅ **Longitud de campos**: Restricciones de longitud mínima y máxima
- ✅ **Formato de email**: Validación de formato de email válido
- ✅ **Formato de teléfono**: Formato internacional (+código + número)
- ✅ **Formato de fecha**: Fecha válida en formato YYYY-MM-DD
- ✅ **URLs válidas**: Validación de URLs para imágenes de perfil
- ✅ **Valores enum**: Validación de valores permitidos
- ✅ **Unicidad de email**: Verificación de que el email no esté en uso

### **Sanitización de Datos**
- ✅ **Trim automático**: Eliminación de espacios en blanco
- ✅ **Normalización de email**: Conversión a minúsculas
- ✅ **Validación de tipos**: Conversión automática de tipos de datos

### **Seguridad**
- ✅ **Autenticación JWT**: Verificación de token válido
- ✅ **Autorización**: Solo el usuario puede actualizar su propio perfil
- ✅ **Validación de entrada**: Sanitización y validación completa
- ✅ **Manejo de errores**: Respuestas de error apropiadas

---

## 🧪 **Pruebas**

### **Script de Prueba**
```bash
# Ejecutar el script de prueba
node test-user-profile-patch.js
```

### **Pruebas Incluidas**
1. ✅ Actualización básica (nombre, ciudad, país)
2. ✅ Actualización de información personal (teléfono, fecha, género)
3. ✅ Actualización de preferencias (idioma, zona horaria, moneda)
4. ✅ Actualización con imagen de perfil
5. ✅ Actualización mínima (un solo campo)
6. ✅ Validación de datos inválidos
7. ✅ Prueba de seguridad (sin autenticación)

---

## 📚 **Documentación Swagger**

El endpoint está completamente documentado en Swagger UI:
- **URL**: `http://localhost:3000/api`
- **Tag**: `users`
- **Endpoint**: `PATCH /api/user/profile`

### **Características de la Documentación**
- ✅ **Descripción detallada** del endpoint
- ✅ **Ejemplos de uso** con diferentes escenarios
- ✅ **Esquemas de respuesta** para todos los códigos de estado
- ✅ **Validaciones** documentadas
- ✅ **Interfaz interactiva** para pruebas

---

## 🚀 **Uso en Producción**

### **Consideraciones de Performance**
- ✅ **Actualización parcial**: Solo se actualizan los campos enviados
- ✅ **Validación eficiente**: Validaciones optimizadas
- ✅ **Índices de base de datos**: Optimizado para consultas rápidas

### **Monitoreo**
- ✅ **Logs de autenticación**: Registro de intentos de acceso
- ✅ **Logs de validación**: Registro de errores de validación
- ✅ **Métricas de uso**: Tracking de uso del endpoint

---

## 🔄 **Comparación con PUT /api/user/me**

| Característica | PATCH /api/user/profile | PUT /api/user/me |
|----------------|------------------------|------------------|
| **Método** | PATCH | PUT |
| **Actualización** | Parcial | Completa |
| **Validación** | Avanzada | Básica |
| **Sanitización** | Completa | Básica |
| **Documentación** | Detallada | Estándar |
| **Casos de uso** | Perfil de usuario | Administración |

---

## 📞 **Soporte**

Para soporte técnico o reportar problemas:
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentación**: [API Docs](./CLIENT-DRIVER-COMMUNICATION-GUIDE.md)
- **Swagger**: `http://localhost:3000/api`

---

*Última actualización: Enero 2024*
