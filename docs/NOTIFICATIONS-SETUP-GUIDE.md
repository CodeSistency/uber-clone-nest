# 🚀 Guía Completa de Configuración de Notificaciones

Esta guía te ayudará a configurar completamente el sistema de notificaciones de tu aplicación Uber Clone con NestJS, incluyendo Firebase Cloud Messaging para push notifications y Twilio para SMS.

## 📋 Tabla de Contenidos

- [API Keys Necesarias](#api-keys-necesarias)
- [Configuración de Firebase](#configuración-de-firebase)
- [Configuración de Twilio](#configuración-de-twilio)
- [Configuración del Proyecto](#configuración-del-proyecto)
- [Pruebas del Sistema](#pruebas-del-sistema)
- [Solución de Problemas](#solución-de-problemas)

## 🔑 API Keys Necesarias

### Firebase Cloud Messaging
```env
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

### Twilio SMS
```env
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Base de Datos y Otros
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/uber_clone"
JWT_SECRET=tu-jwt-secret
REDIS_URL=redis://localhost:6379
```

## 🔥 Configuración de Firebase

### Paso 1: Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto" o selecciona uno existente
3. Habilita Google Analytics si lo deseas
4. Completa la configuración del proyecto

### Paso 2: Habilitar Cloud Messaging

1. En Firebase Console, ve a **Configuración del Proyecto**
2. Haz clic en la pestaña **Cloud Messaging**
3. Toma nota de tu **Server Key** y **Sender ID**

### Paso 3: Crear Service Account

1. En Firebase Console, ve a **Configuración del Proyecto**
2. Haz clic en la pestaña **Cuentas de Servicio**
3. Haz clic en **"Generar nueva clave privada"**
4. Descarga el archivo JSON de la clave
5. **IMPORTANTE**: Copia TODO el contenido del JSON

### Paso 4: Configurar Variables de Entorno

```bash
# Copia el contenido completo del JSON descargado
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tu-proyecto",...}
FIREBASE_PROJECT_ID=tu-proyecto-id
```

## 📱 Configuración de Twilio

### Paso 1: Crear Cuenta Twilio

1. Ve a [Twilio Console](https://www.twilio.com/console)
2. Regístrate para obtener una cuenta gratuita
3. Verifica tu email y número de teléfono

### Paso 2: Obtener Credenciales

1. En Twilio Console, ve al **Dashboard**
2. Anota tu:
   - **Account SID**
   - **Auth Token**

### Paso 3: Comprar Número de Teléfono

1. En Twilio Console, ve a **Phone Numbers**
2. Haz clic en **"Buy a number"**
3. Elige un número con capacidades **SMS**
4. Anota el número comprado (formato: +1234567890)

### Paso 4: Configurar Variables de Entorno

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+1234567890
```

## ⚙️ Configuración del Proyecto

### Paso 1: Archivo de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# =========================================
# FIREBASE CONFIGURATION
# =========================================

FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tu-proyecto",...}

# =========================================
# TWILIO CONFIGURATION
# =========================================

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+1234567890

# =========================================
# DATABASE CONFIGURATION
# =========================================

DATABASE_URL="postgresql://username:password@localhost:5432/uber_clone_db"

# =========================================
# JWT CONFIGURATION
# =========================================

JWT_SECRET=tu-jwt-secret-key-aqui

# =========================================
# REDIS CONFIGURATION (Optional)
# =========================================

REDIS_URL=redis://localhost:6379

# =========================================
# STRIPE CONFIGURATION (Optional)
# =========================================

STRIPE_SECRET_KEY=sk_test_tu-stripe-secret-key
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Base de Datos

```bash
# Ejecutar migraciones de Prisma
npx prisma migrate dev

# (Opcional) Poblar con datos de prueba
npx prisma db seed
```

### Paso 4: Iniciar la Aplicación

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

## 🧪 Pruebas del Sistema

### Verificar Estado de Servicios

```bash
# Verificar que todos los servicios estén configurados
curl http://localhost:3000/api/notifications/test/status
```

**Respuesta esperada:**
```json
{
  "firebase": {
    "initialized": true,
    "status": "configured",
    "projectId": "tu-proyecto-firebase"
  },
  "twilio": {
    "initialized": true,
    "status": "configured",
    "phoneNumber": "+1234567890"
  },
  "websocket": {
    "status": "operational",
    "activeConnections": 0
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Probar Notificaciones

```bash
# 1. Notificación de solicitud de ride
curl -X POST "http://localhost:3000/api/notifications/test/ride-request?userId=test-user"

# 2. Notificación de conductor llegó
curl -X POST "http://localhost:3000/api/notifications/test/driver-arrived?userId=test-user"

# 3. Notificación de emergencia
curl -X POST "http://localhost:3000/api/notifications/test/emergency?userId=test-user"

# 4. Notificación promocional
curl -X POST "http://localhost:3000/api/notifications/test/promotional?userId=test-user"
```

### Registrar Token de Push Notification

```bash
# Registrar token de dispositivo para push notifications
curl -X POST "http://localhost:3000/api/notifications/push-token?userId=test-user" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "tu-fcm-token-aqui",
    "deviceType": "ios",
    "deviceId": "device-123"
  }'
```

### Ver Historial de Notificaciones

```bash
# Ver historial de notificaciones de un usuario
curl "http://localhost:3000/api/notifications/history?userId=test-user&limit=10"
```

## 🔧 Scripts de Automatización

### Script de Configuración

Ejecuta el script de configuración automática:

```bash
node setup-notifications.js
```

### Script de Pruebas

Ejecuta todas las pruebas de notificaciones:

```bash
node test-notifications.js
```

O configura variables de entorno primero:

```bash
export BASE_URL=http://localhost:3000
export TEST_USER_ID=test-user-123
node test-notifications.js
```

## 🚨 Solución de Problemas

### Problemas con Firebase

**Error: "Invalid service account"**
- Verifica que el JSON de la service account esté completo y correctamente formateado
- Asegúrate de que no haya caracteres especiales mal escapados

**Error: "Permission denied"**
- Verifica que la service account tenga permisos de FCM
- Ve a Firebase Console > Project Settings > Service Accounts
- Asegúrate de que la cuenta tenga el rol "Editor" o "Firebase Admin SDK"

**Error: "Token not registered"**
- El token del dispositivo ha expirado
- El usuario necesita refrescar el token desde la app móvil

### Problemas con Twilio

**Error: "Invalid credentials"**
- Verifica Account SID y Auth Token
- Asegúrate de que no haya espacios extra

**Error: "Phone number not verified"**
- Verifica el número de teléfono en Twilio Console
- Asegúrate de que tenga capacidades SMS

**Error: "Insufficient funds"**
- Agrega créditos a tu cuenta de Twilio
- Ve a Twilio Console > Billing > Add Funds

### Problemas Generales

**Notificaciones no llegan**
- Verifica que el usuario tenga tokens registrados
- Revisa las preferencias de notificación del usuario
- Verifica que Firebase/Twilio estén configurados

**Error de conexión a base de datos**
- Verifica DATABASE_URL en .env
- Asegúrate de que PostgreSQL esté corriendo
- Ejecuta las migraciones de Prisma

**Error de Redis**
- Verifica REDIS_URL en .env
- Asegúrate de que Redis esté instalado y corriendo
- Para desarrollo local: `redis-server`

## 📊 Monitoreo y Analytics

### Métricas a Monitorear

- **Tasa de entrega**: Porcentaje de notificaciones entregadas exitosamente
- **Tasa de apertura**: Porcentaje de notificaciones que los usuarios abren
- **Costo por SMS**: Monitorea el uso de Twilio
- **Errores de Firebase**: Tokens expirados, permisos, etc.

### Logs Útiles

```bash
# Ver logs de Firebase
grep "Firebase" logs/application.log

# Ver logs de Twilio
grep "Twilio" logs/application.log

# Ver logs de notificaciones
grep "notification" logs/application.log
```

## 🔒 Consideraciones de Seguridad

### Almacenamiento Seguro de Credenciales

- **Nunca** subas el archivo `.env` al repositorio
- Usa variables de entorno en producción
- Rota las claves regularmente
- Implementa control de acceso basado en roles

### Producción vs Desarrollo

```env
# Desarrollo
FIREBASE_PROJECT_ID=uber-clone-dev
TWILIO_PHONE_NUMBER=+1234567890

# Producción
FIREBASE_PROJECT_ID=uber-clone-prod
TWILIO_PHONE_NUMBER=+1987654321
```

## 📞 Soporte

Para soporte adicional:

- 📚 [Documentación de Firebase](https://firebase.google.com/docs)
- 📚 [Documentación de Twilio](https://www.twilio.com/docs)
- 📚 [Documentación de NestJS](https://docs.nestjs.com)
- 💬 [Comunidad NestJS](https://discord.gg/nestjs)

## 🎯 Checklist Final

- [ ] Proyecto Firebase creado y configurado
- [ ] Service Account de Firebase descargada y configurada
- [ ] Cuenta Twilio creada y verificada
- [ ] Número de teléfono SMS comprado
- [ ] Variables de entorno configuradas en `.env`
- [ ] Base de datos configurada y migrada
- [ ] Aplicación iniciada exitosamente
- [ ] Servicios verificados con `/api/notifications/test/status`
- [ ] Notificaciones de prueba enviadas exitosamente
- [ ] Tokens de dispositivo registrados para push notifications

¡Tu sistema de notificaciones está listo! 🚀
