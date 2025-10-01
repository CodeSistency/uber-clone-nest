import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { APIKeysService } from '../services/api-keys.service';
import { APIKeysRotationService } from '../services/api-keys-rotation.service';
import {
  CreateAPIKeyDto,
  UpdateAPIKeyDto,
  APIKeyListQueryDto,
  APIKeyResponseDto,
  APIKeyListResponseDto,
  APIKeyRotationDto,
  CreateStandardAPIKeysDto,
  BulkAPIKeyUpdateDto,
} from '../dtos/api-key.dto';

@ApiTags('Admin Config - API Keys')
@Controller('admin/config/api-keys')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class APIKeysController {
  constructor(
    private readonly apiKeysService: APIKeysService,
    private readonly apiKeysRotationService: APIKeysRotationService,
  ) {}

  @Post()
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Crear API key',
    description:
      'Crea una nueva clave API para integración con servicios externos',
  })
  @ApiResponse({
    status: 201,
    description: 'API key creada exitosamente',
    type: APIKeyResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Nombre o clave primaria duplicada',
  })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async create(@Body() createDto: CreateAPIKeyDto) {
    return this.apiKeysService.create(createDto, 'system'); // TODO: Get from JWT
  }

  @Get()
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Listar API keys',
    description:
      'Obtiene todas las claves API con opciones de filtrado y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de API keys obtenida exitosamente',
    type: APIKeyListResponseDto,
  })
  async findAll(
    @Query() query: APIKeyListQueryDto,
  ): Promise<APIKeyListResponseDto> {
    return this.apiKeysService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Obtener detalles de API key',
    description: 'Obtiene información completa de una clave API específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'API key encontrada',
    type: APIKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'API key no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<APIKeyResponseDto> {
    return this.apiKeysService.findOne(id);
  }

  @Get('service/:service/:environment')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Obtener API keys por servicio y entorno',
    description:
      'Obtiene todas las claves API activas para un servicio específico y entorno',
  })
  @ApiParam({
    name: 'service',
    description: 'Nombre del servicio',
    example: 'stripe',
  })
  @ApiParam({
    name: 'environment',
    description: 'Entorno',
    example: 'production',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys encontradas',
    type: [APIKeyResponseDto],
  })
  async findByServiceAndEnvironment(
    @Param('service') service: string,
    @Param('environment') environment: string,
  ): Promise<APIKeyResponseDto[]> {
    return this.apiKeysService.findByServiceAndEnvironment(
      service,
      environment,
    );
  }

  @Get(':id/decrypt')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Obtener clave API desencriptada',
    description:
      'Obtiene el valor desencriptado de una clave API (solo para uso interno)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Clave desencriptada obtenida',
  })
  @ApiResponse({ status: 404, description: 'API key no encontrada' })
  @ApiResponse({ status: 400, description: 'API key inactiva' })
  async getDecryptedKey(@Param('id', ParseIntPipe) id: number) {
    const decryptedKey = await this.apiKeysService.getDecryptedKey(id);
    return { decryptedKey };
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Actualizar API key',
    description: 'Actualiza la configuración de una clave API existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'API key actualizada exitosamente',
    type: APIKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'API key no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Nombre duplicado' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAPIKeyDto,
  ): Promise<APIKeyResponseDto> {
    return this.apiKeysService.update(id, updateDto, 'system'); // TODO: Get from JWT
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Eliminar API key',
    description: 'Elimina una clave API del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'API key eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'API key no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.remove(id);
  }

  @Post(':id/toggle')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Alternar estado de API key',
    description: 'Activa o desactiva una clave API',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de API key alternado exitosamente',
    type: APIKeyResponseDto,
  })
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { active?: boolean },
  ): Promise<APIKeyResponseDto> {
    // If no body provided, default to toggling the current state
    const apiKey = await this.apiKeysService.findOne(id);
    const newActiveState =
      body?.active !== undefined ? body.active : !apiKey.isActive;

    return this.apiKeysService.toggleActive(id, newActiveState, 'system'); // TODO: Get from JWT
  }

  @Post(':id/rotate')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Rotar API key',
    description: 'Rota una clave API con un nuevo valor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'API key rotada exitosamente',
    type: APIKeyResponseDto,
  })
  async rotateKey(
    @Param('id', ParseIntPipe) id: number,
    @Body() rotationDto: APIKeyRotationDto,
  ): Promise<APIKeyResponseDto> {
    return this.apiKeysService.rotateKey(id, rotationDto, 'system'); // TODO: Get from JWT
  }

  @Post('bulk-update')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Actualización masiva de API keys',
    description: 'Actualiza múltiples claves API con cambios en lote',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualización completada',
  })
  async bulkUpdate(@Body() updateDto: BulkAPIKeyUpdateDto) {
    return this.apiKeysService.bulkUpdate(updateDto, 'system'); // TODO: Get from JWT
  }

  @Post('create-standard-keys')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Crear API keys estándar',
    description:
      'Crea un conjunto de claves API estándar para servicios comunes',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys estándar creadas exitosamente',
  })
  async createStandardKeys(@Body() standardDto: CreateStandardAPIKeysDto) {
    const result = await this.apiKeysService.createStandardKeys(
      standardDto,
      'system',
    ); // TODO: Get from JWT
    return result;
  }

  @Get('analytics/overview')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Análisis de API keys',
    description: 'Obtiene estadísticas y análisis de todas las claves API',
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis obtenido exitosamente',
  })
  async getAnalytics() {
    const allKeys = await this.apiKeysService.getAnalyticsData();

    const analytics = {
      totalKeys: allKeys.length,
      activeKeys: allKeys.filter((k) => k.isActive).length,
      inactiveKeys: allKeys.filter((k) => !k.isActive).length,
      expiringSoon: allKeys.filter((k) => {
        if (!k.expiresAt) return false;
        const daysUntilExpiry = Math.floor(
          (new Date(k.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      expired: allKeys.filter(
        (k) => k.expiresAt && new Date(k.expiresAt) < new Date(),
      ).length,
      byService: this.groupByService(allKeys),
      byEnvironment: this.groupByEnvironment(allKeys),
      byKeyType: this.groupByKeyType(allKeys),
      usageStats: {
        totalUsage: allKeys.reduce((sum, k) => sum + k.usageCount, 0),
        averageUsage:
          allKeys.length > 0
            ? allKeys.reduce((sum, k) => sum + k.usageCount, 0) / allKeys.length
            : 0,
        mostUsed: allKeys
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5)
          .map((k) => ({ name: k.name, usage: k.usageCount })),
        leastUsed: allKeys
          .filter((k) => k.usageCount > 0)
          .sort((a, b) => a.usageCount - b.usageCount)
          .slice(0, 5)
          .map((k) => ({ name: k.name, usage: k.usageCount })),
      },
    };

    return { analytics };
  }

  @Get('audit/:id')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Obtener historial de auditoría',
    description:
      'Obtiene el historial completo de operaciones para una clave API',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de auditoría obtenido',
  })
  async getAuditHistory(@Param('id', ParseIntPipe) id: number) {
    // This would require a method in the service to fetch audit logs
    // For now, return a placeholder
    return {
      apiKeyId: id,
      auditLogs: [],
      message: 'Audit history feature not yet implemented',
    };
  }

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

  // ========== ENDPOINTS DE ROTACIÓN AUTOMÁTICA ==========

  @Post(':id/force-rotate')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Forzar rotación inmediata de API key',
    description:
      'Fuerza la rotación inmediata de una clave API, generando una nueva',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'API key rotada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'API key no encontrada' })
  async forceRotateKey(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string } = {},
  ): Promise<any> {
    const reason = body.reason || 'Forced rotation by administrator';
    return this.apiKeysRotationService.forceRotateKey(id, reason);
  }

  @Get(':id/rotation-validation')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Validar si una API key necesita rotación',
    description:
      'Verifica si una clave API necesita rotación basada en su política y estado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la API key',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
  })
  async validateKeyRotation(@Param('id', ParseIntPipe) id: number): Promise<{
    needsRotation: boolean;
    reason: string;
    recommendedAction: string;
  }> {
    return this.apiKeysRotationService.validateKeyRotation(id);
  }

  @Get('rotation/stats')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Estadísticas de rotación de API keys',
    description:
      'Obtiene estadísticas sobre rotaciones, claves que necesitan rotación, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getRotationStats(): Promise<any> {
    return this.apiKeysRotationService.getRotationStats();
  }

  @Post('rotation/bulk-rotate')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Rotación masiva de API keys',
    description: 'Rota múltiples claves API que necesitan rotación',
  })
  @ApiResponse({
    status: 200,
    description: 'Rotación masiva completada',
  })
  async bulkRotateKeys(): Promise<any> {
    const keysToRotate =
      await this.apiKeysRotationService['findKeysNeedingRotation']();
    const results: Array<{
      id: number;
      name: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const key of keysToRotate) {
      try {
        const result = await this.apiKeysRotationService.forceRotateKey(
          key.id,
          'Bulk rotation',
        );
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

  @Get('rotation/audit-history')
  @RequirePermissions(AdminPermission.CONFIG_READ)
  @ApiOperation({
    summary: 'Historial de rotaciones de API keys',
    description: 'Obtiene el historial completo de rotaciones realizadas',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de registros',
    example: 50,
  })
  @ApiQuery({
    name: 'service',
    required: false,
    description: 'Filtrar por servicio',
    example: 'stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
  })
  async getRotationAuditHistory(
    @Query('limit') limit?: string,
    @Query('service') service?: string,
  ): Promise<any> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      action: 'rotated',
      performedAt: {
        gte: thirtyDaysAgo,
      },
    };

    if (service) {
      where.apiKey = {
        service,
      };
    }

    const auditLogs = await this.apiKeysService['prisma'].aPIKeyAudit.findMany({
      where,
      include: {
        apiKey: {
          select: {
            name: true,
            service: true,
            environment: true,
            keyType: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
      take: limitNum,
    });

    return {
      total: auditLogs.length,
      logs: auditLogs.map((audit) => ({
        id: audit.id,
        keyName: audit.apiKey.name,
        service: audit.apiKey.service,
        environment: audit.apiKey.environment,
        keyType: audit.apiKey.keyType,
        action: audit.action,
        rotatedAt: audit.performedAt,
        performedBy: audit.performedBy,
        reason:
          audit.metadata &&
          typeof audit.metadata === 'object' &&
          !Array.isArray(audit.metadata)
            ? (audit.metadata as any).reason
            : null,
        autoRotated:
          audit.metadata &&
          typeof audit.metadata === 'object' &&
          !Array.isArray(audit.metadata)
            ? (audit.metadata as any).autoRotated || false
            : false,
      })),
    };
  }

  @Post('rotation/test-auto-rotation')
  @RequirePermissions(AdminPermission.CONFIG_WRITE)
  @ApiOperation({
    summary: 'Probar rotación automática (solo desarrollo)',
    description:
      'Ejecuta el proceso de rotación automática manualmente para testing',
  })
  @ApiResponse({
    status: 200,
    description: 'Prueba de rotación ejecutada',
  })
  async testAutoRotation(): Promise<any> {
    await this.apiKeysRotationService.handleAutoRotation();
    return { message: 'Auto-rotation test completed' };
  }
}
