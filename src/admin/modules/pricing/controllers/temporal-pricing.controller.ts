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

import { TemporalPricingService } from '../services/temporal-pricing.service';
import {
  CreateTemporalPricingRuleDto,
  UpdateTemporalPricingRuleDto,
  TemporalPricingRuleListQueryDto,
  TemporalPricingRuleResponseDto,
  TemporalPricingRuleListResponseDto,
  TemporalPricingEvaluationDto,
  TemporalPricingEvaluationResultDto,
  CreateStandardTemporalRulesDto,
  BulkTemporalRuleUpdateDto,
} from '../dtos/temporal-pricing.dto';

@ApiTags('Admin Pricing - Temporal Rules')
@Controller('admin/pricing/temporal-rules')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class TemporalPricingController {
  constructor(
    private readonly temporalPricingService: TemporalPricingService,
  ) {}

  @Post()
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Crear regla temporal de pricing',
    description:
      'Crea una nueva regla de pricing basada en tiempo, fecha o temporada',
  })
  @ApiResponse({
    status: 201,
    description: 'Regla creada exitosamente',
    type: TemporalPricingRuleResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Conflicto - Regla ya existe' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async create(
    @Body() createDto: CreateTemporalPricingRuleDto,
  ): Promise<TemporalPricingRuleResponseDto> {
    return this.temporalPricingService.create(createDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Listar reglas temporales',
    description:
      'Obtiene todas las reglas de pricing temporal con opciones de filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas obtenida exitosamente',
    type: TemporalPricingRuleListResponseDto,
  })
  async findAll(
    @Query() query: TemporalPricingRuleListQueryDto,
  ): Promise<TemporalPricingRuleListResponseDto> {
    return this.temporalPricingService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Obtener detalles de regla temporal',
    description:
      'Obtiene información completa de una regla de pricing temporal específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la regla',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla encontrada',
    type: TemporalPricingRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Regla no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TemporalPricingRuleResponseDto> {
    return this.temporalPricingService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Actualizar regla temporal',
    description:
      'Actualiza la configuración de una regla de pricing temporal existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la regla',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla actualizada exitosamente',
    type: TemporalPricingRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Regla no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Nombre duplicado' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTemporalPricingRuleDto,
  ): Promise<TemporalPricingRuleResponseDto> {
    return this.temporalPricingService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Eliminar regla temporal',
    description: 'Elimina una regla de pricing temporal',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la regla',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Regla no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.temporalPricingService.remove(id);
  }

  @Post('evaluate')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Evaluar pricing temporal',
    description:
      'Evalúa qué reglas de pricing temporal aplican para una fecha/hora y ubicación específicas',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluación completada',
    type: TemporalPricingEvaluationResultDto,
  })
  async evaluatePricing(
    @Body() evaluationDto: TemporalPricingEvaluationDto,
  ): Promise<TemporalPricingEvaluationResultDto> {
    return this.temporalPricingService.evaluateTemporalPricing(evaluationDto);
  }

  @Post('create-standard-rules')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Crear reglas temporales estándar',
    description:
      'Crea reglas de pricing temporal estándar (horarios pico, nocturnos, fines de semana) para una ubicación específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas estándar creadas exitosamente',
  })
  async createStandardRules(
    @Body() standardDto: CreateStandardTemporalRulesDto,
  ) {
    const result =
      await this.temporalPricingService.createStandardRules(standardDto);
    return result;
  }

  @Post('bulk-update')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Actualización masiva de reglas temporales',
    description:
      'Actualiza múltiples reglas temporales con cambios porcentuales o fijos',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualización completada',
  })
  async bulkUpdate(@Body() updateDto: BulkTemporalRuleUpdateDto) {
    return this.temporalPricingService.bulkUpdate(updateDto);
  }

  @Get('summary/overview')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Resumen de reglas temporales',
    description:
      'Obtiene estadísticas generales de todas las reglas temporales activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen obtenido exitosamente',
  })
  async getSummary() {
    const rules = await this.temporalPricingService.findAll({
      isActive: true,
      limit: 1000, // Get all active rules
    });

    const summary = {
      totalActiveRules: rules.total,
      rulesByType: {
        time_range: rules.rules.filter((r) => r.ruleType === 'time_range')
          .length,
        day_of_week: rules.rules.filter((r) => r.ruleType === 'day_of_week')
          .length,
        date_specific: rules.rules.filter((r) => r.ruleType === 'date_specific')
          .length,
        seasonal: rules.rules.filter((r) => r.ruleType === 'seasonal').length,
      },
      rulesByScope: {
        global: rules.rules.filter(
          (r) => !r.countryId && !r.stateId && !r.cityId && !r.zoneId,
        ).length,
        country: rules.rules.filter(
          (r) => r.countryId && !r.stateId && !r.cityId && !r.zoneId,
        ).length,
        state: rules.rules.filter((r) => r.stateId).length,
        city: rules.rules.filter((r) => r.cityId).length,
        zone: rules.rules.filter((r) => r.zoneId).length,
      },
      averageMultiplier:
        rules.total > 0
          ? rules.rules.reduce((sum, rule) => sum + rule.multiplier, 0) /
            rules.total
          : 0,
      highestMultiplier:
        rules.total > 0 ? Math.max(...rules.rules.map((r) => r.multiplier)) : 0,
      lowestMultiplier:
        rules.total > 0 ? Math.min(...rules.rules.map((r) => r.multiplier)) : 0,
    };

    return { summary };
  }

  @Post('simulate-pricing')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Simular cálculo de precio completo',
    description:
      'Simula el cálculo completo de precio incluyendo todos los multiplicadores (tier, regional, temporal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulación completada',
  })
  async simulatePricing(
    @Body()
    simulationDto: {
      tierId: number;
      distance: number;
      duration: number;
      dateTime: string;
      countryId?: number;
      stateId?: number;
      cityId?: number;
      zoneId?: number;
    },
  ) {
    const {
      tierId,
      distance,
      duration,
      dateTime,
      countryId,
      stateId,
      cityId,
      zoneId,
    } = simulationDto;

    // Evaluate temporal pricing
    const temporalResult =
      await this.temporalPricingService.evaluateTemporalPricing({
        dateTime,
        countryId,
        stateId,
        cityId,
        zoneId,
      });

    // Get tier pricing calculation (this would need to be implemented in RideTiersService)
    // For now, return the temporal evaluation
    return {
      temporalEvaluation: temporalResult,
      note: 'Complete pricing simulation requires integration with RideTiersService.calculatePricing method',
    };
  }
}
