import { Body, Controller, Get, Param, Post, Req, UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { DriverReportsService, IssueReport } from './driver-reports.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SetDriverAvailabilityDto, DriverResponseDto, ReportIssueDto, CancelRideDto } from './dto/transport-flow.dtos';

@ApiTags('rides-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/transport')
export class TransportDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly reports: DriverReportsService,
    private readonly idemp: IdempotencyService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':rideId/accept')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor acepta un viaje',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

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
    `
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
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o usuario no es conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Usuario no registrado como conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'User is not a driver' }
      }
    }
  })
  async accept(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    // Idempotency
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const ride = await this.flow.driverAcceptTransport(Number(rideId), Number(req.user.id), String(req.user.id));
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }

  @Post(':rideId/arrived')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor llega al punto de recogida',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca que el conductor ha llegado al punto de recogida
    - Notifica al cliente que el conductor está esperando
    - Cambia el status del viaje a 'arrived'

    **Después de marcar arrived:**
    - Esperar confirmación del cliente
    - Usar el endpoint 'start' cuando el cliente esté listo
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Llegada confirmada exitosamente',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Driver arrived at pickup location' }
      }
    }
  })
  async arrived(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    return this.flow.driverArrivedTransport(Number(rideId), Number(req.user.id), String(req.user.id));
  }

  @Get('available')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Ver viajes disponibles para conductores',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué devuelve?**
    - Lista de viajes pendientes de asignación
    - Información completa de cada viaje (origen, destino, tarifa, etc.)
    - Solo viajes que coinciden con la ubicación del conductor

    **Uso típico:**
    - Conductor consulta viajes disponibles
    - Selecciona un viaje para aceptar
    - Usa el endpoint 'accept' con el rideId correspondiente
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Viajes disponibles obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rideId: { type: 'number', example: 5 },
              originAddress: { type: 'string', example: 'Calle 123, Bogotá' },
              destinationAddress: { type: 'string', example: 'Carrera 7, Medellín' },
              farePrice: { type: 'string', example: '25.00' },
              tier: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Premium' },
                  baseFare: { type: 'string', example: '6.00' }
                }
              }
            }
          }
        }
      }
    }
  })
  async available(@Req() req: any) {
    // Get driver's vehicle type
    const driver = await this.prisma.driver.findUnique({
      where: { id: req.user.id },
      select: { vehicleTypeId: true }
    });

    if (!driver?.vehicleTypeId) {
      throw new Error('Driver vehicle type not configured');
    }

    // Leverage RidesService through flow service with vehicle type filtering
    const list = await (this.flow as any)['ridesService'].getRideRequests(
      0, // Default lat (will be filtered by vehicle type only)
      0, // Default lng (will be filtered by vehicle type only)
      1000, // Large radius to get all rides (filtered by vehicle type)
      driver.vehicleTypeId // Filter by driver's vehicle type
    );
    return { data: list };
  }

  @Post(':rideId/start')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor inicia el viaje',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca el inicio oficial del viaje
    - Cambia el status del viaje a 'in_progress'
    - Inicia el cobro por tiempo y distancia
    - Notifica al cliente que el viaje ha comenzado

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
  async start(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return cached.value;
    }
    const res = await this.flow.driverStartTransport(Number(rideId), Number(req.user.id), String(req.user.id));
    if (key) this.idemp.set(key, 200, res);
    return res;
  }

  @Post(':rideId/complete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor completa el viaje y confirma tarifa',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca el viaje como completado
    - Confirma la tarifa final del viaje
    - Procesa el pago del cliente
    - Libera al conductor para nuevos viajes

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
  @ApiBody({
    type: Object,
    schema: {
      type: 'object',
      properties: {
        fare: {
          type: 'number',
          example: 25.50,
          description: 'Tarifa final del viaje'
        }
      },
      required: ['fare']
    }
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
    const ride = await this.flow.driverCompleteTransport(
      Number(rideId),
      Number(req.user.id),
      String(req.user.id),
      body.fare,
    );
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }

  @Post(':rideId/respond')
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
    `
  })
  @ApiBody({
    type: DriverResponseDto,
    examples: {
      'accept_ride': {
        summary: '✅ Aceptar solicitud de viaje',
        description: 'Conductor acepta el viaje y está listo para recoger al pasajero',
        value: {
          response: 'accept',
          estimatedArrivalMinutes: 5
        }
      },
      'reject_ride': {
        summary: '❌ Rechazar solicitud de viaje',
        description: 'Conductor rechaza el viaje por alguna razón específica',
        value: {
          response: 'reject',
          reason: 'Estoy muy lejos del punto de recogida'
        }
      }
    }
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
            response: { type: 'string', example: 'accept', enum: ['accept', 'reject'] },
            status: { type: 'string', example: 'accepted' },
            message: { type: 'string', example: 'Viaje aceptado exitosamente' },
            userNotified: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de respuesta inválidos',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'INVALID_RESPONSE' },
        message: { type: 'string', example: 'Respuesta debe ser "accept" o "reject"' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud de viaje no encontrada o expirada',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'REQUEST_NOT_FOUND' },
        message: { type: 'string', example: 'No hay solicitud pendiente para este viaje' }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'El viaje ya fue asignado a otro conductor',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'RIDE_ALREADY_ASSIGNED' },
        message: { type: 'string', example: 'Este viaje ya fue aceptado por otro conductor' }
      }
    }
  })
  async respondToRideRequest(
    @Param('rideId') rideId: string,
    @Body() body: DriverResponseDto,
    @Req() req: any
  ) {
    try {
      const result = await this.flow.handleDriverRideResponse(
        Number(rideId),
        Number(req.user.id),
        body.response,
        body.reason,
        body.estimatedArrivalMinutes
      );

      return { data: result };
    } catch (error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        throw new NotFoundException({
          error: 'REQUEST_NOT_FOUND',
          message: 'No hay solicitud pendiente para este viaje'
        });
      }
      if (error.message === 'RIDE_ALREADY_ASSIGNED') {
        throw new ConflictException({
          error: 'RIDE_ALREADY_ASSIGNED',
          message: 'Este viaje ya fue aceptado por otro conductor'
        });
      }
      throw error;
    }
  }

  // =========================================
  // SISTEMA DE REPORTES Y CANCELACIONES
  // =========================================

  @Post(':rideId/report-issue')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reportar problema durante un viaje',
    description: 'Sistema de reportes de conductores. Permite reportar trafico, averias, accidentes, etc.'
  })
  @ApiBody({
    type: ReportIssueDto,
    description: 'Detalles del problema reportado'
  })
  async reportIssue(
    @Param('rideId') rideId: string,
    @Body() body: ReportIssueDto,
    @Req() req: any
  ) {
    const driverId = req.user.driverId;
    if (!driverId) {
      throw new NotFoundException('Usuario no es conductor');
    }

    const report: IssueReport = {
      type: body.type,
      description: body.description,
      severity: body.severity,
      location: body.location,
      estimatedDelay: body.estimatedDelay,
      requiresCancellation: body.requiresCancellation
    };

    const result = await this.reports.reportIssue(
      Number(rideId),
      driverId,
      report
    );

    return {
      success: true,
      data: result
    };
  }

  @Post(':rideId/cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor cancela viaje con reembolso automático',
    description: 'Cancela viaje y procesa reembolso automático al pasajero. Solo para situaciones excepcionales.'
  })
  @ApiBody({
    type: CancelRideDto,
    description: 'Detalles de la cancelación'
  })
  async cancelRide(
    @Param('rideId') rideId: string,
    @Body() body: CancelRideDto,
    @Req() req: any
  ) {
    const driverId = req.user.driverId;
    if (!driverId) {
      throw new NotFoundException('Usuario no es conductor');
    }

    const result = await this.flow.cancelRideWithRefund(
      Number(rideId),
      driverId,
      {
        reason: body.reason,
        location: body.location,
        notes: body.notes,
        refundType: 'driver_cancellation'
      }
    );

    return {
      success: true,
      data: result
    };
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
    `
  })
  @ApiBody({
    type: SetDriverAvailabilityDto,
    examples: {
      'default': {
        summary: 'Convertir a conductor con configuración por defecto',
        description: 'Se creará un conductor con datos básicos de prueba',
        value: { status: 'online' }
      }
    }
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
            message: { type: 'string', example: 'User successfully converted to driver' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya es un conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User is already a driver' }
      }
    }
  })
  async becomeDriver(@Req() req: any, @Body() body: SetDriverAvailabilityDto) {
    console.log(`🚗 Converting user ${req.user.id} to driver in TransportDriverController`);

    // Check if user is already a driver
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id: req.user.id }
    });

    if (existingDriver) {
      return {
        statusCode: 409,
        message: 'User is already a driver',
        data: existingDriver
      };
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
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
        canDoDeliveries: true
      }
    });

    console.log(`✅ User ${req.user.id} converted to driver with ID: ${driver.id}`);

    return {
      data: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
        message: 'User successfully converted to driver'
      }
    };
  }
}


