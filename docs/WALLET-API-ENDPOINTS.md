# 💰 **Documentación de API - Sistema de Wallet**

## 📋 **Resumen**

Documentación completa de todos los endpoints del sistema de wallet, incluyendo rutas, métodos HTTP, parámetros, respuestas y códigos de estado.

---

## 🔐 **Autenticación**

Todos los endpoints requieren autenticación JWT. Incluir el token en el header:

```http
Authorization: Bearer <jwt_token>
```

---

## 👤 **Endpoints de Usuario**

### **Base URL:** `/api/user/wallet`

---

### **1. Obtener Wallet Completa**

**`GET /api/user/wallet`**

Obtiene el balance actual y historial de transacciones de la wallet del usuario autenticado.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "data": {
    "wallet": {
      "id": 1,
      "userId": 1,
      "balance": 125.50,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T15:45:00.000Z"
    },
    "transactions": [
      {
        "id": 1,
        "amount": 50.00,
        "transactionType": "credit",
        "description": "Wallet top-up",
        "createdAt": "2024-01-15T15:45:00.000Z"
      }
    ]
  }
}
```

#### **Códigos de Estado**
- **200** - Éxito
- **401** - No autenticado
- **404** - Wallet no encontrada

---

### **2. Obtener Balance Actual**

**`GET /api/user/wallet/balance`**

Obtiene únicamente el balance actual de la wallet del usuario.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** 30 solicitudes por hora
- **Ventana:** 1 hora

#### **Respuesta Exitosa (200)**
```json
{
  "balance": 125.50,
  "currency": "USD",
  "lastUpdated": "2024-01-15T15:45:00.000Z"
}
```

#### **Códigos de Estado**
- **200** - Éxito
- **401** - No autenticado
- **429** - Límite de solicitudes excedido

---

### **3. Obtener Historial de Transacciones**

**`GET /api/user/wallet/transactions`**

Obtiene historial paginado de transacciones de la wallet con filtros opcionales.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Query Parameters**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `page` | number | No | Número de página | `1` |
| `limit` | number | No | Elementos por página | `10` |
| `type` | string | No | Tipo de transacción | `credit`, `debit`, `all` |
| `startDate` | string | No | Fecha de inicio (YYYY-MM-DD) | `2024-01-01` |
| `endDate` | string | No | Fecha de fin (YYYY-MM-DD) | `2024-12-31` |

#### **Rate Limiting**
- **Límite:** 50 solicitudes por hora
- **Ventana:** 1 hora

#### **Respuesta Exitosa (200)**
```json
{
  "transactions": [
    {
      "id": 1,
      "amount": 50.00,
      "transactionType": "credit",
      "description": "Wallet top-up",
      "createdAt": "2024-01-15T15:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### **Códigos de Estado**
- **200** - Éxito
- **401** - No autenticado
- **429** - Límite de solicitudes excedido

---

### **4. Agregar Fondos**

**`POST /api/user/wallet/add-funds`**

Agrega dinero a la wallet del usuario autenticado y crea un registro de transacción.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "amount": 50.00,
  "description": "Wallet top-up",
  "source": "credit_card",
  "externalTransactionId": "TXN-123456"
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `amount` | number | Sí | Monto a agregar | Min: 0.01, Max: 1000 |
| `description` | string | Sí | Descripción | Min: 1, Max: 255 caracteres |
| `source` | string | No | Fuente de los fondos | `credit_card`, `bank_transfer`, `cash`, `referral_bonus`, `admin_adjustment` |
| `externalTransactionId` | string | No | ID de transacción externa | Max: 100 caracteres |

#### **Rate Limiting**
- **Límite:** 5 solicitudes por hora
- **Ventana:** 1 hora

#### **Respuesta Exitosa (201)**
```json
{
  "success": true,
  "wallet": {
    "id": 1,
    "userId": 1,
    "balance": 175.50,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T15:45:00.000Z"
  },
  "transaction": {
    "id": 1,
    "amount": 50.00,
    "transactionType": "credit",
    "description": "Wallet top-up",
    "createdAt": "2024-01-15T15:45:00.000Z"
  }
}
```

#### **Códigos de Estado**
- **201** - Fondos agregados exitosamente
- **400** - Datos inválidos o límites excedidos
- **401** - No autenticado
- **429** - Límite de solicitudes excedido

---

### **5. Transferir Fondos**

**`POST /api/user/wallet/transfer`**

Transfiere fondos de la wallet del usuario a otro usuario.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "toUserEmail": "usuario@example.com",
  "amount": 25.00,
  "description": "Transfer between users",
  "referenceType": "user_transfer"
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `toUserEmail` | string | Sí | Email del usuario destinatario | Formato de email válido |
| `amount` | number | Sí | Monto a transferir | Min: 0.01, Max: 500 |
| `description` | string | Sí | Descripción de la transferencia | Min: 1, Max: 255 caracteres |
| `referenceType` | string | No | Tipo de referencia | `user_transfer`, `referral_reward`, `admin_transfer` |

#### **Rate Limiting**
- **Límite:** 10 solicitudes por hora
- **Ventana:** 1 hora

#### **Respuesta Exitosa (200)**
```json
{
  "success": true,
  "transactionId": "TRF-123456",
  "fromBalance": 100.00,
  "toBalance": 200.00,
  "message": "Transferencia exitosa"
}
```

#### **Códigos de Estado**
- **200** - Transferencia realizada exitosamente
- **400** - Datos inválidos, fondos insuficientes o usuario destinatario inactivo
- **401** - No autenticado
- **404** - Usuario destinatario no encontrado (email no existe)
- **429** - Límite de solicitudes excedido

---

### **6. Obtener Estadísticas de Wallet**

**`GET /api/user/wallet/stats`**

Obtiene estadísticas detalladas de la wallet del usuario.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "totalTransactions": 25,
  "totalCredits": 500.00,
  "totalDebits": 375.00,
  "averageTransaction": 20.00,
  "monthlyStats": [
    {
      "month": "2024-01",
      "credits": 100.00,
      "debits": 75.00,
      "net": 25.00
    }
  ]
}
```

#### **Códigos de Estado**
- **200** - Estadísticas obtenidas exitosamente
- **401** - No autenticado

---

### **7. Obtener Límites de Transacción**

**`GET /api/user/wallet/limits`**

Obtiene los límites de transacción del usuario.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "dailyLimit": 1000,
  "singleTransactionLimit": 500,
  "transferLimit": 200,
  "usedToday": 150,
  "remainingToday": 850
}
```

#### **Códigos de Estado**
- **200** - Límites obtenidos exitosamente
- **401** - No autenticado

---

### **8. Validar Operación de Wallet**

**`POST /api/user/wallet/validate`**

Valida si una operación de wallet es posible antes de ejecutarla.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "operation": "add_funds",
  "amount": 50.00,
  "toUserEmail": "usuario@example.com"
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Valores Válidos |
|-------|------|-----------|-------------|-----------------|
| `operation` | string | Sí | Tipo de operación | `add_funds`, `transfer`, `deduct` |
| `amount` | number | Sí | Monto de la operación | Min: 0.01 |
| `toUserEmail` | string | No | Email del usuario destinatario (para transferencias) | Formato de email válido |

#### **Rate Limiting**
- **Límite:** 20 solicitudes por hora
- **Ventana:** 1 hora

#### **Respuesta Exitosa (200)**
```json
{
  "valid": true,
  "message": "Operación válida",
  "limits": {
    "dailyLimit": 1000,
    "remainingToday": 850
  }
}
```

#### **Respuesta de Error (200)**
```json
{
  "valid": false,
  "message": "Fondos insuficientes. Disponible: 100.00, Requerido: 150.00",
  "limits": {
    "dailyLimit": 1000,
    "remainingToday": 850
  }
}
```

#### **Códigos de Estado**
- **200** - Validación completada
- **401** - No autenticado
- **429** - Límite de solicitudes excedido

---

## 👨‍💼 **Endpoints de Administración**

### **Base URL:** `/api/admin/wallet`

---

### **1. Obtener Estadísticas Generales**

**`GET /api/admin/wallet/stats`**

Obtiene estadísticas generales del sistema de wallets para administradores.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "totalWallets": 1250,
  "totalBalance": 125000.50,
  "blockedWallets": 15,
  "lowBalanceWallets": 45,
  "dailyTransactions": 250,
  "monthlyTransactions": 7500,
  "averageTransaction": 25.75,
  "topUsers": [
    {
      "userId": 1,
      "name": "Juan Pérez",
      "balance": 500.00,
      "transactionCount": 25
    }
  ]
}
```

#### **Códigos de Estado**
- **200** - Estadísticas obtenidas exitosamente
- **401** - No autenticado
- **403** - Acceso denegado - Se requieren permisos de administrador

---

### **2. Verificación de Salud del Sistema**

**`GET /api/admin/wallet/health-check`**

Realiza una verificación completa de la salud del sistema de wallets.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "status": "healthy",
  "checks": [
    {
      "name": "Database Connection",
      "status": "ok",
      "message": "Connected successfully"
    },
    {
      "name": "Wallet Service",
      "status": "ok",
      "message": "1250 wallets accessible"
    },
    {
      "name": "Transaction Service",
      "status": "ok",
      "message": "7500 transactions accessible"
    }
  ],
  "timestamp": "2024-01-15T15:45:00.000Z"
}
```

#### **Códigos de Estado**
- **200** - Verificación completada
- **401** - No autenticado
- **503** - Sistema no saludable

---

### **3. Reporte de Actividad Sospechosa**

**`GET /api/admin/wallet/suspicious-activity`**

Obtiene un reporte de usuarios con actividad sospechosa en wallets.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Query Parameters**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `limit` | number | No | Número máximo de resultados | `20` |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "suspiciousUsers": [
    {
      "userId": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "riskScore": 85,
      "reasons": ["Alta frecuencia de transacciones", "Múltiples transacciones de gran monto"],
      "lastActivity": "2024-01-15T15:45:00.000Z"
    }
  ],
  "totalSuspicious": 5
}
```

#### **Códigos de Estado**
- **200** - Reporte obtenido exitosamente
- **401** - No autenticado
- **403** - Acceso denegado

---

### **4. Health Score de Usuario**

**`GET /api/admin/wallet/user/:userId/health`**

Obtiene el health score y recomendaciones para un usuario específico.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Path Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `userId` | number | Sí | ID del usuario |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "userId": 1,
  "score": 75,
  "factors": ["Balance bajo", "Sin actividad reciente"],
  "recommendations": ["Agregar fondos a la wallet", "Usar la wallet regularmente"],
  "lastChecked": "2024-01-15T15:45:00.000Z"
}
```

#### **Códigos de Estado**
- **200** - Health score obtenido exitosamente
- **401** - No autenticado
- **404** - Usuario no encontrado

---

### **5. Bloquear Wallet**

**`POST /api/admin/wallet/block`**

Bloquea la wallet de un usuario por razones administrativas.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "userId": 1,
  "reason": "Suspicious activity detected",
  "adminId": 1
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `userId` | number | Sí | ID del usuario cuya wallet se va a bloquear | Min: 1 |
| `reason` | string | Sí | Razón del bloqueo | Min: 1, Max: 500 caracteres |
| `adminId` | number | Sí | ID del administrador que realiza el bloqueo | Min: 1 |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Wallet bloqueada exitosamente",
  "blockedAt": "2024-01-15T15:45:00.000Z",
  "blockedBy": 1
}
```

#### **Códigos de Estado**
- **200** - Wallet bloqueada exitosamente
- **400** - Datos inválidos
- **401** - No autenticado
- **404** - Usuario no encontrado

---

### **6. Desbloquear Wallet**

**`POST /api/admin/wallet/unblock`**

Desbloquea la wallet de un usuario.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "userId": 1,
  "reason": "Issue resolved after investigation",
  "adminId": 1
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `userId` | number | Sí | ID del usuario cuya wallet se va a desbloquear | Min: 1 |
| `reason` | string | Sí | Razón del desbloqueo | Min: 1, Max: 500 caracteres |
| `adminId` | number | Sí | ID del administrador que realiza el desbloqueo | Min: 1 |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Wallet desbloqueada exitosamente",
  "unblockedAt": "2024-01-15T15:45:00.000Z",
  "unblockedBy": 1
}
```

#### **Códigos de Estado**
- **200** - Wallet desbloqueada exitosamente
- **400** - Datos inválidos
- **401** - No autenticado
- **404** - Usuario no encontrado

---

### **7. Ajustar Balance de Wallet**

**`POST /api/admin/wallet/adjust-balance`**

Ajusta el balance de la wallet de un usuario (solo administradores).

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Request Body**
```json
{
  "userId": 1,
  "amount": 50.00,
  "description": "Manual adjustment for refund",
  "adjustmentType": "admin_adjustment",
  "adminId": 1
}
```

#### **Campos del Request**
| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `userId` | number | Sí | ID del usuario cuya wallet se va a ajustar | Min: 1 |
| `amount` | number | Sí | Monto del ajuste (positivo para crédito, negativo para débito) | Min: -1000, Max: 1000 |
| `description` | string | Sí | Descripción del ajuste | Min: 1, Max: 255 caracteres |
| `adjustmentType` | string | Sí | Tipo de ajuste | `admin_adjustment`, `refund`, `correction`, `bonus` |
| `adminId` | number | Sí | ID del administrador que realiza el ajuste | Min: 1 |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "success": true,
  "wallet": {
    "id": 1,
    "userId": 1,
    "balance": 150.00,
    "updatedAt": "2024-01-15T15:45:00.000Z"
  },
  "transaction": {
    "id": 1,
    "amount": 50.00,
    "description": "Ajuste administrativo: Manual adjustment for refund",
    "createdAt": "2024-01-15T15:45:00.000Z"
  }
}
```

#### **Códigos de Estado**
- **200** - Balance ajustado exitosamente
- **400** - Datos inválidos
- **401** - No autenticado
- **404** - Usuario no encontrado

---

### **8. Estado de Rate Limits de Usuario**

**`GET /api/admin/wallet/rate-limits/:userId`**

Obtiene el estado actual de rate limits para un usuario específico.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Path Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `userId` | number | Sí | ID del usuario |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "userId": 1,
  "operations": {
    "addFunds": {
      "attempts": 3,
      "maxAttempts": 5,
      "remaining": 2,
      "resetTime": "2024-01-15T16:45:00.000Z",
      "isBlocked": false
    },
    "transfer": {
      "attempts": 1,
      "maxAttempts": 10,
      "remaining": 9,
      "resetTime": "2024-01-15T16:45:00.000Z",
      "isBlocked": false
    }
  }
}
```

#### **Códigos de Estado**
- **200** - Estado de rate limits obtenido exitosamente
- **401** - No autenticado
- **404** - Usuario no encontrado

---

### **9. Resetear Rate Limits de Usuario**

**`POST /api/admin/wallet/rate-limits/:userId/reset`**

Resetea todos los rate limits para un usuario específico.

#### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Path Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `userId` | number | Sí | ID del usuario |

#### **Rate Limiting**
- **Límite:** Sin límite específico
- **Ventana:** N/A

#### **Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Rate limits reseteados exitosamente",
  "resetAt": "2024-01-15T15:45:00.000Z"
}
```

#### **Códigos de Estado**
- **200** - Rate limits reseteados exitosamente
- **401** - No autenticado

---

## 📊 **Códigos de Estado HTTP**

### **Códigos de Éxito**
- **200** - OK - Solicitud exitosa
- **201** - Created - Recurso creado exitosamente

### **Códigos de Error del Cliente**
- **400** - Bad Request - Datos inválidos o malformados
- **401** - Unauthorized - No autenticado o token inválido
- **403** - Forbidden - Acceso denegado (permisos insuficientes)
- **404** - Not Found - Recurso no encontrado
- **429** - Too Many Requests - Límite de solicitudes excedido

### **Códigos de Error del Servidor**
- **500** - Internal Server Error - Error interno del servidor
- **503** - Service Unavailable - Servicio no disponible

---

## 🚦 **Rate Limiting**

### **Límites por Operación**

| Operación | Límite | Ventana | Bloqueo |
|-----------|--------|---------|---------|
| `balance` | 30 solicitudes | 1 hora | 15 minutos |
| `transactions` | 50 solicitudes | 1 hora | 10 minutos |
| `addFunds` | 5 solicitudes | 1 hora | 2 horas |
| `transfer` | 10 solicitudes | 1 hora | 1 hora |
| `validate` | 20 solicitudes | 1 hora | 30 minutos |

### **Headers de Rate Limiting**

Todas las respuestas incluyen headers informativos:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1642251600
```

### **Respuesta de Límite Excedido (429)**

```json
{
  "message": "Límite de solicitudes excedido",
  "retryAfter": 3600,
  "resetTime": "2024-01-15T16:45:00.000Z"
}
```

---

## 🔔 **Notificaciones**

### **Tipos de Notificaciones**

El sistema envía notificaciones automáticas para:

- **Transacciones exitosas** - Cuando se agregan fondos
- **Transferencias** - Cuando se reciben o envían transferencias
- **Reembolsos** - Cuando se procesan reembolsos
- **Bloqueos/Desbloqueos** - Cambios de estado de wallet
- **Balance bajo** - Cuando el balance es menor a $10

### **Canales de Notificación**

- **Push Notifications** - Notificaciones móviles
- **Email** - Para eventos importantes
- **Base de Datos** - Almacenamiento para consulta posterior

---

## 🛡️ **Seguridad**

### **Validaciones de Seguridad**

- **Autenticación JWT** requerida en todos los endpoints
- **Validación de límites** diarios y por transacción
- **Prevención de transferencias** a sí mismo
- **Auditoría completa** de todas las operaciones
- **Rate limiting** para prevenir abuso
- **Detección de actividad sospechosa**

### **Campos de Auditoría**

Todas las transacciones incluyen:
- **IP Address** del cliente
- **User Agent** del navegador
- **Timestamp** de la operación
- **ID de transacción** único
- **Referencias** a operaciones relacionadas

---

## 📝 **Ejemplos de Uso**

### **Flujo Completo de Agregar Fondos**

```bash
# 1. Validar operación
curl -X POST "https://api.example.com/api/user/wallet/validate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"operation": "add_funds", "amount": 50.00}'

# 2. Agregar fondos
curl -X POST "https://api.example.com/api/user/wallet/add-funds" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50.00, "description": "Wallet top-up", "source": "credit_card"}'
```

### **Flujo de Transferencia**

```bash
# 1. Validar transferencia
curl -X POST "https://api.example.com/api/user/wallet/validate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"operation": "transfer", "amount": 25.00, "toUserEmail": "usuario@example.com"}'

# 2. Realizar transferencia
curl -X POST "https://api.example.com/api/user/wallet/transfer" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"toUserEmail": "usuario@example.com", "amount": 25.00, "description": "Transfer between users"}'
```

---

## 📚 **Referencias Adicionales**

- [Guía de Autenticación](./AUTHENTICATION-GUIDE.md)
- [Guía de Implementación](./implementation-guide.md)
- [Esquema de Base de Datos](./schema.md)
- [Documentación de Swagger](http://localhost:3000/api)

---

**Última actualización:** 15 de Enero, 2024  
**Versión de API:** 1.0.0
