import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { Driver, DriverDocument } from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { SearchDriversDto } from './dto/search-drivers.dto';
import { PaginatedDriversResponseDto } from './dto/paginated-drivers-response.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UploadVehicleDocumentDto } from './dto/upload-vehicle-document.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { VerifyDriverDto } from './dto/verify-driver.dto';
import { CreateDriverPaymentDto } from './dto/driver-payment.dto';
import { AssignWorkZoneDto } from './dto/work-zone.dto';
import {
  DriverStatisticsDto,
  DriverStatsSummaryDto,
} from './dto/driver-statistics.dto';
import { DriverProfileDto } from './dto/driver-profile.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';

@ApiTags('drivers')
@Controller('api/driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar conductores con filtros avanzados y paginación',
    description: `
    Endpoint flexible para buscar conductores con múltiples filtros y paginación.
    Si no se proporcionan parámetros de búsqueda, devuelve todos los conductores paginados.

    Filtros disponibles:
    - firstName/lastName: Búsqueda parcial por nombre/apellido
    - carModel: Búsqueda por modelo de vehículo (en vehículos asociados al conductor)
    - licensePlate: Búsqueda por placa de vehículo (en vehículos asociados al conductor)
    - status: Estado del conductor ('online', 'offline', 'busy', 'unavailable')
    - verificationStatus: Estado de verificación ('pending', 'approved', 'rejected', 'under_review')
    - canDoDeliveries: Puede hacer entregas (true/false)
    - carSeats: Número de asientos del vehículo (en vehículos asociados al conductor)
    - vehicleTypeId: ID del tipo de vehículo (en vehículos asociados al conductor)
    - createdFrom/createdTo: Rango de fechas de creación
    - updatedFrom/updatedTo: Rango de fechas de actualización
    - sortBy/sortOrder: Ordenamiento personalizado
    - page/limit: Paginación
    `,
  })
  @ApiQuery({
    type: SearchDriversDto,
    description: 'Parámetros de búsqueda y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Conductores encontrados exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              profileImageUrl: { type: 'string' },
              // Vehicle information comes from associated Vehicle records
              vehicleInfo: {
                type: 'object',
                description: 'Vehicle information from associated vehicles',
                properties: {
                  make: { type: 'string' },
                  model: { type: 'string' },
                  licensePlate: { type: 'string' },
                  seatingCapacity: { type: 'number' },
                },
              },
              status: { type: 'string' },
              verificationStatus: { type: 'string' },
              canDoDeliveries: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              vehicleType: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  displayName: { type: 'string' },
                },
              },
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    documentType: { type: 'string' },
                    verificationStatus: { type: 'string' },
                    uploadedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  rides: { type: 'number' },
                  deliveryOrders: { type: 'number' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        filters: {
          type: 'object',
          properties: {
            applied: {
              type: 'array',
              items: { type: 'string' },
            },
            searchTerm: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros de búsqueda inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async searchDrivers(
    @Query() searchDto: SearchDriversDto,
  ): Promise<PaginatedDriversResponseDto> {
    return this.driversService.searchDrivers(searchDto);
  }

  @Get('id/:id')
  @ApiOperation({
    summary: 'Buscar conductor específico por ID',
    description: 'Busca un conductor específico por su ID único',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del conductor',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        profileImageUrl: { type: 'string' },
        // Vehicle information comes from associated Vehicle records
        vehicles: {
          type: 'array',
          description: 'List of vehicles associated with this driver',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              make: { type: 'string' },
              model: { type: 'string' },
              licensePlate: { type: 'string' },
              seatingCapacity: { type: 'number' },
              status: { type: 'string' },
              isDefault: { type: 'boolean' },
            },
          },
        },
        status: { type: 'string' },
        verificationStatus: { type: 'string' },
        canDoDeliveries: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        vehicleType: { type: 'object' },
        documents: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findDriverById(@Param('id') id: string): Promise<Driver | null> {
    return this.driversService.findDriverById(Number(id));
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver' })
  @ApiBody({ type: RegisterDriverDto })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async registerDriver(
    @Body() registerDriverDto: RegisterDriverDto,
  ): Promise<Driver> {
    return this.driversService.registerDriver(registerDriverDto);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload verification document for driver' })
  @ApiBody({ type: UploadDocumentDto })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async uploadDocument(
    @Body() uploadDocumentDto: UploadDocumentDto,
  ): Promise<DriverDocument> {
    return this.driversService.uploadDocument(uploadDocumentDto);
  }

  @Put(':driverId/status')
  @ApiOperation({
    summary: '👑 Update driver availability status (Para administradores)',
    description: `
    **IMPORTANTE:** Este endpoint es para ADMINISTRADORES que quieren cambiar el status de CUALQUIER conductor.

    **¿Para qué sirve?**
    Permite a un administrador cambiar el estado de disponibilidad de cualquier conductor.

    **¿Cómo funciona?**
    - Requiere permisos de administrador
    - El driverId debe especificarse en la URL
    - Útil para soporte técnico o gestión de conductores

    **⚠️ NOTA:** Si eres un CONDUCTOR y quieres cambiar TU PROPIO status, usa:
    \`POST /rides/flow/driver/availability\`
    `,
  })
  @ApiParam({
    name: 'driverId',
    description: 'The unique ID of the driver',
    example: '1',
    type: Number,
  })
  @ApiBody({
    type: UpdateDriverStatusDto,
    description: 'New status for the driver',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        first_name: { type: 'string', example: 'Alex' },
        last_name: { type: 'string', example: 'Rodriguez' },
        email: { type: 'string', example: 'alex@example.com' },
        status: { type: 'string', example: 'online' },
        car_model: { type: 'string', example: 'Toyota Camry' },
        license_plate: { type: 'string', example: 'ABC-1234' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid status' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updateDriverStatus(
    @Param('driverId') driverId: string,
    @Body() body: UpdateDriverStatusDto,
  ): Promise<Driver> {
    return this.driversService.updateDriverStatus(Number(driverId), body);
  }

  @Get('ride-requests')
  @ApiOperation({ summary: 'Get available ride requests for online driver' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of available ride requests',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ride_id: { type: 'number' },
              origin_address: { type: 'string' },
              destination_address: { type: 'string' },
              fare_price: { type: 'string' },
              tier_name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideRequests(): Promise<{ data: any[] }> {
    const rideRequests = await this.driversService.getRideRequests();
    return { data: rideRequests };
  }

  // Legacy endpoints for backward compatibility

  @Get(':driverId/rides')
  @ApiOperation({
    summary: 'Get driver rides history with advanced filtering',
    description:
      'Retrieve complete ride history for a driver with earnings calculation and ratings',
  })
  @ApiParam({
    name: 'driverId',
    description: 'The unique ID of the driver',
    type: Number,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by ride status',
    required: false,
    example: 'completed',
  })
  @ApiQuery({
    name: 'dateFrom',
    description: 'Filter rides from date (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    description: 'Filter rides to date (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of rides to return',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of rides to skip',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver rides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rideId: { type: 'number' },
              originAddress: { type: 'string' },
              destinationAddress: { type: 'string' },
              farePrice: { type: 'number' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time' },
              distance: { type: 'number' },
              duration: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  clerkId: { type: 'string' },
                },
              },
              ratings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ratingValue: { type: 'number' },
                    comment: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalRides: { type: 'number' },
            totalEarnings: { type: 'number' },
            averageRating: { type: 'number' },
            completedRides: { type: 'number' },
            cancelledRides: { type: 'number' },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getDriverRides(
    @Param('driverId') driverId: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<any> {
    const filters = {
      status,
      dateFrom,
      dateTo,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    };

    return this.driversService.getDriverRides(Number(driverId), filters);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get driver delivery orders (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Driver orders retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  async getDriverDeliveryOrders(@Param('id') id: string): Promise<any[]> {
    return this.driversService.getDriverDeliveryOrders(Number(id));
  }

  // =========================================
  // DRIVER PROFILE MANAGEMENT
  // =========================================

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get complete driver profile',
    description:
      'Retrieve comprehensive driver profile with statistics, vehicles, payment methods, and work zones',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver profile retrieved successfully',
    type: DriverProfileDto,
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async getDriverProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DriverProfileDto> {
    return this.driversService.getDriverProfile(id);
  }

  @Put('profile/:id')
  @ApiOperation({
    summary: 'Update driver profile',
    description: 'Update driver personal and professional information',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: UpdateDriverProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Driver profile updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async updateDriverProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDriverProfileDto,
  ): Promise<Driver> {
    return this.driversService.updateDriverProfile(id, updateDto);
  }

  // =========================================
  // VEHICLE MANAGEMENT
  // =========================================

  @Post(':driverId/vehicles')
  @ApiOperation({
    summary: 'Create vehicle for driver',
    description: 'Add a new vehicle to a driver profile',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created successfully',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async createVehicle(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() createDto: CreateVehicleDto,
  ): Promise<any> {
    return this.driversService.createVehicle(driverId, createDto);
  }

  @Get(':driverId/vehicles')
  @ApiOperation({
    summary: 'Get driver vehicles',
    description: 'Retrieve all vehicles associated with a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
  })
  async getDriverVehicles(
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<any[]> {
    return this.driversService.getDriverVehicles(driverId);
  }

  @Put('vehicles/:vehicleId')
  @ApiOperation({
    summary: 'Update vehicle',
    description: 'Update vehicle information',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'Vehicle ID',
    example: 1,
  })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  async updateVehicle(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() updateDto: UpdateVehicleDto,
  ): Promise<any> {
    return this.driversService.updateVehicle(vehicleId, updateDto);
  }

  @Delete('vehicles/:vehicleId')
  @ApiOperation({
    summary: 'Delete vehicle',
    description: 'Remove a vehicle from driver profile',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'Vehicle ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete vehicle with active rides',
  })
  async deleteVehicle(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
  ): Promise<void> {
    return this.driversService.deleteVehicle(vehicleId);
  }

  @Post('vehicles/documents')
  @ApiOperation({
    summary: 'Upload vehicle document',
    description: 'Upload verification documents for a vehicle',
  })
  @ApiBody({ type: UploadVehicleDocumentDto })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
  })
  async uploadVehicleDocument(
    @Body() uploadDto: UploadVehicleDocumentDto,
  ): Promise<any> {
    return this.driversService.uploadVehicleDocument(uploadDto);
  }

  // =========================================
  // PAYMENT METHODS MANAGEMENT
  // =========================================

  @Post(':driverId/payment-methods')
  @ApiOperation({
    summary: 'Create payment method',
    description: 'Add a payment method for driver earnings',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ApiResponse({
    status: 201,
    description: 'Payment method created successfully',
  })
  async createPaymentMethod(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() createDto: CreatePaymentMethodDto,
  ): Promise<any> {
    return this.driversService.createPaymentMethod(driverId, createDto);
  }

  @Get(':driverId/payment-methods')
  @ApiOperation({
    summary: 'Get driver payment methods',
    description: 'Retrieve all payment methods for a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  async getDriverPaymentMethods(
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<any[]> {
    return this.driversService.getDriverPaymentMethods(driverId);
  }

  @Put('payment-methods/:methodId')
  @ApiOperation({
    summary: 'Update payment method',
    description: 'Update payment method information',
  })
  @ApiParam({
    name: 'methodId',
    description: 'Payment method ID',
    example: 1,
  })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
  })
  async updatePaymentMethod(
    @Param('methodId', ParseIntPipe) methodId: number,
    @Body() updateDto: Partial<CreatePaymentMethodDto>,
  ): Promise<any> {
    return this.driversService.updatePaymentMethod(methodId, updateDto);
  }

  @Delete('payment-methods/:methodId')
  @ApiOperation({
    summary: 'Delete payment method',
    description: 'Remove a payment method',
  })
  @ApiParam({
    name: 'methodId',
    description: 'Payment method ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted successfully',
  })
  async deletePaymentMethod(
    @Param('methodId', ParseIntPipe) methodId: number,
  ): Promise<void> {
    return this.driversService.deletePaymentMethod(methodId);
  }

  // =========================================
  // DRIVER VERIFICATION
  // =========================================

  @Put(':driverId/verification')
  @ApiOperation({
    summary: 'Update driver verification status',
    description:
      'Approve, reject, or request additional documents for driver verification',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: VerifyDriverDto })
  @ApiResponse({
    status: 200,
    description: 'Driver verification status updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async verifyDriver(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() verifyDto: VerifyDriverDto,
  ): Promise<Driver> {
    // TODO: Get admin ID from request context
    const adminId = 1; // Placeholder
    return this.driversService.verifyDriver(driverId, verifyDto, adminId);
  }

  // =========================================
  // WORK ZONE MANAGEMENT
  // =========================================

  @Post(':driverId/work-zones')
  @ApiOperation({
    summary: 'Assign work zone to driver',
    description: 'Assign a work zone to a driver for ride assignments',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: AssignWorkZoneDto })
  @ApiResponse({
    status: 201,
    description: 'Work zone assigned successfully',
  })
  async assignWorkZone(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() assignDto: AssignWorkZoneDto,
  ): Promise<any> {
    // TODO: Get admin ID from request context
    const adminId = 1; // Placeholder
    return this.driversService.assignWorkZone(driverId, assignDto, adminId);
  }

  @Delete(':driverId/work-zones/:zoneId')
  @ApiOperation({
    summary: 'Remove work zone from driver',
    description: 'Remove a work zone assignment from a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Work zone ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Work zone removed successfully',
  })
  async removeWorkZone(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Param('zoneId', ParseIntPipe) zoneId: number,
  ): Promise<void> {
    return this.driversService.removeWorkZone(driverId, zoneId);
  }

  // =========================================
  // DRIVER PAYMENTS
  // =========================================

  @Post(':driverId/payments')
  @ApiOperation({
    summary: 'Create driver payment',
    description: 'Record a payment or earnings for a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiBody({ type: CreateDriverPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Driver payment created successfully',
  })
  async createDriverPayment(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() createDto: CreateDriverPaymentDto,
  ): Promise<any> {
    return this.driversService.createDriverPayment({ ...createDto, driverId });
  }

  @Get(':driverId/payments')
  @ApiOperation({
    summary: 'Get driver payments',
    description: 'Retrieve payment history for a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'paymentType',
    required: false,
    description: 'Filter by payment type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver payments retrieved successfully',
  })
  async getDriverPayments(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Query() query: any,
  ): Promise<any> {
    return this.driversService.getDriverPayments(driverId, query);
  }

  @Put('payments/:paymentId/process')
  @ApiOperation({
    summary: 'Process driver payment',
    description: 'Mark a driver payment as processed',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'Payment ID',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', example: 'txn_1234567890' },
        notes: { type: 'string', example: 'Payment processed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
  })
  async processDriverPayment(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() body: { transactionId?: string; notes?: string },
  ): Promise<any> {
    return this.driversService.processDriverPayment(
      paymentId,
      body.transactionId,
      body.notes,
    );
  }

  // =========================================
  // STATISTICS AND METRICS
  // =========================================

  @Get(':driverId/statistics')
  @ApiOperation({
    summary: 'Get driver statistics',
    description: 'Retrieve comprehensive statistics and metrics for a driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver statistics retrieved successfully',
    type: DriverStatisticsDto,
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async getDriverStatistics(
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<DriverStatisticsDto> {
    return this.driversService.getDriverStatistics(driverId);
  }

  @Get('statistics/summary')
  @ApiOperation({
    summary: 'Get drivers statistics summary',
    description: 'Retrieve overall statistics for all drivers',
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers statistics summary retrieved successfully',
    type: DriverStatsSummaryDto,
  })
  async getDriversStatsSummary(): Promise<DriverStatsSummaryDto> {
    return this.driversService.getDriversStatsSummary();
  }

  // =========================================
  // BULK OPERATIONS
  // =========================================

  @Post('bulk/verify')
  @ApiOperation({
    summary: 'Bulk verify drivers',
    description: 'Verify multiple drivers at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        driverIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['1', '2', '3'],
        },
        verificationStatus: {
          type: 'string',
          enum: ['approved', 'rejected'],
          example: 'approved',
        },
        reason: {
          type: 'string',
          example: 'Bulk verification after document review',
        },
      },
      required: ['driverIds', 'verificationStatus'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers verified successfully',
  })
  async bulkVerifyDrivers(
    @Body()
    body: {
      driverIds: string[];
      verificationStatus: string;
      reason?: string;
    },
  ): Promise<any> {
    // TODO: Get admin ID from request context
    const adminId = 1; // Placeholder
    return this.driversService.bulkVerifyDrivers(
      body.driverIds,
      body.verificationStatus,
      body.reason,
      adminId,
    );
  }

  @Post('bulk/status')
  @ApiOperation({
    summary: 'Bulk update driver status',
    description: 'Update status for multiple drivers at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        driverIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['1', '2', '3'],
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended'],
          example: 'active',
        },
        reason: {
          type: 'string',
          example: 'Bulk status update',
        },
      },
      required: ['driverIds', 'status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Driver statuses updated successfully',
  })
  async bulkUpdateStatus(
    @Body() body: { driverIds: string[]; status: string; reason?: string },
  ): Promise<any> {
    // TODO: Get admin ID from request context
    const adminId = 1; // Placeholder
    return this.driversService.bulkUpdateStatus(
      body.driverIds,
      body.status,
      body.reason,
      adminId,
    );
  }
}
