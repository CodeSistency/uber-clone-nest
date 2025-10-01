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

import { CitiesService } from '../services/cities.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityListQueryDto,
  CityResponseDto,
  CityListResponseDto,
  CityListItemDto,
} from '../dtos/country.dto';

@ApiTags('Admin Geography - Cities')
@Controller('admin/geography/cities')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear una nueva ciudad',
    description:
      'Crea una nueva ciudad en el sistema de geografía con coordenadas GPS y límites',
  })
  @ApiResponse({
    status: 201,
    description: 'Ciudad creada exitosamente',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Estado no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Ciudad ya existe' })
  async create(@Body() createCityDto: CreateCityDto): Promise<CityResponseDto> {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Listar ciudades con filtros',
    description:
      'Obtiene una lista paginada de ciudades con opciones avanzadas de filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades obtenida exitosamente',
    type: CityListResponseDto,
  })
  async findAll(
    @Query() query: CityListQueryDto,
  ): Promise<CityListResponseDto> {
    return this.citiesService.findAll(query);
  }

  @Get('by-state/:stateId')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener ciudades por estado',
    description: 'Obtiene todas las ciudades activas de un estado específico',
  })
  @ApiParam({
    name: 'stateId',
    description: 'ID del estado',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    description: 'Solo ciudades activas',
    example: true,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudades obtenidas exitosamente',
  })
  async findByState(
    @Param('stateId', ParseIntPipe) stateId: number,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const activeOnlyBool =
      activeOnly === undefined ? true : activeOnly === 'true';
    return this.citiesService.findByState(stateId, activeOnlyBool);
  }

  @Get('stats/by-state')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Estadísticas de ciudades por estado',
    description:
      'Obtiene el conteo de ciudades activas agrupadas por estado y país',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getCitiesByStateGrouped() {
    const stats = await this.citiesService.getCitiesByStateGrouped();
    return { stats };
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener detalles de una ciudad',
    description:
      'Obtiene la información completa de una ciudad específica incluyendo límites geográficos',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad encontrada',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CityResponseDto> {
    return this.citiesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualizar una ciudad',
    description:
      'Actualiza la información de una ciudad existente incluyendo coordenadas y límites',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad actualizada exitosamente',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  @ApiResponse({ status: 409, description: 'Conflicto - Datos duplicados' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCityDto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    return this.citiesService.update(id, updateCityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Eliminar una ciudad',
    description:
      'Elimina una ciudad del sistema (solo si no tiene zonas de servicio asociadas)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar - tiene dependencias',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado operativo de una ciudad',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la ciudad',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la ciudad cambiado exitosamente',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CityResponseDto> {
    return this.citiesService.toggleActiveStatus(id);
  }
}
