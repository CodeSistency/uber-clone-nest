import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RealTimeService } from '../websocket/real-time.service';
import { LocationTrackingService } from '../redis/location-tracking.service';

interface DriverLocationInfo {
  driverId: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  rideId?: number;
}

@ApiTags('realtime')
@Controller('api/realtime')
export class RealtimeController {
  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  @Get('health/websocket')
  @ApiOperation({ summary: 'Get WebSocket system health status' })
  @ApiResponse({
    status: 200,
    description: 'WebSocket health status',
    schema: {
      type: 'object',
      properties: {
        connectedClients: { type: 'number' },
        activeRides: { type: 'number' },
        onlineDrivers: { type: 'number' },
        totalDriverLocations: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  getWebSocketHealth() {
    return this.realTimeService.getHealthStatus();
  }

  @Get('health/redis')
  @ApiOperation({ summary: 'Get Redis Pub/Sub system health status' })
  @ApiResponse({
    status: 200,
    description: 'Redis health status',
    schema: {
      type: 'object',
      properties: {
        redisConnected: { type: 'boolean' },
        activeDrivers: { type: 'number' },
        activeRides: { type: 'number' },
        totalSubscribers: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  getRedisHealth() {
    return this.locationTrackingService.getHealthStatus();
  }

  @Post('test/driver-location')
  @ApiOperation({ summary: 'Test driver location update via Redis' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        driverId: { type: 'number', example: 1 },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 40.7128 },
            lng: { type: 'number', example: -74.0060 },
          },
        },
        rideId: { type: 'number', example: 123 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Location update published' })
  async testDriverLocation(@Body() data: { driverId: number; location: { lat: number; lng: number }; rideId?: number }) {
    await this.locationTrackingService.updateDriverLocation(data.driverId, data.location, data.rideId);
    return { message: 'Driver location updated via Redis Pub/Sub' };
  }

  @Post('test/ride-subscribe')
  @ApiOperation({ summary: 'Test ride subscription via Redis' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rideId: { type: 'number', example: 123 },
        userId: { type: 'string', example: 'user_123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User subscribed to ride updates' })
  async testRideSubscribe(@Body() data: { rideId: number; userId: string }) {
    await this.locationTrackingService.subscribeToRide(data.rideId, data.userId);
    return { message: `User ${data.userId} subscribed to ride ${data.rideId}` };
  }

  @Post('test/emergency-alert')
  @ApiOperation({ summary: 'Test emergency alert via Redis' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_123' },
        rideId: { type: 'number', example: 123 },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 40.7128 },
            lng: { type: 'number', example: -74.0060 },
          },
        },
        message: { type: 'string', example: 'Help needed!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Emergency alert sent' })
  async testEmergencyAlert(@Body() data: {
    userId: string;
    rideId: number;
    location: { lat: number; lng: number };
    message: string;
  }) {
    await this.locationTrackingService.sendEmergencyAlert(data);
    return { message: 'Emergency alert sent via Redis Pub/Sub' };
  }

  @Get('driver/:driverId/location')
  @ApiOperation({ summary: 'Get driver location from Redis' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiResponse({
    status: 200,
    description: 'Driver location retrieved',
    schema: {
      type: 'object',
      properties: {
        driverId: { type: 'number' },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
          nullable: true,
        },
        source: { type: 'string' },
      },
    },
  })
  async getDriverLocation(@Param('driverId') driverId: string) {
    const location: DriverLocationInfo | null = await this.locationTrackingService.getDriverLocation(Number(driverId));
    return {
      driverId: Number(driverId),
      location,
      source: 'redis',
    };
  }

  @Post('websocket/emit')
  @ApiOperation({ summary: 'Emit event to all WebSocket clients' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'test:event' },
        data: { type: 'object', example: { message: 'Hello World' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Event emitted to WebSocket clients' })
  async emitWebSocketEvent(@Body() data: { event: string; data: any }) {
    // This would require access to the WebSocket server instance
    // For now, just return success
    return {
      message: `Event '${data.event}' would be emitted to WebSocket clients`,
      data: data.data,
    };
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare WebSocket vs Redis performance' })
  @ApiResponse({
    status: 200,
    description: 'System comparison',
    schema: {
      type: 'object',
      properties: {
        websocket: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'WebSocket' },
            useCase: { type: 'string', example: 'Real-time bidirectional communication' },
            advantages: { type: 'array', items: { type: 'string' } },
            connections: { type: 'number' },
          },
        },
        redis: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'Redis Pub/Sub' },
            useCase: { type: 'string', example: 'Cross-service communication' },
            advantages: { type: 'array', items: { type: 'string' } },
            connected: { type: 'boolean' },
          },
        },
      },
    },
  })
  getSystemComparison() {
    const wsHealth = this.realTimeService.getHealthStatus();
    const redisHealth = this.locationTrackingService.getHealthStatus();

    return {
      websocket: {
        type: 'WebSocket',
        useCase: 'Real-time bidirectional communication',
        advantages: [
          'Persistent connections',
          'Low latency',
          'Bidirectional communication',
          'Built-in reconnection',
          'Perfect for real-time UI updates',
        ],
        connections: wsHealth.connectedClients,
        activeRides: wsHealth.activeRides,
      },
      redis: {
        type: 'Redis Pub/Sub',
        useCase: 'Cross-service communication and data streaming',
        advantages: [
          'Scalable across multiple servers',
          'Persistent message storage',
          'Complex routing patterns',
          'High throughput',
          'Reliable delivery',
        ],
        connected: redisHealth.redisConnected,
        activeDrivers: redisHealth.activeDrivers,
        activeRides: redisHealth.activeRides,
      },
      timestamp: new Date(),
    };
  }
}
