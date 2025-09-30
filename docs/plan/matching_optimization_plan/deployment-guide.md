# 🚀 Guía de Deployment - Sistema de Matching Optimizado

## 🎯 Visión General

Esta guía proporciona instrucciones completas para el **deployment seguro** del Sistema de Matching Optimizado, incluyendo checklist de pre-deployment, rollback plan y configuraciones específicas.

---

## 📋 Checklist Pre-Deployment

### ✅ Requisitos del Sistema
- [ ] **Node.js:** v18.17.0+ instalado
- [ ] **PostgreSQL:** v14+ configurado
- [ ] **Redis:** v6.0+ disponible
- [ ] **Memoria:** Mínimo 2GB RAM
- [ ] **CPU:** Mínimo 2 cores

### ✅ Configuración de Base de Datos
- [ ] **Schema actualizado:** `npm run db:setup` ejecutado
- [ ] **Seeds completos:** `npm run db:seed` ejecutado
- [ ] **Índices optimizados:** Verificar índices de performance
- [ ] **Backups:** Backup completo antes del deployment

### ✅ Configuración de Redis
- [ ] **Memoria suficiente:** Mínimo 512MB para caché
- [ ] **Persistencia:** Configurada según política de datos
- [ ] **Conexión:** Pruebas de conectividad exitosas
- [ ] **Seguridad:** Autenticación configurada si aplica

### ✅ Variables de Entorno
```bash
# Obligatorias
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-key

# Optimización (Recomendadas)
NODE_ENV=production
MATCHING_DEBUG=false
CACHE_TTL_DEFAULT=300
BATCH_SIZE=5
CONCURRENCY_LIMIT=8
```

### ✅ Tests y Validación
- [ ] **Unit tests:** `npm run test:unit` ✅
- [ ] **Integration tests:** `npm run test:integration` ✅
- [ ] **Matching tests:** `npm run test:matching` ✅
- [ ] **Performance tests:** Benchmarks ejecutados
- [ ] **Load tests:** Capacidad máxima validada

### ✅ Health Checks
- [ ] **Database connectivity:** Funcionando
- [ ] **Redis connectivity:** Funcionando
- [ ] **API endpoints:** Respondiendo correctamente
- [ ] **WebSocket connections:** Estableciendo

---

## 🏗️ Estrategias de Deployment

### Blue-Green Deployment (Recomendado)
```bash
# 1. Deploy nueva versión (Blue)
kubectl set image deployment/matching-blue matching=new-version

# 2. Health checks en nueva versión
curl -f http://matching-blue/health || exit 1

# 3. Routing switch (0% -> 100% traffic)
kubectl apply -f blue-green-switch.yaml

# 4. Validación post-deployment
npm run test:matching -- --env=production

# 5. Cleanup versión antigua (Green)
kubectl delete deployment/matching-green
```

### Rolling Update (Alternativo)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: matching-service
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  template:
    spec:
      containers:
      - name: matching
        image: matching:v2.0.0
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Canary Deployment
```yaml
# 5% del tráfico a nueva versión
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: matching-canary
spec:
  http:
  - route:
    - destination:
        host: matching
        subset: v1
      weight: 95
    - destination:
        host: matching
        subset: v2
      weight: 5
```

---

## 🔧 Configuración de Infraestructura

### Docker Configuration
```dockerfile
FROM node:18-alpine AS base

# Instalar dependencias de sistema
RUN apk add --no-cache dumb-init curl

# Configurar usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código compilado
COPY dist ./dist

# Cambiar propietario
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Kubernetes Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: matching-service
  labels:
    app: matching
spec:
  replicas: 3
  selector:
    matchLabels:
      app: matching
  template:
    metadata:
      labels:
        app: matching
    spec:
      containers:
      - name: matching
        image: matching:v2.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 5
```

### ConfigMap para Configuración
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: matching-config
data:
  CACHE_TTL_DEFAULT: "300"
  BATCH_SIZE: "5"
  CONCURRENCY_LIMIT: "8"
  COMPRESSION_THRESHOLD: "1000"
  MATCHING_DEBUG: "false"
```

---

## 🛡️ Plan de Rollback

### Estrategia de Rollback
```bash
#!/bin/bash
# rollback-script.sh

echo "🚨 Iniciando rollback del Sistema de Matching"

# 1. Verificar estado actual
echo "📊 Verificando estado actual..."
curl -s http://current-deployment/health | jq .status || echo "⚠️ Health check falló"

# 2. Backup de métricas actuales
echo "💾 Backup de métricas..."
redis-cli --rdb /backup/matching-$(date +%Y%m%d-%H%M%S).rdb

# 3. Rollback a versión anterior
echo "🔄 Ejecutando rollback..."
kubectl rollout undo deployment/matching-service

# 4. Esperar a que se complete
echo "⏳ Esperando completación..."
kubectl rollout status deployment/matching-service

# 5. Validación post-rollback
echo "✅ Validando rollback..."
sleep 30
curl -f http://matching-service/health || exit 1

# 6. Restaurar configuración si es necesario
echo "⚙️ Restaurando configuración..."
kubectl apply -f config/previous-version-config.yaml

echo "✅ Rollback completado exitosamente"
```

### Triggers Automáticos de Rollback
```yaml
# Argo Rollouts Analysis
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: matching-rollback-analysis
spec:
  metrics:
  - name: error-rate
    interval: 5m
    successCondition: result[0] <= 0.05  # < 5% error rate
  - name: latency
    interval: 5m
    successCondition: result[0] <= 200   # < 200ms p95
  - name: health
    interval: 1m
    successCondition: result[0] == 1     # Health check passing
```

---

## 📊 Monitoreo Post-Deployment

### Métricas Críticas (Primeros 15 minutos)
```bash
# Health check continuo
watch -n 30 'curl -s http://matching-service/health'

# Latencia baseline
ab -n 100 -c 5 http://matching-service/health

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'uber_clone';"

# Redis memory usage
redis-cli info memory
```

### Validación Funcional
```bash
#!/bin/bash
# post-deployment-tests.sh

echo "🧪 Ejecutando tests post-deployment..."

# 1. Health checks
echo "🏥 Health checks..."
curl -f http://matching-service/health || exit 1

# 2. Basic functionality
echo "🔄 Basic functionality..."
curl -X POST http://matching-service/rides \
  -H "Content-Type: application/json" \
  -d '{"pickup":"test","dropoff":"test"}' \
  -w "%{http_code}" | grep 201 || exit 1

# 3. Matching performance
echo "⚡ Matching performance..."
time curl -X POST http://matching-service/rides/match \
  -H "Content-Type: application/json" \
  -d '{"userLat":10.5,"userLng":-66.9}' > /dev/null

# 4. Cache functionality
echo "💾 Cache functionality..."
redis-cli get "drivers:available:*" | head -1 || echo "Cache warming..."

echo "✅ Todos los tests pasaron exitosamente"
```

---

## 🚨 Troubleshooting Post-Deployment

### Problemas Comunes

#### 1. Pods no inician
```
Síntomas: CrashLoopBackOff

Solución:
kubectl logs deployment/matching-service
# Buscar errores de configuración o dependencias faltantes
```

#### 2. Health checks fallan
```
Síntomas: Readiness probe failing

Solución:
kubectl exec -it pod/matching-pod -- curl localhost:3000/health
# Verificar conectividad DB/Redis
```

#### 3. Latencia alta inicial
```
Síntomas: Primeras requests lentas

Solución:
# Cache warming
curl -X POST http://matching-service/admin/cache/warm

# Verificar índices DB
psql $DATABASE_URL -c "REINDEX TABLE drivers;"
```

#### 4. Memory leaks
```
Síntomas: OOM kills

Solución:
# Verificar límites de memoria
kubectl describe pod matching-pod

# Implementar garbage collection forzado
node --expose-gc dist/main.js
```

---

## 📈 Optimizaciones Post-Deployment

### Configuración Dinámica
```typescript
// Ajustes basados en carga
const dynamicConfig = {
  batchSize: process.env.LOAD_FACTOR > 0.8 ? 3 : 5,
  concurrencyLimit: process.env.LOAD_FACTOR > 0.8 ? 5 : 8,
  cacheTTL: process.env.LOAD_FACTOR > 0.8 ? 600 : 300
};
```

### Auto-scaling Rules
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: matching-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: matching-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: External
    external:
      metric:
        name: matching_queue_depth
        selector:
          matchLabels:
            service: matching
      target:
        type: AverageValue
        averageValue: "10"
```

---

## 📞 Contactos de Emergencia

### Deployment Team
- **Lead:** deployment-lead@company.com
- **On-call:** +1-555-DEPLOY
- **Slack:** #deployment-alerts

### Rollback Authority
- **Aprobación P1:** CTO + Tech Lead
- **Aprobación P2-P3:** Tech Lead
- **Aprobación P4:** Senior Engineer

### Timeline de Escalación
- **0-15 min:** Engineering on-call
- **15-60 min:** Tech Lead
- **1-4 horas:** Engineering Manager
- **4+ horas:** CTO

---

## ✅ Checklist Final

### Antes del Go-Live
- [ ] Runbook actualizado
- [ ] Contactos configurados
- [ ] Alertas probadas
- [ ] Rollback plan validado

### Durante Deployment
- [ ] Comunicación con stakeholders
- [ ] Monitoreo continuo
- [ ] Tests automatizados ejecutándose
- [ ] Equipo de rollback listo

### Después del Deployment
- [ ] Métricas baseline establecidas
- [ ] Documentación actualizada
- [ ] Lecciones aprendidas documentadas
- [ ] Celebración del éxito 🎉

---

<p align="center">
  <strong>🚀 Deployment Seguro - Sistema de Matching Optimizado</strong>
</p>

*Esta guía se actualiza automáticamente con cada cambio en la arquitectura. Última actualización: 28 de septiembre de 2025*
