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
  @ApiOperation({ summary: 'Create a new ride record' })
  @ApiBody({ type: CreateRideDto })
  @ApiResponse({ status: 201, description: 'Ride created successfully' })
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
  ): Promise<{ data: any }> {
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
  })
  @ApiParam({ name: 'rideId', description: 'The unique ID of the ride' })
  @ApiBody({ type: AcceptRideDto })
  @ApiResponse({ status: 200, description: 'Ride accepted successfully' })
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
  @ApiOperation({ summary: 'Submit a rating for a completed ride' })
  @ApiParam({ name: 'rideId', description: 'The unique ID of the ride' })
  @ApiBody({ type: RateRideDto })
  @ApiResponse({ status: 201, description: 'Rating submitted successfully' })
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
}
