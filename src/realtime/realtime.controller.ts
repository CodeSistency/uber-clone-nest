import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Get WebSocket system health status',
    description: 'Monitor the health and performance of the WebSocket real-time communication system'
  })
  @ApiResponse({
    status: 200,
    description: 'WebSocket system health information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        connectedClients: {
          type: 'number',
          example: 45,
          description: 'Total number of active WebSocket connections'
        },
        activeRides: {
          type: 'number',
          example: 12,
          description: 'Number of rides currently being tracked'
        },
        onlineDrivers: {
          type: 'number',
          example: 28,
          description: 'Number of drivers currently online'
        },
        totalDriverLocations: {
          type: 'number',
          example: 156,
          description: 'Total driver location records stored'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
          description: 'Timestamp of the health check'
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'WebSocket service unavailable',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'WebSocket service is down' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  getWebSocketHealth() {
    return this.realTimeService.getHealthStatus();
  }

  @Get('health/redis')
  @ApiOperation({
    summary: 'Get Redis Pub/Sub system health status',
    description: 'Monitor the health and performance of the Redis Pub/Sub messaging system'
  })
  @ApiResponse({
    status: 200,
    description: 'Redis Pub/Sub system health information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        redisConnected: {
          type: 'boolean',
          example: true,
          description: 'Whether Redis connection is active'
        },
        activeDrivers: {
          type: 'number',
          example: 28,
          description: 'Number of drivers with active location tracking'
        },
        activeRides: {
          type: 'number',
          example: 12,
          description: 'Number of rides with active subscribers'
        },
        totalSubscribers: {
          type: 'number',
          example: 45,
          description: 'Total number of active subscribers across all channels'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
          description: 'Timestamp of the health check'
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Redis service unavailable',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Redis connection failed' },
        redisConnected: { type: 'boolean', example: false },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  getRedisHealth() {
    return this.locationTrackingService.getHealthStatus();
  }

  @Post('test/driver-location')
  @ApiOperation({
    summary: 'Test driver location update via Redis',
    description: 'Test endpoint to simulate driver location updates through Redis Pub/Sub system'
  })
  @ApiBody({
    description: 'Driver location update data',
    schema: {
      type: 'object',
      required: ['driverId', 'location'],
      properties: {
        driverId: {
          type: 'number',
          example: 1,
          description: 'Unique identifier of the driver'
        },
        location: {
          type: 'object',
          description: 'Geographic coordinates of the driver',
          properties: {
            lat: {
              type: 'number',
              example: 40.7128,
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate'
            },
            lng: {
              type: 'number',
              example: -74.006,
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate'
            },
          },
          required: ['lat', 'lng']
        },
        rideId: {
          type: 'number',
          example: 123,
          description: 'Optional: ID of the active ride for targeted notifications'
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Driver location successfully published to Redis Pub/Sub',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Driver location updated via Redis Pub/Sub'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Time when the location was published'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid location data or driver ID'
  })
  @ApiResponse({
    status: 503,
    description: 'Redis service unavailable'
  })
  async testDriverLocation(
    @Body()
    data: {
      driverId: number;
      location: { lat: number; lng: number };
      rideId?: number;
    },
  ) {
    await this.locationTrackingService.updateDriverLocation(
      data.driverId,
      data.location,
      data.rideId,
    );
    return {
      message: 'Driver location updated via Redis Pub/Sub',
      timestamp: new Date()
    };
  }

  @Post('test/ride-subscribe')
  @ApiOperation({
    summary: 'Test ride subscription via Redis',
    description: 'Test endpoint to subscribe a user to ride updates through Redis Pub/Sub'
  })
  @ApiBody({
    description: 'Ride subscription data',
    schema: {
      type: 'object',
      required: ['rideId', 'userId'],
      properties: {
        rideId: {
          type: 'number',
          example: 123,
          description: 'Unique identifier of the ride to subscribe to'
        },
        userId: {
          type: 'string',
          example: 'user_2abc123def456',
          description: 'Clerk ID of the user subscribing to ride updates'
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully subscribed to ride updates',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User user_2abc123def456 subscribed to ride 123'
        },
        timestamp: {
          type: 'string',
          format: 'date-time'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ride ID or user ID'
  })
  @ApiResponse({
    status: 404,
    description: 'Ride not found'
  })
  async testRideSubscribe(@Body() data: { rideId: number; userId: string }) {
    await this.locationTrackingService.subscribeToRide(
      data.rideId,
      data.userId,
    );
    return {
      message: `User ${data.userId} subscribed to ride ${data.rideId}`,
      timestamp: new Date()
    };
  }

  @Post('test/emergency-alert')
  @ApiOperation({
    summary: 'Test emergency alert via Redis',
    description: 'Test endpoint to simulate emergency alerts through Redis Pub/Sub system'
  })
  @ApiBody({
    description: 'Emergency alert data',
    schema: {
      type: 'object',
      required: ['userId', 'rideId', 'location', 'message'],
      properties: {
        userId: {
          type: 'string',
          example: 'user_2abc123def456',
          description: 'Clerk ID of the user sending the emergency alert'
        },
        rideId: {
          type: 'number',
          example: 123,
          description: 'ID of the ride where the emergency occurred'
        },
        location: {
          type: 'object',
          description: 'Location coordinates where the emergency occurred',
          properties: {
            lat: { type: 'number', example: 40.7128 },
            lng: { type: 'number', example: -74.006 }
          },
          required: ['lat', 'lng']
        },
        message: {
          type: 'string',
          example: 'I need immediate medical assistance!',
          description: 'Description of the emergency situation'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency alert successfully sent via Redis Pub/Sub',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Emergency alert sent via Redis Pub/Sub'
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async testEmergencyAlert(
    @Body()
    data: {
      userId: string;
      rideId: number;
      location: { lat: number; lng: number };
      message: string;
    },
  ) {
    await this.locationTrackingService.sendEmergencyAlert(data);
    return {
      message: 'Emergency alert sent via Redis Pub/Sub',
      timestamp: new Date()
    };
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
    const location: DriverLocationInfo | null =
      await this.locationTrackingService.getDriverLocation(Number(driverId));
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
  @ApiResponse({
    status: 200,
    description: 'Event emitted to WebSocket clients',
  })
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
            useCase: {
              type: 'string',
              example: 'Real-time bidirectional communication',
            },
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
