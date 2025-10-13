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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { CountriesService } from '../services/countries.service';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryListQueryDto,
  CountryResponseDto,
  CountryListResponseDto,
  CountryListItemDto,
  BulkImportResultDto,
} from '../dtos/country.dto';

@ApiTags('Admin Geography - Countries')
@Controller('admin/geography/countries')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Crear un nuevo país',
    description: 'Crea un nuevo país en el sistema de geografía',
  })
  @ApiResponse({
    status: 201,
    description: 'País creado exitosamente',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Conflicto - País ya existe' })
  async create(
    @Body() createCountryDto: CreateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Listar países con filtros',
    description:
      'Obtiene una lista paginada de países con opciones de búsqueda y filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de países obtenida exitosamente',
    type: CountryListResponseDto,
  })
  async findAll(
    @Query() query: CountryListQueryDto,
  ): Promise<CountryListResponseDto> {
    return this.countriesService.findAll(query);
  }

  @Get('continents')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener lista de continentes',
    description: 'Obtiene la lista de continentes disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de continentes obtenida exitosamente',
  })
  async getContinents() {
    const continents = await this.countriesService.getContinents();
    return { continents };
  }

  @Get('stats/by-continent')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Estadísticas por continente',
    description:
      'Obtiene estadísticas completas de países agrupados por continente basándose en todos los registros existentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getCountriesByContinent() {
    const stats = await this.countriesService.getCountriesByContinent();
    return { stats };
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_READ)
  @ApiOperation({
    summary: 'Obtener detalles de un país',
    description: 'Obtiene la información completa de un país específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del país',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'País encontrado',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'País no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CountryResponseDto> {
    return this.countriesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Actualizar un país',
    description: 'Actualiza la información de un país existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del país',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'País actualizado exitosamente',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'País no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Datos duplicados' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countriesService.update(id, updateCountryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Eliminar un país',
    description:
      'Elimina un país del sistema (solo si no tiene estados asociados)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del país',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'País eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'País no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar - tiene dependencias',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.countriesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @ApiOperation({
    summary: 'Cambiar estado activo/inactivo',
    description: 'Alterna el estado activo de un país',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del país',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del país cambiado exitosamente',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'País no encontrado' })
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CountryResponseDto> {
    return this.countriesService.toggleActiveStatus(id);
  }

  @Post('bulk-import')
  @RequirePermissions(AdminPermission.GEOGRAPHY_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Importar países desde archivo CSV',
    description:
      'Carga masiva de países desde un archivo CSV con validación y manejo de errores',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo CSV con datos de países',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV con los países a importar',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Importación completada exitosamente',
    type: BulkImportResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o datos incorrectos',
  })
  async bulkImportCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkImportResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      return await this.countriesService.bulkImportCsv(file.buffer);
    } catch (error) {
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }
}
