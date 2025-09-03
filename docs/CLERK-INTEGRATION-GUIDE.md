# Guía de Integración con Clerk

Esta guía explica cómo usar la integración de Clerk en el módulo de usuarios de tu aplicación Uber Clone.

## 📋 Resumen

Se han agregado nuevos endpoints que utilizan autenticación de Clerk, manteniendo compatibilidad con los endpoints existentes. Los nuevos endpoints obtienen automáticamente el `clerk_id` del token JWT, eliminando la necesidad de enviarlo manualmente.

## 🚀 Endpoints Nuevos

### Autenticación con Clerk

#### 1. Registro de Usuario con Clerk
```http
POST /api/user/clerk/register
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**Respuesta exitosa:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "clerkId": "user_2abc123def456ghi789jkl012"
    }
  ]
}
```

#### 2. Obtener Usuario Actual
```http
GET /api/user/clerk/me
Authorization: Bearer <clerk-jwt-token>
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_2abc123def456ghi789jkl012",
  "wallet": {...},
  "emergencyContacts": [...]
}
```

#### 3. Actualizar Usuario Actual
```http
PUT /api/user/clerk/me
Authorization: Bearer <clerk-jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated.email@example.com"
}
```

#### 4. Obtener Mis Viajes
```http
GET /api/user/clerk/me/rides
Authorization: Bearer <clerk-jwt-token>
```

#### 5. Obtener Mis Órdenes de Delivery
```http
GET /api/user/clerk/me/orders
Authorization: Bearer <clerk-jwt-token>
```

## 🔒 Seguridad

Todos los endpoints de Clerk están protegidos por:
- **ClerkAuthGuard**: Verifica la validez del token JWT
- **Validación de expiración**: Rechaza tokens expirados
- **Validación de issuer**: Solo acepta tokens emitidos por Clerk

## 📊 Endpoints Antiguos (Mantenidos por Compatibilidad)

Los endpoints originales siguen funcionando:

```http
# Crear usuario (requiere clerk_id manual)
POST /api/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "clerkId": "user_2abc123def456ghi789jkl012"
}

# Otros endpoints antiguos...
GET /api/user/:id
PUT /api/user/:id
DELETE /api/user/:id
GET /api/user/clerk/:clerkId
GET /api/user?email=...
```

## 🛠️ Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_JWT_PUBLIC_KEY=your_jwt_public_key_here
```

### Configuración en Producción

Para producción, implementa verificación completa del token:

1. **Instala JWT**: `npm install jsonwebtoken`
2. **Actualiza ClerkService** para usar verificación completa:

```typescript
import * as jwt from 'jsonwebtoken';

// En verifyToken()
const decoded = jwt.verify(token, process.env.CLERK_PEM_PUBLIC_KEY);
```

## 🧪 Testing

### Usando Postman/cURL

```bash
# Registro con Clerk
curl -X POST http://localhost:3000/api/user/clerk/register \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }'
```

### Tokens de Desarrollo

Para desarrollo, puedes usar tokens JWT simulados o tokens reales de Clerk desde tu dashboard.

## 📁 Estructura de Archivos

```
src/users/
├── clerk.service.ts          # Servicio de autenticación Clerk
├── guards/
│   └── clerk-auth.guard.ts   # Guard para proteger rutas
├── decorators/
│   └── clerk-user.decorator.ts # Decorador para extraer Clerk ID
├── dto/
│   ├── create-user-clerk.dto.ts  # DTO para creación con Clerk
│   └── update-user-clerk.dto.ts  # DTO para actualización con Clerk
├── users.controller.ts       # Controlador con nuevos endpoints
├── users.service.ts          # Servicio con métodos Clerk
└── users.module.ts          # Módulo actualizado
```

## 🔄 Migración de Usuarios Existentes

Si tienes usuarios existentes sin Clerk ID:

1. **Actualización masiva**: Crear un script para asignar Clerk IDs
2. **Migración gradual**: Los usuarios nuevos usan Clerk, los antiguos usan el flujo tradicional
3. **Validación**: Asegurar que todos los usuarios tengan Clerk ID antes de la transición completa

## ⚠️ Consideraciones de Seguridad

1. **Verificación de Token**: En producción, siempre verifica tokens con la clave pública
2. **Rate Limiting**: Implementa límites de tasa en endpoints de autenticación
3. **Logging**: Registra intentos de autenticación fallidos
4. **HTTPS**: Siempre usa HTTPS en producción
5. **Token Rotation**: Maneja rotación de tokens de Clerk

## 🐛 Solución de Problemas

### Errores Comunes

1. **"Token inválido"**: Verifica que el token sea válido y no haya expirado
2. **"No se pudo extraer el Clerk ID"**: El token no contiene el campo `sub`
3. **"Usuario ya existe"**: Intento de registrar usuario con Clerk ID duplicado

### Debugging

Habilita logs detallados en desarrollo:

```typescript
// En ClerkService
this.logger.debug(`Token payload: ${JSON.stringify(decoded)}`);
```

## 📚 Recursos Adicionales

- [Documentación de Clerk](https://clerk.com/docs)
- [JWT.io](https://jwt.io) - Para decodificar tokens
- [NestJS Guards](https://docs.nestjs.com/guards) - Más sobre guards

---

## 🎯 Próximos Pasos

1. **Frontend Integration**: Actualizar el frontend para usar Clerk
2. **Middleware**: Agregar middleware global para Clerk
3. **Roles & Permissions**: Implementar autorización basada en roles
4. **Social Login**: Configurar proveedores sociales en Clerk
5. **Webhooks**: Configurar webhooks para sincronización de usuarios
