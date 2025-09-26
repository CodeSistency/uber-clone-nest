import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
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
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { DriverManagementService } from '../services/driver-management.service';
import {
  GetDriversQueryDto,
  UpdateDriverStatusDto,
  UpdateDriverVerificationDto,
  UpdateDriverWorkZonesDto,
  BulkUpdateDriverStatusDto,
  DriverListResponseDto,
  DriverDetailsDto,
} from '../dtos/driver-management.dto';

@ApiTags('Admin Driver Management')
@Controller('admin/drivers')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DriverManagementController {
  constructor(
    private readonly driverManagementService: DriverManagementService,
  ) {}

  @Get()
  @RequirePermissions(AdminPermission.DRIVERS_READ)
  @ApiOperation({
    summary: 'Listar drivers con filtros',
    description:
      'Obtiene una lista paginada de drivers con filtros avanzados para administración',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de drivers obtenida exitosamente',
    type: DriverListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async getDrivers(
    @Query() query: GetDriversQueryDto,
  ): Promise<DriverListResponseDto> {
    const filters = {
      status: query.status,
      verificationStatus: query.verificationStatus,
      canDoDeliveries: query.canDoDeliveries,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      minRating: query.minRating,
      maxRating: query.maxRating,
      minRides: query.minRides,
      maxRides: query.maxRides,
      minEarnings: query.minEarnings,
      maxEarnings: query.maxEarnings,
      search: query.search,
      zoneId: query.zoneId,
    };

    return this.driverManagementService.getDriversWithFilters(
      filters,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.DRIVERS_READ)
  @ApiOperation({
    summary: 'Obtener detalles de un driver',
    description:
      'Obtiene información completa de un driver específico incluyendo documentos, vehículos, estadísticas, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del driver',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del driver obtenidos exitosamente',
    type: DriverDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver no encontrado',
  })
  async getDriverDetails(
    @Param('id', ParseIntPipe) driverId: number,
  ): Promise<DriverDetailsDto> {
    const details =
      await this.driverManagementService.getDriverDetails(driverId);

    // Format the response
    return {
      basic: {
        id: details.id,
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone,
        dateOfBirth: details.dateOfBirth,
        gender: details.gender,
        status: details.status,
        verificationStatus: details.verificationStatus,
        canDoDeliveries: details.canDoDeliveries,
        lastActive: details.lastActive,
        createdAt: details.createdAt,
      },
      stats: {
        averageRating: details.averageRating,
        totalRides: details.totalRides,
        completedRides: details.completedRides,
        cancelledRides: details.cancelledRides,
        totalEarnings: details.totalEarnings,
        completionRate: details.completionRate,
      },
      address: details.address,
      documents: details.documents,
      vehicles: details.vehicles,
      currentWorkZone: details.currentWorkZone,
      paymentMethods: details.paymentMethods,
      recentRides: details.recentRides,
      performanceStats: details.performanceStats,
    };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.DRIVERS_SUSPEND)
  @ApiOperation({
    summary: 'Actualizar estado de driver',
    description:
      'Cambia el estado de un driver (online/offline/busy/suspended) con posibilidad de suspensión temporal',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del driver',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del driver actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver no encontrado',
  })
  async updateDriverStatus(
    @Param('id', ParseIntPipe) driverId: number,
    @Body() statusDto: UpdateDriverStatusDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.driverManagementService.updateDriverStatus(
      driverId,
      statusDto.status,
      adminId,
      statusDto.reason,
      statusDto.suspensionEndDate
        ? new Date(statusDto.suspensionEndDate)
        : undefined,
    );
  }

  @Put(':id/verification')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.DRIVERS_VERIFY)
  @ApiOperation({
    summary: 'Actualizar verificación de driver',
    description:
      'Cambia el estado de verificación de un driver (pending/approved/rejected/under_review)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del driver',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación del driver actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver no encontrado',
  })
  async updateDriverVerification(
    @Param('id', ParseIntPipe) driverId: number,
    @Body() verificationDto: UpdateDriverVerificationDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.driverManagementService.updateDriverVerification(
      driverId,
      verificationDto.verificationStatus,
      adminId,
      verificationDto.notes,
    );
  }

  @Put(':id/work-zones')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.DRIVERS_WRITE)
  @ApiOperation({
    summary: 'Actualizar zonas de trabajo',
    description:
      'Asigna nuevas zonas de trabajo a un driver con posibilidad de zona primaria',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del driver',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Zonas de trabajo actualizadas exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver no encontrado',
  })
  async updateDriverWorkZones(
    @Param('id', ParseIntPipe) driverId: number,
    @Body() workZonesDto: UpdateDriverWorkZonesDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.driverManagementService.updateDriverWorkZones(
      driverId,
      workZonesDto.zoneIds,
      adminId,
      workZonesDto.primaryZoneId,
    );
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.DRIVERS_SUSPEND)
  @ApiOperation({
    summary: 'Actualizar estado de múltiples drivers',
    description: 'Cambia el estado de múltiples drivers en una operación bulk',
  })
  @ApiResponse({
    status: 200,
    description: 'Estados de drivers actualizados exitosamente',
  })
  async bulkUpdateDriverStatus(
    @Body() bulkDto: BulkUpdateDriverStatusDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.driverManagementService.bulkUpdateDriverStatus(
      bulkDto.driverIds,
      bulkDto.status,
      adminId,
      bulkDto.reason,
    );
  }
}
