# 🔑 Guía de Gestión de API Keys - Integraciones Externas

## 🎯 Descripción General

El sistema de **API Keys** proporciona una gestión segura y centralizada de claves de integración con servicios externos como Stripe, Twilio, Firebase, etc. Incluye encriptación avanzada, rotación automática, auditoría completa y monitoreo de integraciones.

## 🏗️ Arquitectura de API Keys

### Modelo de Datos Seguro
```prisma
model APIKey {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(100) // "Stripe Production Key"
  service       String   @db.VarChar(50) // "stripe", "twilio", "firebase"
  environment   String   @db.VarChar(20) // "development", "production"
  keyType       String   @db.VarChar(30) // "secret", "public", "webhook_secret"

  // Encriptación AES-256-GCM
  encryptedKey  String   @db.Text // Clave encriptada
  keyHash       String?  @db.VarChar(128) // Hash para verificación de integridad

  // Metadatos y configuración
  description   String?  @db.VarChar(255)
  expiresAt     DateTime? // Fecha de expiración
  lastRotated   DateTime? // Última rotación
  rotationPolicy String? // "manual", "auto_30d", "auto_90d"

  // Configuración de seguridad
  isActive      Boolean  @default(true) // Clave activa
  isPrimary     Boolean  @default(false) // Clave primaria del servicio
  accessLevel   String   @db.VarChar(20) // "read", "write", "admin"

  // Métricas de uso
  lastUsed      DateTime? // Último uso
  usageCount    Int      @default(0) // Conteo de usos
  errorCount    Int      @default(0) // Conteo de errores
  rateLimit     Int?     // Límite de requests por minuto

  // Auditoría y organización
  createdAt     DateTime @default(now())
  updatedAt     DateTime @default(now()) @updatedAt
  createdBy     String?  @db.VarChar(100)
  updatedBy     String?  @db.VarChar(100)
  tags          Json?    // Etiquetas para organización

  // Relaciones
  audits        APIKeyAudit[] // Log de auditoría
}
```

### Modelo de Auditoría Completo
```prisma
model APIKeyAudit {
  id            Int      @id @default(autoincrement())
  apiKeyId      Int      @map("api_key_id")

  // Detalles de la acción
  action        String   @db.VarChar(50) // "created", "rotated", "accessed"
  oldValue      String?  @db.Text // Valor anterior encriptado
  newValue      String?  @db.Text // Nuevo valor encriptado
  metadata      Json?    // Contexto adicional

  // Información del actor
  performedBy   String?  @db.VarChar(100) // Usuario que realizó la acción
  performedAt   DateTime @default(now())
  ipAddress     String?  @db.VarChar(45) // Dirección IP
  userAgent     String?  @db.VarChar(500) // User Agent

  // Relación con la clave API
  apiKey        APIKey   @relation(fields: [apiKeyId], references: [id])
}
```

### Modelo de Monitoreo de Integraciones
```prisma
model IntegrationStatus {
  id            Int      @id @default(autoincrement())
  service       String   @db.VarChar(50) // Servicio monitoreado
  environment   String   @db.VarChar(20) // Entorno
  status        String   @db.VarChar(20) // "healthy", "degraded", "down"

  // Métricas de salud
  lastChecked   DateTime @default(now())
  responseTime  Int?     // Tiempo de respuesta en ms
  errorMessage  String?  @db.Text
  version       String?  @db.VarChar(50) // Versión de la API

  // Estadísticas de uptime
  uptimePercentage Decimal? @default(100.0) @db.Decimal(5, 2) // % último mes
  errorRate      Decimal? @default(0.0) @db.Decimal(5, 2) // % últimas 24h

  // Configuración de alertas
  alertEnabled   Boolean  @default(true)
  alertThreshold Int      @default(5) // Minutos sin checks exitosos
}
```

## 🔐 Sistema de Encriptación Avanzado

### Algoritmo AES-256-GCM
```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly tagLength = 16; // 128 bits

  encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    cipher.setAAD(Buffer.from('api-key')); // Datos autenticados adicionales

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();
    return { encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const key = this.getEncryptionKey();

    const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('api-key'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Almacenamiento Seguro
```typescript
// Clave encriptada se almacena como: encrypted:iv:tag
const encrypted = `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`;

// Ejemplo: "a1b2c3...:d4e5f6...:g7h8i9..."
```

### Verificación de Integridad
```typescript
// Hash SHA-256 para verificar que la clave no fue alterada
const hash = crypto.createHash('sha256').update(keyValue).digest('hex');

verifyIntegrity(decryptedKey: string, storedHash: string): boolean {
  const calculatedHash = crypto.createHash('sha256').update(decryptedKey).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}
```

## 🚀 Endpoints de Gestión

### CRUD de API Keys
```
GET    /admin/config/api-keys           # Listar claves con filtros
POST   /admin/config/api-keys           # Crear nueva clave API
GET    /admin/config/api-keys/:id       # Detalles específicos
PATCH  /admin/config/api-keys/:id       # Actualizar clave
DELETE /admin/config/api-keys/:id       # Eliminar clave
```

### Operaciones Avanzadas
```
GET    /admin/config/api-keys/service/:service/:env  # Claves por servicio/entorno
GET    /admin/config/api-keys/:id/decrypt            # Obtener clave desencriptada
POST   /admin/config/api-keys/:id/toggle              # Activar/desactivar clave
POST   /admin/config/api-keys/:id/rotate              # Rotar clave
POST   /admin/config/api-keys/bulk-update             # Actualizaciones masivas
POST   /admin/config/api-keys/create-standard-keys    # Crear claves estándar
GET    /admin/config/api-keys/analytics/overview      # Análisis de claves
```

## 🎭 Tipos de API Keys Soportados

### 1. Secret Keys - Claves Privadas
```json
{
  "name": "Stripe Secret Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "keyValue": "sk_live_1234567890abcdef",
  "accessLevel": "write",
  "isPrimary": true
}
```

### 2. Public Keys - Claves Públicas
```json
{
  "name": "Stripe Publishable Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "public",
  "keyValue": "pk_live_1234567890abcdef",
  "accessLevel": "read"
}
```

### 3. Webhook Secrets - Secretos de Webhooks
```json
{
  "name": "Stripe Webhook Secret",
  "service": "stripe",
  "environment": "production",
  "keyType": "webhook_secret",
  "keyValue": "whsec_1234567890abcdef",
  "accessLevel": "read"
}
```

### 4. Access Tokens - Tokens de Acceso
```json
{
  "name": "Twilio Auth Token",
  "service": "twilio",
  "environment": "production",
  "keyType": "access_token",
  "keyValue": "SK1234567890abcdef",
  "accessLevel": "admin"
}
```

## 🔄 Rotación Automática de Claves

### Políticas de Rotación
```typescript
const rotationPolicies = {
  manual: 'Rotación manual por administrador',
  auto_30d: 'Rotación automática cada 30 días',
  auto_90d: 'Rotación automática cada 90 días',
  auto_1y: 'Rotación automática cada año'
};
```

### Sistema de Rotación Automática
```typescript
@Injectable()
export class APIKeyRotationService {
  @Cron('0 0 * * *') // Ejecutar diariamente a medianoche
  async handleAutoRotation() {
    const keysToRotate = await this.prisma.aPIKey.findMany({
      where: {
        isActive: true,
        rotationPolicy: { not: 'manual' },
        OR: [
          // Claves que necesitan rotación por política
          this.buildRotationCondition(),
          // Claves próximas a expirar
          {
            expiresAt: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
            }
          }
        ]
      }
    });

    for (const key of keysToRotate) {
      await this.rotateKey(key.id, `Auto-rotation: ${key.rotationPolicy}`);
    }
  }
}
```

### Proceso de Rotación
```typescript
async rotateKey(id: number, reason: string) {
  // 1. Generar nueva clave (para algunos servicios)
  const newKeyValue = await this.generateNewKeyForService(apiKey.service);

  // 2. Encriptar nueva clave
  const encryption = this.encryptionService.encryptAPIKey(newKeyValue);

  // 3. Actualizar base de datos
  const updatedKey = await this.prisma.aPIKey.update({
    where: { id },
    data: {
      encryptedKey: `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`,
      keyHash: encryption.hash,
      lastRotated: new Date(),
      errorCount: 0, // Reset error count
    },
  });

  // 4. Crear entrada de auditoría
  await this.createAuditLog(id, 'rotated', null, updatedKey.encryptedKey, {
    reason,
    autoRotated: true
  });

  // 5. Notificar servicios dependientes
  await this.notifyServicesOfKeyRotation(apiKey.service, newKeyValue);

  return updatedKey;
}
```

## 📊 Análisis y Monitoreo

### Dashboard de API Keys
```bash
GET /admin/config/api-keys/analytics/overview
```

### Respuesta de Análisis
```json
{
  "totalKeys": 25,
  "activeKeys": 23,
  "inactiveKeys": 2,
  "expiringSoon": 3,     // Claves que expiran en 30 días
  "expired": 1,          // Claves ya expiradas
  "byService": {
    "stripe": { "total": 5, "active": 5, "primary": 1 },
    "twilio": { "total": 3, "active": 3, "primary": 1 },
    "firebase": { "total": 4, "active": 4, "primary": 1 }
  },
  "byEnvironment": {
    "production": { "total": 15, "active": 15 },
    "staging": { "total": 7, "active": 7 },
    "development": { "total": 3, "active": 2 }
  },
  "usageStats": {
    "totalUsage": 125000,
    "averageUsage": 5000,
    "mostUsed": [
      { "name": "Stripe Production", "usage": 45000 },
      { "name": "Twilio SMS", "usage": 32000 }
    ],
    "errorProne": [
      { "name": "Old Firebase Key", "errors": 25 }
    ]
  }
}
```

### Métricas de Uso por Clave
```json
{
  "apiKeyMetrics": {
    "id": 1,
    "name": "Stripe Production",
    "usageCount": 45000,
    "errorCount": 5,
    "errorRate": 0.011,        // 1.1% error rate
    "lastUsed": "2024-01-15T10:30:00Z",
    "averageResponseTime": 150, // ms
    "uptime": 99.8,             // 99.8% uptime
    "throttledRequests": 0,
    "expiredRequests": 0
  }
}
```

## 🛡️ Seguridad y Auditoría

### Log de Auditoría Completo
```typescript
private async createAuditLog(
  apiKeyId: number,
  action: string,
  oldValue?: string,
  newValue?: string,
  metadata?: any,
) {
  const clientIP = this.request?.ip || '127.0.0.1';
  const userAgent = this.request?.get('User-Agent') || 'APIKeysService';

  await this.prisma.aPIKeyAudit.create({
    data: {
      apiKeyId,
      action,
      oldValue,
      newValue,
      metadata,
      performedBy: this.getCurrentUserId(),
      ipAddress: clientIP,
      userAgent: userAgent.substring(0, 500), // Limitar longitud
    },
  });
}
```

### Tipos de Eventos Auditados
```json
{
  "auditEvents": [
    {
      "action": "created",
      "description": "API key creada por primera vez"
    },
    {
      "action": "accessed",
      "description": "API key utilizada para llamada a servicio externo"
    },
    {
      "action": "rotated",
      "description": "API key rotada (manual o automática)"
    },
    {
      "action": "updated",
      "description": "Configuración de API key actualizada"
    },
    {
      "action": "activated",
      "description": "API key activada"
    },
    {
      "action": "deactivated",
      "description": "API key desactivada"
    }
  ]
}
```

### Alertas de Seguridad
```json
{
  "securityAlerts": [
    {
      "type": "key_expiring",
      "severity": "warning",
      "message": "API key 'Stripe Production' expires in 3 days",
      "action": "Rotate or extend key"
    },
    {
      "type": "high_error_rate",
      "severity": "critical",
      "message": "API key 'Twilio SMS' has 15% error rate in last hour",
      "action": "Check service status and rotate key if compromised"
    },
    {
      "type": "unauthorized_access",
      "severity": "critical",
      "message": "Unauthorized attempt to access API key from IP 192.168.1.100",
      "action": "Review access logs and rotate key"
    }
  ]
}
```

## 🔧 Creación de Claves Estándar

### Claves por Servicio
```bash
POST /admin/config/api-keys/create-standard-keys
{
  "services": ["stripe", "twilio", "firebase"],
  "environments": ["development", "production"]
}
```

### Estructura de Claves Estándar

#### Stripe
```json
[
  {
    "name": "Stripe Production Secret Key",
    "service": "stripe",
    "environment": "production",
    "keyType": "secret",
    "accessLevel": "write",
    "isPrimary": true,
    "tags": ["payment", "critical", "production"]
  },
  {
    "name": "Stripe Production Webhook Secret",
    "service": "stripe",
    "environment": "production",
    "keyType": "webhook_secret",
    "accessLevel": "read",
    "tags": ["webhook", "production"]
  }
]
```

#### Twilio
```json
[
  {
    "name": "Twilio Production Account SID",
    "service": "twilio",
    "environment": "production",
    "keyType": "access_token",
    "accessLevel": "admin",
    "isPrimary": true,
    "tags": ["sms", "communication", "production"]
  },
  {
    "name": "Twilio Production Auth Token",
    "service": "twilio",
    "environment": "production",
    "keyType": "secret",
    "accessLevel": "admin",
    "tags": ["sms", "communication", "production"]
  }
]
```

## 🚀 Integración con Servicios Externos

### Patrón de Uso Seguro
```typescript
@Injectable()
export class StripeService {
  constructor(
    private apiKeysService: APIKeysService,
    private configService: ConfigService,
  ) {}

  async createPayment(amount: number, currency: string) {
    // Obtener clave API desencriptada
    const apiKey = await this.apiKeysService.getDecryptedKey(
      await this.getPrimaryStripeKeyId()
    );

    // Usar clave para llamada a Stripe
    const stripe = new Stripe(apiKey);

    return stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  private async getPrimaryStripeKeyId(): Promise<number> {
    const keys = await this.apiKeysService.findByServiceAndEnvironment(
      'stripe',
      this.configService.get('NODE_ENV') === 'production' ? 'production' : 'development',
      'secret'
    );

    const primaryKey = keys.find(key => key.isPrimary);
    if (!primaryKey) {
      throw new Error('No primary Stripe key found');
    }

    return primaryKey.id;
  }
}
```

### Manejo de Errores y Reintentos
```typescript
async callExternalService(service: string, operation: Function) {
  const startTime = Date.now();

  try {
    const result = await operation();

    // Registrar uso exitoso
    await this.updateKeyMetrics(service, true, Date.now() - startTime);

    return result;
  } catch (error) {
    // Registrar error
    await this.updateKeyMetrics(service, false, Date.now() - startTime, error.message);

    // Intentar con clave secundaria si la primaria falla
    if (this.isRetriableError(error)) {
      return await this.retryWithSecondaryKey(service, operation);
    }

    throw error;
  }
}
```

## 📈 Monitoreo de Integraciones

### Health Checks Automáticos
```typescript
@Injectable()
export class IntegrationHealthService {
  @Cron('*/5 * * * *') // Cada 5 minutos
  async performHealthChecks() {
    const services = ['stripe', 'twilio', 'firebase', 'google_maps'];

    for (const service of services) {
      await this.checkServiceHealth(service);
    }
  }

  private async checkServiceHealth(service: string) {
    const startTime = Date.now();

    try {
      const isHealthy = await this.performServiceSpecificCheck(service);
      const responseTime = Date.now() - startTime;

      await this.updateIntegrationStatus(service, {
        status: isHealthy ? 'healthy' : 'degraded',
        lastChecked: new Date(),
        responseTime,
        errorMessage: isHealthy ? null : 'Service check failed',
      });
    } catch (error) {
      await this.updateIntegrationStatus(service, {
        status: 'down',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
      });
    }
  }
}
```

### Dashboard de Estado de Integraciones
```json
{
  "integrationStatus": {
    "stripe": {
      "status": "healthy",
      "responseTime": 125,
      "uptimePercentage": 99.8,
      "errorRate": 0.02,
      "lastChecked": "2024-01-15T10:30:00Z"
    },
    "twilio": {
      "status": "degraded",
      "responseTime": 850,
      "uptimePercentage": 98.5,
      "errorRate": 2.1,
      "lastChecked": "2024-01-15T10:30:00Z"
    },
    "firebase": {
      "status": "healthy",
      "responseTime": 95,
      "uptimePercentage": 100.0,
      "errorRate": 0.0,
      "lastChecked": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

**🔑 El sistema de API Keys proporciona una gestión segura, escalable y auditada de integraciones externas, con encriptación avanzada y rotación automática para máxima seguridad.**
