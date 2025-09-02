# 🚀 Guía de Configuración de NestJS - Variables de Entorno

Esta guía explica cómo NestJS maneja las variables de entorno de forma profesional, con validación, tipado fuerte y mejores prácticas.

## 📋 Tabla de Contenidos

- [¿Por qué NestJS tiene su propia forma?](#por-qué-nestjs-tiene-su-propia-forma)
- [Arquitectura de Configuración](#arquitectura-de-configuración)
- [Validación con Joi](#validación-con-joi)
- [Uso del ConfigService](#uso-del-configservice)
- [Mejores Prácticas](#mejores-prácticas)
- [Ejemplos de Implementación](#ejemplos-de-implementación)

## 🤔 ¿Por qué NestJS tiene su propia forma?

A diferencia de otros frameworks que usan `process.env` directamente, NestJS proporciona:

### ✅ **Ventajas del enfoque de NestJS:**

1. **Tipado fuerte** - Autocompletado y detección de errores en tiempo de desarrollo
2. **Validación automática** - Verifica que las variables tengan el formato correcto
3. **Valores por defecto** - No necesitas definir todas las variables
4. **Transformación** - Convierte strings a tipos nativos automáticamente
5. **Centralización** - Toda la configuración en un solo lugar
6. **Modular** - Diferentes configuraciones para diferentes entornos

### ❌ **Problemas del enfoque tradicional:**

```javascript
// ❌ Mal - Acceso directo a process.env
const port = parseInt(process.env.PORT || '3000', 10);
const databaseUrl = process.env.DATABASE_URL;

// ¿Qué pasa si DATABASE_URL no existe?
// ¿Qué pasa si PORT no es un número?
// ¿Qué pasa si DATABASE_URL tiene formato incorrecto?
```

## 🏗️ Arquitectura de Configuración

### Estructura de archivos:

```
src/config/
├── configuration.interface.ts    # Interfaces TypeScript
├── configuration.ts              # Configuración principal
├── validation.schema.ts          # Validación con Joi
├── config.service.ts             # Servicio personalizado
└── config.module.ts              # Módulo global
```

### 1. Interfaces de Configuración (`configuration.interface.ts`)

```typescript
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface Config {
  database: DatabaseConfig;
  firebase: FirebaseConfig;
  twilio: TwilioConfig;
  // ... más configuraciones
}
```

### 2. Configuración Principal (`configuration.ts`)

```typescript
import { Config } from './configuration.interface';

export default (): Config => ({
  database: {
    url: process.env.DATABASE_URL!,
    host: extractDatabaseHost(process.env.DATABASE_URL!),
    port: extractDatabasePort(process.env.DATABASE_URL!),
    // ... parsing automático
  },
  // ... más configuraciones
});
```

### 3. Validación con Joi (`validation.schema.ts`)

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string()
    .required()
    .pattern(/^postgresql:\/\/.+$/)
    .messages({
      'string.pattern.base': 'DATABASE_URL debe ser una URL válida de PostgreSQL'
    }),

  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .messages({
      'string.min': 'JWT_SECRET debe tener al menos 32 caracteres'
    }),
  // ... más validaciones
});
```

### 4. Servicio Personalizado (`config.service.ts`)

```typescript
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<Config>) {}

  get database() {
    return {
      url: this.configService.get<string>('database.url'),
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 5432),
      // ... métodos helper
    };
  }

  get firebase() {
    return {
      projectId: this.configService.get<string>('firebase.projectId', ''),
      isConfigured: (): boolean => {
        return !!(this.configService.get<string>('firebase.projectId'));
      },
    };
  }
}
```

## 🔍 Validación con Joi

### Tipos de validación comunes:

```typescript
// String con patrón específico
DATABASE_URL: Joi.string()
  .required()
  .pattern(/^postgresql:\/\/.+$/)

// Número con límites
PORT: Joi.number()
  .default(3000)
  .min(1000)
  .max(9999)

// Booleano
SWAGGER_ENABLED: Joi.boolean()
  .default(true)

// Validación condicional
FIREBASE_PROJECT_ID: Joi.string()
  .when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  })

// Validación personalizada
FIREBASE_SERVICE_ACCOUNT: Joi.string()
  .custom((value, helpers) => {
    try {
      JSON.parse(value);
      return value;
    } catch (error) {
      return helpers.error('firebase.invalid_json');
    }
  })
```

### Mensajes de error personalizados:

```typescript
.messages({
  'string.pattern.base': 'DATABASE_URL debe ser una URL válida de PostgreSQL',
  'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
  'firebase.invalid_json': 'FIREBASE_SERVICE_ACCOUNT debe ser un JSON válido'
})
```

## 🛠️ Uso del ConfigService

### Inyección básica:

```typescript
@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const port = this.configService.get<number>('PORT', 3000);
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
  }
}
```

### Uso con interfaces tipadas:

```typescript
@Injectable()
export class MyService {
  constructor(private configService: ConfigService<Config>) {}

  someMethod() {
    const dbConfig = this.configService.get<DatabaseConfig>('database');
    const port = dbConfig.port; // ✅ Tipado fuerte
  }
}
```

### Uso con servicio personalizado:

```typescript
@Injectable()
export class MyService {
  constructor(private appConfigService: AppConfigService) {}

  someMethod() {
    const dbConfig = this.appConfigService.database;
    const isFirebaseConfigured = this.appConfigService.firebase.isConfigured();
    // ✅ Autocompletado y métodos helper
  }
}
```

## 📝 Archivo .env

### Estructura recomendada:

```env
# =========================================
# APPLICATION CONFIGURATION
# =========================================
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# =========================================
# DATABASE CONFIGURATION
# =========================================
DATABASE_URL="postgresql://username:password@localhost:5432/uber_clone_db?schema=public"

# =========================================
# FIREBASE CONFIGURATION
# =========================================
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# =========================================
# TWILIO CONFIGURATION
# =========================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# =========================================
# JWT CONFIGURATION
# =========================================
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

## 🚀 Mejores Prácticas

### 1. **Separación por entorno:**

```typescript
// config/configuration.ts
export default (): Config => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    database: {
      ssl: isProduction, // SSL solo en producción
    },
    // ...
  };
};
```

### 2. **Validación específica por entorno:**

```typescript
// config/validation.schema.ts
FIREBASE_PROJECT_ID: Joi.string()
  .when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
```

### 3. **Variables críticas vs opcionales:**

```typescript
// Críticas (requeridas en todos los entornos)
DATABASE_URL: Joi.string().required()
JWT_SECRET: Joi.string().required()

// Opcionales (solo en producción o con valores por defecto)
FIREBASE_PROJECT_ID: Joi.string().optional()
REDIS_URL: Joi.string().default('redis://localhost:6379')
```

### 4. **Manejo seguro de secrets:**

```typescript
// ❌ NO hacer esto
const secret = process.env.JWT_SECRET;

// ✅ Usar ConfigService
const secret = this.configService.get<string>('jwt.secret');
```

### 5. **Documentación clara:**

```typescript
// En interfaces
export interface DatabaseConfig {
  /** URL completa de conexión a PostgreSQL */
  url: string;
  /** Host del servidor de base de datos */
  host: string;
  // ...
}
```

## 💡 Ejemplos de Implementación

### Servicio de base de datos:

```typescript
@Injectable()
export class DatabaseService {
  constructor(private appConfigService: AppConfigService) {}

  async connect() {
    const { host, port, username, password, database, ssl } = this.appConfigService.database;

    return await createConnection({
      host,
      port,
      username,
      password,
      database,
      ssl,
    });
  }
}
```

### Servicio de notificaciones:

```typescript
@Injectable()
export class NotificationService {
  constructor(private appConfigService: AppConfigService) {}

  async sendPushNotification(userId: string, message: string) {
    if (!this.appConfigService.firebase.isConfigured()) {
      throw new Error('Firebase no está configurado');
    }

    const firebaseConfig = this.appConfigService.firebase;
    // ... enviar notificación
  }
}
```

## 🔧 Scripts de Utilidad

### Validación de configuración:

```bash
# Ejecutar validación
node validate-config.js

# En package.json
{
  "scripts": {
    "validate:config": "node validate-config.js"
  }
}
```

### Generación de .env:

```bash
# Script para generar .env desde template
cp .env.template .env
# Editar con valores reales
```

## 🐛 Solución de Problemas

### Error: "Config validation error"

```bash
# Ver errores detallados
npm run validate:config

# Verificar que todas las variables requeridas estén definidas
```

### Error: "Cannot read property of undefined"

```typescript
// ❌ Problema
const port = this.configService.get('PORT');

// ✅ Solución con valor por defecto
const port = this.configService.get('PORT', 3000);

// ✅ Solución con tipado
const port = this.configService.get<number>('PORT', 3000);
```

### Error: "ValidationError: ... is required"

```typescript
// Verificar que la variable esté definida en .env
# En .env
DATABASE_URL="postgresql://..."

# O en validation schema
DATABASE_URL: Joi.string().optional() // Cambiar a opcional si no es crítica
```

## 📚 Recursos Adicionales

- [Documentación oficial de NestJS Config](https://docs.nestjs.com/techniques/configuration)
- [Documentación de Joi](https://joi.dev/api/)
- [Mejores prácticas de configuración](https://12factor.net/config)

## 🎯 Checklist de Configuración

- [ ] Instalar `@nestjs/config` y `joi`
- [ ] Crear estructura de archivos de configuración
- [ ] Definir interfaces TypeScript
- [ ] Implementar validación con Joi
- [ ] Crear servicio personalizado
- [ ] Actualizar `app.module.ts`
- [ ] Crear archivo `.env` con valores reales
- [ ] Ejecutar validación de configuración
- [ ] Probar en diferentes entornos

---

¡Con este sistema, tu configuración de NestJS será **robusta**, **tipada** y **fácil de mantener**! 🚀
