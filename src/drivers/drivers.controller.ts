import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { Driver, DriverDocument } from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDriverStatusDto } from './dto/update-status.dto';
import { SearchDriversDto } from './dto/search-drivers.dto';
import { PaginatedDriversResponseDto } from './dto/paginated-drivers-response.dto';

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
    - carModel: Búsqueda por modelo de carro
    - licensePlate: Búsqueda por placa
    - status: Estado del conductor ('online', 'offline', 'busy', 'unavailable')
    - verificationStatus: Estado de verificación ('pending', 'approved', 'rejected', 'under_review')
    - canDoDeliveries: Puede hacer entregas (true/false)
    - carSeats: Número de asientos
    - vehicleTypeId: ID del tipo de vehículo
    - createdFrom/createdTo: Rango de fechas de creación
    - updatedFrom/updatedTo: Rango de fechas de actualización
    - sortBy/sortOrder: Ordenamiento personalizado
    - page/limit: Paginación
    `
  })
  @ApiQuery({
    type: SearchDriversDto,
    description: 'Parámetros de búsqueda y paginación'
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
              carModel: { type: 'string' },
              licensePlate: { type: 'string' },
              carSeats: { type: 'number' },
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
                }
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
                  }
                }
              },
              _count: {
                type: 'object',
                properties: {
                  rides: { type: 'number' },
                  deliveryOrders: { type: 'number' },
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        },
        filters: {
          type: 'object',
          properties: {
            applied: {
              type: 'array',
              items: { type: 'string' }
            },
            searchTerm: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parámetros de búsqueda inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async searchDrivers(@Query() searchDto: SearchDriversDto): Promise<PaginatedDriversResponseDto> {
    return this.driversService.searchDrivers(searchDto);
  }

  @Get('id/:id')
  @ApiOperation({
    summary: 'Buscar conductor específico por ID',
    description: 'Busca un conductor específico por su ID único'
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
        carModel: { type: 'string' },
        licensePlate: { type: 'string' },
        carSeats: { type: 'number' },
        status: { type: 'string' },
        verificationStatus: { type: 'string' },
        canDoDeliveries: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        vehicleType: { type: 'object' },
        documents: { type: 'array' },
      }
    }
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
    summary: 'Update driver availability status',
    description: 'Update the online/offline/busy status of a driver',
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
    return this.driversService.updateDriverStatus(
      Number(driverId),
      body.status,
    );
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
}
