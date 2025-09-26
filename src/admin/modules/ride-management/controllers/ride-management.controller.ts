import {
  Controller,
  Get,
  Post,
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

import { RideManagementService } from '../services/ride-management.service';
import {
  GetRidesQueryDto,
  ReassignRideDto,
  CancelRideDto,
  CompleteRideDto,
  RideListResponseDto,
  RideDetailsDto,
} from '../dtos/ride-management.dto';

@ApiTags('Admin Ride Management')
@Controller('admin/rides')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class RideManagementController {
  constructor(private readonly rideManagementService: RideManagementService) {}

  @Get()
  @RequirePermissions(AdminPermission.RIDES_READ)
  @ApiOperation({
    summary: 'Listar rides con filtros',
    description:
      'Obtiene una lista paginada de rides con filtros avanzados para administración',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rides obtenida exitosamente',
    type: RideListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async getRides(
    @Query() query: GetRidesQueryDto,
  ): Promise<RideListResponseDto> {
    const filters = {
      status: query.status,
      driverId: query.driverId,
      userId: query.userId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      minFare: query.minFare,
      maxFare: query.maxFare,
      originAddress: query.originAddress,
      destinationAddress: query.destinationAddress,
    };

    return this.rideManagementService.getRidesWithFilters(
      filters,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.RIDES_READ)
  @ApiOperation({
    summary: 'Obtener detalles de un ride',
    description:
      'Obtiene información completa de un ride específico incluyendo driver, user, mensajes, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del ride',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del ride obtenidos exitosamente',
    type: RideDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ride no encontrado',
  })
  async getRideDetails(
    @Param('id', ParseIntPipe) rideId: number,
  ): Promise<RideDetailsDto> {
    const details = await this.rideManagementService.getRideDetails(rideId);

    // Format the response
    return {
      basic: {
        id: details.id,
        rideId: details.rideId,
        status: details.status,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
        rideTime: details.rideTime,
        farePrice: details.farePrice,
        paymentStatus: details.paymentStatus,
      },
      locations: {
        originAddress: details.originAddress,
        destinationAddress: details.destinationAddress,
        originLatitude: details.originLatitude,
        originLongitude: details.originLongitude,
        destinationLatitude: details.destinationLatitude,
        destinationLongitude: details.destinationLongitude,
      },
      driver: details.driver,
      user: details.user,
      tier: details.tier,
      ratings: details.ratings || [],
      messages: details.messages || [],
      recentLocations: details.locationHistory || [],
    };
  }

  @Post(':id/reassign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.RIDES_REASSIGN)
  @ApiOperation({
    summary: 'Reasignar ride a otro driver',
    description:
      'Permite a un administrador reasignar un ride de un driver a otro',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del ride a reasignar',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Ride reasignado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Ride o driver no encontrado',
  })
  @ApiResponse({
    status: 400,
    description:
      'El ride no puede ser reasignado o el driver no está disponible',
  })
  async reassignRide(
    @Param('id', ParseIntPipe) rideId: number,
    @Body() reassignDto: ReassignRideDto,
    // In a real implementation, you'd get the admin ID from the JWT token
    // @Req() req: Request
  ): Promise<any> {
    // For now, using a mock admin ID - in production this would come from JWT
    const adminId = 1; // This should come from the authenticated admin

    return this.rideManagementService.reassignRide(
      rideId,
      reassignDto.newDriverId,
      adminId,
      reassignDto.reason,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.RIDES_CANCEL)
  @ApiOperation({
    summary: 'Cancelar ride administrativamente',
    description:
      'Permite a un administrador cancelar un ride con opción de reembolso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del ride a cancelar',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Ride cancelado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Ride no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'El ride no puede ser cancelado',
  })
  async cancelRide(
    @Param('id', ParseIntPipe) rideId: number,
    @Body() cancelDto: CancelRideDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.rideManagementService.cancelRide(
      rideId,
      adminId,
      cancelDto.reason,
      cancelDto.refundAmount,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.RIDES_WRITE)
  @ApiOperation({
    summary: 'Completar ride manualmente',
    description:
      'Permite a un administrador marcar un ride como completado manualmente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del ride a completar',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Ride completado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Ride no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'El ride no puede ser completado',
  })
  async completeRideManually(
    @Param('id', ParseIntPipe) rideId: number,
    @Body() completeDto: CompleteRideDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.rideManagementService.completeRideManually(
      rideId,
      adminId,
      completeDto.reason,
    );
  }
}
