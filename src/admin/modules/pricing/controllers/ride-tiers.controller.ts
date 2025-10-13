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
  BadRequestException,
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

import { RideTiersService } from '../services/ride-tiers.service';
import {
  CreateRideTierDto,
  UpdateRideTierDto,
  RideTierListQueryDto,
  RideTierResponseDto,
  RideTierListResponseDto,
  RideTierListItemDto,
  PricingCalculationDto,
  PricingCalculationResultDto,
  PricingValidationDto,
  PricingValidationResultDto,
} from '../dtos/ride-tier.dto';

@ApiTags('Admin Pricing - Ride Tiers')
@Controller('admin/pricing/ride-tiers')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class RideTiersController {
  constructor(private readonly rideTiersService: RideTiersService) {}

  @Post()
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Crear una nueva tarifa base',
    description: 'Crea un nuevo nivel de servicio con tarifas base para rides',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarifa creada exitosamente',
    type: RideTierResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Conflicto - Tarifa ya existe' })
  @ApiResponse({ status: 400, description: 'Configuración de precio inválida' })
  async create(
    @Body() createRideTierDto: CreateRideTierDto,
  ): Promise<RideTierResponseDto> {
    return this.rideTiersService.create(createRideTierDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Listar tarifas base',
    description:
      'Obtiene todas las tarifas base disponibles con opciones de filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarifas obtenida exitosamente',
    type: RideTierListResponseDto,
  })
  async findAll(
    @Query() query: RideTierListQueryDto,
  ): Promise<RideTierListResponseDto> {
    return this.rideTiersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Obtener detalles de tarifa',
    description: 'Obtiene información completa de una tarifa base específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tarifa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarifa encontrada',
    type: RideTierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RideTierResponseDto> {
    return this.rideTiersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Actualizar tarifa base',
    description: 'Actualiza la configuración de una tarifa base existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tarifa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarifa actualizada exitosamente',
    type: RideTierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Nombre duplicado' })
  @ApiResponse({ status: 400, description: 'Configuración inválida' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRideTierDto: UpdateRideTierDto,
  ): Promise<RideTierResponseDto> {
    return this.rideTiersService.update(id, updateRideTierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Eliminar tarifa base',
    description: 'Elimina una tarifa base (solo si no tiene rides asociados)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tarifa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarifa eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar - tiene rides asociados',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rideTiersService.remove(id);
  }

  @Post('calculate-pricing')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Calcular precio de ride',
    description:
      'Calcula el precio total de un ride considerando todas las variables regionales y dinámicas',
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo completado',
    type: PricingCalculationResultDto,
  })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async calculatePricing(
    @Body() calculationDto: PricingCalculationDto,
  ): Promise<PricingCalculationResultDto> {
    return this.rideTiersService.calculatePricing(calculationDto);
  }

  @Post('validate-pricing')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Validar configuración de pricing',
    description:
      'Valida una configuración de pricing y opcionalmente la compara con una tarifa existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
    type: PricingValidationResultDto,
  })
  async validatePricing(
    @Body() validationDto: PricingValidationDto,
  ): Promise<PricingValidationResultDto> {
    return this.rideTiersService.validatePricingConfiguration(validationDto);
  }

  @Post('create-standard-tiers')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Crear tiers estándar',
    description:
      'Crea los tiers estándar de Uber (UberX, UberXL, Comfort, Uber Black) con configuraciones predefinidas',
  })
  @ApiResponse({
    status: 200,
    description: 'Tiers estándar creados exitosamente',
  })
  async createStandardTiers() {
    const result = await this.rideTiersService.createStandardTiers();
    return result;
  }

  @Get('summary/overview')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Resumen de pricing',
    description:
      'Obtiene estadísticas generales de todas las tarifas disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen obtenido exitosamente',
  })
  async getPricingSummary() {
    const summary = await this.rideTiersService.getPricingSummary();
    return { summary };
  }

  @Post('vehicle-types')
  @RequirePermissions(AdminPermission.PRICING_READ)
  @ApiOperation({
    summary: 'Obtener tipos de vehículo',
    description:
      'Obtiene la lista de tipos de vehículo disponibles para asociar con tiers',
  })
  @ApiResponse({
    status: 201,
    description: 'Tipos de vehículo obtenidos exitosamente',
  })
  async getVehicleTypes() {
    return this.rideTiersService.getVehicleTypes();
  }

  @Post('bulk-update')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Actualización masiva de tarifas',
    description: 'Actualiza múltiples tarifas con ajustes porcentuales',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualización completada',
  })
  async bulkUpdatePricing(
    @Body()
    data: {
      tierIds: number[];
      adjustmentType: 'percentage' | 'fixed';
      adjustmentValue: number;
      field: 'baseFare' | 'perMinuteRate' | 'perKmRate';
    },
  ) {
    const { tierIds, adjustmentType, adjustmentValue, field } = data;

    if (!Array.isArray(tierIds) || tierIds.length === 0) {
      throw new BadRequestException('tierIds must be a non-empty array');
    }

    const results: Array<{
      tierId: number;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];
    for (const tierId of tierIds) {
      try {
        const tier = await this.rideTiersService.findOne(tierId);
        let newValue: number;

        if (adjustmentType === 'percentage') {
          newValue = tier[field] * (1 + adjustmentValue / 100);
        } else {
          newValue = tier[field] + adjustmentValue;
        }

        // Round to nearest cent
        newValue = Math.round(newValue);

        const updateData = { [field]: newValue };
        const result = await this.rideTiersService.update(
          tierId,
          updateData as any,
        );
        results.push({ tierId, success: true, data: result });
      } catch (error) {
        results.push({
          tierId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      message: `Bulk pricing update completed`,
      results,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.PRICING_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado activo de un tier de pricing',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del tier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del tier cambiado exitosamente',
    type: RideTierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tier no encontrado' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RideTierResponseDto> {
    return this.rideTiersService.toggleActiveStatus(id);
  }
}
