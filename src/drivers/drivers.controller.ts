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

@ApiTags('drivers')
@Controller('api/driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all drivers with advanced filtering',
    description:
      'Retrieve drivers with optional filters for status, location, and verification',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by driver status',
    required: false,
    example: 'online',
  })
  @ApiQuery({
    name: 'verified',
    description: 'Filter by verification status',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'lat',
    description: 'Filter by latitude (for location-based queries)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Filter by longitude (for location-based queries)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers',
    required: false,
    type: Number,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of driver objects',
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
              status: { type: 'string' },
              verificationStatus: { type: 'string' },
              carModel: { type: 'string' },
              licensePlate: { type: 'string' },
              carSeats: { type: 'number' },
              currentLat: { type: 'number' },
              currentLng: { type: 'number' },
              lastLocationUpdate: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getAllDrivers(
    @Query('status') status?: string,
    @Query('verified') verified?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ): Promise<{ data: Driver[]; total: number }> {
    const filters = {
      status,
      verified: verified ? verified === 'true' : undefined,
      location:
        lat && lng
          ? {
              lat: Number(lat),
              lng: Number(lng),
              radius: Number(radius) || 5,
            }
          : undefined,
    };

    const drivers = await this.driversService.findAllDrivers(filters);
    return {
      data: drivers,
      total: drivers.length,
    };
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
  @Post()
  @ApiOperation({
    summary: 'Create driver (Legacy)',
    description:
      'Legacy endpoint for driver creation. Consider using /register instead.',
    deprecated: true,
  })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  async createDriver(@Body() data: any): Promise<Driver> {
    return this.driversService.createDriver(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({ status: 200, description: 'Driver found' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findDriverById(@Param('id') id: string): Promise<Driver | null> {
    return this.driversService.findDriverById(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update driver (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateDriver(
    @Param('id') id: string,
    @Body() data: any,
  ): Promise<Driver> {
    return this.driversService.updateDriver(Number(id), data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete driver (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({ status: 200, description: 'Driver deleted successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async deleteDriver(@Param('id') id: string): Promise<Driver> {
    return this.driversService.deleteDriver(Number(id));
  }

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
