# 🚩 Guía de Feature Flags - Configuración Dinámica del Sistema

## 🎯 Descripción General

Los **Feature Flags** permiten habilitar/deshabilitar funcionalidades del sistema de forma dinámica sin necesidad de despliegues de código. Este sistema soporta rollouts graduales, targeting específico de usuarios y entornos, permitiendo una gestión avanzada de features en producción.

## 🏗️ Arquitectura de Feature Flags

### Modelo de Datos FeatureFlag
```prisma
model FeatureFlag {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(100) // Nombre descriptivo
  key           String   @unique @db.VarChar(100) // Clave única
  description   String?  @db.VarChar(255) // Descripción detallada
  category      String   @db.VarChar(50) // payments, rides, admin, etc.

  // Estado y configuración
  isEnabled     Boolean  @default(false) // Habilitado/deshabilitado
  config        Json?    // Configuración adicional
  rolloutPercentage Int? @default(100) // Porcentaje de rollout (0-100)

  // Targeting específico
  userRoles     Json?    // Roles de usuario específicos
  userIds       Json?    // IDs de usuario específicos
  environments  Json?    // Entornos específicos

  // Configuración operativa
  isActive      Boolean  @default(true) // Flag activo
  autoEnable    Boolean  @default(false) // Auto-habilitar al crear

  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @default(now()) @updatedAt
  createdBy     String?  @db.VarChar(100)
  updatedBy     String?  @db.VarChar(100)
}
```

## 🎭 Tipos de Feature Flags

### 1. Boolean Flags - On/Off Simple
```json
{
  "name": "New Payment Flow",
  "key": "new_payment_flow",
  "category": "payments",
  "isEnabled": true,
  "rolloutPercentage": 100
}
```

### 2. Percentage Rollout Flags - Rollout Gradual
```json
{
  "name": "Advanced Analytics",
  "key": "advanced_analytics",
  "category": "admin",
  "isEnabled": true,
  "rolloutPercentage": 25  // Solo 25% de usuarios
}
```

### 3. Targeted Flags - Usuarios/Roles Específicos
```json
{
  "name": "Beta Features",
  "key": "beta_features",
  "category": "system",
  "isEnabled": true,
  "userRoles": ["admin", "beta_tester"],
  "environments": ["staging"]
}
```

### 4. Configuration Flags - Configuración Dinámica
```json
{
  "name": "Payment Limits",
  "key": "payment_limits",
  "category": "payments",
  "isEnabled": true,
  "config": {
    "maxAmount": 1000,
    "supportedCurrencies": ["USD", "EUR", "GBP"]
  }
}
```

## 🚀 Endpoints de Gestión

### CRUD de Feature Flags
```
GET    /admin/config/feature-flags           # Listar flags con filtros
POST   /admin/config/feature-flags           # Crear flag
GET    /admin/config/feature-flags/:id       # Detalles específicos
GET    /admin/config/feature-flags/key/:key  # Buscar por key
PATCH  /admin/config/feature-flags/:id       # Actualizar flag
DELETE /admin/config/feature-flags/:id       # Eliminar flag
```

### Operaciones Avanzadas
```
POST  /admin/config/feature-flags/:id/toggle         # Alternar estado
POST  /admin/config/feature-flags/evaluate           # Evaluar flag para usuario
POST  /admin/config/feature-flags/create-standard-flags # Crear flags estándar
POST  /admin/config/feature-flags/bulk-update        # Actualizaciones masivas
GET   /admin/config/feature-flags/categories/overview # Resumen por categorías
GET   /admin/config/feature-flags/rollout/status     # Estado de rollouts
POST  /admin/config/feature-flags/public/evaluate    # Evaluación pública
```

## 📊 Evaluación de Feature Flags

### Algoritmo de Evaluación
```typescript
function evaluateFeatureFlag(flag: FeatureFlag, context: EvaluationContext): boolean {
  // 1. Verificar si flag está activo
  if (!flag.isActive) return false;

  // 2. Verificar si feature está habilitado
  if (!flag.isEnabled) return false;

  // 3. Verificar targeting por usuario
  if (!checkUserTargeting(flag, context.userId, context.userRole)) return false;

  // 4. Verificar targeting por entorno
  if (!checkEnvironmentTargeting(flag, context.environment)) return false;

  // 5. Verificar rollout percentage
  if (!checkRolloutPercentage(flag, context.userId)) return false;

  return true;
}
```

### Evaluación por Usuario
```bash
POST /admin/config/feature-flags/evaluate
{
  "featureKey": "new_payment_flow",
  "userId": 123,
  "userRole": "premium_user",
  "environment": "prod"
}
```

### Respuesta de Evaluación
```json
{
  "featureKey": "new_payment_flow",
  "isEnabled": true,
  "isTargeted": true,
  "rolloutPercentage": 100,
  "isInRollout": true,
  "config": {
    "maxAmount": 1000,
    "supportedCurrencies": ["USD", "EUR"]
  },
  "context": {
    "userId": 123,
    "userRole": "premium_user",
    "environment": "prod",
    "userHash": 42
  }
}
```

## 🎯 Targeting Avanzado

### Por Roles de Usuario
```json
{
  "userRoles": ["admin", "manager"],
  "isEnabled": true
}
```

### Por IDs Específicos
```json
{
  "userIds": [1, 2, 3, 100, 250],
  "isEnabled": true
}
```

### Por Entornos
```json
{
  "environments": ["dev", "staging"],
  "isEnabled": true
}
```

### Combinación de Targeting
```json
{
  "userRoles": ["premium_user"],
  "environments": ["prod"],
  "rolloutPercentage": 50,
  "isEnabled": true
}
```

## 📈 Rollout Gradual

### Sistema de Porcentajes
```typescript
function checkRolloutPercentage(flag: FeatureFlag, userId: number): boolean {
  const percentage = flag.rolloutPercentage || 100;
  if (percentage === 100) return true;

  // Crear hash consistente del userId
  const hash = createHash('md5').update(userId.toString()).digest('hex');
  const userBucket = parseInt(hash.substring(0, 8), 16) % 100;

  return userBucket < percentage;
}
```

### Ejemplo de Rollout
```
Rollout 25%: Usuarios con hash 0-24 → Sí
Rollout 25%: Usuarios con hash 25-99 → No

Usuario ID 123:
- Hash: "a665a45920422f9d417e4867efdc4fb8"
- Bucket: 2806156216 % 100 = 16
- Resultado: 16 < 25 → Flag habilitado ✅
```

## 🛠️ Creación de Flags Estándar

### Flags por Categoría
```bash
POST /admin/config/feature-flags/create-standard-flags
{
  "categories": ["payments", "rides", "admin"]
}
```

### Flags Creados Automáticamente

#### Payments
- `new_payment_flow` - Nuevo flujo de pagos
- `digital_wallets` - Billeteras digitales
- `multi_currency` - Soporte multi-moneda

#### Rides
- `ride_pooling` - Compartir viajes
- `priority_pickup` - Recogida prioritaria
- `route_optimization` - Optimización de rutas

#### Admin
- `advanced_analytics` - Analytics avanzados
- `bulk_operations` - Operaciones masivas
- `real_time_monitoring` - Monitoreo en tiempo real

## ⚡ Sistema de Cache de Alto Rendimiento

### Arquitectura de Cache Dual
```typescript
// Cache en dos niveles:
// 1. Feature Flags Cache (5 minutos TTL)
// 2. Evaluations Cache (1 minuto TTL)
```

### Implementación de Cache Service
```typescript
@Injectable()
export class FeatureFlagsCacheService implements OnModuleInit {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly EVALUATION_TTL = 60; // 1 minute

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // Cache warmup on startup
  async onModuleInit() {
    await this.warmupCache();
  }
}
```

### Estrategia de Cache Inteligente

#### **1. Cache de Feature Flags**
```typescript
// Cache por key única
const cacheKey = `feature_flag:${flag.key}`;

// TTL: 5 minutos
await this.redisService.set(cacheKey, JSON.stringify(flag), 300);
```

#### **2. Cache de Evaluaciones**
```typescript
// Cache por combinación única
const cacheKey = `feature_evaluation:${featureKey}:${userId}:${userRole}:${environment}`;

// TTL: 1 minuto (evaluaciones cambian frecuentemente)
await this.redisService.set(cacheKey, JSON.stringify(result), 60);
```

### Invalidación Inteligente de Cache

#### **Invalidación Automática**
```typescript
// Al actualizar un flag
async update(id: number, updateDto: UpdateFeatureFlagDto) {
  const updatedFlag = await this.prisma.featureFlag.update({
    where: { id },
    data: updateDto,
  });

  // Invalidar cache del flag específico
  await this.cacheService.invalidateFlagCache(updatedFlag.key);

  // Recachear con datos actualizados
  await this.cacheService.setCachedFlag(updatedFlag);

  return updatedFlag;
}
```

#### **Invalidación Masiva**
```bash
# Limpiar cache completo
POST /admin/config/feature-flags/cache/clear

# Limpiar cache de flag específico
POST /admin/config/feature-flags/cache/clear/new_payment_flow

# Limpiar evaluaciones expiradas
POST /admin/config/feature-flags/cache/cleanup
```

### Rendimiento y Estadísticas

#### **Métricas de Cache**
```bash
GET /admin/config/feature-flags/cache/stats
```

#### **Respuesta de Estadísticas**
```json
{
  "flagsCached": 25,
  "evaluationsCached": 1250,
  "cacheTTL": 300,
  "evaluationTTL": 60,
  "timestamp": "2024-01-15T10:30:00Z",
  "performance": {
    "hitRate": 0.95,
    "averageResponseTime": 5, // ms
    "cacheMisses": 45,
    "cacheHits": 855
  }
}
```

### Optimización de Cache

#### **Cache Warmup**
```typescript
// Precarga de cache al iniciar
async warmupCache(): Promise<void> {
  const flags = await this.prisma.featureFlag.findMany({
    where: { isActive: true },
  });

  for (const flag of flags) {
    await this.setCachedFlag(flag);
  }
}
```

#### **Cache Staleness Check**
```typescript
// Verificación de frescura del cache
if (dbFlag.updatedAt > new Date(cachedFlag.lastUpdated)) {
  // Cache obsoleto, invalidar
  await this.invalidateFlagCache(key);
}
```

## 📊 Operaciones Masivas

### Actualización Masiva
```bash
POST /admin/config/feature-flags/bulk-update
{
  "flagIds": [1, 2, 3],
  "updates": {
    "isEnabled": true,
    "rolloutPercentage": 75
  }
}
```

### Resultado de Operación Masiva
```json
{
  "message": "Bulk update completed",
  "results": [
    {
      "flagId": 1,
      "success": true,
      "data": { "rolloutPercentage": 75 }
    }
  ],
  "successful": 3,
  "failed": 0
}
```

## 📈 Dashboard y Analytics

### Resumen por Categorías
```bash
GET /admin/config/feature-flags/categories/overview
```

### Respuesta del Dashboard
```json
{
  "overview": {
    "payments": {
      "total": 5,
      "enabled": 3,
      "disabled": 2,
      "active": 5,
      "averageRollout": 80
    },
    "rides": {
      "total": 8,
      "enabled": 6,
      "disabled": 2,
      "active": 7,
      "averageRollout": 65
    }
  },
  "totalFlags": 25
}
```

### Estado de Rollouts
```bash
GET /admin/config/feature-flags/rollout/status
```

### Respuesta de Estado
```json
{
  "rolloutStatus": {
    "totalEnabled": 18,
    "fullRollout": 12,
    "partialRollout": 4,
    "zeroRollout": 2,
    "averageRolloutPercentage": 78.5,
    "rolloutDistribution": {
      "0-25%": 3,
      "26-50%": 2,
      "51-75%": 1,
      "76-99%": 1,
      "100%": 12
    }
  }
}
```

## 🔧 Integración con Aplicaciones

### Cliente JavaScript/TypeScript
```typescript
import axios from 'axios';

class FeatureFlagService {
  private flags: Map<string, any> = new Map();

  async isEnabled(featureKey: string, context?: any): Promise<boolean> {
    try {
      const response = await axios.post('/api/feature-flags/evaluate', {
        featureKey,
        ...context
      });

      this.flags.set(featureKey, response.data);
      return response.data.isEnabled;
    } catch (error) {
      // Fallback: asumir deshabilitado
      return false;
    }
  }

  getConfig(featureKey: string): any {
    return this.flags.get(featureKey)?.config || null;
  }
}

// Uso en componentes
const flagService = new FeatureFlagService();

// Verificar si feature está habilitado
if (await flagService.isEnabled('new_payment_flow', {
  userId: currentUser.id,
  userRole: currentUser.role,
  environment: process.env.NODE_ENV
})) {
  // Mostrar nueva funcionalidad
  renderNewPaymentFlow();
}
```

### React Hook
```typescript
import { useEffect, useState } from 'react';

function useFeatureFlag(featureKey: string, context?: any) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluateFeatureFlag();
  }, [featureKey]);

  const evaluateFeatureFlag = async () => {
    try {
      const response = await fetch('/api/feature-flags/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, ...context })
      });

      const result = await response.json();
      setIsEnabled(result.isEnabled);
      setConfig(result.config);
    } catch (error) {
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return { isEnabled, config, loading, refetch: evaluateFeatureFlag };
}

// Uso en componentes React
function PaymentComponent() {
  const { isEnabled, config, loading } = useFeatureFlag('new_payment_flow', {
    userId: user?.id,
    userRole: user?.role
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isEnabled ? (
        <NewPaymentFlow maxAmount={config?.maxAmount} />
      ) : (
        <OldPaymentFlow />
      )}
    </div>
  );
}
```

## 🎯 Estrategias de Uso

### Desarrollo Seguro
```typescript
// Flags para desarrollo
const DEV_FEATURES = {
  'debug_mode': { environments: ['dev'] },
  'test_payments': { environments: ['staging'] },
  'mock_services': { environments: ['dev', 'staging'] }
};
```

### Rollouts Graduales
```typescript
// Estrategia de rollout
const ROLLOUT_STAGES = [
  { percentage: 1,   duration: '1 day',  target: 'internal_users' },
  { percentage: 5,   duration: '3 days', target: 'beta_users' },
  { percentage: 25,  duration: '1 week', target: 'premium_users' },
  { percentage: 50,  duration: '2 weeks', target: 'all_users' },
  { percentage: 100, duration: 'full',   target: 'production' }
];
```

### Feature Flags por Entorno
```json
{
  "staging": {
    "flags": {
      "new_ui": true,
      "beta_features": true,
      "debug_logging": true
    }
  },
  "production": {
    "flags": {
      "new_ui": false,
      "beta_features": false,
      "debug_logging": false
    }
  }
}
```

## 🚨 Monitoreo y Alertas

### Métricas Clave
```json
{
  "featureFlagMetrics": {
    "totalActiveFlags": 25,
    "flagsByCategory": {
      "payments": 5,
      "rides": 8,
      "admin": 6,
      "system": 6
    },
    "rolloutProgress": {
      "completed": 15,
      "inProgress": 7,
      "notStarted": 3
    },
    "errorRates": {
      "evaluationErrors": 0.01,
      "configurationErrors": 0.005
    },
    "performance": {
      "averageEvaluationTime": 15, // ms
      "cacheHitRate": 95
    }
  }
}
```

### Alertas Automáticas
```json
{
  "alerts": [
    {
      "type": "rollout_stuck",
      "message": "Feature 'new_payment_flow' stuck at 25% rollout for 3 days",
      "severity": "warning"
    },
    {
      "type": "high_error_rate",
      "message": "Feature flag evaluation error rate above 5%",
      "severity": "critical"
    },
    {
      "type": "inactive_flags",
      "message": "15 feature flags have been inactive for 30+ days",
      "severity": "info"
    }
  ]
}
```

## 🌟 Beneficios Estratégicos

### Para Desarrolladores
- ✅ **Despliegues Seguros**: Features pueden ser activados/desactivados sin code deployments
- ✅ **Testing en Producción**: Rollouts graduales permiten testing real con usuarios
- ✅ **Rollback Instantáneo**: Desactivar features problemáticos inmediatamente
- ✅ **A/B Testing**: Comparar diferentes implementaciones

### Para Product Managers
- ✅ **Lanzamientos Graduales**: Control total sobre quién ve qué features
- ✅ **Feature Gating**: Restringir acceso a features premium o beta
- ✅ **Métricas en Tiempo Real**: Ver impacto de features inmediatamente
- ✅ **Optimización de Producto**: Data-driven decisions sobre features

### Para Operaciones
- ✅ **Control de Riesgos**: Reducir impacto de bugs en producción
- ✅ **Mantenimiento Predictible**: Desactivar features durante maintenance
- ✅ **Configuración Dinámica**: Cambiar comportamiento sin downtime
- ✅ **Monitoreo Avanzado**: Tracking detallado de feature usage

## 🚀 Impacto en Rendimiento

### Métricas de Producción
```json
{
  "performanceImpact": {
    "beforeCache": {
      "averageEvaluationTime": 150, // ms (DB query)
      "requestsPerSecond": 50,
      "cpuUsage": 75,
      "memoryUsage": 80
    },
    "afterCache": {
      "averageEvaluationTime": 5, // ms (Redis cache)
      "requestsPerSecond": 2500,
      "cpuUsage": 25,
      "memoryUsage": 45,
      "improvement": {
        "responseTime": "30x faster",
        "throughput": "50x higher",
        "resourceUsage": "70% reduction"
      }
    }
  }
}
```

### Optimización de Consultas
```typescript
// Sin cache: Query DB cada evaluación
const flag = await this.prisma.featureFlag.findUnique({
  where: { key: featureKey },
}); // ~100-150ms

// Con cache: Lookup en Redis
const cached = await this.redisService.get(`feature_flag:${key}`);
// ~1-5ms
```

### Escalabilidad Horizontal
```json
{
  "scalability": {
    "singleServer": {
      "evaluationsPerSecond": 500,
      "concurrentUsers": 1000
    },
    "withRedisCluster": {
      "evaluationsPerSecond": 50000,
      "concurrentUsers": 100000,
      "cacheNodes": 3,
      "readReplicas": 2
    }
  }
}
```

### Monitoreo de Cache
```typescript
// Métricas automáticas
const metrics = {
  cacheHitRate: calculateHitRate(),
  cacheMissRate: calculateMissRate(),
  averageResponseTime: calculateAverageResponseTime(),
  errorRate: calculateErrorRate(),
  staleCacheRate: calculateStaleCacheRate(),
};
```

---

**🚩 Los Feature Flags convierten el desarrollo de software en un proceso controlado y medible, permitiendo innovación rápida con riesgo mínimo y rendimiento excepcional.**
