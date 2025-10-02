# API Keys - Guía de Consumo para Administradores

Esta guía explica cómo consumir los endpoints de gestión de API Keys desde el panel de administración.

## 📋 Información General

**Base URL:** `/admin/config/api-keys`

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

---

## 🆕 CREAR API KEYS

### Crear una nueva API Key

**MÉTODO:** `POST /admin/config/api-keys`

**DESCRIPCIÓN:** Crea una nueva clave API para integrar servicios externos como Stripe, Twilio, etc.

**ENVÍO:**
```json
{
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "keyValue": "sk_live_...",
  "description": "Clave principal de Stripe para pagos en producción",
  "expiresAt": "2024-12-31T23:59:59Z",
  "rotationPolicy": "auto_90d",
  "isPrimary": true,
  "accessLevel": "write",
  "rateLimit": 100,
  "tags": ["production", "critical"]
}
```

**RECIBE:**
```json
{
  "id": 1,
  "name": "Stripe Production Key",
  "service": "stripe",
  "environment": "production",
  "keyType": "secret",
  "description": "Clave principal de Stripe para pagos en producción",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "lastRotated": null,
  "isActive": true,
  "isPrimary": true,
  "accessLevel": "write",
  "usageCount": 0,
  "rateLimit": 100,
  "tags": ["production", "critical"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**ERRORES POSIBLES:**
- `400`: Datos inválidos
- `409`: Nombre duplicado o conflicto de clave primaria

---

## 📖 LEER API KEYS
### 2. `GET /admin/config/api-keys` - Listar API Keys

**Decoradores:**
```typescript
@Get()
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Listar API keys',
  description: 'Obtiene todas las claves API con opciones de filtrado y paginación'
})
@ApiResponse({ status: 200, description: 'Lista de API keys obtenida exitosamente', type: APIKeyListResponseDto })
```

**Parámetros:**
- **Query:** `APIKeyListQueryDto` - Opciones de filtrado y paginación

**Campos de filtrado disponibles:**
```typescript
interface APIKeyListQueryDto {
  page?: number;        // Página actual (default: 1)
  limit?: number;       // Elementos por página (default: 20, max: 100)
  service?: string;     // Filtrar por servicio
  environment?: string; // Filtrar por entorno
  keyType?: string;     // Filtrar por tipo de clave
  isActive?: boolean;   // Filtrar por estado activo
  search?: string;      // Búsqueda por nombre/descripción
  sortBy?: string;      // Campo de ordenamiento
  sortOrder?: 'asc' | 'desc'; // Orden ascendente/descendente
}
```

**Respuesta:**
```typescript
interface APIKeyListResponseDto {
  keys: APIKeyResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### 3. `GET /admin/config/api-keys/:id` - Obtener API Key por ID

**Decoradores:**
```typescript
@Get(':id')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Obtener detalles de API key',
  description: 'Obtiene información completa de una clave API específica'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'API key encontrada', type: APIKeyResponseDto })
@ApiResponse({ status: 404, description: 'API key no encontrada' })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key

**Lógica:**
```typescript
async findOne(@Param('id', ParseIntPipe) id: number): Promise<APIKeyResponseDto> {
  return this.apiKeysService.findOne(id);
}
```

---

### 4. `PATCH /admin/config/api-keys/:id` - Actualizar API Key

**Decoradores:**
```typescript
@Patch(':id')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Actualizar API key',
  description: 'Actualiza la configuración de una clave API existente'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'API key actualizada exitosamente', type: APIKeyResponseDto })
@ApiResponse({ status: 404, description: 'API key no encontrada' })
@ApiResponse({ status: 409, description: 'Conflicto - Nombre duplicado' })
@ApiResponse({ status: 400, description: 'Configuración inválida' })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key
- **Body:** `UpdateAPIKeyDto` - Campos a actualizar

---

### 5. `DELETE /admin/config/api-keys/:id` - Eliminar API Key

**Decoradores:**
```typescript
@Delete(':id')
@HttpCode(HttpStatus.OK)
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Eliminar API key',
  description: 'Elimina una clave API del sistema'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'API key eliminada exitosamente' })
@ApiResponse({ status: 404, description: 'API key no encontrada' })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key

**Lógica:**
```typescript
async remove(@Param('id', ParseIntPipe) id: number) {
  return this.apiKeysService.remove(id);
}
```

---

## 🔄 Endpoints de Gestión de Estado y Rotación

### 6. `POST /admin/config/api-keys/:id/toggle` - Alternar Estado

**Decoradores:**
```typescript
@Post(':id/toggle')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Alternar estado de API key',
  description: 'Activa o desactiva una clave API'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'Estado de API key alternado exitosamente', type: APIKeyResponseDto })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key
- **Body (opcional):** `{ active?: boolean }` - Nuevo estado deseado

**Lógica Especial:**
```typescript
async toggleActive(
  @Param('id', ParseIntPipe) id: number,
  @Body() body?: { active?: boolean }
): Promise<APIKeyResponseDto> {
  // If no body provided, default to toggling the current state
  const apiKey = await this.apiKeysService.findOne(id);
  const newActiveState = body?.active !== undefined ? body.active : !apiKey.isActive;

  return this.apiKeysService.toggleActive(id, newActiveState, 'system');
}
```

---

### 7. `POST /admin/config/api-keys/:id/rotate` - Rotar API Key

**Decoradores:**
```typescript
@Post(':id/rotate')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Rotar API key',
  description: 'Rota una clave API con un nuevo valor'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'API key rotada exitosamente', type: APIKeyResponseDto })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key
- **Body:** `APIKeyRotationDto` - Información de rotación

---

## 🔍 Endpoints de Consulta Especializada

### 8. `GET /admin/config/api-keys/service/:service/:environment` - Por Servicio/Entorno

**Decoradores:**
```typescript
@Get('service/:service/:environment')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Obtener API keys por servicio y entorno',
  description: 'Obtiene todas las claves API activas para un servicio específico y entorno'
})
@ApiParam({ name: 'service', description: 'Nombre del servicio', example: 'stripe' })
@ApiParam({ name: 'environment', description: 'Entorno', example: 'production' })
@ApiResponse({ status: 200, description: 'API keys encontradas', type: [APIKeyResponseDto] })
```

**Parámetros:**
- **Path:** `service: string` - Nombre del servicio
- **Path:** `environment: string` - Entorno

---

### 9. `GET /admin/config/api-keys/:id/decrypt` - Obtener Clave Desencriptada

**Decoradores:**
```typescript
@Get(':id/decrypt')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Obtener clave API desencriptada',
  description: 'Obtiene el valor desencriptado de una clave API (solo para uso interno)'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'Clave desencriptada obtenida' })
@ApiResponse({ status: 404, description: 'API key no encontrada' })
@ApiResponse({ status: 400, description: 'API key inactiva' })
```

**Respuesta:**
```typescript
interface DecryptResponse {
  decryptedKey: string;  // El valor desencriptado de la API key
}
```

---

## 📊 Endpoints de Análisis y Operaciones Masivas

### 10. `POST /admin/config/api-keys/bulk-update` - Actualización Masiva

**Decoradores:**
```typescript
@Post('bulk-update')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Actualización masiva de API keys',
  description: 'Actualiza múltiples claves API con cambios en lote'
})
@ApiResponse({ status: 200, description: 'Actualización completada' })
```

**Parámetros:**
- **Body:** `BulkAPIKeyUpdateDto` - Configuración de actualización masiva

---

### 11. `POST /admin/config/api-keys/create-standard-keys` - Crear Claves Estándar

**Decoradores:**
```typescript
@Post('create-standard-keys')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Crear API keys estándar',
  description: 'Crea un conjunto de claves API estándar para servicios comunes'
})
@ApiResponse({ status: 200, description: 'API keys estándar creadas exitosamente' })
```

**Parámetros:**
- **Body:** `CreateStandardAPIKeysDto` - Configuración de claves estándar

---

### 12. `GET /admin/config/api-keys/analytics/overview` - Análisis General

**Decoradores:**
```typescript
@Get('analytics/overview')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Análisis de API keys',
  description: 'Obtiene estadísticas y análisis de todas las claves API'
})
@ApiResponse({ status: 200, description: 'Análisis obtenido exitosamente' })
```

**Lógica de Análisis Compleja:**
```typescript
async getAnalytics() {
  const allKeys = await this.apiKeysService.findAll({ limit: 1000 });

  const analytics = {
    totalKeys: allKeys.total,
    activeKeys: allKeys.keys.filter((k) => k.isActive).length,
    inactiveKeys: allKeys.keys.filter((k) => !k.isActive).length,
    expiringSoon: allKeys.keys.filter((k) => {
      if (!k.expiresAt) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length,
    expired: allKeys.keys.filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date()).length,
    byService: this.groupByService(allKeys.keys),
    byEnvironment: this.groupByEnvironment(allKeys.keys),
    byKeyType: this.groupByKeyType(allKeys.keys),
    usageStats: { /* ... */ }
  };

  return { analytics };
}
```

---

### 13. `GET /admin/config/api-keys/audit/:id` - Historial de Auditoría

**Decoradores:**
```typescript
@Get('audit/:id')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Obtener historial de auditoría',
  description: 'Obtiene el historial completo de operaciones para una clave API'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'Historial de auditoría obtenido' })
```

**Nota:** Actualmente retorna un placeholder ya que la funcionalidad no está implementada.

---

## 🔄 Endpoints de Rotación Automática

### 14. `POST /admin/config/api-keys/:id/force-rotate` - Rotación Forzada

**Decoradores:**
```typescript
@Post(':id/force-rotate')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Forzar rotación inmediata de API key',
  description: 'Fuerza la rotación inmediata de una clave API, generando una nueva'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'API key rotada exitosamente' })
@ApiResponse({ status: 404, description: 'API key no encontrada' })
```

**Parámetros:**
- **Path:** `id: number` - ID de la API key
- **Body:** `{ reason?: string }` - Razón opcional para la rotación

---

### 15. `GET /admin/config/api-keys/:id/rotation-validation` - Validar Rotación

**Decoradores:**
```typescript
@Get(':id/rotation-validation')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Validar si una API key necesita rotación',
  description: 'Verifica si una clave API necesita rotación basada en su política y estado'
})
@ApiParam({ name: 'id', description: 'ID de la API key', example: 1 })
@ApiResponse({ status: 200, description: 'Validación completada' })
```

**Respuesta:**
```typescript
interface RotationValidationResponse {
  needsRotation: boolean;
  reason: string;
  recommendedAction: string;
}
```

---

### 16. `GET /admin/config/api-keys/rotation/stats` - Estadísticas de Rotación

**Decoradores:**
```typescript
@Get('rotation/stats')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Estadísticas de rotación de API keys',
  description: 'Obtiene estadísticas sobre rotaciones, claves que necesitan rotación, etc.'
})
@ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
```

---

### 17. `POST /admin/config/api-keys/rotation/bulk-rotate` - Rotación Masiva

**Decoradores:**
```typescript
@Post('rotation/bulk-rotate')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Rotación masiva de API keys',
  description: 'Rota múltiples claves API que necesitan rotación'
})
@ApiResponse({ status: 200, description: 'Rotación masiva completada' })
```

**Lógica Compleja:**
```typescript
async bulkRotateKeys(): Promise<any> {
  const keysToRotate = await this.apiKeysRotationService['findKeysNeedingRotation']();
  const results: Array<{ id: number; name: string; success: boolean; error?: string }> = [];

  for (const key of keysToRotate) {
    try {
      const result = await this.apiKeysRotationService.forceRotateKey(key.id, 'Bulk rotation');
      results.push(result);
    } catch (error) {
      results.push({
        id: key.id,
        name: key.name,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return {
    message: 'Bulk rotation completed',
    totalKeys: keysToRotate.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
```

---

### 18. `GET /admin/config/api-keys/rotation/audit-history` - Historial de Rotaciones

**Decoradores:**
```typescript
@Get('rotation/audit-history')
@RequirePermissions(AdminPermission.GEOGRAPHY_READ)
@ApiOperation({
  summary: 'Historial de rotaciones de API keys',
  description: 'Obtiene el historial completo de rotaciones realizadas'
})
@ApiQuery({ name: 'limit', required: false, description: 'Número máximo de registros', example: 50 })
@ApiQuery({ name: 'service', required: false, description: 'Filtrar por servicio', example: 'stripe' })
@ApiResponse({ status: 200, description: 'Historial obtenido exitosamente' })
```

**Parámetros de Query:**
- `limit?: string` - Número máximo de registros (default: 100)
- `service?: string` - Filtrar por servicio específico

---

### 19. `POST /admin/config/api-keys/rotation/test-auto-rotation` - Probar Rotación Automática

**Decoradores:**
```typescript
@Post('rotation/test-auto-rotation')
@RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
@ApiOperation({
  summary: 'Probar rotación automática (solo desarrollo)',
  description: 'Ejecuta el proceso de rotación automática manualmente para testing'
})
@ApiResponse({ status: 200, description: 'Prueba de rotación ejecutada' })
```

**Nota:** Endpoint destinado únicamente para desarrollo y testing.

---

## 🔧 Métodos Auxiliares Privados

### `groupByService()`
```typescript
private groupByService(keys: APIKeyResponseDto[]) {
  const groups = {};
  keys.forEach((key) => {
    if (!groups[key.service]) {
      groups[key.service] = { total: 0, active: 0, primary: 0 };
    }
    groups[key.service].total++;
    if (key.isActive) groups[key.service].active++;
    if (key.isPrimary) groups[key.service].primary++;
  });
  return groups;
}
```

### `groupByEnvironment()`
```typescript
private groupByEnvironment(keys: APIKeyResponseDto[]) {
  const groups = {};
  keys.forEach((key) => {
    if (!groups[key.environment]) {
      groups[key.environment] = { total: 0, active: 0 };
    }
    groups[key.environment].total++;
    if (key.isActive) groups[key.environment].active++;
  });
  return groups;
}
```

### `groupByKeyType()`
```typescript
private groupByKeyType(keys: APIKeyResponseDto[]) {
  const groups = {};
  keys.forEach((key) => {
    if (!groups[key.keyType]) {
      groups[key.keyType] = { total: 0, active: 0 };
    }
    groups[key.keyType].total++;
    if (key.isActive) groups[key.keyType].active++;
  });
  return groups;
}
```

---

## ⚠️ TODOs y Mejoras Pendientes

### Identificación de Usuario
```typescript
// En múltiples métodos
return this.apiKeysService.create(createDto, 'system'); // TODO: Get from JWT
```
**Problema:** Actualmente usa `'system'` como usuario, debería obtener el ID del usuario autenticado del JWT.

### Historial de Auditoría
```typescript
// Método getAuditHistory()
return {
  apiKeyId: id,
  auditLogs: [],
  message: 'Audit history feature not yet implemented',
};
```
**Problema:** La funcionalidad de auditoría no está implementada.

### Validación de Permisos
**Mejora:** Los permisos están mapeados a `GEOGRAPHY_READ/WRITE`, pero deberían ser específicos para API keys (`API_KEYS_READ/WRITE`).

---

## 🔒 Consideraciones de Seguridad

### Encriptación de Claves
- Las claves API se almacenan encriptadas en la base de datos
- Solo el endpoint `/decrypt` permite acceder al valor desencriptado
- Requiere permisos específicos para desencriptar

### Rate Limiting
- Recomendado implementar rate limiting por usuario/IP
- Especial atención en endpoints de rotación masiva

### Auditoría
- Todas las operaciones deberían registrarse en un log de auditoría
- Incluir: usuario, timestamp, operación, resultado

### Validación de Input
- Validación completa usando class-validator en DTOs
- Sanitización de inputs para prevenir inyección

---

## 📈 Estadísticas de Uso

**Total de Endpoints:** 19
- **CRUD Básico:** 5 endpoints
- **Gestión de Estado:** 2 endpoints
- **Consultas Especializadas:** 3 endpoints
- **Operaciones Masivas:** 2 endpoints
- **Análisis y Reportes:** 2 endpoints
- **Rotación Automática:** 5 endpoints

**Decoradores por Endpoint:** ~4-8 decoradores promedio
**Complejidad:** Alta - múltiples servicios, validaciones complejas, lógica de negocio extensa

---

## 🔗 Relaciones con Otros Módulos

### Servicios Externos
- **APIKeysService:** Lógica de negocio principal
- **APIKeysRotationService:** Manejo de rotación automática
- **PrismaService:** Acceso a base de datos (indirectamente)

### Guards y Decorators
- **AdminAuthGuard:** Autenticación JWT
- **PermissionsGuard:** Control de permisos basado en roles
- **RequirePermissions:** Decorador para permisos específicos

### DTOs y Validación
- **class-validator:** Validación de inputs
- **class-transformer:** Transformación de objetos
- **Swagger:** Documentación automática de API

---

## 🧪 Testing Recommendations

### Unit Tests
- Tests para cada endpoint con diferentes escenarios
- Mocks para servicios externos
- Validación de respuestas y códigos de estado

### Integration Tests
- Tests con base de datos real
- Validación de flujo completo (create → read → update → delete)
- Tests de permisos y autenticación

### E2E Tests
- Tests de rotación automática
- Tests de operaciones masivas
- Validación de concurrencia

---

## 📝 Notas de Implementación

1. **Paginación:** Implementada en endpoints de listado con límites razonables
2. **Validación:** DTOs con validadores completos para todos los campos
3. **Error Handling:** Respuestas de error consistentes con códigos HTTP apropiados
4. **Swagger:** Documentación completa para todos los endpoints
5. **Auditoría:** Framework preparado para logging de operaciones (pendiente implementación)

Este controlador representa un componente crítico del sistema de configuración, proporcionando gestión completa y segura de claves API con características avanzadas como rotación automática y análisis detallado.
