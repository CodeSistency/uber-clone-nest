import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { Driver, DriverDocument } from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

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
          items: { type: 'object' }
        }
      }
    }
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
  async registerDriver(@Body() registerDriverDto: RegisterDriverDto): Promise<Driver> {
    return this.driversService.registerDriver(registerDriverDto);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload verification document for driver' })
  @ApiBody({ type: UploadDocumentDto })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async uploadDocument(@Body() uploadDocumentDto: UploadDocumentDto): Promise<DriverDocument> {
    return this.driversService.uploadDocument(uploadDocumentDto);
  }

  @Put(':driverId/status')
  @ApiOperation({ summary: 'Update driver availability status' })
  @ApiParam({ name: 'driverId', description: 'The unique ID of the driver' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'online' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Missing or invalid status' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updateDriverStatus(
    @Param('driverId') driverId: string,
    @Body() body: { status: string }
  ): Promise<Driver> {
    return this.driversService.updateDriverStatus(Number(driverId), body.status);
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
              tier_name: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideRequests(): Promise<{ data: any[] }> {
    const rideRequests = await this.driversService.getRideRequests();
    return { data: rideRequests };
  }

  // Legacy endpoints for backward compatibility
  @Post()
  async createDriver(@Body() data: any): Promise<Driver> {
    return this.driversService.createDriver(data);
  }

  @Get(':id')
  async findDriverById(@Param('id') id: string): Promise<Driver | null> {
    return this.driversService.findDriverById(Number(id));
  }

  @Put(':id')
  async updateDriver(@Param('id') id: string, @Body() data: any): Promise<Driver> {
    return this.driversService.updateDriver(Number(id), data);
  }

  @Delete(':id')
  async deleteDriver(@Param('id') id: string): Promise<Driver> {
    return this.driversService.deleteDriver(Number(id));
  }

  @Get(':id/rides')
  async getDriverRides(@Param('id') id: string): Promise<any[]> {
    return this.driversService.getDriverRides(Number(id));
  }

  @Get(':id/orders')
  async getDriverDeliveryOrders(@Param('id') id: string): Promise<any[]> {
    return this.driversService.getDriverDeliveryOrders(Number(id));
  }
}
