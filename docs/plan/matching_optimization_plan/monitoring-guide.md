# 📊 Guía de Monitoreo - Sistema de Matching Optimizado

## 🎯 Visión General

Esta guía documenta cómo monitorear el **Sistema de Matching Optimizado** en producción, incluyendo métricas clave, alertas y procedimientos de troubleshooting.

---

## 📈 Métricas Clave

### Latencia y Performance

#### Métricas Principales
```bash
# Latencia total del matching
GET matching:metrics:total_duration

# Latencia por fase (desarrollo)
console.time('🔍 Health Check')    # ~2-5ms
console.time('🔧 Filters Building') # ~1-3ms
console.time('🗂️ Drivers Search')   # ~10-45ms
console.time('📏 Distance Calculation') # ~5-20ms
console.time('🧮 Scoring')          # ~10-35ms
console.time('📊 Response Preparation') # ~2-8ms
```

#### Thresholds Recomendados
| Métrica | Verde (< 50ms) | Amarillo (50-100ms) | Rojo (> 100ms) |
|---------|----------------|-------------------|---------------|
| **Latencia Total** | ✅ Óptimo | ⚠️ Aceptable | ❌ Problema |
| **Health Check** | < 10ms | 10-20ms | > 20ms |
| **Cache Lookup** | < 5ms | 5-10ms | > 10ms |
| **Database Query** | < 30ms | 30-60ms | > 60ms |

### Caché y Eficiencia

#### Métricas de Caché
```bash
# Hit rate de caché
GET cache:hit_rate:drivers_availability
GET cache:hit_rate:drivers_details

# TTL adaptativo en uso
GET cache:ttl_adaptive:active

# Tamaño de caché comprimida
GET cache:compression:ratio
```

#### Alertas de Caché
```typescript
// Alertas automáticas configuradas
cache_hit_rate < 70% → ALERTA: "Cache efficiency baja"
cache_miss_rate > 30% → ALERTA: "Demasiados cache misses"
compression_ratio < 50% → ALERTA: "Compresión ineficiente"
```

### Throughput y Escalabilidad

#### Métricas de Carga
```bash
# Requests por segundo
GET matching:throughput:rps

# Concurrencia máxima soportada
GET matching:concurrency:max_supported

# Errores por minuto
GET matching:errors:per_minute
```

#### Límites de Escalabilidad
- **Concurrencia máxima:** 50 requests simultáneos
- **Throughput objetivo:** 100-200 req/s
- **Error rate máximo:** < 1%

---

## 🚨 Sistema de Alertas

### Alertas Críticas (🔴 Acción Inmediata)
```bash
# Sistema caído
matching:health_check:failed → "🚨 SISTEMA DE MATCHING CAÍDO"

# Performance crítica
matching:latency:p95 > 500ms → "🚨 LATENCIA CRÍTICA DETECTADA"

# Cache completamente fallido
cache:hit_rate < 10% → "🚨 CACHE COMPLETAMENTE INEFICAZ"
```

### Alertas de Advertencia (🟡 Monitoreo)
```bash
# Degradación de performance
matching:latency:p95 > 200ms → "⚠️ LATENCIA ELEVADA"

# Cache con problemas
cache:hit_rate < 60% → "⚠️ CACHE BAJO RENDIMIENTO"

# Errores crecientes
matching:errors:rate > 5% → "⚠️ TASA DE ERRORES ELEVADA"
```

### Alertas Informativas (🟢 Seguimiento)
```bash
# Cambios en patrones
cache:pattern_change → "ℹ️ PATRÓN DE ACCESO CAMBIADO"

# Optimizaciones aplicadas
cache:ttl_adapted → "ℹ️ TTL ADAPTATIVO ACTIVADO"

# Maintenance necesaria
cache:cleanup_needed → "ℹ️ LIMPIEZA DE CACHE RECOMENDADA"
```

---

## 🔍 Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Latencia Alta
```
Síntomas: matching:latency:p95 > 200ms

Posibles causas:
🔍 Redis lento → Verificar redis-cli ping
🗄️ DB sobrecargada → Revisar PostgreSQL connections
⚡ CPU alta → Verificar load average
📡 Red lenta → Verificar network latency

Solución:
1. Verificar métricas: npm run test:matching
2. Revisar logs: NODE_ENV=development
3. Scale infrastructure si necesario
```

#### 2. Cache Hit Rate Baja
```
Síntomas: cache:hit_rate < 60%

Posibles causas:
🔄 Datos expirando muy rápido → Aumentar TTL base
📊 Patrones de acceso cambiantes → Reset adaptive TTL
💾 Memoria insuficiente → Aumentar Redis memory
🎯 Cache key collisions → Revisar key strategy

Solución:
1. Monitor access patterns
2. Adjust TTL settings
3. Increase Redis memory
4. Optimize key naming
```

#### 3. Errores de Consistencia
```
Síntomas: matching:consistency < 90%

Posibles causas:
🔄 Race conditions → Revisar paralelización
💾 Cache stale → Invalidar manualmente
🗄️ DB inconsistencies → Verificar constraints
⚙️ Configuración errónea → Validar environment

Solución:
1. Run consistency tests
2. Clear cache manually
3. Check database integrity
4. Validate configuration
```

#### 4. Alta Concurrencia Problemática
```
Síntomas: matching:concurrency:errors > 10%

Posibles causas:
🔢 Límite de concurrencia excedido → Aumentar límite
⚡ CPU throttling → Verificar resources
💾 Memory pressure → Monitor RAM usage
🔒 Locks excesivos → Optimizar locking

Solución:
1. Increase concurrency limit gradually
2. Monitor system resources
3. Implement circuit breaker
4. Optimize locking strategy
```

---

## 📊 Dashboards de Monitoreo

### Dashboard Principal
```bash
# Métricas en tiempo real
watch -n 5 'redis-cli --raw keys "matching:metrics:*" | head -10'

# Health check continuo
while true; do curl -s http://localhost:3000/health && echo " ✅" || echo " ❌"; sleep 30; done
```

### Grafana Dashboard Recomendado
```json
{
  "title": "Matching System Performance",
  "panels": [
    {
      "title": "Latency P95",
      "targets": ["matching:metrics:latency:p95"]
    },
    {
      "title": "Cache Hit Rate",
      "targets": ["cache:hit_rate:drivers_*"]
    },
    {
      "title": "Throughput",
      "targets": ["matching:throughput:rps"]
    },
    {
      "title": "Error Rate",
      "targets": ["matching:errors:per_minute"]
    }
  ]
}
```

---

## 🛠️ Herramientas de Diagnóstico

### Comandos Útiles
```bash
# Ver métricas actuales
redis-cli keys "matching:metrics:*" | xargs redis-cli mget

# Limpiar caché para testing
redis-cli flushdb  # ⚠️ Solo en desarrollo

# Ver logs de aplicación
tail -f logs/combined.log | grep "MATCHING\|CACHE"

# Test de carga básico
ab -n 1000 -c 10 http://localhost:3000/rides/match
```

### Scripts de Monitoreo
```bash
#!/bin/bash
# monitoring-script.sh

echo "🔍 Sistema de Matching - Status Report"
echo "====================================="

# Health check
echo "🏥 Health Check:"
curl -s http://localhost:3000/health | jq .status || echo "❌ Failed"

# Performance metrics
echo -e "\n📊 Performance Metrics:"
redis-cli get matching:metrics:latency:p95 2>/dev/null || echo "N/A"

# Cache status
echo -e "\n💾 Cache Status:"
redis-cli --raw keys "cache:*" | wc -l 2>/dev/null || echo "Redis unavailable"

echo -e "\n✅ Report completed"
```

---

## 📈 Métricas de Éxito

### KPIs Objetivo
- **Disponibilidad:** 99.9% uptime
- **Latencia P95:** < 200ms
- **Cache Hit Rate:** > 75%
- **Error Rate:** < 1%
- **Consistencia:** > 95%

### Seguimiento Continuo
```bash
# Reporte semanal automático
0 9 * * 1 /path/to/monitoring-script.sh | mail -s "Weekly Matching Report" admin@company.com

# Alertas en tiempo real (ejemplo con Prometheus)
groups:
  - name: matching_alerts
    rules:
      - alert: HighLatency
        expr: matching_latency_p95 > 200
        for: 5m
        labels:
          severity: warning
```

---

## 🚀 Optimizaciones Proactivas

### Maintenance Programado
```bash
# Limpieza semanal de métricas antiguas
redis-cli keys "matching:metrics:*" | xargs redis-cli del

# Optimización mensual de índices DB
# (Ejecutar queries de optimization de PostgreSQL)

# Reset de patrones de caché trimestral
redis-cli del cache:patterns:*
```

### Auto-scaling Basado en Métricas
```yaml
# Kubernetes HPA basado en métricas personalizadas
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: matching-service-hpa
spec:
  metrics:
  - type: External
    external:
      metric:
        name: matching_latency_p95
        selector:
          matchLabels:
            service: matching
      target:
        type: Value
        value: "200"
```

---

## 📞 Contactos y Escalación

### Equipos Responsables
- **Desarrollo:** dev-team@company.com
- **Infraestructura:** infra@company.com
- **Producto:** product@company.com

### Procedimientos de Escalación
1. **P1 (Crítico):** < 15 minutos - Sistema caído
2. **P2 (Alto):** < 1 hora - Performance crítica
3. **P3 (Medio):** < 4 horas - Degradación significativa
4. **P4 (Bajo):** < 24 horas - Problemas menores

---

*Esta guía se actualiza automáticamente con cada deployment. Última actualización: 28 de septiembre de 2025*
