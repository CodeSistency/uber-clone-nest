import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ParseFloatPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { DriverReportsService, IssueReport } from './driver-reports.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SetDriverAvailabilityDto,
  DriverResponseDto,
  ReportIssueDto,
  CancelRideDto,
  SimulateRequestDto,
  UpdateDriverLocationDto,
} from './dto/transport-flow.dtos';

@ApiTags('rides-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/transport')
export class TransportDriverController {
  private readonly logger = new Logger(TransportDriverController.name);

  constructor(
    private readonly flow: RidesFlowService,
    private readonly reports: DriverReportsService,
    private readonly idemp: IdempotencyService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':rideId/accept')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor acepta un viaje',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.

    **¿Qué hace?**
    - Asigna el viaje al conductor autenticado
    - Cambia el status del viaje a 'accepted'
    - Notifica al cliente que el viaje fue aceptado
    - Actualiza la disponibilidad del conductor

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key

    **Después de aceptar:**
    - El conductor debe marcar "arrived" cuando llegue al punto de recogida
    - El viaje pasa al siguiente estado del flujo
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Viaje aceptado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 5 },
            driverId: { type: 'number', example: 1 },
            status: { type: 'string', example: 'accepted' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o usuario no es conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Usuario no registrado como conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'User is not a driver' },
      },
    },
  })
  async accept(@Param('rideId') rideId: string, @Req() req: any) {
    // Idempotency
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    const ride = await this.flow.driverAcceptTransport(
      Number(rideId),
      req.driver.id,
      String(req.user.id),
    );
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }

  @Post(':rideId/arrived')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor llega al punto de recogida',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.

    **¿Qué hace?**
    - Marca que el conductor ha llegado al punto de recogida
    - Notifica al cliente que el conductor está esperando
    - Cambia el status del viaje a 'arrived'

    **Después de marcar arrived:**
    - Esperar confirmación del cliente
    - Usar el endpoint 'start' cuando el cliente esté listo
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Llegada confirmada exitosamente',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Driver arrived at pickup location',
        },
      },
    },
  })
  async arrived(@Param('rideId') rideId: string, @Req() req: any) {
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    return this.flow.driverArrivedTransport(
      Number(rideId),
      req.driver.id,
      String(req.user.id),
    );
  }

  @Get('pending-requests')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📋 Ver solicitudes de viaje pendientes (matching automático)',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.

    **¿Qué devuelve?**
    - Lista de solicitudes de viaje asignadas automáticamente al conductor
    - Solo viajes con \`status: 'driver_confirmed'\` (matching automático completado)
    - Información completa del pasajero, ruta y tarifa
    - Tiempo restante para aceptar/rechazar (2 minutos)

    **Uso típico:**
    - Conductor consulta solicitudes pendientes después de recibir notificación
    - Revisa detalles del viaje antes de aceptar
    - Responde con \`POST /{rideId}/respond\` (accept/reject)

    **Estados posibles:**
    - \`timeRemainingSeconds > 0\`: Solicitud activa, puede responder
    - \`timeRemainingSeconds = 0\`: Solicitud expirada automáticamente

    **Notas importantes:**
    - Las solicitudes expiran automáticamente después de 2 minutos
    - Solo muestra solicitudes asignadas al conductor autenticado
    - Ordenadas por fecha de asignación (más recientes primero)
    `,
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitud actual del conductor (opcional, para testing)',
    example: 4.6097,
    required: false,
    type: 'number',
    minimum: -90,
    maximum: 90,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitud actual del conductor (opcional, para testing)',
    example: -74.0817,
    required: false,
    type: 'number',
    minimum: -180,
    maximum: 180,
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitudes pendientes obtenidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rideId: { type: 'number', example: 456 },
          status: { type: 'string', example: 'driver_confirmed' },
          originAddress: { type: 'string', example: 'Parque de la 93, Bogotá' },
          destinationAddress: { type: 'string', example: 'Zona Rosa, Bogotá' },
          farePrice: { type: 'number', example: 18.5 },
          estimatedDistance: { type: 'number', example: 3.2 },
          duration: { type: 'number', example: 20 },
          passenger: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'María García' },
              phone: { type: 'string', example: '+573001234567' },
              rating: { type: 'number', example: 4.9 },
            },
          },
          tier: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Premium' },
            },
          },
          requestedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:02:00.000Z',
          },
          timeRemainingSeconds: { type: 'number', example: 85 },
          pickupLocation: {
            type: 'object',
            properties: {
              lat: { type: 'number', example: 4.6767 },
              lng: { type: 'number', example: -74.0483 },
            },
          },
        },
      },
    },
  })
  async getPendingRequests(
    @Req() req: any,
    @Query('lat', ParseFloatPipe) lat?: number,
    @Query('lng', ParseFloatPipe) lng?: number
  ) {
    try {
      // DriverGuard ya validó que el usuario es conductor y agregó req.driver
      const driverId = req.driver.id;

      // Si se proporcionan coordenadas manualmente Y NO SON (0,0), actualizar ubicación
      if (lat !== undefined && lng !== undefined && !(lat === 0 && lng === 0)) {
        this.logger.log(`📍 [PENDING-REQUESTS] Usando ubicación manual del conductor: (${lat}, ${lng})`);
        await this.flow.updateDriverLocation(driverId, {
          lat,
          lng
        });
      } else if (lat === 0 && lng === 0) {
        this.logger.log(`📍 [PENDING-REQUESTS] IGNORANDO coordenadas (0,0) - Usando ubicación GPS existente`);
      }

      const pendingRequests =
        await this.flow.getDriverPendingRequests(driverId);
      return pendingRequests;
    } catch (error) {
      throw error;
    }
  }

  @Post('location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📍 Actualizar ubicación GPS del conductor',
    description: `
    **IMPORTANTE:** Actualiza la ubicación actual del conductor en el sistema de tracking.

    **¿Para qué sirve?**
    - Permite que el conductor actualice su posición GPS en tiempo real
    - Es necesario para que el algoritmo de matching automático funcione
    - Los conductores deben actualizar su ubicación periódicamente (cada 30 segundos)

    **Datos que se almacenan:**
    - Ubicación GPS (latitud, longitud)
    - Precisión de la ubicación
    - Velocidad actual
    - Dirección (heading)
    - Timestamp de la actualización

    **Después de actualizar:**
    - El conductor aparecerá disponible para matching automático
    - La ubicación se usa para calcular distancias y tiempos de llegada
    - Se emiten actualizaciones en tiempo real a clientes activos

    **Notas importantes:**
    - La ubicación se almacena tanto en memoria (Redis) como en base de datos
    - Si hay un ride activo, se especifica en \`rideId\`
    - Las actualizaciones se publican a través de WebSockets
    `
  })
  @ApiBody({ type: UpdateDriverLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Ubicación actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ubicación actualizada exitosamente' },
        data: {
          type: 'object',
          properties: {
            driverId: { type: 'number', example: 7 },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 4.6097 },
                lng: { type: 'number', example: -74.0817 }
              }
            },
            timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
            accuracy: { type: 'number', example: 5.2 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Usuario no es conductor'
  })
  async updateLocation(
    @Body() locationData: UpdateDriverLocationDto,
    @Req() req: any
  ) {
    console.log(`📍 [LOCATION-UPDATE] === INICIO LOCATION UPDATE ===`);
    console.log(`📍 [LOCATION-UPDATE] Usuario autenticado:`, {
      userId: req.user.id,
      email: req.user.email,
      driverId: req.user.driverId,
      hasDriverId: !!req.user.driverId
    });

    console.log(`📍 [LOCATION-UPDATE] Datos de ubicación recibidos:`, {
      lat: locationData.lat,
      lng: locationData.lng,
      accuracy: locationData.accuracy,
      speed: locationData.speed,
      heading: locationData.heading,
      rideId: locationData.rideId
    });

    try {
      const driverId = req.user.driverId;
      console.log(`📍 [LOCATION-UPDATE] DriverId obtenido: ${driverId}`);

      if (!driverId) {
        console.log(`❌ [LOCATION-UPDATE] ERROR: Usuario no tiene driverId`);
        throw new NotFoundException({ error: 'USER_NOT_DRIVER', message: 'Usuario no es conductor' });
      }

      console.log(`📍 [LOCATION-UPDATE] Usando driverId: ${driverId} para actualizar ubicación`);

      // Actualizar ubicación usando el location tracking service
      await this.flow.updateDriverLocation(driverId, {
        lat: locationData.lat,
        lng: locationData.lng,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        rideId: locationData.rideId
      });

      return {
        success: true,
        message: 'Ubicación actualizada exitosamente',
        data: {
          driverId,
          location: {
            lat: locationData.lat,
            lng: locationData.lng
          },
          timestamp: new Date(),
          accuracy: locationData.accuracy
        }
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('go-online')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚗 Conductor se pone online (disponible para rides)',
    description: `
    **IMPORTANTE:** Cambia el estado del conductor a 'online' para que aparezca disponible en el sistema de matching.

    **¿Qué hace?**
    - Cambia status del conductor a 'online'
    - Verifica que el conductor esté verificado
    - Actualiza timestamp de última actividad

    **Después de ponerse online:**
    - El conductor aparecerá en búsquedas de matching
    - Podrá recibir solicitudes de viaje automáticamente
    - Debe actualizar su ubicación periódicamente

    **Notas importantes:**
    - Solo conductores verificados pueden ponerse online
    - Si hay un ride activo, no se puede poner offline
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor puesto online exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Conductor online exitosamente' },
        data: {
          type: 'object',
          properties: {
            driverId: { type: 'number', example: 7 },
            status: { type: 'string', example: 'online' },
            onlineAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Conductor no verificado'
  })
  async goOnline(@Req() req: any) {
    try {
      const driverId = req.user.driverId;
      if (!driverId) {
        throw new NotFoundException({ error: 'USER_NOT_DRIVER', message: 'Usuario no es conductor' });
      }

      const result = await this.flow.setDriverOnline(driverId);

      return {
        success: true,
        message: 'Conductor online exitosamente',
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('go-offline')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🔴 Conductor se pone offline (no disponible)',
    description: `
    **IMPORTANTE:** Cambia el estado del conductor a 'offline' para dejar de recibir solicitudes.

    **¿Qué hace?**
    - Cambia status del conductor a 'offline'
    - Cancela cualquier búsqueda activa
    - Mantiene ubicación para estadísticas

    **Notas importantes:**
    - Si hay un ride activo, no se puede poner offline
    - Las ubicaciones se mantienen para reporting
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor puesto offline exitosamente'
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede poner offline con ride activo'
  })
  async goOffline(@Req() req: any) {
    try {
      const driverId = req.user.driverId;
      if (!driverId) {
        throw new NotFoundException({ error: 'USER_NOT_DRIVER', message: 'Usuario no es conductor' });
      }

      const result = await this.flow.setDriverOffline(driverId);

      return {
        success: true,
        message: 'Conductor offline exitosamente',
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) // Sin DriverGuard para que funcione aunque no sea conductor
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '👤 Información del usuario/conductor autenticado',
    description: `
    **DEBUGGING:** Endpoint para verificar que el JWT token contiene la información correcta.

    **Muestra:**
    - Información del usuario del JWT token
    - Información del conductor si existe
    - Estado de verificación y online/offline
    - Diagnóstico completo para debugging

    **Útil para:**
    - Verificar que el JWT token tiene driverId
    - Confirmar que el conductor existe en BD
    - Diagnosticar problemas de autenticación
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario/conductor',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string' },
            driverId: { type: 'number', nullable: true },
            driverStatus: { type: 'string', nullable: true },
            driverVerificationStatus: { type: 'string', nullable: true },
          }
        },
        driver: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            verificationStatus: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          }
        },
        diagnostics: {
          type: 'object',
          properties: {
            hasDriverId: { type: 'boolean' },
            driverExistsInDb: { type: 'boolean' },
            isOnline: { type: 'boolean' },
            isVerified: { type: 'boolean' },
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getMe(@Req() req: any) {
    console.log(`👤 [DRIVER-ME] === CONSULTA ESTADO CONDUCTOR ===`);
    console.log(`👤 [DRIVER-ME] Usuario del JWT:`, req.user);

    try {
      const user = req.user;

      // Buscar información detallada del conductor si existe
      let driver: any = null;
      if (user.driverId) {
        driver = await this.prisma.driver.findUnique({
          where: { id: user.driverId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            verificationStatus: true,
          }
        });
      }

      // Diagnóstico completo
      const diagnostics = {
        hasDriverId: !!user.driverId,
        driverExistsInDb: !!driver,
        isOnline: driver?.status === 'online',
        isVerified: driver?.verificationStatus === 'approved',
        driverIdFromJwt: user.driverId,
        driverIdFromDb: driver?.id,
        driverIdsMatch: user.driverId === driver?.id
      };

      const result = {
        user: user,
        driver: driver,
        diagnostics: diagnostics,
        timestamp: new Date(),
      };

      console.log(`👤 [DRIVER-ME] Diagnóstico completo:`, diagnostics);
      console.log(`👤 [DRIVER-ME] Driver info:`, {
        id: driver?.id,
        status: driver?.status,
        verificationStatus: driver?.verificationStatus,
        currentLatitude: driver?.currentLatitude,
        currentLongitude: driver?.currentLongitude,
        isLocationActive: driver?.isLocationActive,
        lastLocationUpdate: driver?.lastLocationUpdate
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post(':rideId/start')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor inicia el viaje',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.

    **¿Qué hace?**
    - Marca el inicio oficial del viaje
    - Cambia el status del viaje a 'in_progress'
    - Inicia el cobro por tiempo y distancia
    - Notifica al cliente que el viaje ha comenzado

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `,
  })
  async start(@Param('rideId') rideId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return cached.value;
    }
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    const res = await this.flow.driverStartTransport(
      Number(rideId),
      req.driver.id,
      String(req.user.id),
    );
    if (key) this.idemp.set(key, 200, res);
    return res;
  }

  @Post(':rideId/complete')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor completa el viaje y confirma tarifa',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.

    **¿Qué hace?**
    - Marca el viaje como completado
    - Confirma la tarifa final del viaje
    - Procesa el pago del cliente
    - Libera al conductor para nuevos viajes

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `,
  })
  @ApiBody({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        fare: {
          type: 'number',
          example: 25.5,
          description: 'Tarifa final del viaje',
        },
      },
      required: ['fare'],
    },
  })
  async complete(
    @Param('rideId') rideId: string,
    @Req() req: any,
    @Body() body: { fare: number },
  ) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    const ride = await this.flow.driverCompleteTransport(
      Number(rideId),
      req.driver.id,
      String(req.user.id),
      body.fare,
    );
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }

  @Post(':rideId/respond')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor responde a solicitud de viaje específica',
    description: `
    **NUEVO FLUJO DE MATCHING AUTOMÁTICO**

    Después de que un usuario confirma un conductor encontrado por matching automático,
    el conductor recibe una notificación y debe responder dentro de 2 minutos.

    **¿Qué hace?**
    - ✅ Valida que el conductor tenga una solicitud pendiente para este viaje
    - ✅ Si **acepta**: Asigna el viaje al conductor y notifica al usuario
    - ✅ Si **rechaza**: Libera el viaje para que el usuario busque otro conductor
    - ✅ Actualiza el estado del viaje apropiadamente

    **Tiempo límite:**
    - El conductor tiene 2 minutos para responder
    - Después de ese tiempo, la solicitud expira automáticamente
    - El usuario puede buscar otro conductor si expira

    **Flujo de estados:**
    - \`driver_confirmed\` → \`accepted\` (si acepta)
    - \`driver_confirmed\` → \`pending\` (si rechaza o expira)

    **Notificaciones enviadas:**
    - Al usuario: Aceptación/rechazo del conductor
    - WebSocket events para tracking en tiempo real
    `,
  })
  @ApiBody({
    type: DriverResponseDto,
    examples: {
      accept_ride: {
        summary: '✅ Aceptar solicitud de viaje',
        description:
          'Conductor acepta el viaje y está listo para recoger al pasajero',
        value: {
          response: 'accept',
          estimatedArrivalMinutes: 5,
        },
      },
      reject_ride: {
        summary: '❌ Rechazar solicitud de viaje',
        description: 'Conductor rechaza el viaje por alguna razón específica',
        value: {
          response: 'reject',
          reason: 'Estoy muy lejos del punto de recogida',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta del conductor procesada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            driverId: { type: 'number', example: 1 },
            response: {
              type: 'string',
              example: 'accept',
              enum: ['accept', 'reject'],
            },
            status: { type: 'string', example: 'accepted' },
            message: { type: 'string', example: 'Viaje aceptado exitosamente' },
            userNotified: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de respuesta inválidos',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'INVALID_RESPONSE' },
        message: {
          type: 'string',
          example: 'Respuesta debe ser "accept" o "reject"',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de viaje no encontrada o expirada',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'REQUEST_NOT_FOUND' },
        message: {
          type: 'string',
          example: 'No hay solicitud pendiente para este viaje',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El viaje ya fue asignado a otro conductor',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'RIDE_ALREADY_ASSIGNED' },
        message: {
          type: 'string',
          example: 'Este viaje ya fue aceptado por otro conductor',
        },
      },
    },
  })
  async respondToRideRequest(
    @Param('rideId') rideId: string,
    @Body() body: DriverResponseDto,
    @Req() req: any,
  ) {
    try {
      // DriverGuard ya validó que el usuario es conductor y agregó req.driver
      const result = await this.flow.handleDriverRideResponse(
        Number(rideId),
        req.driver.id,
        body.response,
        body.reason,
        body.estimatedArrivalMinutes,
      );

      return { data: result };
    } catch (error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        throw new NotFoundException({
          error: 'REQUEST_NOT_FOUND',
          message: 'No hay solicitud pendiente para este viaje',
        });
      }
      if (error.message === 'RIDE_ALREADY_ASSIGNED') {
        throw new ConflictException({
          error: 'RIDE_ALREADY_ASSIGNED',
          message: 'Este viaje ya fue aceptado por otro conductor',
        });
      }
      throw error;
    }
  }

  // =========================================
  // SISTEMA DE REPORTES Y CANCELACIONES
  // =========================================

  @Post(':rideId/report-issue')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reportar problema durante un viaje',
    description:
      'Sistema de reportes de conductores. Permite reportar trafico, averias, accidentes, etc.',
  })
  @ApiBody({
    type: ReportIssueDto,
    description: 'Detalles del problema reportado',
  })
  async reportIssue(
    @Param('rideId') rideId: string,
    @Body() body: ReportIssueDto,
    @Req() req: any,
  ) {
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    const driverId = req.driver.id;

    const report: IssueReport = {
      type: body.type,
      description: body.description,
      severity: body.severity,
      location: body.location,
      estimatedDelay: body.estimatedDelay,
      requiresCancellation: body.requiresCancellation,
    };

    const result = await this.reports.reportIssue(
      Number(rideId),
      driverId,
      report,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post(':rideId/cancel')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor cancela viaje con reembolso automático',
    description:
      'Cancela viaje y procesa reembolso automático al pasajero. Solo para situaciones excepcionales.',
  })
  @ApiBody({
    type: CancelRideDto,
    description: 'Detalles de la cancelación',
  })
  async cancelRide(
    @Param('rideId') rideId: string,
    @Body() body: CancelRideDto,
    @Req() req: any,
  ) {
    // DriverGuard ya validó que el usuario es conductor y agregó req.driver
    const driverId = req.driver.id;

    const result = await this.flow.cancelRideWithRefund(
      Number(rideId),
      driverId,
      {
        reason: body.reason,
        location: body.location,
        notes: body.notes,
        refundType: 'driver_cancellation',
      },
    );

    return {
      success: true,
      data: result,
    };
  }

  // =========================================
  // ENDPOINT PARA SIMULAR SOLICITUDES DE VIAJE
  // =========================================

  @Post('simulate-request')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🎯 Simular solicitud de viaje automática (para testing)',
    description: `
    **IMPORTANTE:** Este endpoint es exclusivamente para TESTING y desarrollo.

    **¿Qué hace?**
    - Crea un viaje simulado con datos de prueba (Bogotá)
    - Busca un usuario aleatorio de la base de datos
    - Asigna automáticamente el viaje al conductor autenticado
    - Envía notificación al conductor como si fuera matching automático
    - El conductor podrá ver la solicitud en \`GET /pending-requests\`

    **Datos de prueba usados:**
    - Origen: Parque de la 93, Bogotá
    - Destino: Zona Rosa, Bogotá
    - Tarifa: $18.50
    - Tiempo estimado: 20 minutos
    - Tier: Premium

    **Después de simular:**
    - Usa \`GET /pending-requests\` para ver la solicitud
    - Responde con \`POST /{rideId}/respond\` (accept/reject)

    **Notas importantes:**
    - Solo funciona si hay usuarios activos en la BD
    - Excluye al conductor actual como posible pasajero
    - La solicitud expira en 2 minutos
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud simulada creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 456 },
            driverId: { type: 'number', example: 1 },
            userId: { type: 'number', example: 123 },
            userName: { type: 'string', example: 'María García' },
            originAddress: {
              type: 'string',
              example: 'Parque de la 93, Bogotá',
            },
            destinationAddress: {
              type: 'string',
              example: 'Zona Rosa, Bogotá',
            },
            farePrice: { type: 'number', example: 18.5 },
            tierName: { type: 'string', example: 'Premium' },
            status: { type: 'string', example: 'driver_confirmed' },
            message: {
              type: 'string',
              example: 'Solicitud simulada creada exitosamente',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:02:00.000Z',
            },
            notificationSent: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No hay usuarios disponibles para simular el viaje',
  })
  async simulateRequest(@Req() req: any) {
    try {
      // DriverGuard ya validó que el usuario es conductor y agregó req.driver
      const driverId = req.driver.id;
      const result = await this.flow.simulateRideRequest(driverId);
      return { data: result };
    } catch (error) {
      if (error.message === 'NO_USERS_AVAILABLE') {
        throw new NotFoundException({
          error: 'NO_USERS_AVAILABLE',
          message: 'No hay usuarios activos disponibles para simular el viaje',
        });
      }
      throw error;
    }
  }

  // =========================================
  // ENDPOINT PARA CONVERTIR USUARIO EN CONDUCTOR
  // =========================================

  @Post('become-driver')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚗 Convertir usuario actual en conductor (para testing)',
    description: `
    **IMPORTANTE:** Este endpoint es para TESTING. Convierte al usuario autenticado en un conductor.

    **¿Qué hace?**
    - Verifica si el usuario ya es conductor
    - Si no lo es, crea un registro de conductor con datos básicos
    - Establece el status inicial como 'online'

    **Campos que se crean:**
    - firstName: Del nombre del usuario
    - lastName: 'Driver' (por defecto)
    - carModel: 'Toyota Camry' (por defecto)
    - licensePlate: 'TEST-123' (por defecto)
    - carSeats: 4 (por defecto)
    - status: 'online'
    - verificationStatus: 'verified'

    **Después de usar este endpoint:**
    - El usuario podrá usar todos los endpoints de conductores
    - Podrá ver viajes disponibles con /available
    - Podrá aceptar viajes con /accept
    - Podrá marcar arrived, start, complete
    `,
  })
  @ApiBody({
    type: SetDriverAvailabilityDto,
    examples: {
      default: {
        summary: 'Convertir a conductor con configuración por defecto',
        description: 'Se creará un conductor con datos básicos de prueba',
        value: { status: 'online' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario convertido exitosamente en conductor',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'Test' },
            lastName: { type: 'string', example: 'Driver' },
            status: { type: 'string', example: 'online' },
            message: {
              type: 'string',
              example: 'User successfully converted to driver',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya es un conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User is already a driver' },
      },
    },
  })
  async becomeDriver(@Req() req: any, @Body() body: SetDriverAvailabilityDto) {
    console.log(
      `🚗 Converting user ${req.user.id} to driver in TransportDriverController`,
    );

    // Check if user is already a driver
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id: req.user.id },
    });

    if (existingDriver) {
      return {
        statusCode: 409,
        message: 'User is already a driver',
        data: existingDriver,
      };
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create driver record
    const driver = await this.prisma.driver.create({
      data: {
        id: req.user.id,
        firstName: user.name?.split(' ')[0] || 'Test',
        lastName: user.name?.split(' ')[1] || 'Driver',
        carModel: 'Toyota Camry',
        licensePlate: 'TEST-123',
        carSeats: 4,
        status: body.status,
        verificationStatus: 'verified',
        canDoDeliveries: true,
      },
    });

    console.log(
      `✅ User ${req.user.id} converted to driver with ID: ${driver.id}`,
    );

    return {
      data: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
        message: 'User successfully converted to driver',
      },
    };
  }
}
