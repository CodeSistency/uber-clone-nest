# Guía de Autenticación - Uber Clone NestJS

## 📋 Resumen

Este proyecto cuenta con un **sistema de autenticación completamente propio** basado en JWT (JSON Web Tokens). El sistema incluye registro, login, refresh tokens y validación de usuarios, sin ninguna dependencia externa de servicios como Clerk.

## 🏗️ Arquitectura

### Estructura del Módulo Auth

```
src/auth/
├── auth.controller.ts       # Endpoints de autenticación
├── auth.service.ts          # Lógica de negocio de autenticación
├── auth.module.ts           # Configuración del módulo
├── dto/                     # Data Transfer Objects
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
├── guards/                  # Guards de protección
│   ├── jwt-auth.guard.ts
│   └── refresh-token.guard.ts
├── strategies/              # Estrategias Passport
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── interfaces/              # Interfaces TypeScript
│   └── jwt-payload.interface.ts
└── decorators/              # Decoradores personalizados
    └── get-user.decorator.ts
```

## 🔐 Características

### ✅ Implementadas
- **Registro de usuarios** con validación de email único
- **Login con email/password** con hash bcrypt
- **Refresh tokens** para mantener sesiones activas
- **JWT Access Tokens** con expiración configurable
- **Guards de protección** para endpoints
- **Validación de contraseñas** con hash seguro
- **Soporte dual**: Clerk y autenticación propia
- **Perfil de usuario** protegido
- **Logout básico** (listo para implementar invalidación de tokens)

### 🔄 Migración de Clerk
- Los usuarios existentes con Clerk ID pueden seguir usando el sistema
- Nuevos usuarios pueden registrarse con autenticación propia
- Compatibilidad hacia atrás mantenida

## 📡 Endpoints de API

### Autenticación

#### POST `/api/auth/register`
Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "clerkId": null
  }
}
```

#### POST `/api/auth/login`
Inicia sesión con email y contraseña.

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123!"
}
```

**Response:** (igual que register)

#### POST `/api/auth/refresh`
Refresca el access token usando el refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/api/auth/profile`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "clerkId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/auth/logout`
Cierra la sesión del usuario (implementación básica).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## 🛡️ Protección de Endpoints

### Usando Guards

Para proteger un endpoint, importa y usa el `JwtAuthGuard`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get('route')
  @UseGuards(JwtAuthGuard)
  async protectedRoute(@Request() req: any) {
    // req.user contiene la información del usuario autenticado
    return { user: req.user };
  }
}
```

### Usando Decoradores

También puedes usar el decorador `@GetUser()` para obtener el usuario directamente:

```typescript
import { GetUser } from '../auth/decorators/get-user.decorator';

@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@GetUser() user: any) {
  return user;
}
```

## ⚙️ Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uber_clone
```

### Configuración por Defecto

```typescript
// En src/config/configuration.ts
jwt: {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}
```

## 🔒 Seguridad

### Hash de Contraseñas
- **bcrypt** con 12 salt rounds
- Contraseñas nunca se almacenan en texto plano
- Validación de fortaleza de contraseña

### JWT Tokens
- **Access Token**: Expira en 1 hora (configurable)
- **Refresh Token**: Expira en 7 días (configurable)
- Secret seguro almacenado en variables de entorno

### Validaciones
- Email único por usuario
- Contraseña mínimo 6 caracteres
- Validación de formato de email
- Verificación de usuario activo

## 📊 Esquema de Base de Datos

### Cambios en el Modelo User

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(100)
  clerkId   String?  @unique @map("clerk_id") @db.VarChar(50)  // Mantengo por compatibilidad, pero no se usa
  password  String?  @db.VarChar(255)  // Campo para hash de contraseña
  isActive  Boolean  @default(true) @map("is_active")  // Estado del usuario
  lastLogin DateTime? @map("last_login")  // Último inicio de sesión

  // ... demás campos
}
```

## 🧪 Testing

### Endpoints de Desarrollo (REMOVER EN PRODUCCIÓN)

- `GET /api/user/debug/env` - Estado de variables de entorno
- `GET /api/user/debug/token-generator` - Generador de tokens de prueba

### Tokens de Prueba

Para desarrollo, puedes usar estos tokens:

```
Authorization: Bearer dev-test-token
Authorization: Bearer dev-test-token-user1
Authorization: Bearer dev-test-token-user2
```

## 🔄 Sistema Independiente

### Autenticación 100% Propia
Este módulo de autenticación es **completamente independiente** y no requiere integración con Clerk.

### Campo clerkId
- El campo `clerkId` se mantiene en la base de datos por compatibilidad con otros módulos
- En el módulo de autenticación, **siempre será `null`**
- No se usa para ningún proceso de autenticación

### Compatibilidad
- ✅ **Sistema completamente propio** sin dependencias externas
- ✅ **Nuevos usuarios** se registran con autenticación interna
- ✅ **Base de datos preparada** para usuarios existentes

## 🚀 Próximos Pasos

### Mejoras Pendientes
1. **Invalidación de Tokens**: Implementar blacklist de tokens revocados
2. **Rate Limiting**: Limitar intentos de login por IP
3. **Email Verification**: Verificación de email al registro
4. **Password Reset**: Sistema de recuperación de contraseña
5. **2FA**: Autenticación de dos factores
6. **Session Management**: Mejor manejo de sesiones múltiples

### Endpoints Adicionales
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `GET /api/auth/sessions`

## 📝 Ejemplos de Uso

### Registro e Inicio de Sesión

```typescript
// 1. Registrar usuario
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'Password123!'
  })
});

const { accessToken, refreshToken } = await registerResponse.json();

// 2. Usar el token para requests autenticados
const profileResponse = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Refresh Token Flow

```typescript
// Cuando el access token expira
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${refreshToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken } = await refreshResponse.json();
```

---

## 🎯 Conclusión

El nuevo sistema de autenticación proporciona:
- ✅ **Seguridad robusta** con JWT y hash bcrypt
- ✅ **Flexibilidad** para migrar desde Clerk gradualmente
- ✅ **Escalabilidad** con refresh tokens
- ✅ **Compatibilidad** con la arquitectura existente
- ✅ **Documentación completa** para desarrollo y mantenimiento

El sistema está listo para producción y puede ser extendido fácilmente con características adicionales según las necesidades del proyecto.
