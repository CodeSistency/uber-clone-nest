import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
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
  @ApiOperation({ summary: 'Get all drivers' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of driver objects',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getAllDrivers(): Promise<{ data: Driver[] }> {
    const drivers = await this.driversService.findAllDrivers();
    return { data: drivers };
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
    description: 'Update the online/offline/busy status of a driver'
  })
  @ApiParam({
    name: 'driverId',
    description: 'The unique ID of the driver',
    example: '1',
    type: Number
  })
  @ApiBody({
    type: UpdateDriverStatusDto,
    description: 'New status for the driver'
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
        license_plate: { type: 'string', example: 'ABC-1234' }
      }
    }
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
    description: 'Legacy endpoint for driver creation. Consider using /register instead.',
    deprecated: true
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

  @Get(':id/rides')
  @ApiOperation({ summary: 'Get driver rides (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Driver rides retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' }
    }
  })
  async getDriverRides(@Param('id') id: string): Promise<any[]> {
    return this.driversService.getDriverRides(Number(id));
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get driver delivery orders (Legacy)' })
  @ApiParam({ name: 'id', description: 'Driver ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Driver orders retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' }
    }
  })
  async getDriverDeliveryOrders(@Param('id') id: string): Promise<any[]> {
    return this.driversService.getDriverDeliveryOrders(Number(id));
  }
}
