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
import { RideTiersService } from '../services/ride-tiers.service';
import {
  CreateTemporalPricingRuleDto,
  UpdateTemporalPricingRuleDto,
  TemporalPricingRuleListQueryDto,
  TemporalPricingRuleResponseDto,
  TemporalPricingRuleListResponseDto,
  TemporalPricingRuleListItemDto,
  TemporalPricingEvaluationDto,
  TemporalPricingEvaluationResultDto,
  CreateStandardTemporalRulesDto,
  BulkTemporalRuleUpdateDto,
  SimulatePricingDto,
  SimulatePricingResponseDto,
} from '../dtos/temporal-pricing.dto';

@ApiTags('Admin Pricing - Temporal Rules')
@Controller('admin/pricing/temporal-rules')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class TemporalPricingController {
  constructor(
    private readonly temporalPricingService: TemporalPricingService,
    private readonly rideTiersService: RideTiersService,
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
    // Get raw data for summary calculations (not transformed)
    const rawRules = await this.temporalPricingService.getRawRulesForSummary();

    const summary = {
      totalActiveRules: rawRules.length,
      rulesByType: {
        time_range: rawRules.filter((r) => r.ruleType === 'TIME_RANGE').length,
        day_of_week: rawRules.filter((r) => r.ruleType === 'DAY_OF_WEEK').length,
        date_specific: rawRules.filter((r) => r.ruleType === 'DATE_SPECIFIC').length,
        seasonal: rawRules.filter((r) => r.ruleType === 'SEASONAL').length,
      },
      rulesByScope: {
        global: rawRules.filter(
          (r) => !r.countryId && !r.stateId && !r.cityId && !r.zoneId,
        ).length,
        country: rawRules.filter(
          (r) => r.countryId && !r.stateId && !r.cityId && !r.zoneId,
        ).length,
        state: rawRules.filter((r) => r.stateId).length,
        city: rawRules.filter((r) => r.cityId).length,
        zone: rawRules.filter((r) => r.zoneId).length,
      },
      averageMultiplier:
        rawRules.length > 0
          ? rawRules.reduce((sum, rule) => sum + Number(rule.multiplier), 0) /
            rawRules.length
          : 0,
      highestMultiplier:
        rawRules.length > 0 ? Math.max(...rawRules.map((r) => Number(r.multiplier))) : 0,
      lowestMultiplier:
        rawRules.length > 0 ? Math.min(...rawRules.map((r) => Number(r.multiplier))) : 0,
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
    type: SimulatePricingResponseDto,
  })
  async simulatePricing(@Body() simulationDto: SimulatePricingDto): Promise<SimulatePricingResponseDto> {
    const {
      tierId,
      distance,
      duration,
      dateTime,
      ruleIds,
      countryId,
      stateId,
      cityId,
      zoneId,
    } = simulationDto;

    // Evaluate temporal pricing
    let temporalResult;
    if (ruleIds && ruleIds.length > 0) {
      // Use specific rules provided by user
      temporalResult = await this.temporalPricingService.evaluateSpecificRules(
        ruleIds,
        {
          dateTime,
          countryId,
          stateId,
          cityId,
          zoneId,
        }
      );
    } else {
      // Evaluate temporal pricing automatically
      temporalResult =
        await this.temporalPricingService.evaluateTemporalPricing({
          dateTime,
          countryId,
          stateId,
          cityId,
          zoneId,
        });
    }

    // Calculate base pricing using RideTiersService
    const basePricing = await this.rideTiersService.calculatePricing({
      tierId,
      distance,
      duration,
      countryId,
      stateId,
      cityId,
      zoneId,
      surgeMultiplier: 1.0, // Base calculation without surge
    });

    // Apply temporal multiplier to the base pricing
    const temporalMultiplier = temporalResult.combinedMultiplier || 1.0;
    const temporalAdjustedTotal = basePricing.finalPricing.baseAmount * temporalMultiplier;
    const temporalAdjustments = temporalAdjustedTotal - basePricing.finalPricing.baseAmount;

    // Recalculate final pricing with temporal adjustments
    const totalAmountWithTemporal = temporalAdjustedTotal + basePricing.finalPricing.serviceFees + basePricing.finalPricing.taxes;

    // Combine all applied rules
    const allAppliedRules = [
      ...basePricing.metadata.appliedRules,
      ...(temporalMultiplier !== 1.0 ? ['temporal_pricing'] : [])
    ];

    return {
      temporalEvaluation: temporalResult,
      basePricing: basePricing.basePricing,
      regionalMultipliers: basePricing.regionalMultipliers,
      dynamicPricing: basePricing.dynamicPricing,
      temporalPricing: {
        temporalMultiplier,
        temporalAdjustedTotal,
        temporalAdjustments,
      },
      finalPricing: {
        ...basePricing.finalPricing,
        temporalAdjustedTotal,
        temporalAdjustments,
        totalAmountWithTemporal,
      },
      metadata: {
        ...basePricing.metadata,
        appliedRules: allAppliedRules,
        simulationMode: ruleIds && ruleIds.length > 0 ? 'manual_rules' : 'automatic_evaluation',
      },
      tier: basePricing.tier,
      scope: temporalResult.scope,
    };
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado activo de una regla temporal de pricing',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la regla temporal',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la regla temporal cambiado exitosamente',
    type: TemporalPricingRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Regla temporal no encontrada' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TemporalPricingRuleResponseDto> {
    return this.temporalPricingService.toggleActiveStatus(id);
  }
}
