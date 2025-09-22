import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
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
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { RideManagementService } from '../services/ride-management.service';
import { FormattedRide } from '../services/ride-management.service';

type RideStatus = 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'all';

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'all';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/rides')
@ApiBearerAuth('JWT-auth')
export class RideManagementController {
  private readonly logger = new Logger(RideManagementController.name);

  constructor(private readonly rideService: RideManagementService) {}

  @Get()
  @RequirePermissions(Permission.RIDE_READ)
  @ApiOperation({
    summary: 'Get rides with filters',
    description: 'Retrieve a paginated list of rides with advanced filtering options',
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
    description: 'Number of rides per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    enum: ['pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled', 'all'],
    required: false,
    description: 'Filter by ride status',
    example: 'completed',
  })
  @ApiQuery({
    name: 'paymentStatus',
    enum: ['pending', 'paid', 'failed', 'refunded', 'all'],
    required: false,
    description: 'Filter by payment status',
    example: 'paid',
  })
  @ApiQuery({
    name: 'driverId',
    type: 'number',
    required: false,
    description: 'Filter by driver ID',
    example: 1,
  })
  @ApiQuery({
    name: 'userId',
    type: 'number',
    required: false,
    description: 'Filter by user ID',
    example: 1,
  })
  @ApiQuery({
    name: 'dateFrom',
    type: 'string',
    required: false,
    description: 'Filter rides from this date (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    type: 'string',
    required: false,
    description: 'Filter rides to this date (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Rides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Ride',
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  async getRides(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('driverId') driverId?: number,
    @Query('userId') userId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{ 
    success: boolean; 
    data: FormattedRide[]; 
    pagination: { 
      page: number; 
      limit: number; 
      total: number; 
      pages: number; 
    } 
  }> {
    this.logger.log(
      `Fetching rides - page: ${page}, limit: ${limit}, paymentStatus: ${paymentStatus}`,
    );
    return this.rideService.getRides({
      page,
      limit,
      paymentStatus,
      driverId,
      userId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.RIDE_READ)
  @ApiOperation({
    summary: 'Get ride by ID',
    description: 'Retrieve detailed information about a specific ride',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Ride ID to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ride details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        status: { type: 'string', example: 'completed' },
        paymentStatus: { type: 'string', example: 'paid' },
        pickupLocation: { type: 'string', example: '123 Main St, City' },
        pickupLat: { type: 'number', example: 40.7128 },
        pickupLng: { type: 'number', example: -74.006 },
        dropoffLocation: { type: 'string', example: '456 Oak Ave, City' },
        dropoffLat: { type: 'number', example: 40.7213 },
        dropoffLng: { type: 'number', example: -73.9872 },
        fare: { type: 'number', example: 15.5 },
        distance: { type: 'number', example: 5.2 },
        duration: { type: 'number', example: 15 },
        scheduledAt: { type: 'string', format: 'date-time' },
        startedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time' },
        cancelledAt: { type: 'string', format: 'date-time' },
        cancellationReason: { type: 'string', example: 'Driver cancelled' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
          },
        },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Mike Driver' },
            email: { type: 'string', example: 'mike@example.com' },
            phone: { type: 'string', example: '+1987654321' },
          },
        },
        vehicle: {
          type: 'object',
          properties: {
            make: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Camry' },
            year: { type: 'number', example: 2020 },
            color: { type: 'string', example: 'Blue' },
            licensePlate: { type: 'string', example: 'ABC123' },
          },
        },
        payment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            amount: { type: 'number', example: 15.5 },
            method: { type: 'string', example: 'credit_card' },
            transactionId: { type: 'string', example: 'txn_123456789' },
            status: { type: 'string', example: 'succeeded' },
            paidAt: { type: 'string', format: 'date-time' },
          },
        },
        rating: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            rating: { type: 'number', example: 5 },
            comment: { type: 'string', example: 'Great ride!' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        route: {
          type: 'object',
          properties: {
            polyline: { type: 'string', example: 'encoded_polyline_string' },
            distance: { type: 'number', example: 5.2 },
            duration: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Ride not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getRideById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching ride by ID: ${id}`);
    return this.rideService.getRideById(id);
  }
}
