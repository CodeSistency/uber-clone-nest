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
  ApiBody,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { ServiceZonesService } from '../services/service-zones.service';
import {
  CreateServiceZoneDto,
  UpdateServiceZoneDto,
  ServiceZoneListQueryDto,
  ServiceZoneResponseDto,
  ServiceZoneListResponseDto,
  ServiceZoneListItemDto,
  ZoneValidationResultDto,
  CityCoverageAnalysisDto,
  CityServiceZonesListResponseDto,
  CityPricingMatrixResponseDto,
} from '../dtos/country.dto';

@ApiTags('Admin Geography - Service Zones')
@Controller('admin/geography/service-zones')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ServiceZonesController {
  constructor(private readonly serviceZonesService: ServiceZonesService) {}

  @Post()
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear una nueva zona de servicio',
    description:
      'Crea una zona de servicio con geometría GeoJSON y configuraciones de pricing',
  })
  @ApiResponse({
    status: 201,
    description: 'Zona creada exitosamente',
    type: ServiceZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Zona ya existe' })
  @ApiResponse({ status: 400, description: 'Geometría inválida' })
  async create(
    @Body() createServiceZoneDto: CreateServiceZoneDto,
  ): Promise<ServiceZoneResponseDto> {
    return this.serviceZonesService.create(createServiceZoneDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Listar zonas de servicio con filtros avanzados',
    description:
      'Obtiene zonas de servicio con filtrado por ciudad, estado, tipo y estado operativo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de zonas obtenida exitosamente',
    type: ServiceZoneListResponseDto,
  })
  async findAll(
    @Query() query: ServiceZoneListQueryDto,
  ): Promise<ServiceZoneListResponseDto> {
    return this.serviceZonesService.findAll(query);
  }

  @Get('by-city/:cityId')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener zonas por ciudad',
    description: 'Obtiene todas las zonas activas de una ciudad específica',
  })
  @ApiParam({
    name: 'cityId',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    description: 'Solo zonas activas',
    example: true,
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Zonas obtenidas exitosamente',
    type: CityServiceZonesListResponseDto,
  })
  async findByCity(
    @Param('cityId', ParseIntPipe) cityId: number,
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const activeOnlyBool =
      activeOnly === undefined ? true : activeOnly === 'true';
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.serviceZonesService.findByCity(cityId, activeOnlyBool, pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener detalles de una zona de servicio',
    description:
      'Obtiene información completa de una zona incluyendo geometría y configuraciones',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la zona',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Zona encontrada',
    type: ServiceZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceZoneResponseDto> {
    return this.serviceZonesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualizar una zona de servicio',
    description:
      'Actualiza geometría, pricing y configuraciones de una zona existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la zona',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Zona actualizada exitosamente',
    type: ServiceZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Datos duplicados' })
  @ApiResponse({ status: 400, description: 'Geometría inválida' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceZoneDto: UpdateServiceZoneDto,
  ): Promise<ServiceZoneResponseDto> {
    return this.serviceZonesService.update(id, updateServiceZoneDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Eliminar una zona de servicio',
    description: 'Elimina una zona del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la zona',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Zona eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceZonesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado operativo de una zona de servicio',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la zona',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la zona cambiado exitosamente',
    type: ServiceZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceZoneResponseDto> {
    return this.serviceZonesService.toggleActiveStatus(id);
  }

  @Post('validate-geometry')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Validar geometría de zona',
    description:
      'Valida geometría GeoJSON y verifica conflictos con zonas existentes',
  })
  @ApiBody({
    description: 'Datos para validar geometría de zona',
    schema: {
      type: 'object',
      properties: {
        zoneData: {
          oneOf: [
            { $ref: '#/components/schemas/CreateServiceZoneDto' },
            { $ref: '#/components/schemas/UpdateServiceZoneDto' },
          ],
        },
        cityId: { type: 'number', example: 1 },
        excludeZoneId: { type: 'number', example: 1 },
      },
      required: ['zoneData', 'cityId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
    type: ZoneValidationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  async validateGeometry(
    @Body()
    validationData: {
      zoneData: CreateServiceZoneDto | UpdateServiceZoneDto;
      cityId: number;
      excludeZoneId?: number;
    },
  ): Promise<ZoneValidationResultDto> {
    const { zoneData, cityId, excludeZoneId } = validationData;
    return this.serviceZonesService.validateZoneGeometry(
      zoneData,
      cityId,
      excludeZoneId,
    );
  }

  @Get('coverage-analysis/city/:cityId')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Análisis de cobertura por ciudad',
    description:
      'Analiza cobertura geográfica, solapamientos y áreas sin cobertura en una ciudad',
  })
  @ApiParam({
    name: 'cityId',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis completado',
    type: CityCoverageAnalysisDto,
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  async analyzeCityCoverage(
    @Param('cityId', ParseIntPipe) cityId: number,
  ): Promise<CityCoverageAnalysisDto> {
    return this.serviceZonesService.analyzeCityCoverage(cityId);
  }

  @Post('bulk-update-status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualización masiva de estado',
    description: 'Cambia el estado activo/inactivo de múltiples zonas',
  })
  @ApiBody({
    description: 'Datos para actualización masiva de estado',
    schema: {
      type: 'object',
      properties: {
        zoneIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
        isActive: { type: 'boolean', example: true },
      },
      required: ['zoneIds', 'isActive'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Actualización completada',
  })
  async bulkUpdateStatus(
    @Body() data: { zoneIds: number[]; isActive: boolean },
  ) {
    const { zoneIds, isActive } = data;

    if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
      throw new BadRequestException('zoneIds must be a non-empty array');
    }

    const results: Array<{
      zoneId: number;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];
    for (const zoneId of zoneIds) {
      try {
        const result =
          await this.serviceZonesService.toggleActiveStatus(zoneId);
        results.push({ zoneId, success: true, data: result });
      } catch (error) {
        results.push({
          zoneId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      message: `Bulk status update completed`,
      results,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  @Get('pricing-matrix/city/:cityId')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Matriz de pricing por ciudad',
    description:
      'Obtiene todos los multiplicadores de pricing organizados por zona con paginación',
  })
  @ApiParam({
    name: 'cityId',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz de pricing obtenida',
    type: CityPricingMatrixResponseDto,
  })
  async getPricingMatrix(
    @Param('cityId', ParseIntPipe) cityId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.serviceZonesService.getPricingMatrix(cityId, pageNum, limitNum);
  }
}
