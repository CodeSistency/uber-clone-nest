# API Keys - Guía de Consumo para Administradores

Esta guía explica cómo consumir los endpoints de gestión de API Keys desde el panel de administración.

## 📋 Información General

**Base URL:** `/admin/config/api-keys`

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

---

## 🆕 CREAR API KEYS

### Crear una nueva API Key

**MÉTODO:** `POST /admin/config/api-keys`

**DESCRIPCIÓN:** Crea una nueva clave API para integrar servicios externos como Stripe, Twilio, etc.

**ENVÍO:**
```json
{
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "keyValue": "sk_live_...",
  "description": "Clave principal de Stripe para pagos en producción",
  "expiresAt": "2024-12-31T23:59:59Z",
  "rotationPolicy": "auto_90d",
  "isPrimary": true,
  "accessLevel": "write",
  "rateLimit": 100,
  "tags": ["production", "critical"]
}
```

**RECIBE:**
```json
{
  "id": 1,
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "description": "Clave principal de Stripe para pagos en producción",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "lastRotated": null,
  "isActive": true,
  "isPrimary": true,
  "accessLevel": "write",
  "usageCount": 0,
  "rateLimit": 100,
  "tags": ["production", "critical"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `409`: Nombre duplicado o conflicto de clave primaria

---

## 📖 LEER API KEYS

### Listar todas las API Keys

**MÉTODO:** `GET /admin/config/api-keys`

**DESCRIPCIÓN:** Obtiene una lista paginada de todas las claves API con opciones de filtrado.

**PARÁMETROS DE CONSULTA (opcionales):**
```
?page=1&limit=20&service=stripe&environment=production&isActive=true&search=production
```

**RECIBE:**
```json
{
  "keys": [
    {
      "id": 1,
      "name": "Stripe Production Key",
      "service": "stripe",
      "environment": "production",
      "keyType": "secret",
      "isActive": true,
      "isPrimary": true,
      "usageCount": 1250,
      "lastRotated": "2024-01-10T08:30:00.000Z",
      "expiresAt": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

---

### Obtener detalles de una API Key específica

**MÉTODO:** `GET /admin/config/api-keys/{id}`

**DESCRIPCIÓN:** Obtiene información completa de una clave API específica.

**RECIBE:**
```json
{
  "id": 1,
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "description": "Clave principal de Stripe para pagos en producción",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "lastRotated": "2024-01-10T08:30:00.000Z",
  "isActive": true,
  "isPrimary": true,
  "accessLevel": "write",
  "usageCount": 1250,
  "rateLimit": 100,
  "tags": ["production", "critical"],
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-10T08:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `404`: API Key no encontrada

---

## ✏️ MODIFICAR API KEYS

### Actualizar una API Key

**MÉTODO:** `PATCH /admin/config/api-keys/{id}`

**DESCRIPCIÓN:** Modifica la configuración de una clave API existente.

**ENVÍO:**
```json
{
  "name": "Stripe Production Key - Updated",
  "description": "Clave principal actualizada",
  "expiresAt": "2025-12-31T23:59:59Z",
  "rateLimit": 200,
  "tags": ["production", "critical", "updated"]
}
```

**RECIBE:** La API Key actualizada (mismo formato que GET)

**ERRORES POSIBLES:**
- `404`: API Key no encontrada
- `409`: Nombre duplicado

---

### Activar/Desactivar API Key

**MÉTODO:** `POST /admin/config/api-keys/{id}/toggle`

**DESCRIPCIÓN:** Cambia el estado activo/inactivo de una clave API.

**ENVÍO (opcional):**
```json
{
  "active": true
}
```

**RECIBE:** La API Key con el estado actualizado

---

### Rotar API Key

**MÉTODO:** `POST /admin/config/api-keys/{id}/rotate`

**DESCRIPCIÓN:** Genera una nueva clave API reemplazando la actual.

**ENVÍO:**
```json
{
  "reason": "Rotación de seguridad programada"
}
```

**RECIBE:** La API Key con la nueva clave generada

---

## 🗑️ ELIMINAR API KEYS

### Eliminar una API Key

**MÉTODO:** `DELETE /admin/config/api-keys/{id}`

**DESCRIPCIÓN:** Elimina permanentemente una clave API del sistema.

**RECIBE:** `204 No Content` (sin respuesta body)

**ERRORES POSIBLES:**
- `404`: API Key no encontrada
- `409`: No se puede eliminar (restricciones de integridad)

---

## 🔍 CONSULTAS ESPECIALIZADAS

### Obtener API Keys por Servicio y Entorno

**MÉTODO:** `GET /admin/config/api-keys/service/{service}/{environment}`

**DESCRIPCIÓN:** Lista todas las claves activas de un servicio específico en un entorno.

**EJEMPLO:** `GET /admin/config/api-keys/service/stripe/production`

**RECIBE:** Array de API Keys (mismo formato que listar)

---

### Obtener valor desencriptado de API Key

**MÉTODO:** `GET /admin/config/api-keys/{id}/decrypt`

**DESCRIPCIÓN:** Obtiene el valor real de la clave API (solo para uso interno/admin).

**RECIBE:**
```json
{
  "decryptedKey": "sk_live_1234567890abcdef..."
}
```

**⚠️ IMPORTANTE:** Este endpoint revela información sensible. Solo usar cuando sea estrictamente necesario.

---

## 📊 ANÁLISIS Y REPORTES

### Obtener estadísticas de API Keys

**MÉTODO:** `GET /admin/config/api-keys/analytics/overview`

**DESCRIPCIÓN:** Proporciona estadísticas generales sobre todas las claves API.

**RECIBE:**
```json
{
  "analytics": {
    "totalKeys": 25,
    "activeKeys": 20,
    "inactiveKeys": 5,
    "expiringSoon": 3,
    "expired": 1,
    "byService": {
      "stripe": { "total": 5, "active": 4, "primary": 1 },
      "twilio": { "total": 3, "active": 3, "primary": 1 }
    },
    "byEnvironment": {
      "production": { "total": 15, "active": 12 },
      "staging": { "total": 8, "active": 6 }
    },
    "usageStats": {
      "totalUsage": 15750,
      "averageUsage": 630,
      "mostUsed": [
        { "name": "Stripe Production Key", "usage": 1250 },
        { "name": "Twilio SMS Key", "usage": 890 }
      ]
    }
  }
}
```

---

## 🔄 OPERACIONES MASIVAS

### Actualización masiva de API Keys

**MÉTODO:** `POST /admin/config/api-keys/bulk-update`

**DESCRIPCIÓN:** Actualiza múltiples claves API al mismo tiempo.

**ENVÍO:**
```json
{
  "keyIds": [1, 2, 3],
  "updates": {
    "isActive": true,
    "environment": "production",
    "accessLevel": "read"
  }
}
```

**RECIBE:**
```json
{
  "updated": 3,
  "failed": 0,
  "results": [
    { "keyId": 1, "success": true },
    { "keyId": 2, "success": true },
    { "keyId": 3, "success": true }
  ]
}
```

---

### Crear conjunto de claves estándar

**MÉTODO:** `POST /admin/config/api-keys/create-standard-keys`

**DESCRIPCIÓN:** Crea automáticamente claves API estándar para servicios comunes.

**ENVÍO:**
```json
{
  "services": ["stripe", "twilio", "firebase"],
  "environments": ["development", "production"],
  "includeWebhooks": true
}
```

**RECIBE:**
```json
{
  "created": 8,
  "keys": [
    // Array de las claves creadas
  ],
  "skipped": [
    {
      "service": "stripe",
      "environment": "production",
      "reason": "Already exists"
    }
  ]
}
```

---

## 🔄 ROTACIÓN AUTOMÁTICA

### Forzar rotación inmediata

**MÉTODO:** `POST /admin/config/api-keys/{id}/force-rotate`

**DESCRIPCIÓN:** Fuerza la rotación inmediata de una clave API.

**ENVÍO:**
```json
{
  "reason": "Brecha de seguridad detectada"
}
```

**RECIBE:** La API Key con la nueva clave rotada

---

### Verificar si necesita rotación

**MÉTODO:** `GET /admin/config/api-keys/{id}/rotation-validation`

**DESCRIPCIÓN:** Verifica si una clave API necesita ser rotada según su política.

**RECIBE:**
```json
{
  "needsRotation": true,
  "reason": "Expirará en 5 días",
  "recommendedAction": "Rotar inmediatamente"
}
```

---

### Estadísticas de rotación

**MÉTODO:** `GET /admin/config/api-keys/rotation/stats`

**DESCRIPCIÓN:** Obtiene estadísticas sobre rotaciones de claves.

**RECIBE:**
```json
{
  "totalKeys": 25,
  "keysNeedingRotation": 5,
  "autoRotationEnabled": 15,
  "manualRotationOnly": 10,
  "recentlyRotated": 3,
  "rotationSchedule": [
    {
      "keyId": 1,
      "keyName": "Stripe Key",
      "nextRotation": "2024-02-01T00:00:00.000Z",
      "rotationType": "auto"
    }
  ]
}
```

---

### Rotación masiva de claves

**MÉTODO:** `POST /admin/config/api-keys/rotation/bulk-rotate`

**DESCRIPCIÓN:** Rota automáticamente todas las claves que necesitan rotación.

**RECIBE:**
```json
{
  "message": "Bulk rotation completed",
  "totalKeys": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "id": 1,
      "name": "Stripe Production Key",
      "success": true
    },
    {
      "id": 2,
      "name": "Twilio Key",
      "success": false,
      "error": "Service temporarily unavailable"
    }
  ]
}
```

---

### Historial de rotaciones

**MÉTODO:** `GET /admin/config/api-keys/rotation/audit-history`

**DESCRIPCIÓN:** Obtiene el historial de todas las rotaciones realizadas.

**PARÁMETROS DE CONSULTA:**
```
?limit=50&service=stripe
```

**RECIBE:**
```json
{
  "total": 25,
  "logs": [
    {
      "id": 1,
      "keyName": "Stripe Production Key",
      "service": "stripe",
      "environment": "production",
      "action": "rotated",
      "rotatedAt": "2024-01-10T08:30:00.000Z",
      "performedBy": "admin@example.com",
      "reason": "Rotación automática mensual",
      "autoRotated": true
    }
  ]
}
```

---

## 📋 CAMPOS Y VALIDACIONES

### Campos requeridos para crear API Key:
- `name`: 3-100 caracteres
- `service`: Uno de los servicios soportados
- `environment`: development/staging/production
- `keyType`: secret/public/private_key/access_token/refresh_token/webhook_secret
- `keyValue`: Mínimo 10 caracteres

### Servicios soportados:
- `stripe`, `twilio`, `firebase`, `google_maps`, `sendgrid`, `aws`, `azure`, `google_analytics`

### Tipos de clave:
- `secret`: Claves secretas (Stripe sk_live_...)
- `public`: Claves públicas (Stripe pk_live_...)
- `private_key`: Claves privadas (Firebase service account)
- `access_token`: Tokens de acceso OAuth
- `refresh_token`: Tokens de refresco OAuth
- `webhook_secret`: Secretos para validar webhooks

### Políticas de rotación:
- `manual`: Rotación manual únicamente
- `auto_30d`: Rotación automática cada 30 días
- `auto_90d`: Rotación automática cada 90 días
- `auto_1y`: Rotación automática cada año

### Niveles de acceso:
- `read`: Solo lectura
- `write`: Lectura y escritura
- `admin`: Acceso administrativo
- `full`: Acceso completo

---

## 🔧 USO PRÁCTICO

### 1. Configurar Stripe para producción:
```json
POST /admin/config/api-keys
{
  "name": "Stripe Production",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "keyValue": "sk_live_...",
  "isPrimary": true,
  "accessLevel": "write",
  "rotationPolicy": "auto_90d"
}
```

### 2. Verificar claves expirando pronto:
```json
GET /admin/config/api-keys/analytics/overview
// Buscar en analytics.expiringSoon
```

### 3. Rotar clave comprometida:
```json
POST /admin/config/api-keys/123/force-rotate
{
  "reason": "Posible compromiso de seguridad"
}
```

### 4. Obtener clave para uso en código:
```json
GET /admin/config/api-keys/service/stripe/production
// Obtener la clave primaria activa
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Seguridad**: Las claves API se almacenan encriptadas. Solo el endpoint `/decrypt` revela el valor real.

2. **Rotación**: La rotación automática está configurada por política. Las claves críticas deben rotarse regularmente.

3. **Permisos**: Asegúrate de tener permisos `GEOGRAPHY_READ` para consultas y `GEOGRAPHY_WRITE` para modificaciones.

4. **Rate Limiting**: Los endpoints masivos tienen límites de requests. Para grandes volúmenes, considera paginación.

5. **Auditoría**: Todas las operaciones quedan registradas. Revisa el historial para troubleshooting.

6. **Entornos**: Mantén claves separadas por entorno (development/staging/production) para evitar accidentes.

Esta documentación cubre todas las operaciones necesarias para gestionar API Keys desde el panel de administración.
