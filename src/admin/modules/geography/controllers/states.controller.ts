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

import { StatesService } from '../services/states.service';
import {
  CreateStateDto,
  UpdateStateDto,
  StateListQueryDto,
  StateResponseDto,
  StateListResponseDto,
  StateListItemDto,
} from '../dtos/country.dto';

@ApiTags('Admin Geography - States')
@Controller('admin/geography/states')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Post()
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear un nuevo estado/provincia',
    description: 'Crea un nuevo estado o provincia en el sistema de geografía',
  })
  @ApiResponse({
    status: 201,
    description: 'Estado creado exitosamente',
    type: StateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'País no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Estado ya existe' })
  async create(
    @Body() createStateDto: CreateStateDto,
  ): Promise<StateResponseDto> {
    return this.statesService.create(createStateDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Listar estados/provincias con filtros',
    description:
      'Obtiene una lista paginada de estados con opciones de búsqueda y filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estados obtenida exitosamente',
    type: StateListResponseDto,
  })
  async findAll(
    @Query() query: StateListQueryDto,
  ): Promise<StateListResponseDto> {
    return this.statesService.findAll(query);
  }

  @Get('by-country/:countryId')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener estados por país',
    description: 'Obtiene todos los estados activos de un país específico',
  })
  @ApiParam({
    name: 'countryId',
    description: 'ID del país',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    description: 'Solo estados activos',
    example: true,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Estados obtenidos exitosamente',
  })
  async findByCountry(
    @Param('countryId', ParseIntPipe) countryId: number,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<StateListResponseDto> {
    const activeOnlyBool =
      activeOnly === undefined ? true : activeOnly === 'true';
    return this.statesService.findByCountry(countryId, activeOnlyBool);
  }

  @Get('stats/by-country')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Estadísticas de estados por país',
    description:
      'Obtiene estadísticas completas de estados agrupados por país basándose en todos los registros existentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getStatesByCountryGrouped() {
    const stats = await this.statesService.getStatesByCountryGrouped();
    return { stats };
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener detalles de un estado',
    description: 'Obtiene la información completa de un estado específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del estado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado encontrado',
    type: StateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Estado no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StateResponseDto> {
    return this.statesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualizar un estado',
    description: 'Actualiza la información de un estado existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del estado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    type: StateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Estado no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Datos duplicados' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStateDto: UpdateStateDto,
  ): Promise<StateResponseDto> {
    return this.statesService.update(id, updateStateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Eliminar un estado',
    description:
      'Elimina un estado del sistema (solo si no tiene ciudades asociadas)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del estado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Estado no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar - tiene dependencias',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.statesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado activo de un estado/provincia',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del estado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del estado cambiado exitosamente',
    type: StateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Estado no encontrado' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StateResponseDto> {
    return this.statesService.toggleActiveStatus(id);
  }
}
