# 📚 Cursor Rules - Uber Clone NestJS

Bienvenido a las reglas de Cursor para el proyecto **Uber Clone NestJS**. Estas reglas te ayudarán a navegar y entender mejor el código.

## 🎯 Reglas Disponibles

### 📋 **project-architecture.mdc**
**Alcance:** Todo el proyecto
**Descripción:** Arquitectura general y estructura del proyecto Uber Clone

**Contenido:**
- Estructura de módulos NestJS
- Arquitectura de base de datos PostgreSQL con Prisma
- Sistema de autenticación JWT
- WebSockets con Socket.IO
- Integraciones (Stripe, Twilio, Firebase)
- Patrones de diseño usados

### 🔐 **authentication-system.mdc**
**Alcance:** `src/auth/**/*`
**Descripción:** Sistema de autenticación JWT y estrategias de Passport

**Contenido:**
- Configuración de JWT (access + refresh tokens)
- Guards y protección de rutas
- Estrategias Passport
- Flujo de registro/login
- Manejo de errores
- DTOs de autenticación

### 🗄️ **database-schema.mdc**
**Alcance:** `prisma/**/*`
**Descripción:** Esquema de base de datos PostgreSQL con Prisma ORM

**Contenido:**
- Modelo completo de User, Driver, Ride, etc.
- Relaciones entre entidades
- Configuración de índices
- Consultas comunes
- Migraciones y seeds
- Optimizaciones de performance

### ⚡ **websocket-realtime.mdc**
**Alcance:** `src/websocket/**/*`
**Descripción:** Sistema de WebSockets para comunicación en tiempo real

**Contenido:**
- Configuración de Socket.IO
- Eventos de ride (join, accept, complete)
- Sistema de chat en tiempo real
- Emergencias SOS
- Integración con notificaciones
- Manejo de rooms y namespaces

### 🚗 **business-modules.mdc**
**Alcance:** `src/rides/**/*`, `src/users/**/*`, `src/drivers/**/*`
**Descripción:** Módulos de negocio principales (rides, users, drivers)

**Contenido:**
- UsersService: gestión de usuarios y perfiles
- RidesService: lógica de viajes y estimaciones
- DriversService: gestión de conductores
- WalletService: billetera digital
- NotificationsService: sistema de notificaciones
- DTOs y validaciones

### 💳 **payments-stripe.mdc**
**Alcance:** `src/stripe/**/*`
**Descripción:** Sistema de pagos con Stripe integration

**Contenido:**
- StripeService: integración completa
- Payment intents y confirmaciones
- Webhooks y manejo de eventos
- Sistema de promociones
- Refunds y transacciones
- DTOs para pagos

### 🚀 **development-deployment.mdc**
**Alcance:** `*.json`, `*.js`, `*.ts`
**Descripción:** Guía de desarrollo, configuración y deployment

**Contenido:**
- Configuración del entorno
- Variables de entorno
- Scripts de desarrollo
- Testing (unit, integration, e2e)
- Docker y deployment
- CI/CD con GitHub Actions
- Monitoreo y logging
- Seguridad y optimización

## 🏗️ Arquitectura del Proyecto

```
uber-clone-nest/
├── src/
│   ├── auth/              # 🔐 Autenticación JWT
│   ├── users/             # 👥 Gestión de usuarios
│   ├── drivers/           # 🚗 Gestión de conductores
│   ├── rides/             # 🚕 Sistema de viajes
│   ├── chat/              # 💬 Mensajería
│   ├── wallet/            # 💰 Billetera digital
│   ├── stripe/            # 💳 Pagos con Stripe
│   ├── websocket/         # ⚡ Comunicación en tiempo real
│   ├── notifications/     # 🔔 Sistema de notificaciones
│   ├── prisma/            # 🗄️ Base de datos
│   └── config/            # ⚙️ Configuración
├── prisma/
│   ├── schema.prisma      # 📋 Esquema de BD
│   └── seed.ts           # 🌱 Datos iniciales
├── test/                 # 🧪 Tests
├── docs/                 # 📖 Documentación
└── .cursor/rules/        # 📚 Reglas de Cursor
```

## 🚀 Inicio Rápido

1. **Instalación:**
   ```bash
   npm install
   cp env-config-template.txt .env
   npm run db:setup
   npm run db:seed
   ```

2. **Desarrollo:**
   ```bash
   npm run start:dev
   ```

3. **Documentación:**
   - Swagger: http://localhost:3000/api
   - Health check: http://localhost:3000/health

## 🎨 Patrones de Diseño

- **Repository Pattern**: PrismaService para acceso a datos
- **Observer Pattern**: WebSocket para eventos en tiempo real
- **Strategy Pattern**: Múltiples estrategias de autenticación
- **Factory Pattern**: DTOs para creación de objetos
- **Decorator Pattern**: Guards y interceptors de NestJS

## 🧪 Testing Strategy

- **Unit Tests**: Servicios individuales y utilidades
- **Integration Tests**: Endpoints completos y base de datos
- **E2E Tests**: Flujos completos de usuario
- **Performance Tests**: Load y stress testing
- **Security Tests**: Auditing de dependencias

## 🔧 Tecnologías Principales

- **Framework**: NestJS con TypeScript
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT con Passport.js
- **Tiempo real**: Socket.IO con Redis
- **Pagos**: Stripe API
- **Notificaciones**: Push, SMS, Email
- **Cache**: Redis
- **Validación**: class-validator
- **Documentación**: Swagger/OpenAPI

## 📊 Base de Datos - Entidades

- **Users**: Perfiles de usuario con wallet
- **Drivers**: Conductores con verificación
- **Rides**: Viajes con ubicación y precio
- **Delivery Orders**: Pedidos de delivery
- **Wallet**: Transacciones financieras
- **Notifications**: Historial de notificaciones
- **Chat Messages**: Mensajes entre usuarios
- **Ratings**: Calificaciones de servicios

## 🔐 Seguridad

- **JWT Authentication**: Access + Refresh tokens
- **Rate Limiting**: Protección contra abuso
- **Input Validation**: DTOs con class-validator
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad HTTP
- **Webhook Verification**: Validación de Stripe

## 📈 Escalabilidad

- **Redis Pub/Sub**: Comunicación entre instancias
- **Database Indexing**: Optimización de consultas
- **Connection Pooling**: Manejo eficiente de conexiones
- **Caching**: Redis para datos frecuentes
- **Horizontal Scaling**: Múltiples instancias

## 🎯 Próximos Pasos

1. **Revisar reglas específicas** según el módulo que trabajes
2. **Configurar entorno** siguiendo `development-deployment.mdc`
3. **Entender la arquitectura** leyendo `project-architecture.mdc`
4. **Explorar base de datos** con `database-schema.mdc`
5. **Implementar funcionalidades** usando los ejemplos de código

---

**💡 Tip**: Las reglas están organizadas por dominio. Usa la regla más específica para el área que estés trabajando, y `project-architecture.mdc` para entender el panorama general.
