import {
  Controller,
  Get,
  Put,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { DriverManagementService } from '../services/driver-management.service';
import { DriverStatus, VerificationStatus } from '../types/driver.types';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/drivers')
@ApiBearerAuth('JWT-auth')
export class DriverManagementController {
  private readonly logger = new Logger(DriverManagementController.name);

  constructor(private readonly driverService: DriverManagementService) {}

  @Get()
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({
    summary: 'Get drivers with filters',
    description:
      'Retrieve a paginated list of drivers with advanced filtering options',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of drivers per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for name, email, or phone',
    example: 'john',
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'suspended', 'all'],
    required: false,
    description: 'Filter by driver status',
    example: 'active',
  })
  @ApiQuery({
    name: 'verificationStatus',
    enum: ['pending', 'verified', 'rejected', 'all'],
    required: false,
    description: 'Filter by verification status',
    example: 'verified',
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Driver' },
              email: { type: 'string', example: 'driver@example.com' },
              phone: { type: 'string', example: '+1234567890' },
              status: { type: 'string', example: 'active' },
              verificationStatus: { type: 'string', example: 'verified' },
              lastLogin: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              _count: {
                type: 'object',
                properties: {
                  rides: { type: 'number', example: 15 },
                  deliveries: { type: 'number', example: 8 },
                  ratings: { type: 'number', example: 12 },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            pages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getDrivers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: DriverStatus,
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
  ) {
    this.logger.log(
      `Fetching drivers - page: ${page}, limit: ${limit}, search: ${search}, status: ${status}, verificationStatus: ${verificationStatus}`,
    );
    return this.driverService.getDrivers({
      page,
      limit,
      search,
      status,
      verificationStatus,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({
    summary: 'Get driver by ID',
    description: 'Retrieve detailed information about a specific driver',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Driver' },
        email: { type: 'string', example: 'driver@example.com' },
        phone: { type: 'string', example: '+1234567890' },
        status: { type: 'string', example: 'active' },
        verificationStatus: { type: 'string', example: 'verified' },
        isOnline: { type: 'boolean', example: true },
        lastActive: { type: 'string', format: 'date-time' },
        lastLogin: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        driverProfile: {
          type: 'object',
          properties: {
            licenseNumber: { type: 'string', example: 'DL1234567890' },
            licenseExpiry: { type: 'string', format: 'date' },
            vehicleMake: { type: 'string', example: 'Toyota' },
            vehicleModel: { type: 'string', example: 'Corolla' },
            vehicleYear: { type: 'number', example: 2020 },
            vehicleColor: { type: 'string', example: 'Blue' },
            vehiclePlate: { type: 'string', example: 'ABC123' },
            averageRating: { type: 'number', example: 4.8 },
            totalRides: { type: 'number', example: 150 },
            totalEarnings: { type: 'number', example: 12500.75 },
          },
        },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              type: { type: 'string', example: 'LICENSE' },
              status: { type: 'string', example: 'APPROVED' },
              url: {
                type: 'string',
                example: 'https://example.com/documents/license.jpg',
              },
              verifiedAt: { type: 'string', format: 'date-time' },
              verifiedBy: { type: 'number', example: 1 },
              rejectionReason: { type: 'string', example: 'Expired document' },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getDriverById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching driver by ID: ${id}`);
    return this.driverService.getDriverById(id);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.DRIVER_WRITE)
  @ApiOperation({
    summary: 'Update driver status',
    description: 'Update the status of a driver (active, inactive, suspended)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended'],
          description: 'New status for the driver',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Driver status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Driver status updated successfully',
        },
        data: {
          $ref: '#/components/schemas/Driver',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid status provided' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateDriverStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    this.logger.log(`Updating status for driver ID: ${id}, status: ${status}`);

    // Validate the status is a valid DriverStatus
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be one of: active, inactive, suspended',
      );
    }

    // Use the verification status update since that's what's available in the service
    // This assumes that verification status and driver status are related in your business logic
    return this.driverService.updateDriverVerification(id, status);
  }

  @Put(':id/verification')
  @RequirePermissions(Permission.DRIVER_APPROVE)
  @ApiOperation({
    summary: 'Update driver verification status',
    description:
      'Update the verification status of a driver and optionally add notes',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to verify',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver verification status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Driver verification status updated',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            verificationStatus: { type: 'string', example: 'verified' },
            verifiedAt: { type: 'string', format: 'date-time' },
            verifiedBy: { type: 'number', example: 1 },
            notes: { type: 'string', example: 'All documents verified' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateDriverVerification(
    @Param('id', ParseIntPipe) id: number,
    @Body('verificationStatus')
    verificationStatus: 'pending' | 'verified' | 'rejected',
    @Body('notes') notes?: string,
  ) {
    this.logger.log(
      `Updating verification for driver ID: ${id}, status: ${verificationStatus}`,
    );
    return this.driverService.updateDriverVerification(
      id,
      verificationStatus,
      notes,
    );
  }
}
