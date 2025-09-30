import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
  ) {}

  @Get('health/websocket')
  @ApiOperation({
    summary: 'Get WebSocket system health status',
    description:
      'Monitor the health and performance of the WebSocket real-time communication system',
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
          description: 'Total number of active WebSocket connections',
        },
        activeRides: {
          type: 'number',
          example: 12,
          description: 'Number of rides currently being tracked',
        },
        onlineDrivers: {
          type: 'number',
          example: 28,
          description: 'Number of drivers currently online',
        },
        totalDriverLocations: {
          type: 'number',
          example: 156,
          description: 'Total driver location records stored',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
          description: 'Timestamp of the health check',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'WebSocket service unavailable',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'WebSocket service is down' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getWebSocketHealth() {
    return this.realTimeService.getHealthStatus();
  }

  @Get('health/redis')
  @ApiOperation({
    summary: 'Get Redis Pub/Sub system health status',
    description:
      'Monitor the health and performance of the Redis Pub/Sub messaging system',
  })
  @ApiResponse({
    status: 200,
    description:
      'Redis Pub/Sub system health information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        redisConnected: {
          type: 'boolean',
          example: true,
          description: 'Whether Redis connection is active',
        },
        activeDrivers: {
          type: 'number',
          example: 28,
          description: 'Number of drivers with active location tracking',
        },
        activeRides: {
          type: 'number',
          example: 12,
          description: 'Number of rides with active subscribers',
        },
        totalSubscribers: {
          type: 'number',
          example: 45,
          description: 'Total number of active subscribers across all channels',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
          description: 'Timestamp of the health check',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Redis service unavailable',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Redis connection failed' },
        redisConnected: { type: 'boolean', example: false },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getRedisHealth() {
    return this.locationTrackingService.getHealthStatus();
  }

  @Post('test/driver-location')
  @ApiOperation({
    summary: 'Test driver location update via Redis',
    description:
      'Test endpoint to simulate driver location updates through Redis Pub/Sub system',
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
          description: 'Unique identifier of the driver',
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
              description: 'Latitude coordinate',
            },
            lng: {
              type: 'number',
              example: -74.006,
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
            },
          },
          required: ['lat', 'lng'],
        },
        rideId: {
          type: 'number',
          example: 123,
          description:
            'Optional: ID of the active ride for targeted notifications',
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
          example: 'Driver location updated via Redis Pub/Sub',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Time when the location was published',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid location data or driver ID',
  })
  @ApiResponse({
    status: 503,
    description: 'Redis service unavailable',
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
      timestamp: new Date(),
    };
  }

  @Post('test/ride-subscribe')
  @ApiOperation({
    summary: 'Test ride subscription via Redis',
    description:
      'Test endpoint to subscribe a user to ride updates through Redis Pub/Sub',
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
          description: 'Unique identifier of the ride to subscribe to',
        },
        userId: {
          type: 'string',
          example: 'user_2abc123def456',
          description: 'Clerk ID of the user subscribing to ride updates',
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
          example: 'User user_2abc123def456 subscribed to ride 123',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ride ID or user ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Ride not found',
  })
  async testRideSubscribe(@Body() data: { rideId: number; userId: string }) {
    await this.locationTrackingService.subscribeToRide(
      data.rideId,
      data.userId,
    );
    return {
      message: `User ${data.userId} subscribed to ride ${data.rideId}`,
      timestamp: new Date(),
    };
  }

  @Post('test/emergency-alert')
  @ApiOperation({
    summary: 'Test emergency alert via Redis',
    description:
      'Test endpoint to simulate emergency alerts through Redis Pub/Sub system',
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
          description: 'Clerk ID of the user sending the emergency alert',
        },
        rideId: {
          type: 'number',
          example: 123,
          description: 'ID of the ride where the emergency occurred',
        },
        location: {
          type: 'object',
          description: 'Location coordinates where the emergency occurred',
          properties: {
            lat: { type: 'number', example: 40.7128 },
            lng: { type: 'number', example: -74.006 },
          },
          required: ['lat', 'lng'],
        },
        message: {
          type: 'string',
          example: 'I need immediate medical assistance!',
          description: 'Description of the emergency situation',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency alert successfully sent via Redis Pub/Sub',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Emergency alert sent via Redis Pub/Sub',
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
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
      timestamp: new Date(),
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
  async getSystemComparison() {
    const wsHealth = this.realTimeService.getHealthStatus();
    const redisHealth = await this.locationTrackingService.getHealthStatus();

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

  @Post('test/simulate-driver-locations')
  @ApiOperation({
    summary: 'Simular ubicaciones de conductores para pruebas',
    description: `
    **ENDPOINT PARA TESTING Y DESARROLLO**

    Crea ubicaciones simuladas para conductores en un área específica para poder probar:
    - La búsqueda de conductores cercanos
    - El sistema de tracking en tiempo real
    - Los algoritmos de matching

    **¿Qué hace?**
    - Genera ubicaciones aleatorias dentro de un radio especificado
    - Actualiza la ubicación de conductores existentes en la base de datos
    - Crea registros en el historial de ubicaciones
    - Simula conductores online y activos

    **Parámetros requeridos:**
    - centerLat, centerLng: Centro del área a simular
    - radiusKm: Radio en kilómetros (máximo 10km)
    - driverCount: Número de conductores a simular (máximo 50)

    **Ejemplo de uso:**
    - Centro: La Castellana, Caracas (10.4998, -66.8517)
    - Radio: 5km
    - Conductores: 20
    `,
  })
  @ApiBody({
    description: 'Parámetros para simular ubicaciones de conductores',
    schema: {
      type: 'object',
      required: ['centerLat', 'centerLng', 'radiusKm', 'driverCount'],
      properties: {
        centerLat: {
          type: 'number',
          example: 10.4998,
          minimum: -90,
          maximum: 90,
          description: 'Latitud del centro del área a simular',
        },
        centerLng: {
          type: 'number',
          example: -66.8517,
          minimum: -180,
          maximum: 180,
          description: 'Longitud del centro del área a simular',
        },
        radiusKm: {
          type: 'number',
          example: 5,
          minimum: 0.1,
          maximum: 10,
          description: 'Radio en kilómetros para distribuir conductores',
        },
        driverCount: {
          type: 'number',
          example: 20,
          minimum: 1,
          maximum: 50,
          description: 'Número de conductores a simular',
        },
        vehicleTypeIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description:
            'Tipos de vehículo a asignar (opcional, si no se especifica se asignan aleatoriamente)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ubicaciones de conductores simuladas exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully simulated 20 driver locations',
        },
        simulatedDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driverId: { type: 'number' },
              name: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
              distanceFromCenter: { type: 'number' },
              vehicleType: { type: 'string' },
            },
          },
        },
        center: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        radiusKm: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async simulateDriverLocations(
    @Body()
    data: {
      centerLat: number;
      centerLng: number;
      radiusKm: number;
      driverCount: number;
      vehicleTypeIds?: number[];
    },
  ) {
    const { centerLat, centerLng, radiusKm, driverCount, vehicleTypeIds } =
      data;

    // Validaciones
    if (radiusKm > 10) {
      throw new Error('Radius cannot exceed 10km for simulation');
    }
    if (driverCount > 50) {
      throw new Error('Cannot simulate more than 50 drivers at once');
    }
    if (
      centerLat < -90 ||
      centerLat > 90 ||
      centerLng < -180 ||
      centerLng > 180
    ) {
      throw new Error('Invalid center coordinates');
    }

    try {
      // Obtener conductores existentes para simular
      const existingDrivers = await this.prisma.driver.findMany({
        take: driverCount,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          vehicles: {
            where: { isDefault: true, status: 'active' },
            take: 1,
            include: { vehicleType: true },
          },
        },
        orderBy: { id: 'asc' },
      });

      if (existingDrivers.length === 0) {
        throw new Error(
          'No drivers found in database. Please create some drivers first.',
        );
      }

      // Obtener tipos de vehículo disponibles si no se especificaron
      let availableVehicleTypes = vehicleTypeIds;
      if (!availableVehicleTypes || availableVehicleTypes.length === 0) {
        const vehicleTypes = await this.prisma.vehicleType.findMany({
          select: { id: true },
        });
        availableVehicleTypes = vehicleTypes.map((vt) => vt.id);
      }

      const simulatedDrivers: any[] = [];

      // Simular ubicaciones para cada conductor
      for (let i = 0; i < Math.min(driverCount, existingDrivers.length); i++) {
        const driver = existingDrivers[i];

        // Generar ubicación aleatoria dentro del radio
        const angle = Math.random() * 2 * Math.PI; // Ángulo aleatorio
        const distance = Math.random() * radiusKm; // Distancia aleatoria dentro del radio

        // Convertir coordenadas polares a cartesianas y luego a lat/lng
        const latOffset = (distance / 111.32) * Math.cos(angle); // 1 grado lat ≈ 111.32 km
        const lngOffset =
          (distance / (111.32 * Math.cos((centerLat * Math.PI) / 180))) *
          Math.sin(angle);

        const newLat = centerLat + latOffset;
        const newLng = centerLng + lngOffset;

        // Asignar tipo de vehículo si no tiene uno
        let vehicleTypeId = driver.vehicles?.[0]?.vehicleTypeId;
        if (!vehicleTypeId && availableVehicleTypes.length > 0) {
          vehicleTypeId =
            availableVehicleTypes[
              Math.floor(Math.random() * availableVehicleTypes.length)
            ];
        }

        // Actualizar ubicación del conductor
        await this.locationTrackingService.updateDriverLocation(
          driver.id,
          { lat: newLat, lng: newLng },
          undefined, // No ride ID for simulation
          {
            accuracy: Math.random() * 20 + 5, // 5-25 meters accuracy
            speed: Math.random() * 60 + 10, // 10-70 km/h
            heading: Math.random() * 360, // 0-360 degrees
            source: 'simulated',
          },
        );

        // Cambiar estado a online si no lo está
        await this.prisma.driver.update({
          where: { id: driver.id },
          data: {
            status: 'online',
            updatedAt: new Date(),
          },
        });

        // Calcular distancia desde el centro
        const distanceFromCenter =
          this.locationTrackingService.calculateDistance(
            centerLat,
            centerLng,
            newLat,
            newLng,
          );

        simulatedDrivers.push({
          driverId: driver.id,
          name: `${driver.firstName} ${driver.lastName}`,
          location: { lat: newLat, lng: newLng },
          distanceFromCenter: Math.round(distanceFromCenter * 100) / 100,
          vehicleType:
            driver.vehicles?.[0]?.vehicleType?.displayName || 'Unknown',
          status: 'online',
          locationActive: true,
        });
      }

      return {
        message: `Successfully simulated ${simulatedDrivers.length} driver locations`,
        simulatedDrivers,
        center: { lat: centerLat, lng: centerLng },
        radiusKm,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error simulating driver locations:', error);
      throw error;
    }
  }

  @Get('test/simulated-drivers')
  @ApiOperation({
    summary: 'Obtener lista de conductores con ubicaciones simuladas',
    description: `
    **ENDPOINT PARA VERIFICACIÓN DE SIMULACIÓN**

    Lista todos los conductores que tienen ubicaciones activas (simuladas o reales)
    para verificar que el sistema de tracking está funcionando correctamente.

    **Incluye:**
    - Ubicación actual
    - Estado online/offline
    - Información del vehículo
    - Última actualización de ubicación
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conductores con ubicaciones activas',
    schema: {
      type: 'object',
      properties: {
        drivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              status: { type: 'string' },
              currentLocation: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
              lastLocationUpdate: { type: 'string', format: 'date-time' },
              vehicleType: { type: 'string' },
              locationActive: { type: 'boolean' },
            },
          },
        },
        total: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSimulatedDrivers() {
    const drivers = await this.prisma.driver.findMany({
      where: {
        status: 'online',
        isLocationActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
      include: {
        vehicles: {
          where: { isDefault: true, status: 'active' },
          take: 1,
          include: { vehicleType: true },
        },
      },
      orderBy: { lastLocationUpdate: 'desc' },
    });

    return {
      drivers: drivers.map((driver) => ({
        id: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
        status: driver.status,
        currentLocation: {
          lat: Number(driver.currentLatitude),
          lng: Number(driver.currentLongitude),
        },
        lastLocationUpdate: driver.lastLocationUpdate,
        locationAccuracy: driver.locationAccuracy
          ? Number(driver.locationAccuracy)
          : null,
        vehicleType:
          driver.vehicles?.[0]?.vehicleType?.displayName || 'Unknown',
        locationActive: true,
      })),
      total: drivers.length,
      timestamp: new Date(),
    };
  }
}
