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

import { FeatureFlagsService } from '../services/feature-flags.service';
import { FeatureFlagsCacheService } from '../services/feature-flags-cache.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagListQueryDto,
  FeatureFlagResponseDto,
  FeatureFlagListResponseDto,
  FeatureFlagEvaluationDto,
  FeatureFlagEvaluationResultDto,
  CreateStandardFeatureFlagsDto,
  BulkFeatureFlagUpdateDto,
} from '../dtos/feature-flag.dto';

@ApiTags('Admin Config - Feature Flags')
@Controller('admin/config/feature-flags')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class FeatureFlagsController {
  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly cacheService: FeatureFlagsCacheService,
  ) {}

  @Post()
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear feature flag',
    description:
      'Crea un nuevo feature flag para habilitar/deshabilitar funcionalidades dinámicamente',
  })
  @ApiResponse({
    status: 201,
    description: 'Feature flag creado exitosamente',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Conflicto - Key duplicada' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async create(@Body() createDto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(createDto, 'system'); // TODO: Get from JWT
  }

  @Get()
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Listar feature flags',
    description:
      'Obtiene todos los feature flags con opciones de filtrado y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de feature flags obtenida exitosamente',
    type: FeatureFlagListResponseDto,
  })
  async findAll(
    @Query() query: FeatureFlagListQueryDto,
  ): Promise<FeatureFlagListResponseDto> {
    return this.featureFlagsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener detalles de feature flag',
    description: 'Obtiene información completa de un feature flag específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del feature flag',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag encontrado',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Feature flag no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.findOne(id);
  }

  @Get('key/:key')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener feature flag por key',
    description:
      'Obtiene información completa de un feature flag usando su key única',
  })
  @ApiParam({
    name: 'key',
    description: 'Key del feature flag',
    example: 'new_payment_flow',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag encontrado',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Feature flag no encontrado' })
  async findByKey(@Param('key') key: string): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.findByKey(key);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualizar feature flag',
    description: 'Actualiza la configuración de un feature flag existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del feature flag',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag actualizado exitosamente',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Feature flag no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Key duplicada' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.update(id, updateDto, 'system'); // TODO: Get from JWT
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Eliminar feature flag',
    description: 'Elimina un feature flag del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del feature flag',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Feature flag no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.featureFlagsService.remove(id);
  }

  @Post(':id/toggle')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Alternar estado del feature flag',
    description: 'Habilita o deshabilita un feature flag',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del feature flag',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del feature flag alternado exitosamente',
    type: FeatureFlagResponseDto,
  })
  async toggleEnabled(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { enabled: boolean },
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.toggleEnabled(id, body.enabled, 'system'); // TODO: Get from JWT
  }

  @Post('evaluate')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Evaluar feature flag',
    description:
      'Evalúa si un feature flag está habilitado para un usuario específico y contexto',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluación completada',
    type: FeatureFlagEvaluationResultDto,
  })
  async evaluateFeature(
    @Body() evaluationDto: FeatureFlagEvaluationDto,
  ): Promise<FeatureFlagEvaluationResultDto> {
    return this.featureFlagsService.evaluateFeature(evaluationDto);
  }

  @Post('create-standard-flags')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear feature flags estándar',
    description:
      'Crea un conjunto de feature flags estándar para diferentes categorías del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flags estándar creados exitosamente',
  })
  async createStandardFlags(
    @Body() standardDto: CreateStandardFeatureFlagsDto,
  ) {
    const result = await this.featureFlagsService.createStandardFlags(
      standardDto,
      'system',
    ); // TODO: Get from JWT
    return result;
  }

  @Post('bulk-update')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualización masiva de feature flags',
    description: 'Actualiza múltiples feature flags con cambios en lote',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualización completada',
  })
  async bulkUpdate(@Body() updateDto: BulkFeatureFlagUpdateDto) {
    return this.featureFlagsService.bulkUpdate(updateDto, 'system'); // TODO: Get from JWT
  }

  @Get('categories/overview')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Resumen por categorías',
    description:
      'Obtiene estadísticas de feature flags agrupadas por categoría',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen obtenido exitosamente',
  })
  async getCategoriesOverview() {
    const allFlags = await this.featureFlagsService.findAll({
      limit: 1000, // Get all flags
    });

    const categories = [
      'payments',
      'rides',
      'admin',
      'notifications',
      'geography',
      'pricing',
      'system',
    ];
    const overview = {};

    categories.forEach((category) => {
      const categoryFlags = allFlags.flags.filter(
        (flag) => flag.category === category,
      );
      overview[category] = {
        total: categoryFlags.length,
        enabled: categoryFlags.filter((flag) => flag.isEnabled).length,
        disabled: categoryFlags.filter((flag) => !flag.isEnabled).length,
        active: categoryFlags.filter((flag) => flag.isActive).length,
        averageRollout:
          categoryFlags.length > 0
            ? categoryFlags.reduce(
                (sum, flag) => sum + flag.rolloutPercentage,
                0,
              ) / categoryFlags.length
            : 0,
      };
    });

    return { overview, totalFlags: allFlags.total };
  }

  @Get('rollout/status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Estado de rollouts',
    description:
      'Obtiene información sobre el progreso de rollouts de features',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de rollouts obtenido exitosamente',
  })
  async getRolloutStatus() {
    const allFlags = await this.featureFlagsService.findAll({
      isEnabled: true,
      limit: 1000,
    });

    const rolloutStatus = {
      totalEnabled: allFlags.total,
      fullRollout: allFlags.flags.filter(
        (flag) => flag.rolloutPercentage === 100,
      ).length,
      partialRollout: allFlags.flags.filter(
        (flag) => flag.rolloutPercentage < 100 && flag.rolloutPercentage > 0,
      ).length,
      zeroRollout: allFlags.flags.filter((flag) => flag.rolloutPercentage === 0)
        .length,
      averageRolloutPercentage:
        allFlags.total > 0
          ? allFlags.flags.reduce(
              (sum, flag) => sum + flag.rolloutPercentage,
              0,
            ) / allFlags.total
          : 0,
      rolloutDistribution: {
        '0-25%': allFlags.flags.filter((flag) => flag.rolloutPercentage <= 25)
          .length,
        '26-50%': allFlags.flags.filter(
          (flag) => flag.rolloutPercentage > 25 && flag.rolloutPercentage <= 50,
        ).length,
        '51-75%': allFlags.flags.filter(
          (flag) => flag.rolloutPercentage > 50 && flag.rolloutPercentage <= 75,
        ).length,
        '76-99%': allFlags.flags.filter(
          (flag) => flag.rolloutPercentage > 75 && flag.rolloutPercentage < 100,
        ).length,
        '100%': allFlags.flags.filter((flag) => flag.rolloutPercentage === 100)
          .length,
      },
    };

    return { rolloutStatus };
  }

  @Get('cache/stats')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Estadísticas de cache',
    description: 'Obtiene estadísticas del sistema de cache de feature flags',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  @Post('cache/warmup')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Calentar cache',
    description: 'Precarga todos los feature flags activos en cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache calentado exitosamente',
  })
  async warmupCache() {
    await this.cacheService.warmupCache();
    return { message: 'Cache warmup completed successfully' };
  }

  @Post('cache/clear')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Limpiar cache',
    description: 'Elimina todos los feature flags y evaluaciones del cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache limpiado exitosamente',
  })
  async clearCache() {
    await this.cacheService.invalidateAllFlagCaches();
    return { message: 'Cache cleared successfully' };
  }

  @Post('cache/clear/:key')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Limpiar cache de flag específico',
    description: 'Elimina el cache de un feature flag específico',
  })
  @ApiParam({
    name: 'key',
    description: 'Key del feature flag',
    example: 'new_payment_flow',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache del flag limpiado exitosamente',
  })
  async clearFlagCache(@Param('key') key: string) {
    await this.cacheService.invalidateFlagCache(key);
    return { message: `Cache cleared for feature flag: ${key}` };
  }

  @Post('cache/cleanup')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Limpiar evaluaciones expiradas',
    description: 'Elimina evaluaciones de cache que han expirado',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluaciones expiradas limpiadas exitosamente',
  })
  async cleanupExpiredEvaluations() {
    await this.cacheService.cleanExpiredEvaluations();
    return { message: 'Expired evaluations cleaned up successfully' };
  }

  @Post('public/evaluate')
  @ApiOperation({
    summary: 'Evaluación pública de feature flag',
    description:
      'Endpoint público para que aplicaciones cliente evalúen feature flags',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluación completada',
    type: FeatureFlagEvaluationResultDto,
  })
  async evaluateFeaturePublic(
    @Body() evaluationDto: FeatureFlagEvaluationDto,
  ): Promise<FeatureFlagEvaluationResultDto> {
    // This endpoint can be used by client applications to check feature flags
    // without requiring admin authentication
    return this.featureFlagsService.evaluateFeature(evaluationDto);
  }
}
