# 🚀 API Endpoints Guide - Uber Clone

## 📋 Tabla de Contenidos

- [Sistema de Autenticación](#sistema-de-autenticación)
- [Endpoints de Usuarios](#endpoints-de-usuarios)
- [Endpoints de Debug](#endpoints-de-debug)
- [Códigos de Estado HTTP](#códigos-de-estado-http)
- [Manejo de Errores](#manejo-de-errores)

## 🔐 Sistema de Autenticación

### Autenticación con Clerk JWT

**Solo los endpoints marcados con 🔒 requieren un token JWT válido** en el header `Authorization`. Los demás son **públicos**.

```bash
# Solo para endpoints con 🔒
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

### Tokens de Desarrollo

Para desarrollo, puedes usar tokens de prueba en los endpoints que los requieren:

```bash
# Token básico (para endpoints con 🔒)
Authorization: Bearer dev-test-token

# Tokens específicos (para endpoints con 🔒)
Authorization: Bearer dev-test-token-user1
Authorization: Bearer dev-test-token-admin
```

---

## 👤 Endpoints de Usuarios

### 1. POST `/api/user` - Registro de Usuario
**Estado:** ✅ Público (sin autenticación requerida)

Registra un nuevo usuario en el sistema con un Clerk ID temporal.

#### Request
```bash
curl -X 'POST' \
  'http://localhost:3000/api/user' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "John Doe",
  "email": "john.doe@example.com"
}'
```

#### Request Body
```json
{
  "name": "string (requerido, 2-100 caracteres)",
  "email": "string (requerido, formato email válido)"
}
```

#### Response - Éxito (201)
```json
{
  "data": [{
    "id": 15,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "clerkId": "temp_1756914000000_abc123def"
  }],
  "message": "Success",
  "statusCode": 201,
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user"
}
```

#### Response - Error (409 - Email ya existe)
```json
{
  "statusCode": 409,
  "message": "User already exists with this email",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user"
}
```

#### Response - Error (400 - Datos inválidos)
```json
{
  "statusCode": 400,
  "message": ["name must be longer than or equal to 2 characters", "email must be an email"],
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user"
}
```

---

### 2. POST `/api/user/auth/callback` - Callback de Autenticación Clerk 🔒
**Estado:** ✅ Requiere autenticación JWT

Maneja la respuesta después de que Clerk autentica al usuario. Crea usuarios nuevos o vincula cuentas existentes.

#### Request
```bash
curl -X 'POST' \
  'http://localhost:3000/api/user/auth/callback' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "John Doe",
  "email": "john.doe@gmail.com"
}'
```

#### Request Body
```json
{
  "name": "string (opcional)",
  "email": "string (opcional)"
}
```

#### Response - Usuario Nuevo (200)
```json
{
  "data": [{
    "id": 16,
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "clerkId": "user_dev_test_1756914000000"
  }],
  "message": "Welcome! New account created successfully",
  "isNewUser": true
}
```

#### Response - Usuario Existente (200)
```json
{
  "data": [{
    "id": 15,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "clerkId": "temp_1756914000000_abc123def"
  }],
  "message": "Welcome back! User authenticated successfully",
  "isNewUser": false
}
```

#### Response - Cuenta Vinculada (200)
```json
{
  "data": [{
    "id": 15,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "clerkId": "user_dev_test_1756914000000"
  }],
  "message": "Account linked successfully! Welcome back",
  "isNewUser": false
}
```

---

### 3. POST `/api/user/link-clerk` - Vincular Cuenta con Clerk 🔒
**Estado:** ✅ Requiere autenticación JWT

Vincula una cuenta de usuario existente (creada manualmente) con un Clerk ID.

#### Request
```bash
curl -X 'POST' \
  'http://localhost:3000/api/user/link-clerk' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "John Doe",
  "email": "john.doe@example.com"
}'
```

#### Response - Éxito (200)
```json
{
  "data": [{
    "id": 15,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "clerkId": "user_dev_test_1756914000000"
  }],
  "message": "User account linked with Clerk successfully"
}
```

#### Response - Error (404 - Usuario no encontrado)
```json
{
  "statusCode": 404,
  "message": "User not found with this email",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user/link-clerk"
}
```

#### Response - Error (409 - Ya vinculado)
```json
{
  "statusCode": 409,
  "message": "User already linked with Clerk",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user/link-clerk"
}
```

---

### 4. GET `/api/user/:id` - Obtener Usuario por ID
**Estado:** ✅ Público

Obtiene la información de un usuario específico por su ID interno.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/15' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

#### Response - Error (404 - Usuario no encontrado)
```json
{
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user/999"
}
```

---

### 5. GET `/api/user/clerk/:clerkId` - Obtener Usuario por Clerk ID
**Estado:** ✅ Público

Obtiene la información de un usuario por su Clerk ID.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/clerk/user_dev_test_1756914000000' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

---

### 6. GET `/api/user?email=user@example.com` - Obtener Usuario por Email
**Estado:** ✅ Público

Busca un usuario por su dirección de email.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user?email=john.doe@example.com' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

#### Response - No encontrado (200 - null)
```json
null
```

---

### 7. PUT `/api/user/:id` - Actualizar Usuario
**Estado:** ✅ Público

Actualiza la información de un usuario existente.

#### Request
```bash
curl -X 'PUT' \
  'http://localhost:3000/api/user/15' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "John Smith",
  "email": "john.smith@example.com"
}'
```

#### Request Body
```json
{
  "name": "string (opcional)",
  "email": "string (opcional)",
  "clerkId": "string (opcional)"
}
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Smith",
  "email": "john.smith@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

---

### 8. DELETE `/api/user/:id` - Eliminar Usuario
**Estado:** ✅ Público

Elimina un usuario del sistema.

#### Request
```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/user/15' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Smith",
  "email": "john.smith@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

---

### 9. GET `/api/user/clerk/me` - Obtener Usuario Actual 🔒
**Estado:** ✅ Requiere autenticación JWT

Obtiene la información del usuario actualmente autenticado.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/clerk/me' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

#### Response - Error (401 - Token inválido)
```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user/clerk/me"
}
```

---

### 10. PUT `/api/user/clerk/me` - Actualizar Usuario Actual 🔒
**Estado:** ✅ Requiere autenticación JWT

Actualiza la información del usuario actualmente autenticado.

#### Request
```bash
curl -X 'PUT' \
  'http://localhost:3000/api/user/clerk/me' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Updated Name"
}'
```

#### Response - Éxito (200)
```json
{
  "id": 15,
  "name": "Updated Name",
  "email": "john.doe@example.com",
  "clerkId": "user_dev_test_1756914000000"
}
```

---

### 11. GET `/api/user/:clerkId/rides` - Obtener Rides del Usuario
**Estado:** ✅ Público

Obtiene todos los rides asociados a un usuario.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/user_dev_test_1756914000000/rides' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
[
  {
    "rideId": 1,
    "originAddress": "123 Main St, City",
    "destinationAddress": "456 Oak Ave, City",
    "farePrice": 25.50,
    "status": "completed",
    "createdAt": "2025-09-03T15:00:00.000Z"
  }
]
```

---

### 12. GET `/api/user/:clerkId/orders` - Obtener Orders del Usuario
**Estado:** ✅ Público

Obtiene todos los pedidos de delivery asociados a un usuario.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/user_dev_test_1756914000000/orders' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
[
  {
    "orderId": 1,
    "storeId": 5,
    "totalPrice": 45.99,
    "status": "delivered",
    "createdAt": "2025-09-03T14:30:00.000Z"
  }
]
```

---

### 13. GET `/api/user/clerk/me/rides` - Rides del Usuario Actual 🔒
**Estado:** ✅ Requiere autenticación JWT

Obtiene los rides del usuario actualmente autenticado.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/clerk/me/rides' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token'
```

---

### 14. GET `/api/user/clerk/me/orders` - Orders del Usuario Actual 🔒
**Estado:** ✅ Requiere autenticación JWT

Obtiene los pedidos del usuario actualmente autenticado.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/clerk/me/orders' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer dev-test-token'
```

---

## 🔧 Endpoints de Debug

### 15. GET `/api/user/debug/env` - Información del Entorno
**Estado:** ✅ Público

Muestra información sobre las variables de entorno y configuración.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/debug/env' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "clerk": {
    "secretKey": "CONFIGURADO",
    "publishableKey": "CONFIGURADO",
    "jwtPublicKey": "CONFIGURADO",
    "isConfigured": true,
    "apiUrl": "https://api.clerk.com/v1",
    "frontendApi": "clerk.your-domain.com",
    "domain": "your-domain.com"
  },
  "environment": "development",
  "timestamp": "2025-09-03T15:40:00.000Z"
}
```

---

### 16. GET `/api/user/debug/token-generator` - Generador de Tokens
**Estado:** ✅ Público

Genera tokens de prueba para desarrollo.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/debug/token-generator' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "message": "Development test tokens",
  "tokens": [
    "dev-test-token",
    "dev-test-token-user1",
    "dev-test-token-user2",
    "dev-test-token-admin"
  ],
  "usage": "Use any of these tokens in the Authorization header: Bearer <token>",
  "example": {
    "curl": "curl -H \"Authorization: Bearer dev-test-token\" http://localhost:3000/api/user",
    "swagger": "Click \"Authorize\" button and enter: Bearer dev-test-token"
  },
  "note": "These tokens only work in development mode and are handled by ClerkAuthGuard"
}
```

---

### 17. GET `/api/user/debug/clerk-test?token=<token>` - Test de Token Clerk
**Estado:** ✅ Público

Valida y decodifica tokens JWT de Clerk.

#### Request
```bash
curl -X 'GET' \
  'http://localhost:3000/api/user/debug/clerk-test?token=dev-test-token' \
  -H 'accept: application/json'
```

#### Response - Éxito (200)
```json
{
  "success": true,
  "decoded": {
    "sub": "user_dev_test_1756914000000",
    "userId": "user_dev_test_1756914000000",
    "email": "dev_user_dev_test_1756914000000@test.com",
    "name": "Dev Test User"
  },
  "userInfo": {
    "clerkId": "user_dev_test_1756914000000",
    "email": "dev_user_dev_test_1756914000000@test.com",
    "firstName": "Dev",
    "lastName": "Test User"
  },
  "clerkId": "user_dev_test_1756914000000",
  "timestamp": "2025-09-03T15:40:00.000Z"
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token requerido o inválido |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Recurso ya existe |
| 500 | Internal Server Error | Error del servidor |

## 🚨 Manejo de Errores

### Estructura General de Error
```json
{
  "statusCode": 400,
  "message": "Error description or array of validation errors",
  "timestamp": "2025-09-03T15:40:00.000Z",
  "path": "/api/user"
}
```

### Tipos de Errores Comunes

#### Errores de Validación (400)
```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 2 characters",
    "email must be an email"
  ]
}
```

#### Errores de Autenticación (401)
```json
{
  "statusCode": 401,
  "message": "Token de autorización requerido"
}
```

#### Errores de Base de Datos (500)
```json
{
  "statusCode": 500,
  "message": "Can't reach database server at `ep-orange-poetry-a5z1ifzg-pooler.us-east-2.aws.neon.tech:5432`",
  "error": "Database Error"
}
```

---

## 🎯 Guía de Uso Rápida

### Endpoints que NO requieren token (Públicos):
- ✅ `POST /api/user` - Registro
- ✅ `GET /api/user/:id` - Usuario por ID
- ✅ `GET /api/user/clerk/:clerkId` - Usuario por Clerk ID
- ✅ `GET /api/user?email=...` - Usuario por email
- ✅ `PUT /api/user/:id` - Actualizar usuario
- ✅ `DELETE /api/user/:id` - Eliminar usuario
- ✅ `GET /api/user/:clerkId/rides` - Rides del usuario
- ✅ `GET /api/user/:clerkId/orders` - Orders del usuario
- ✅ `GET /api/user/debug/*` - Endpoints de debug

### Endpoints que SÍ requieren token JWT (🔒):
- 🔒 `POST /api/user/auth/callback` - Callback de Clerk
- 🔒 `POST /api/user/link-clerk` - Vincular cuenta
- 🔒 `GET /api/user/clerk/me` - Usuario actual
- 🔒 `PUT /api/user/clerk/me` - Actualizar usuario actual
- 🔒 `GET /api/user/clerk/me/rides` - Rides del usuario actual
- 🔒 `GET /api/user/clerk/me/orders` - Orders del usuario actual

### Flujo Típico:
1. **Registro**: `POST /api/user` (sin token)
2. **Autenticación**: Usuario hace login con Clerk
3. **Callback**: `POST /api/user/auth/callback` (con token)
4. **Uso**: Cualquier endpoint con token JWT

### Tokens de Desarrollo (solo para endpoints 🔒):
- `dev-test-token` (básico)
- `dev-test-token-user1` (usuario específico)
- `dev-test-token-admin` (administrador)

---

## 🔗 Endpoints Relacionados

Esta documentación cubre solo los endpoints de **usuarios**. El sistema también incluye:

- 🚗 **Rides**: Gestión de viajes
- 🛒 **Orders**: Gestión de pedidos
- 💰 **Wallet**: Gestión de billetera
- 🔔 **Notifications**: Sistema de notificaciones
- 🔄 **Realtime**: Comunicación en tiempo real

¿Necesitas documentación para algún endpoint específico o módulo adicional?
