# 🔐 **Endpoints de Verificación de Seguridad**

## 🎯 **Resumen Ejecutivo**

Sistema completo de verificación de seguridad para cambios críticos en el perfil del usuario, implementando códigos de verificación por email/SMS y verificación de identidad con DNI.

---

## 📋 **Tabla de Contenidos**

1. [Cambio de Email](#-cambio-de-email)
2. [Cambio de Contraseña](#-cambio-de-contraseña)
3. [Cambio de Teléfono](#-cambio-de-teléfono)
4. [Verificación de Identidad](#-verificación-de-identidad)
5. [Seguridad y Rate Limiting](#-seguridad-y-rate-limiting)
6. [Códigos de Error](#-códigos-de-error)
7. [Ejemplos de Uso](#-ejemplos-de-uso)

---

## 📧 **Cambio de Email**

### **Endpoint Base:** `/api/user/change-email`

#### **1. Solicitar Cambio de Email**
```http
POST /api/user/change-email/request
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "newEmail": "nuevo.email@example.com",
  "password": "MiContraseñaActual123!"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Código de verificación enviado al nuevo email",
  "expiresAt": "2024-01-15T10:45:00.000Z"
}
```

#### **2. Verificar Cambio de Email**
```http
POST /api/user/change-email/verify
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "newEmail": "nuevo.email@example.com",
  "code": "123456"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Email actualizado exitosamente",
  "user": {
    "id": 1,
    "email": "nuevo.email@example.com",
    "emailVerified": true,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **3. Cancelar Cambio de Email**
```http
POST /api/user/change-email/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "confirm": true
}
```

---

## 🔑 **Cambio de Contraseña**

### **Endpoint Base:** `/api/user/change-password`

#### **1. Solicitar Cambio de Contraseña**
```http
POST /api/user/change-password/request
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "MiContraseñaActual123!"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Código de verificación enviado al email",
  "expiresAt": "2024-01-15T10:45:00.000Z"
}
```

#### **2. Verificar Cambio de Contraseña**
```http
POST /api/user/change-password/verify
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "newPassword": "MiNuevaContraseña456!",
  "code": "123456"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **3. Cancelar Cambio de Contraseña**
```http
POST /api/user/change-password/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "confirm": true
}
```

---

## 📱 **Cambio de Teléfono**

### **Endpoint Base:** `/api/user/change-phone`

#### **1. Solicitar Cambio de Teléfono**
```http
POST /api/user/change-phone/request
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "newPhone": "+584121234567"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Código de verificación enviado por SMS",
  "expiresAt": "2024-01-15T10:45:00.000Z"
}
```

#### **2. Verificar Cambio de Teléfono**
```http
POST /api/user/change-phone/verify
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "newPhone": "+584121234567",
  "code": "123456"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Teléfono actualizado exitosamente",
  "user": {
    "id": 1,
    "phone": "+584121234567",
    "phoneVerified": true,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **3. Cancelar Cambio de Teléfono**
```http
POST /api/user/change-phone/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "confirm": true
}
```

---

## 🆔 **Verificación de Identidad**

### **Endpoint Base:** `/api/user/identity-verification`

#### **1. Enviar Verificación de Identidad**
```http
POST /api/user/identity-verification/submit
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "dniNumber": "12345678",
  "frontPhotoUrl": "https://storage.example.com/dni/front_12345678.jpg",
  "backPhotoUrl": "https://storage.example.com/dni/back_12345678.jpg"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Solicitud de verificación enviada exitosamente",
  "verification": {
    "id": 1,
    "dniNumber": "12345678",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **2. Obtener Estado de Verificación**
```http
GET /api/user/identity-verification/status
Authorization: Bearer <jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "verification": {
    "isVerified": false,
    "status": "pending",
    "verifiedAt": null,
    "rejectionReason": null,
    "dniNumber": "12345678",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **3. Obtener Verificaciones Pendientes (Admin)**
```http
GET /api/user/identity-verification/admin/pending
Authorization: Bearer <admin-jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "verifications": [
    {
      "id": 1,
      "dniNumber": "12345678",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "+584121234567"
      }
    }
  ]
}
```

#### **4. Verificar Identidad (Admin)**
```http
POST /api/user/identity-verification/admin/verify
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "verificationId": 1,
  "status": "verified"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Verificación procesada exitosamente",
  "verification": {
    "id": 1,
    "status": "verified",
    "verifiedAt": "2024-01-15T10:30:00.000Z",
    "verifiedBy": 1
  }
}
```

#### **5. Obtener Estadísticas (Admin)**
```http
GET /api/user/identity-verification/admin/stats
Authorization: Bearer <admin-jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "pending": 25,
    "verified": 70,
    "rejected": 5
  }
}
```

#### **6. Obtener Verificaciones por Estado (Admin)**
```http
GET /api/user/identity-verification/admin/verifications?status=pending&page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## 🔒 **Seguridad y Rate Limiting**

### **Medidas de Seguridad Implementadas**

1. **Autenticación JWT Requerida**
   - Todos los endpoints requieren token JWT válido
   - Verificación de identidad del usuario

2. **Validación de Contraseña Actual**
   - Cambio de email y contraseña requieren contraseña actual
   - Verificación con bcrypt

3. **Códigos de Verificación**
   - Códigos de 6 dígitos numéricos
   - Expiración en 15 minutos
   - Máximo 3 intentos por código
   - Un solo uso por código

4. **Rate Limiting**
   - Máximo 3 códigos por hora por usuario
   - Máximo 3 intentos de verificación por código
   - Bloqueo temporal por exceso de solicitudes

5. **Validación de Datos**
   - Formato de email válido
   - Formato de teléfono internacional
   - DNI entre 7-9 dígitos
   - Contraseñas con complejidad requerida

6. **Unicidad de Datos**
   - Verificación de email único
   - Verificación de teléfono único
   - Verificación de DNI único

### **Configuración de Rate Limiting**

```javascript
// Configuración actual
const RATE_LIMITS = {
  codesPerHour: 3,        // Máximo 3 códigos por hora
  attemptsPerCode: 3,     // Máximo 3 intentos por código
  codeExpiryMinutes: 15,  // Código válido por 15 minutos
  blockDurationMinutes: 60 // Bloqueo por 1 hora si se excede
};
```

---

## ❌ **Códigos de Error**

### **Errores Comunes**

| Código | Descripción | Solución |
|--------|-------------|----------|
| 400 | Datos inválidos | Verificar formato de datos |
| 401 | No autenticado | Proporcionar token JWT válido |
| 403 | Contraseña incorrecta | Verificar contraseña actual |
| 404 | Usuario no encontrado | Verificar que el usuario existe |
| 409 | Email/teléfono ya en uso | Usar otro email/teléfono |
| 429 | Demasiadas solicitudes | Esperar antes de intentar nuevamente |
| 503 | Servicio SMS no disponible | Intentar más tarde |

### **Errores de Validación**

| Campo | Error | Descripción |
|-------|-------|-------------|
| email | Formato inválido | Debe ser un email válido |
| phone | Formato inválido | Debe ser formato internacional (+584121234567) |
| dni | Formato inválido | Debe contener entre 7-9 dígitos |
| password | Muy débil | Debe tener min 8 chars, mayúscula, minúscula, número y especial |
| code | Formato inválido | Debe ser exactamente 6 dígitos numéricos |

---

## 🚀 **Ejemplos de Uso**

### **Flujo Completo de Cambio de Email**

```javascript
// 1. Solicitar cambio de email
const requestResponse = await fetch('/api/user/change-email/request', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newEmail: 'nuevo@example.com',
    password: 'MiContraseña123!'
  })
});

// 2. Usuario recibe código por email
// 3. Verificar cambio con código
const verifyResponse = await fetch('/api/user/change-email/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newEmail: 'nuevo@example.com',
    code: '123456'
  })
});
```

### **Flujo Completo de Verificación de Identidad**

```javascript
// 1. Usuario sube fotos del DNI
const photos = await uploadDNIPhotos(frontPhoto, backPhoto);

// 2. Enviar verificación
const submitResponse = await fetch('/api/user/identity-verification/submit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dniNumber: '12345678',
    frontPhotoUrl: photos.frontUrl,
    backPhotoUrl: photos.backUrl
  })
});

// 3. Verificar estado
const statusResponse = await fetch('/api/user/identity-verification/status', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### **Flujo de Administración**

```javascript
// 1. Obtener verificaciones pendientes
const pendingResponse = await fetch('/api/user/identity-verification/admin/pending', {
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
});

// 2. Procesar verificación
const verifyResponse = await fetch('/api/user/identity-verification/admin/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    verificationId: 1,
    status: 'verified'
  })
});
```

---

## 📊 **Monitoreo y Logs**

### **Logs Importantes**

```javascript
// Logs de seguridad
console.log('Email change request for user', userId, 'new email:', newEmail);
console.log('Verification code sent to', email, 'for user', userId);
console.log('Code verified successfully for user', userId, 'type:', type);
console.log('Identity verification submitted:', verificationId, 'for user', userId);
```

### **Métricas a Monitorear**

1. **Tasa de éxito de verificación**
2. **Número de intentos fallidos**
3. **Tiempo promedio de verificación**
4. **Solicitudes bloqueadas por rate limiting**
5. **Verificaciones de identidad procesadas**

---

## 🔧 **Configuración y Deployment**

### **Variables de Entorno Requeridas**

```bash
# Base de datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Notificaciones
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### **Comandos de Deployment**

```bash
# 1. Migrar base de datos
node migrate-security-tables.js

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm run start:dev

# 4. Probar endpoints
node test-security-endpoints.js
```

---

## 📚 **Recursos Adicionales**

- [Documentación de Swagger](http://localhost:3000/api)
- [Guía de Autenticación](./AUTHENTICATION-GUIDE.md)
- [Guía de Notificaciones](./NOTIFICATIONS-GUIDE.md)
- [Guía de Administración](./ADMIN-GUIDE.md)

---

## 🆘 **Soporte**

Para problemas o preguntas sobre los endpoints de seguridad:

1. Revisar logs del servidor
2. Verificar configuración de variables de entorno
3. Probar con el script de testing incluido
4. Consultar documentación de Swagger
5. Contactar al equipo de desarrollo

---

**Última actualización:** 2024-01-15  
**Versión:** 1.0.0  
**Autor:** Equipo de Desarrollo Uber Clone
