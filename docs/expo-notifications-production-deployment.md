# 🚀 Production Deployment Guide - Expo Notifications

## **Checklist Pre-Deployment**

### ✅ **Configuración del Entorno**
- [ ] `NOTIFICATION_PROVIDER=expo` (o `firebase` si prefieres)
- [ ] `EXPO_PROJECT_ID` configurado (opcional pero recomendado)
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` configurados
- [ ] Base de datos PostgreSQL configurada y migrada
- [ ] Redis configurado para WebSocket (opcional pero recomendado)

### ✅ **Dependencias Instaladas**
```bash
npm install expo-server-sdk twilio
# Para Firebase: npm install firebase-admin twilio
```

### ✅ **Archivos Verificados**
- [ ] `src/notifications/expo-notifications.service.ts` ✓
- [ ] `src/notifications/notification-manager.service.ts` ✓
- [ ] `src/notifications/notification-manager.module.ts` ✓
- [ ] Todos los servicios migrados al `NotificationManager` ✓

---

## 🐳 **Deployment con Docker**

### **Dockerfile Optimizado**

```dockerfile
# Multi-stage build para producción
FROM node:18-alpine AS base

# Instalar dependencias solo para producción
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurar variables de entorno para build
ENV NODE_ENV=production
ENV NOTIFICATION_PROVIDER=expo

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NOTIFICATION_PROVIDER=expo

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cambiar permisos
USER nestjs

EXPOSE 3000

ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/notifications/provider-status || exit 1

CMD ["npm", "run", "start:prod"]
```

### **Docker Compose para Producción**

```yaml
version: '3.8'

services:
  uber-clone-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      # Base configuration
      - NODE_ENV=production
      - PORT=3000

      # Notification Provider
      - NOTIFICATION_PROVIDER=expo

      # Expo (Optional)
      - EXPO_PROJECT_ID=${EXPO_PROJECT_ID}

      # Twilio (Required)
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}

      # Database
      - DATABASE_URL=${DATABASE_URL}

      # JWT
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=1h
      - JWT_REFRESH_EXPIRES_IN=7d

      # Redis (Optional)
      - REDIS_URL=${REDIS_URL}

    depends_on:
      - postgres
      - redis
    restart: unless-stopped

    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=uber_clone_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  postgres_data:
```

### **Variables de Entorno de Producción**

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Notification Provider (REQUIRED)
NOTIFICATION_PROVIDER=expo

# Expo Configuration (Optional)
EXPO_PROJECT_ID=your-production-expo-project-id

# Twilio Configuration (REQUIRED for SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-production-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL="postgresql://user:password@postgres:5432/uber_clone_prod"

# JWT (Generate secure keys)
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (Optional but recommended)
REDIS_URL=redis://redis:6379

# Admin JWT (Separate from user JWT)
ADMIN_JWT_SECRET="your-admin-jwt-secret-key-here"
ADMIN_JWT_EXPIRES_IN=1h
ADMIN_JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=warn

# Rate Limiting
NOTIFICATION_RATE_LIMIT_PER_HOUR=1000
NOTIFICATION_RATE_LIMIT_PER_MINUTE=50
```

---

## ☁️ **Deployment en la Nube**

### **Railway.app (Recomendado para Expo)**

#### **railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/notifications/provider-status",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "sleepApplication": false,
    "enableWarptime": false
  },
  "environments": {
    "production": {
      "variables": {
        "NOTIFICATION_PROVIDER": "expo",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### **Variables de Entorno en Railway**
```bash
# Railway Environment Variables
NOTIFICATION_PROVIDER=expo
EXPO_PROJECT_ID=your-expo-project-id
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
DATABASE_URL=${DATABASE_URL}  # Provided by Railway
REDIS_URL=${REDIS_URL}       # If using Railway Redis
```

### **Vercel Deployment**

#### **vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NOTIFICATION_PROVIDER": "expo",
    "NODE_ENV": "production"
  }
}
```

### **Heroku Deployment**

#### **Procfile**
```
web: npm run start:prod
```

#### **Configuración de Build**
```yaml
# app.json (para Heroku)
{
  "name": "Uber Clone API",
  "description": "Ride-sharing API with Expo notifications",
  "env": {
    "NOTIFICATION_PROVIDER": {
      "value": "expo"
    },
    "NODE_ENV": {
      "value": "production"
    }
  }
}
```

---

## 📊 **Monitoreo y Alertas**

### **Health Checks**

```typescript
// src/health/notifications.health.ts
import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthIndicator } from '@nestjs/terminus';
import { NotificationManagerService } from '../notifications/notification-manager.service';

@Injectable()
export class NotificationsHealthIndicator extends HealthIndicator {
  constructor(private notificationManager: NotificationManagerService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const status = this.notificationManager.getProviderStatus();
      const isHealthy = status.currentProvider !== undefined;

      return this.getStatus(key, isHealthy, {
        provider: status.currentProvider,
        availableProviders: status.availableProviders,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
      });
    }
  }
}
```

### **Endpoints de Monitoreo**

```typescript
// Health check endpoint
GET /health
GET /health/notifications

// Status endpoints
GET /api/notifications/provider-status
GET /api/notifications/analytics
```

### **Prometheus Metrics**

```typescript
// src/notifications/notifications.metrics.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram } from 'prom-client';

@Injectable()
export class NotificationsMetricsService {
  private readonly notificationSent = new Counter({
    name: 'notifications_sent_total',
    help: 'Total number of notifications sent',
    labelNames: ['provider', 'channel', 'type'],
  });

  private readonly notificationLatency = new Histogram({
    name: 'notification_send_duration_seconds',
    help: 'Duration of notification sending',
    labelNames: ['provider', 'channel'],
  });

  recordNotificationSent(provider: string, channel: string, type: string) {
    this.notificationSent.inc({ provider, channel, type });
  }

  recordLatency(provider: string, channel: string, duration: number) {
    this.notificationLatency.observe({ provider, channel }, duration);
  }
}
```

### **Alertas Recomendadas**

```yaml
# Prometheus alerting rules
groups:
  - name: notifications_alerts
    rules:
      - alert: NotificationProviderDown
        expr: up{job="uber-clone-api", service="notifications"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Notification service is down"
          description: "Notification provider {{ $labels.provider }} is not responding"

      - alert: HighNotificationFailureRate
        expr: rate(notification_send_failures_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High notification failure rate"
          description: "Notification failure rate is {{ $value }} for provider {{ $labels.provider }}"

      - alert: ExpoTokenExhaustion
        expr: expo_push_tokens_active < 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Low active Expo push tokens"
          description: "Only {{ $value }} active push tokens remaining"
```

---

## 🔧 **Scripts de Automatización**

### **Script de Setup de Producción**

```bash
#!/bin/bash
# setup-production.sh

echo "🚀 Configurando Uber Clone para producción..."

# Verificar variables de entorno requeridas
required_vars=("NOTIFICATION_PROVIDER" "TWILIO_ACCOUNT_SID" "DATABASE_URL")
for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "❌ Variable requerida $var no está configurada"
    exit 1
  fi
done

# Verificar dependencias
echo "📦 Verificando dependencias..."
if ! npm list expo-server-sdk > /dev/null 2>&1; then
  echo "❌ expo-server-sdk no está instalado"
  exit 1
fi

# Ejecutar migraciones de base de datos
echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

# Verificar conectividad de servicios
echo "🔍 Verificando servicios..."
curl -f http://localhost:3000/api/notifications/provider-status > /dev/null
if [[ $? -ne 0 ]]; then
  echo "❌ Servicio de notificaciones no responde"
  exit 1
fi

echo "✅ Configuración completada exitosamente!"
echo "🎯 Provider activo: $NOTIFICATION_PROVIDER"
```

### **Script de Verificación de Salud**

```bash
#!/bin/bash
# health-check.sh

echo "🏥 Verificando salud del sistema..."

# Verificar API
if curl -f -s http://localhost:3000/health > /dev/null; then
  echo "✅ API está saludable"
else
  echo "❌ API no responde"
  exit 1
fi

# Verificar notificaciones
status=$(curl -s http://localhost:3000/api/notifications/provider-status | jq -r '.currentProvider')
if [[ "$status" == "expo" ]] || [[ "$status" == "firebase" ]]; then
  echo "✅ Notificaciones configuradas correctamente (Provider: $status)"
else
  echo "❌ Sistema de notificaciones mal configurado"
  exit 1
fi

# Verificar base de datos
if curl -f -s http://localhost:3000/health/database > /dev/null; then
  echo "✅ Base de datos conectada"
else
  echo "❌ Problemas de conexión a base de datos"
  exit 1
fi

echo "🎉 Todos los servicios están operativos!"
```

---

## 🚨 **Troubleshooting de Producción**

### **Problemas Comunes**

#### **1. Notificaciones no llegan**
```bash
# Verificar configuración
curl http://localhost:3000/api/notifications/provider-status

# Verificar logs
tail -f logs/application.log | grep "notification"

# Probar envío manual
curl -X POST "http://localhost:3000/api/notifications/test/ride-request?userId=test-user"
```

#### **2. Tokens Expo expirados**
```sql
-- Limpiar tokens expirados
UPDATE push_tokens
SET is_active = false, updated_at = NOW()
WHERE updated_at < NOW() - INTERVAL '30 days';
```

#### **3. Rate limiting**
```bash
# Verificar límites actuales
curl http://localhost:3000/api/notifications/analytics

# Ajustar límites si es necesario
export NOTIFICATION_RATE_LIMIT_PER_HOUR=2000
```

#### **4. Problemas de memoria**
```bash
# Monitorear uso de memoria
docker stats uber-clone-api

# Configurar límites de memoria
docker run --memory=512m --memory-swap=1g uber-clone-api
```

### **Rollback Strategy**

```bash
# Cambiar a Firebase como fallback
export NOTIFICATION_PROVIDER=firebase

# Reiniciar servicio
docker-compose restart uber-clone-api

# Verificar funcionamiento
curl http://localhost:3000/api/notifications/provider-status
```

---

## 📈 **Optimizaciones de Producción**

### **Configuración de Performance**

```typescript
// src/config/notification.config.ts
export const notificationConfig = {
  expo: {
    maxConcurrentRequests: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    chunkSize: 100,
  },
  rateLimiting: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
    },
    byUser: {
      windowMs: 60 * 1000, // 1 minute
      max: 50, // limit each user to 50 notifications per minute
    },
  },
  caching: {
    pushTokens: {
      ttl: 3600, // 1 hour
      maxSize: 10000,
    },
    userPreferences: {
      ttl: 1800, // 30 minutes
      maxSize: 5000,
    },
  },
};
```

### **Configuración de Logging**

```typescript
// src/config/logging.config.ts
export const loggingConfig = {
  notifications: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: [
      {
        type: 'file',
        filename: 'logs/notifications.log',
        maxsize: '10m',
        maxFiles: 5,
      },
      {
        type: 'console',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
      },
    ],
    filters: {
      // Log solo errores en producción
      production: ['error', 'warn'],
      development: ['debug', 'info', 'warn', 'error'],
    },
  },
};
```

---

## 🎯 **Post-Deployment Checklist**

### ✅ **Verificaciones Finales**
- [ ] API responde correctamente en `/health`
- [ ] Notificaciones llegan a dispositivos de prueba
- [ ] SMS fallback funciona para números de prueba
- [ ] WebSocket connections se mantienen activas
- [ ] Base de datos maneja la carga esperada
- [ ] Logs se rotan correctamente
- [ ] Monitoreo está configurado y funcionando

### ✅ **Configuración de Monitoreo**
- [ ] Alertas configuradas para fallos críticos
- [ ] Dashboards de Grafana/Kibana configurados
- [ ] Logs centralizados (ELK stack o similar)
- [ ] Métricas de negocio configuradas

### ✅ **Documentación**
- [ ] Runbooks actualizados con procedimientos de troubleshooting
- [ ] Documentación de API actualizada
- [ ] Contactos de soporte documentados

---

**🎉 ¡Tu sistema de notificaciones está listo para producción!**

**Próximos pasos recomendados:**
1. Ejecutar el checklist de pre-deployment
2. Configurar variables de entorno de producción
3. Ejecutar deployment en staging primero
4. Verificar funcionamiento con usuarios de prueba
5. Monitorear métricas durante la primera semana



