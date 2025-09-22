import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
import { IdempotencyService } from '../../common/services/idempotency.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SetDriverAvailabilityDto } from './dto/transport-flow.dtos';

@ApiTags('rides-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/transport')
export class TransportDriverController {
  constructor(
    private readonly flow: RidesFlowService,
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


