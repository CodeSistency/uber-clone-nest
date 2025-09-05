import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { Ride, Rating } from '@prisma/client';
import { CreateRideDto } from './dto/create-ride.dto';
import { ScheduleRideDto } from './dto/schedule-ride.dto';
import { AcceptRideDto } from './dto/accept-ride.dto';
import { RateRideDto } from './dto/rate-ride.dto';

@ApiTags('rides')
@Controller('api/ride')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new ride record',
    description:
      'Create a new ride request with origin and destination details',
  })
  @ApiBody({ type: CreateRideDto })
  @ApiResponse({
    status: 201,
    description: 'Ride created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        origin_address: {
          type: 'string',
          example: '123 Main St, New York, NY',
        },
        destination_address: {
          type: 'string',
          example: '456 Broadway, New York, NY',
        },
        origin_latitude: { type: 'number', example: 40.7128 },
        origin_longitude: { type: 'number', example: -74.006 },
        destination_latitude: { type: 'number', example: 40.7589 },
        destination_longitude: { type: 'number', example: -73.9851 },
        ride_time: { type: 'number', example: 25 },
        fare_price: { type: 'number', example: 15.75 },
        payment_status: { type: 'string', example: 'pending' },
        status: { type: 'string', example: 'requested' },
        user_id: { type: 'number', example: 1 },
        tier_id: { type: 'number', example: 1 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createRide(@Body() createRideDto: CreateRideDto): Promise<Ride> {
    return this.ridesService.createRide(createRideDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride history for a specific user' })
  @ApiParam({ name: 'id', description: 'The Clerk ID of the user' })
  @ApiResponse({
    status: 200,
    description: "Returns an array of the user's past rides",
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
  @ApiResponse({ status: 400, description: 'User ID is missing' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserRides(@Param('id') userId: string): Promise<Ride[]> {
    return this.ridesService.getUserRidesHistory(userId);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a ride for a future date and time' })
  @ApiBody({ type: ScheduleRideDto })
  @ApiResponse({ status: 201, description: 'Ride scheduled successfully' })
  @ApiResponse({
    status: 400,
    description: 'Missing fields or invalid tier ID',
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async scheduleRide(@Body() scheduleRideDto: ScheduleRideDto): Promise<Ride> {
    return this.ridesService.scheduleRide(scheduleRideDto);
  }

  @Get('estimate')
  @ApiOperation({
    summary: 'Provide fare estimate based on route and ride tier',
  })
  @ApiQuery({ name: 'tierId', description: 'The ID of the ride_tier' })
  @ApiQuery({ name: 'minutes', description: 'Estimated duration of the ride' })
  @ApiQuery({ name: 'miles', description: 'Estimated distance of the ride' })
  @ApiResponse({
    status: 200,
    description: 'Returns the fare calculation',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            tier: { type: 'string' },
            baseFare: { type: 'number' },
            perMinuteRate: { type: 'number' },
            perMileRate: { type: 'number' },
            estimatedMinutes: { type: 'number' },
            estimatedMiles: { type: 'number' },
            totalFare: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getFareEstimate(
    @Query('tierId') tierId: string,
    @Query('minutes') minutes: string,
    @Query('miles') miles: string,
  ): Promise<{
    data: {
      tier: string;
      baseFare: number;
      perMinuteRate: number;
      perMileRate: number;
      estimatedMinutes: number;
      estimatedMiles: number;
      totalFare: number;
    };
  }> {
    const estimate = await this.ridesService.getFareEstimate(
      Number(tierId),
      Number(minutes),
      Number(miles),
    );
    return { data: estimate };
  }

  @Post(':rideId/accept')
  @ApiOperation({
    summary: 'Allow a driver to accept an available ride request',
    description:
      'Driver accepts a ride request and becomes the assigned driver for that ride',
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    example: '1',
    type: Number,
  })
  @ApiBody({
    type: AcceptRideDto,
    description: 'Driver information for accepting the ride',
  })
  @ApiResponse({
    status: 200,
    description: 'Ride accepted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        origin_address: {
          type: 'string',
          example: '123 Main St, New York, NY',
        },
        destination_address: {
          type: 'string',
          example: '456 Broadway, New York, NY',
        },
        status: { type: 'string', example: 'accepted' },
        driver_id: { type: 'number', example: 5 },
        fare_price: { type: 'number', example: 15.75 },
        payment_status: { type: 'string', example: 'pending' },
        accepted_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing fields' })
  @ApiResponse({
    status: 404,
    description: "Ride is not available or doesn't exist",
  })
  @ApiResponse({
    status: 409,
    description: 'Ride was already accepted by another driver',
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async acceptRide(
    @Param('rideId') rideId: string,
    @Body() acceptRideDto: AcceptRideDto,
  ): Promise<Ride> {
    return this.ridesService.acceptRide(Number(rideId), acceptRideDto);
  }

  @Post(':rideId/rate')
  @ApiOperation({
    summary: 'Submit a rating for a completed ride',
    description:
      'Allow users to rate their ride experience and provide feedback',
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    example: '1',
    type: Number,
  })
  @ApiBody({
    type: RateRideDto,
    description: 'Rating information including score and optional comment',
  })
  @ApiResponse({
    status: 201,
    description: 'Rating submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        ride_id: { type: 'number', example: 1 },
        rated_by_clerk_id: { type: 'string', example: 'user_2abc123def456' },
        rated_clerk_id: { type: 'string', example: 'driver_clerk_id_1' },
        rating_value: { type: 'number', example: 5 },
        comment: {
          type: 'string',
          example: 'Great ride! Driver was very professional.',
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields or invalid rating value',
  })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async rateRide(
    @Param('rideId') rideId: string,
    @Body() rateRideDto: RateRideDto,
  ): Promise<Rating> {
    return this.ridesService.rateRide(Number(rideId), rateRideDto);
  }

  // ========== NUEVOS ENDPOINTS CRÍTICOS ==========

  @Get('requests')
  @ApiOperation({
    summary: 'Get available ride requests for drivers',
    description:
      'Retrieve ride requests that are available for drivers to accept, filtered by location and distance',
  })
  @ApiQuery({
    name: 'driverLat',
    description: 'Driver latitude',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'driverLng',
    description: 'Driver longitude',
    required: true,
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
    description: 'Returns available ride requests',
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
              distance: { type: 'number' },
              estimatedFare: { type: 'number' },
              rideTime: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideRequests(
    @Query('driverLat') driverLat: string,
    @Query('driverLng') driverLng: string,
    @Query('radius') radius: string = '5',
  ): Promise<{ data: any[] }> {
    const requests = await this.ridesService.getRideRequests(
      Number(driverLat),
      Number(driverLng),
      Number(radius),
    );
    return { data: requests };
  }

  @Post(':rideId/start')
  @ApiOperation({
    summary: 'Start a ride when driver arrives at pickup location',
    description:
      'Mark a ride as started when the driver arrives at the passenger pickup location',
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    type: Number,
  })
  @ApiBody({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        driverId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ride started successfully',
    schema: {
      type: 'object',
      properties: {
        rideId: { type: 'number' },
        status: { type: 'string', example: 'in_progress' },
        actualStartTime: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({
    status: 403,
    description: 'Driver not authorized for this ride',
  })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 409, description: 'Ride cannot be started' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async startRide(
    @Param('rideId') rideId: string,
    @Body() body: { driverId: number },
  ): Promise<any> {
    return this.ridesService.startRide(Number(rideId), body.driverId);
  }

  @Post(':rideId/complete')
  @ApiOperation({
    summary: 'Complete a ride when driver arrives at destination',
    description:
      'Mark a ride as completed when the driver and passenger arrive at the destination',
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    type: Number,
  })
  @ApiBody({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        driverId: { type: 'number', example: 1 },
        finalDistance: { type: 'number', example: 12.5 },
        finalTime: { type: 'number', example: 25 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ride completed successfully',
    schema: {
      type: 'object',
      properties: {
        rideId: { type: 'number' },
        status: { type: 'string', example: 'completed' },
        finalFare: { type: 'number', example: 18.75 },
        completedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({
    status: 403,
    description: 'Driver not authorized for this ride',
  })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 409, description: 'Ride cannot be completed' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async completeRide(
    @Param('rideId') rideId: string,
    @Body()
    body: { driverId: number; finalDistance?: number; finalTime?: number },
  ): Promise<any> {
    return this.ridesService.completeRide(
      Number(rideId),
      body.driverId,
      body.finalDistance,
      body.finalTime,
    );
  }

  @Post(':rideId/cancel')
  @ApiOperation({
    summary: 'Cancel a ride',
    description: 'Cancel a ride by driver or passenger with optional reason',
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    type: Number,
  })
  @ApiBody({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        cancelledBy: { type: 'string', example: 'driver' },
        reason: { type: 'string', example: 'Driver unable to reach location' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ride cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        rideId: { type: 'number' },
        status: { type: 'string', example: 'cancelled' },
        cancelledAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 409, description: 'Ride cannot be cancelled' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async cancelRide(
    @Param('rideId') rideId: string,
    @Body() body: { cancelledBy: string; reason?: string },
  ): Promise<any> {
    return this.ridesService.cancelRide(
      Number(rideId),
      body.cancelledBy,
      body.reason,
    );
  }
}
