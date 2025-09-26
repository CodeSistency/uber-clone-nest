# 🔄 Guía de Rotación Automática de API Keys

## 🎯 Descripción General

El sistema de **Rotación Automática de API Keys** proporciona una gestión proactiva y segura de claves API, implementando rotaciones programadas, detección de claves expiradas y renovación automática para mantener la seguridad del sistema.

## 🏗️ Arquitectura del Sistema de Rotación

### Servicio de Rotación Automática
```typescript
@Injectable()
export class APIKeysRotationService {
  // Cron jobs automáticos
  @Cron('0 0 * * *')     // Diaria - medianoche
  handleAutoRotation()

  @Cron('0 */6 * * *')   // Cada 6 horas
  handleExpiringKeysRotation()

  @Cron('0 1 * * 1')     // Semanal - lunes 1 AM
  handleExpiredKeysCleanup()
}
```

### Políticas de Rotación
```typescript
const rotationPolicies = {
  manual: 'Rotación manual por administrador',
  auto_30d: 'Rotación automática cada 30 días',
  auto_90d: 'Rotación automática cada 90 días',
  auto_1y: 'Rotación automática cada año'
};
```

## ⏰ Programación de Rotaciones Automáticas

### 1. Rotación Diaria - Medianoche (`0 0 * * *`)
**Propósito**: Rotar claves basadas en política de tiempo
```typescript
async handleAutoRotation() {
  const keysNeedingRotation = await this.findKeysNeedingRotation();

  for (const key of keysNeedingRotation) {
    if (key.rotationPolicy === 'auto_30d' && daysSinceLastRotation >= 30) {
      await this.rotateKey(key.id, `Auto-rotation: ${key.rotationPolicy}`);
    }
    // Similar para auto_90d y auto_1y
  }
}
```

### 2. Rotación de Claves Expiradas - Cada 6 Horas (`0 */6 * * *`)
**Propósito**: Rotar claves próximas a expirar (7 días)
```typescript
async handleExpiringKeysRotation() {
  const expiringKeys = await this.findExpiringKeys(); // expiresAt <= 7 días

  for (const key of expiringKeys) {
    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7) {
      await this.rotateKey(key.id, `Auto-rotation: Key expires in ${daysUntilExpiry} days`);
    }
  }
}
```

### 3. Limpieza de Claves Expiradas - Semanal (`0 1 * * 1`)
**Propósito**: Desactivar claves ya expiradas
```typescript
async handleExpiredKeysCleanup() {
  const expiredKeys = await this.prisma.aPIKey.findMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
  });

  for (const key of expiredKeys) {
    await this.apiKeysService.toggleActive(key.id, false, 'system');
    // Crear auditoría de desactivación automática
  }
}
```

## 🔍 Lógica de Detección de Rotación Necesaria

### Criterios para Rotación Automática
```typescript
private buildRotationCondition(now: Date) {
  return [
    // auto_30d: Rotar si han pasado más de 30 días
    {
      rotationPolicy: 'auto_30d',
      lastRotated: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    // auto_90d: Rotar si han pasado más de 90 días
    {
      rotationPolicy: 'auto_90d',
      lastRotated: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
    },
    // auto_1y: Rotar si han pasado más de 365 días
    {
      rotationPolicy: 'auto_1y',
      lastRotated: { lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
    },
  ];
}
```

### Claves Próximas a Expirar
```typescript
private async findExpiringKeys() {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return this.prisma.aPIKey.findMany({
    where: {
      expiresAt: {
        lte: sevenDaysFromNow,  // Expira en 7 días o menos
        gt: new Date(),         // No incluir expiradas
      },
      isActive: true,
      rotationPolicy: { not: 'manual' }, // Solo auto-rotación
    },
  });
}
```

## 🔄 Proceso de Rotación

### Flujo Completo de Rotación
```typescript
async rotateKey(id: number, reason: string) {
  // 1. Obtener clave actual
  const apiKey = await this.prisma.aPIKey.findUnique({ where: { id } });

  // 2. Generar nueva clave
  const newKeyValue = await this.generateNewKeyForService(apiKey.service, apiKey.keyType);

  // 3. Encriptar nueva clave
  const encryption = this.encryptionService.encryptAPIKey(newKeyValue);

  // 4. Actualizar base de datos
  const updatedKey = await this.prisma.aPIKey.update({
    where: { id },
    data: {
      encryptedKey: `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`,
      keyHash: encryption.hash,
      lastRotated: new Date(),
      errorCount: 0, // Reset error count
    },
  });

  // 5. Crear auditoría
  await this.createAuditLog(id, 'rotated', apiKey.encryptedKey, updatedKey.encryptedKey, {
    reason,
    autoRotated: true
  });

  // 6. Notificar sobre rotación
  await this.notifyKeyRotation(apiKey, newKeyValue);

  return updatedKey;
}
```

### Generación de Nuevas Claves por Servicio
```typescript
private async generateNewKeyForService(service: string, keyType: string) {
  switch (service) {
    case 'stripe':
      return keyType === 'secret'
        ? `sk_live_${this.generateSecureKey(24)}`
        : `whsec_${this.generateSecureKey(32)}`;

    case 'twilio':
      return keyType === 'secret'
        ? `SK${this.generateSecureKey(34)}`
        : `AC${this.generateSecureKey(34)}`;

    case 'firebase':
      return keyType === 'private_key'
        ? this.generateSecureKey('firebase_', 64)
        : `AIza${this.generateSecureKey(35)}`;

    default:
      return this.generateSecureKey(`${service}_${keyType}_`, 32);
  }
}
```

## 📊 Endpoints de Gestión de Rotación

### Rotación Manual
```
POST /admin/config/api-keys/:id/force-rotate
```
```json
{
  "reason": "Security breach detected - immediate rotation required"
}
```

### Validación de Necesidad de Rotación
```
GET /admin/config/api-keys/:id/rotation-validation
```
```json
{
  "needsRotation": true,
  "reason": "Key is 45 days old, policy requires rotation every 30 days",
  "recommendedAction": "Schedule rotation"
}
```

### Estadísticas de Rotación
```
GET /admin/config/api-keys/rotation/stats
```
```json
{
  "totalKeys": 25,
  "keysNeedingRotation": 5,
  "expiringKeys": 2,
  "recentRotations": [
    {
      "id": 1,
      "keyName": "Stripe Production",
      "service": "stripe",
      "rotatedAt": "2024-01-15T00:00:00Z",
      "reason": "Auto-rotation: auto_30d"
    }
  ],
  "rotationPolicies": {
    "manual": 10,
    "auto_30d": 8,
    "auto_90d": 5,
    "auto_1y": 2
  }
}
```

### Rotación Masiva
```
POST /admin/config/api-keys/rotation/bulk-rotate
```
```json
{
  "message": "Bulk rotation completed",
  "totalKeys": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "id": 1,
      "name": "Stripe Production",
      "success": true,
      "rotatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Historial de Rotaciones
```
GET /admin/config/api-keys/rotation/audit-history?limit=50&service=stripe
```
```json
{
  "total": 25,
  "logs": [
    {
      "id": 123,
      "keyName": "Stripe Production",
      "service": "stripe",
      "environment": "production",
      "action": "rotated",
      "rotatedAt": "2024-01-15T00:00:00Z",
      "performedBy": "system-auto-rotation",
      "reason": "Auto-rotation: auto_30d",
      "autoRotated": true
    }
  ]
}
```

### Prueba de Rotación Automática (Desarrollo)
```
POST /admin/config/api-keys/rotation/test-auto-rotation
```

## 📈 Monitoreo y Alertas

### Dashboard de Estado de Rotación
```typescript
async getRotationStats() {
  return {
    totalKeys: await this.prisma.aPIKey.count(),
    keysNeedingRotation: (await this.findKeysNeedingRotation()).length,
    expiringKeys: (await this.findExpiringKeys()).length,
    recentRotations: await this.getRecentRotations(),
    policyBreakdown: await this.getPolicyBreakdown(),
  };
}
```

### Alertas Automáticas
```json
{
  "alerts": [
    {
      "type": "rotation_overdue",
      "severity": "high",
      "message": "5 API keys are overdue for rotation",
      "action": "Review and rotate keys"
    },
    {
      "type": "keys_expiring_soon",
      "severity": "medium",
      "message": "3 API keys expire within 7 days",
      "action": "Schedule rotation or extend expiry"
    },
    {
      "type": "rotation_failed",
      "severity": "critical",
      "message": "Auto-rotation failed for 2 keys",
      "action": "Manual intervention required"
    }
  ]
}
```

## 🔐 Seguridad y Auditoría

### Log de Auditoría Completo
```typescript
private async createAuditLog(
  apiKeyId: number,
  action: string,
  oldValue: string | null,
  newValue: string | null,
  metadata: any,
) {
  await this.prisma.aPIKeyAudit.create({
    data: {
      apiKeyId,
      action,
      oldValue,
      newValue,
      metadata,
      performedBy: metadata.autoRotated ? 'system-auto-rotation' : 'admin',
      ipAddress: '127.0.0.1', // Para rotaciones automáticas
      userAgent: 'APIKeysRotationService',
    },
  });
}
```

### Tipos de Eventos Auditados
```json
{
  "auditEvents": [
    {
      "action": "rotated",
      "description": "API key rotada automáticamente o manualmente",
      "metadata": {
        "reason": "Auto-rotation: auto_30d",
        "autoRotated": true,
        "oldKeyHash": "abc123...",
        "newKeyHash": "def456..."
      }
    },
    {
      "action": "expired_deactivated",
      "description": "API key desactivada por expiración",
      "metadata": {
        "expiredAt": "2024-01-15T00:00:00Z",
        "autoDeactivated": true
      }
    }
  ]
}
```

## 🧪 Testing y Validación

### Validación de Necesidad de Rotación
```typescript
async validateKeyRotation(id: number) {
  const apiKey = await this.prisma.aPIKey.findUnique({ where: { id } });

  // Verificar expiración
  if (apiKey.expiresAt < new Date()) {
    return {
      needsRotation: true,
      reason: 'Key is expired',
      recommendedAction: 'Immediate rotation required'
    };
  }

  // Verificar política de rotación
  const daysSinceRotation = Math.floor(
    (Date.now() - apiKey.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
  );

  const thresholds = { auto_30d: 30, auto_90d: 90, auto_1y: 365 };
  const threshold = thresholds[apiKey.rotationPolicy];

  if (daysSinceRotation >= threshold) {
    return {
      needsRotation: true,
      reason: `Key is ${daysSinceRotation} days old, policy requires rotation every ${threshold} days`,
      recommendedAction: 'Schedule rotation'
    };
  }

  return {
    needsRotation: false,
    reason: `Key is ${daysSinceRotation} days old, next rotation in ${threshold - daysSinceRotation} days`,
    recommendedAction: 'No action needed'
  };
}
```

### Testing de Rotación Automática
```bash
# Ejecutar rotación automática manualmente para testing
POST /admin/config/api-keys/rotation/test-auto-rotation
```

## 🚀 Integración con Servicios Externos

### Notificación de Rotaciones
```typescript
private async notifyKeyRotation(oldKey: any, newKeyValue: string) {
  // Log para auditoría
  this.logger.log(`Key rotated: ${oldKey.name} (${oldKey.service}/${oldKey.environment})`);

  // En producción, esto podría:
  // 1. Enviar email al administrador
  // 2. Crear ticket en sistema de gestión de cambios
  // 3. Actualizar configuraciones en servicios dependientes
  // 4. Trigger CI/CD pipelines para actualizar configs

  const notification = {
    type: 'api_key_rotated',
    keyName: oldKey.name,
    service: oldKey.service,
    environment: oldKey.environment,
    rotatedAt: new Date(),
    newKeyPreview: this.encryptionService.maskSensitiveData(newKeyValue),
    performedBy: 'system-auto-rotation',
  };

  // Aquí se integraría con sistema de notificaciones
  await this.notificationsService.sendAdminNotification(notification);
}
```

### Actualización de Configuraciones Dependientes
```typescript
// Después de rotar una clave, actualizar servicios que la usan
private async updateDependentServices(service: string, newKey: string) {
  switch (service) {
    case 'stripe':
      await this.updateStripeConfig(newKey);
      break;
    case 'twilio':
      await this.updateTwilioConfig(newKey);
      break;
    case 'firebase':
      await this.updateFirebaseConfig(newKey);
      break;
  }
}
```

## 📊 Reportes y Analytics

### Reporte de Cumplimiento de Rotación
```json
{
  "complianceReport": {
    "totalKeys": 25,
    "compliantKeys": 20,
    "nonCompliantKeys": 5,
    "compliancePercentage": 80,
    "policyCompliance": {
      "manual": { "compliant": 10, "total": 10, "percentage": 100 },
      "auto_30d": { "compliant": 6, "total": 8, "percentage": 75 },
      "auto_90d": { "compliant": 4, "total": 5, "percentage": 80 },
      "auto_1y": { "compliant": 0, "total": 2, "percentage": 0 }
    },
    "expiringKeys": 3,
    "recentRotations": 12
  }
}
```

### Métricas de Rendimiento
```json
{
  "performanceMetrics": {
    "averageRotationTime": 150, // ms
    "rotationSuccessRate": 98.5, // %
    "keysRotatedLastMonth": 45,
    "autoRotationCoverage": 85, // % de claves con rotación automática
    "manualInterventionRate": 2.1 // % de rotaciones que requieren intervención manual
  }
}
```

## 🔧 Configuración y Personalización

### Configuración de Cron Jobs
```typescript
// En el módulo, se pueden configurar los schedules
@Module({
  providers: [
    {
      provide: APIKeysRotationService,
      useFactory: () => {
        const service = new APIKeysRotationService();
        // Configurar schedules personalizados si es necesario
        return service;
      },
    },
  ],
})
```

### Personalización de Políticas de Rotación
```typescript
// Se pueden agregar nuevas políticas según necesidades
const customPolicies = {
  auto_7d: 'Rotación semanal',
  auto_14d: 'Rotación cada 2 semanas',
  auto_6m: 'Rotación semestral',
};
```

## 🎯 Mejores Prácticas

### 1. **Monitoreo Continuo**
- Monitorear logs de rotación automática
- Alertas para fallos de rotación
- Dashboard de cumplimiento de políticas

### 2. **Testing Regular**
- Probar rotación automática en entornos de staging
- Validar que claves rotadas funcionan correctamente
- Verificar que servicios dependientes se actualizan

### 3. **Backup y Recovery**
- Backup de claves antes de rotación
- Plan de rollback en caso de problemas
- Documentación de procedimientos de emergencia

### 4. **Comunicación**
- Notificar equipos afectados sobre rotaciones
- Documentar cambios en sistemas de configuración
- Mantener registro de cambios para auditorías

## 🚀 Próximas Mejoras

### Funcionalidades Futuras
- **Integración con Secret Managers**: AWS Secrets Manager, Azure Key Vault
- **Rotación Basada en Eventos**: Rotación por detección de breach
- **Rotación Coordinada**: Rotación de múltiples claves relacionadas
- **Zero-Downtime Rotation**: Cambios sin interrupción de servicio
- **Machine Learning**: Predicción de necesidades de rotación

---

**🔄 El sistema de rotación automática garantiza que las claves API se mantengan seguras y actualizadas, reduciendo riesgos de seguridad y asegurando cumplimiento con políticas de rotación.**
