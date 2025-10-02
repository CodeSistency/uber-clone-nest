import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationTrackingService } from '../../redis/location-tracking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import {
  ConfirmRidePaymentDto,
  DefineRideDto,
  RateRideFlowDto,
  SelectVehicleDto,
  MatchBestDriverDto,
  ConfirmDriverDto,
  PayWithMultipleMethodsDto,
  GeneratePaymentReferenceDto,
  ConfirmPaymentWithReferenceDto,
} from './dto/transport-flow.dtos';
import { PaymentsService } from '../../payments/payments.service';

@ApiTags('rides-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/transport')
export class TransportClientController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  @Get('tiers')
  @ApiOperation({
    summary: 'Get ride tiers organized by vehicle type',
    description:
      'Retrieve all available ride tiers grouped by compatible vehicle types for easy frontend consumption.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns ride tiers grouped by vehicle type',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            car: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Economy' },
                  baseFare: { type: 'number', example: 2.5 },
                  perMinuteRate: { type: 'number', example: 0.15 },
                  perMileRate: { type: 'number', example: 1.25 },
                  imageUrl: { type: 'string', example: 'https://...' },
                  vehicleTypeId: { type: 'number', example: 1 },
                  vehicleTypeName: { type: 'string', example: 'Carro' },
                  vehicleTypeIcon: { type: 'string', example: '🚗' },
                },
              },
            },
            motorcycle: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Economy' },
                  baseFare: { type: 'number', example: 2.5 },
                  vehicleTypeId: { type: 'number', example: 2 },
                  vehicleTypeName: { type: 'string', example: 'Moto' },
                  vehicleTypeIcon: { type: 'string', example: '🏍️' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideTiers(): Promise<{ data: any }> {
    const tiersByVehicleType =
      await this.flow.getAvailableRideTiersByVehicleType();
    return { data: tiersByVehicleType };
  }

  @Get('tiers/:vehicleTypeId')
  @ApiOperation({
    summary: 'Get available tiers for a specific vehicle type',
    description:
      'Retrieve ride tiers that are available for a specific vehicle type (car, motorcycle, etc.)',
  })
  @ApiParam({
    name: 'vehicleTypeId',
    description: 'ID of the vehicle type',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns available tiers for the vehicle type',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Economy' },
              baseFare: { type: 'number', example: 2.5 },
              perMinuteRate: { type: 'number', example: 0.15 },
              perMileRate: { type: 'number', example: 1.25 },
              imageUrl: { type: 'string', example: 'https://...' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid vehicle type ID' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getTiersForVehicleType(
    @Param('vehicleTypeId') vehicleTypeId: string,
  ): Promise<{ data: any }> {
    const tiers = await this.flow.getAvailableTiersForVehicleType(
      Number(vehicleTypeId),
    );
    return { data: tiers };
  }

  @Post('define-ride')
  @ApiOperation({
    summary: 'Define transport ride (origin/destination) and create ride',
    description: `
    Creates a new transport ride request with origin and destination details.

    **Flow:**
    1. Validates ride parameters and user authentication
    2. Creates ride in database with 'pending' status
    3. Returns ride ID for payment processing
    4. After payment confirmation, drivers will be notified automatically

    **Real-time Events (after payment):**
    - \`ride:requested\` - Broadcast to nearby drivers (only after payment confirmed)
    - \`ride:accepted\` - When driver accepts the ride
    - \`ride:location\` - Live driver location updates

    **Important:** Drivers are only notified after payment is confirmed to ensure
    users pay before drivers are engaged.
    `,
  })
  @ApiBody({
    type: DefineRideDto,
    examples: {
      city_ride: {
        summary: 'Basic city ride',
        value: {
          originAddress: 'Calle 123 #45-67, Bogotá, Colombia',
          originLat: 4.6097,
          originLng: -74.0817,
          destinationAddress: 'Carrera 7 #23-45, Medellín, Colombia',
          destinationLat: 6.2518,
          destinationLng: -75.5636,
          minutes: 25,
          tierId: 1,
        },
      },
      airport_pickup: {
        summary: 'Airport pickup with vehicle type',
        value: {
          originAddress: 'Aeropuerto El Dorado, Bogotá',
          originLat: 4.7016,
          originLng: -74.1469,
          destinationAddress: 'Hotel Casa Deco, Zona Rosa',
          destinationLat: 4.6584,
          destinationLng: -74.0548,
          minutes: 45,
          tierId: 2,
          vehicleTypeId: 1,
        },
      },
    },
  })
  async defineRide(@Body() body: DefineRideDto, @Req() req: any) {
    const ride = await this.flow.defineTransportRide({
      userId: Number(req.user.id),
      origin: {
        address: body.originAddress,
        lat: body.originLat,
        lng: body.originLng,
      },
      destination: {
        address: body.destinationAddress,
        lat: body.destinationLat,
        lng: body.destinationLng,
      },
      minutes: body.minutes,
      tierId: body.tierId,
      vehicleTypeId: body.vehicleTypeId,
    });
    return { data: ride };
  }

  @Post(':rideId/select-vehicle')
  @ApiOperation({
    summary: 'Seleccionar tier y tipo de vehículo para un viaje existente',
    description: `
    Permite actualizar el tier (nivel de servicio) y/o el tipo de vehículo para un viaje que ya ha sido creado.

    **Casos de uso:**
    - Cambiar de UberX a UberXL
    - Cambiar de carro a moto
    - Solo actualizar uno de los campos (tierId o vehicleTypeId)

    **Campos opcionales:**
    - Si no se envía tierId, mantiene el valor actual
    - Si no se envía vehicleTypeId, mantiene el valor actual
    - Si no se envía ninguno, retorna el viaje sin cambios

    **Tiers disponibles:**
    - 1: Economy (Comfort)
    - 2: Premium
    - 3: Luxury

    **Tipos de vehículo:**
    - 1: Carro
    - 2: Moto
    - 3: Bicicleta
    - 4: Camión

    **Notas importantes para Swagger:**
    - Los campos son opcionales, puedes enviar un objeto vacío {}
    - Si quieres mantener un campo sin cambios, simplemente no lo incluyas en el JSON
    - El endpoint maneja automáticamente valores null como undefined
    `,
  })
  @ApiBody({
    type: SelectVehicleDto,
    examples: {
      no_changes: {
        summary:
          'Sin cambios (retorna datos actuales) - RECOMENDADO PARA PRUEBAS',
        description:
          'Envía un objeto vacío para obtener los datos actuales sin hacer cambios',
        value: {},
      },
      update_tier: {
        summary: 'Actualizar solo el tier',
        value: {
          tierId: 2,
        },
      },
      update_vehicle: {
        summary: 'Actualizar solo el tipo de vehículo',
        value: {
          vehicleTypeId: 1,
        },
      },
      update_both: {
        summary: 'Actualizar tier y vehículo',
        value: {
          tierId: 2,
          vehicleTypeId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo seleccionado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 5 },
            originAddress: {
              type: 'string',
              example: 'Calle 123 #45-67, Bogotá, Colombia',
            },
            destinationAddress: {
              type: 'string',
              example: 'Carrera 7 #23-45, Medellín, Colombia',
            },
            tierId: { type: 'number', example: 2 },
            requestedVehicleTypeId: {
              type: 'number',
              example: 1,
              nullable: true,
            },
            tier: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                name: { type: 'string', example: 'Premium' },
                baseFare: { type: 'string', example: '6' },
                perMinuteRate: { type: 'string', example: '0.35' },
                perMileRate: { type: 'string', example: '3' },
              },
            },
            requestedVehicleType: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Carro' },
                displayName: { type: 'string', example: 'Carro' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  @ApiResponse({ status: 404, description: 'Viaje no encontrado' })
  async selectVehicle(
    @Param('rideId') rideId: string,
    @Body() body: SelectVehicleDto,
  ) {
    console.log(`🚗 Transport Client Controller - selectVehicle called`);
    console.log(
      `📊 Parameters: rideId=${rideId}, body=`,
      JSON.stringify(body, null, 2),
    );
    console.log(`📝 Body type:`, typeof body);
    console.log(`🔍 Body keys:`, Object.keys(body || {}));
    console.log(`❓ tierId defined:`, body?.tierId !== undefined);
    console.log(`❓ vehicleTypeId defined:`, body?.vehicleTypeId !== undefined);

    const numericRideId = Number(rideId);
    console.log(`🔢 Converted rideId: ${numericRideId}`);

    // Handle Swagger sending null values instead of undefined
    const tierId =
      body?.tierId !== null && body?.tierId !== undefined
        ? body.tierId
        : undefined;
    const vehicleTypeId =
      body?.vehicleTypeId !== null && body?.vehicleTypeId !== undefined
        ? body.vehicleTypeId
        : undefined;

    console.log(
      `🔧 Processed values: tierId=${tierId}, vehicleTypeId=${vehicleTypeId}`,
    );

    try {
      const ride = await this.flow.selectTransportVehicle(
        numericRideId,
        tierId,
        vehicleTypeId,
      );
      console.log(`✅ selectVehicle completed successfully`);
      return { data: ride };
    } catch (error) {
      console.error(`❌ selectVehicle failed:`, error);
      throw error;
    }
  }

  @Post('match-best-driver')
  @ApiOperation({
    summary: 'Encontrar el mejor conductor disponible automáticamente',
    description: `
    **NUEVO FLUJO DE MATCHING AUTOMÁTICO**

    Este endpoint reemplaza el flujo anterior de "lista de conductores".
    El sistema automáticamente encuentra y selecciona el mejor conductor disponible
    basado en algoritmos de optimización que consideran:

    **Criterios de Matching:**
    - ✅ **Distancia**: Conductores más cercanos tienen prioridad
    - ✅ **Calificación**: Conductores con mejor rating
    - ✅ **Tiempo estimado**: Menor tiempo de llegada
    - ✅ **Disponibilidad**: Solo conductores online y verificados
    - ✅ **Compatibilidad**: Vehículos compatibles con el tier solicitado

    **Algoritmo de Puntuación:**
    \`\`\`
    Score = (1/distance) × 40 + rating × 35 + (1/estimated_time) × 25
    \`\`\`

    **Flujo típico:**
    1. Usuario define viaje (origen/destino + tier)
    2. Sistema busca mejor conductor automáticamente
    3. Usuario ve detalles del conductor encontrado
    4. Usuario confirma o busca otro conductor
    5. Sistema notifica al conductor seleccionado

    **Estados del matching:**
    - \`matching\`: Buscando conductor óptimo
    - \`found\`: Conductor encontrado exitosamente
    - \`no_drivers\`: No hay conductores disponibles
    `,
  })
  @ApiBody({
    type: MatchBestDriverDto,
    examples: {
      basic_matching: {
        summary: 'Matching básico con ubicación',
        description: 'Busca el mejor conductor en un radio de 5km',
        value: {
          lat: 4.6097,
          lng: -74.0817,
        },
      },
      tier_specific: {
        summary: 'Matching con tier específico',
        description: 'Busca conductor Economy (tier 1) en zona específica',
        value: {
          lat: 4.6097,
          lng: -74.0817,
          tierId: 1,
          radiusKm: 3,
        },
      },
      vehicle_specific: {
        summary: 'Matching con tipo de vehículo específico',
        description: 'Busca conductor con moto (vehicleType 2)',
        value: {
          lat: 10.4998,
          lng: -66.8517,
          vehicleTypeId: 2,
          radiusKm: 8,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mejor conductor encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            matchedDriver: {
              $ref: '#/components/schemas/MatchedDriverDto',
            },
            searchCriteria: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 4.6097 },
                lng: { type: 'number', example: -74.0817 },
                tierId: { type: 'number', example: 1, nullable: true },
                vehicleTypeId: { type: 'number', example: 1, nullable: true },
                radiusKm: { type: 'number', example: 5 },
                searchDuration: {
                  type: 'number',
                  example: 1.2,
                  description: 'Tiempo de búsqueda en segundos',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros de búsqueda inválidos' })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron conductores disponibles',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'NO_DRIVERS_AVAILABLE' },
        message: {
          type: 'string',
          example: 'No hay conductores disponibles en tu área',
        },
        searchCriteria: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            radiusKm: { type: 'number' },
            triedTierIds: { type: 'array', items: { type: 'number' } },
            triedVehicleTypeIds: { type: 'array', items: { type: 'number' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async matchBestDriver(@Body() body: MatchBestDriverDto, @Req() req: any) {
    console.log(`🎯 [CLIENT] === INICIO MATCH BEST DRIVER ===`);
    console.log(`🎯 [CLIENT] Usuario autenticado:`, {
      userId: req.user.id,
      email: req.user.email,
      driverId: req.user.driverId,
    });
    console.log(`🎯 [CLIENT] Datos de matching:`, body);

    try {
      console.log(`🎯 [CLIENT] Llamando a findBestDriverMatch...`);
      const result = await this.flow.findBestDriverMatch({
        lat: body.lat,
        lng: body.lng,
        tierId: body.tierId,
        vehicleTypeId: body.vehicleTypeId,
        radiusKm: body.radiusKm || 5,
      });

      console.log(`✅ [CLIENT] Matching completado exitosamente:`, {
        matchedDriver: result?.matchedDriver?.driver?.driverId,
        matchScore: result?.matchedDriver?.matchScore,
        estimatedArrival: result?.matchedDriver?.location?.estimatedArrival,
      });

      return { data: result };
    } catch (error) {
      if (error.message === 'NO_DRIVERS_AVAILABLE') {
        throw new NotFoundException({
          error: 'NO_DRIVERS_AVAILABLE',
          message: 'No hay conductores disponibles en tu área',
          searchCriteria: {
            lat: body.lat,
            lng: body.lng,
            radiusKm: body.radiusKm || 5,
            triedTierIds: body.tierId ? [body.tierId] : [],
            triedVehicleTypeIds: body.vehicleTypeId ? [body.vehicleTypeId] : [],
          },
        });
      }
      throw error;
    }
  }

  @Post(':rideId/confirm-driver')
  @ApiOperation({
    summary: 'Confirmar conductor encontrado y enviar solicitud',
    description: `
    **CONFIRMACIÓN DEL MATCHING AUTOMÁTICO**

    Después de que el sistema encuentra el mejor conductor automáticamente,
    el usuario debe confirmar que quiere proceder con ese conductor.

    **¿Qué hace?**
    - ✅ Valida que el conductor esté disponible
    - ✅ Asocia el conductor al viaje
    - ✅ Envía notificación push/SMS al conductor
    - ✅ Actualiza estado del viaje a 'driver_confirmed'
    - ✅ Inicia temporizador de respuesta (2 minutos)

    **Flujo:**
    1. Usuario ve conductor encontrado por matching automático
    2. Usuario confirma conductor → Este endpoint
    3. Sistema notifica al conductor inmediatamente
    4. Conductor tiene 2 minutos para responder
    5. Si conductor acepta → Viaje confirmado
    6. Si conductor rechaza o no responde → Usuario puede buscar otro

    **Notificaciones enviadas:**
    - Push notification al conductor
    - SMS al conductor (si habilitado)
    - WebSocket event al conductor: \`driver:ride-request\`
    `,
  })
  @ApiBody({
    type: ConfirmDriverDto,
    examples: {
      basic_confirmation: {
        summary: 'Confirmación básica',
        description: 'Confirma el conductor encontrado sin notas adicionales',
        value: {
          driverId: 1,
        },
      },
      confirmation_with_notes: {
        summary: 'Confirmación con notas',
        description: 'Confirma conductor con instrucciones especiales',
        value: {
          driverId: 1,
          notes:
            'Por favor llegue rápido, tengo prisa por llegar al aeropuerto',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor confirmado y notificación enviada',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            driverId: { type: 'number', example: 1 },
            status: { type: 'string', example: 'driver_confirmed' },
            message: {
              type: 'string',
              example: 'Conductor notificado exitosamente',
            },
            notificationSent: { type: 'boolean', example: true },
            responseTimeoutMinutes: { type: 'number', example: 2 },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de confirmación inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Conductor no encontrado o no disponible',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'DRIVER_NOT_AVAILABLE' },
        message: {
          type: 'string',
          example: 'El conductor ya no está disponible',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Viaje ya tiene conductor asignado',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'RIDE_ALREADY_HAS_DRIVER' },
        message: {
          type: 'string',
          example: 'Este viaje ya tiene un conductor asignado',
        },
      },
    },
  })
  async confirmDriver(
    @Param('rideId') rideId: string,
    @Body() body: ConfirmDriverDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.flow.confirmDriverForRide(
        Number(rideId),
        body.driverId,
        req.user.id,
        body.notes,
      );

      return { data: result };
    } catch (error) {
      if (error.message === 'DRIVER_NOT_AVAILABLE') {
        throw new NotFoundException({
          error: 'DRIVER_NOT_AVAILABLE',
          message: 'El conductor ya no está disponible',
        });
      }
      if (error.message === 'RIDE_ALREADY_HAS_DRIVER') {
        throw new ConflictException({
          error: 'RIDE_ALREADY_HAS_DRIVER',
          message: 'Este viaje ya tiene un conductor asignado',
        });
      }
      throw error;
    }
  }

  @Post(':rideId/confirm-payment')
  @ApiOperation({
    summary: 'Confirmar pago de viaje (Sistema Venezolano)',
    description: `
    **SISTEMA DE PAGOS VENEZOLANO**

    Este endpoint genera una referencia bancaria para el pago del viaje.
    El usuario debe realizar el pago externamente usando esta referencia.

    **Proceso:**
    1. Se valida el viaje y método de pago
    2. Se genera referencia bancaria única de 20 dígitos
    3. Se registra en base de datos con expiración de 24 horas
    4. Se notifica al usuario con instrucciones de pago

    **Métodos de pago soportados:**
    - \`transfer\`: Transferencia bancaria (requiere bankCode)
    - \`pago_movil\`: Pago móvil venezolano (requiere bankCode)
    - \`zelle\`: Transferencias Zelle
    - \`bitcoin\`: Pagos en Bitcoin
    - \`wallet\`: Pago con saldo de wallet (inmediato)
    - \`cash\`: Pago en efectivo (sin referencia)

    **Flujo de pago:**
    1. Usuario confirma pago → Obtiene referencia bancaria (excepto efectivo)
    2. Usuario paga usando la referencia en su app bancaria
    3. Usuario confirma pago realizado
    4. Sistema valida con el banco
    5. Viaje se confirma cuando pago es validado
    `,
  })
  @ApiBody({
    type: ConfirmRidePaymentDto,
    examples: {
      transfer_banco_venezuela: {
        summary: '💳 Transferencia bancaria - Banco de Venezuela',
        description:
          'Pago mediante transferencia bancaria tradicional en Banco de Venezuela',
        value: {
          method: 'transfer',
          bankCode: '0102',
        },
      },
      pago_movil_mercantil: {
        summary: '📱 Pago móvil - Banco Mercantil',
        description:
          'Pago mediante Pago Móvil venezolano usando Banco Mercantil',
        value: {
          method: 'pago_movil',
          bankCode: '0105',
        },
      },
      zelle_payment: {
        summary: '💰 Pago Zelle',
        description:
          'Transferencia internacional mediante Zelle (sin código bancario)',
        value: {
          method: 'zelle',
        },
      },
      bitcoin_payment: {
        summary: '₿ Pago Bitcoin',
        description:
          'Pago en criptomonedas Bitcoin (la referencia será la dirección wallet)',
        value: {
          method: 'bitcoin',
        },
      },
      cash_payment: {
        summary: '💵 Pago en efectivo',
        description:
          'Pago directo en efectivo al conductor (no genera referencia bancaria)',
        value: {
          method: 'cash',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Referencia bancaria generada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            paymentStatus: { type: 'string', example: 'pending_reference' },
            reference: {
              type: 'object',
              properties: {
                referenceNumber: {
                  type: 'string',
                  example: '12345678901234567890',
                },
                bankCode: { type: 'string', example: '0102' },
                amount: { type: 'number', example: 25.5 },
                expiresAt: { type: 'string', format: 'date-time' },
                instructions: {
                  type: 'string',
                  example: 'Realice la transferencia...',
                },
              },
            },
          },
        },
      },
    },
  })
  async confirmPayment(
    @Param('rideId') rideId: string,
    @Body() body: ConfirmRidePaymentDto,
    @Req() req: any,
  ) {
    // Obtener información del viaje para calcular el monto
    const ride = await this.flow.getTransportRideStatus(Number(rideId));

    if (!ride) {
      throw new Error('Viaje no encontrado');
    }

    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Para pagos en efectivo, no necesitamos generar referencia
    if (body.method === 'cash') {
      const updated = await this.flow.confirmTransportPayment(
        Number(rideId),
        body.method,
      );
      return { data: { ...updated, paymentMethod: 'cash' } };
    }

    // Generar referencia bancaria usando el servicio de pagos venezolano
    const reference = await this.paymentsService.generateBankReference({
      serviceType: 'ride',
      serviceId: Number(rideId),
      amount: Number(ride.farePrice || 0),
      paymentMethod: body.method,
      bankCode: body.bankCode,
      userId: req.user.id,
    });

    return {
      data: {
        rideId: Number(rideId),
        paymentStatus: 'pending_reference',
        reference: reference,
        instructions: this.paymentsService.getPaymentInstructions(
          body.method,
          reference.referenceNumber,
        ),
      },
    };
  }

  @Post(':rideId/join')
  @ApiOperation({ summary: 'Join real-time tracking for ride' })
  async joinRide(@Param('rideId') rideId: string, @Req() req: any) {
    // WS handled at gateway; REST endpoint is no-op helper
    return { ok: true, room: `ride-${rideId}`, userId: req.user.id };
  }

  @Get(':rideId/status')
  @ApiOperation({ summary: 'Get current status of a ride' })
  async getStatus(@Param('rideId') rideId: string) {
    const status = await this.flow.getTransportStatus(Number(rideId));
    return { data: status };
  }

  @Post(':rideId/cancel')
  @ApiOperation({ summary: 'Cancel the ride' })
  async cancel(
    @Param('rideId') rideId: string,
    @Body() body: { reason?: string },
  ) {
    return this.flow.cancelTransport(Number(rideId), body?.reason);
  }

  @Post(':rideId/rate')
  @ApiOperation({ summary: 'Rate the completed ride' })
  async rate(
    @Param('rideId') rideId: string,
    @Body() body: RateRideFlowDto,
    @Req() req: any,
  ) {
    const rating = await this.flow.rateTransport(Number(rideId), {
      ...body,
      userId: String(req.user.id),
    });
    return { data: rating };
  }

  // =========================================
  // NUEVOS ENDPOINTS DE PAGOS COMPLETOS
  // =========================================

  @Post(':rideId/pay-with-multiple-methods')
  @ApiOperation({
    summary: '💰 Pagar viaje con múltiples métodos de pago',
    description: `
    **PAGO DIRECTO EN LA APP - SISTEMA COMPLETO**

    Permite al usuario pagar un viaje directamente en la aplicación usando uno o múltiples métodos de pago venezolanos.

    **Funcionalidades:**
    - ✅ Pago con un solo método (ej: solo transferencia)
    - ✅ Pago combinado con múltiples métodos (ej: parte transferencia + parte Zelle)
    - ✅ Validación automática de montos y métodos
    - ✅ Creación de referencias para pagos electrónicos
    - ✅ Confirmación inmediata para pagos en efectivo

    **Métodos de pago soportados:**
    - \`transfer\`: Transferencia bancaria
    - \`pago_movil\`: Pago móvil venezolano
    - \`zelle\`: Transferencias Zelle
    - \`bitcoin\`: Pagos en Bitcoin
    - \`wallet\`: Pago con saldo de wallet (inmediato)
    - \`cash\`: Pago en efectivo (sin referencia)

    **Flujo de pago múltiple:**
    1. Usuario selecciona métodos y montos
    2. Sistema valida que sumen el total
    3. Crea grupo de pagos con UUID único
    4. Genera referencias para métodos electrónicos
    5. Usuario confirma cada pago individualmente
    6. Viaje se completa cuando todos los pagos están confirmados
    `,
  })
  @ApiBody({
    type: PayWithMultipleMethodsDto,
    examples: {
      single_method_transfer: {
        summary: '💳 Pago con un solo método - Transferencia',
        description:
          'Pago completo del viaje usando solo transferencia bancaria',
        value: {
          totalAmount: 25.5,
          payments: [
            {
              method: 'transfer',
              amount: 25.5,
              bankCode: '0102',
            },
          ],
        },
      },
      multiple_methods_combined: {
        summary: '🔄 Pago combinado - Transferencia + Zelle',
        description: 'Pago dividido entre transferencia bancaria y Zelle',
        value: {
          totalAmount: 75.5,
          payments: [
            {
              method: 'transfer',
              amount: 50.0,
              bankCode: '0102',
            },
            {
              method: 'zelle',
              amount: 25.5,
            },
          ],
        },
      },
      cash_payment_only: {
        summary: '💵 Pago solo en efectivo',
        description: 'Pago directo al conductor en efectivo (sin referencias)',
        value: {
          totalAmount: 25.5,
          payments: [
            {
              method: 'cash',
              amount: 25.5,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago(s) procesado(s) exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            groupId: {
              type: 'string',
              example: 'cm1n8x9p40000abcdefghijk',
              description: 'UUID del grupo de pagos (para pagos múltiples)',
            },
            rideId: { type: 'number', example: 123 },
            totalAmount: { type: 'number', example: 75.5 },
            paymentMethods: {
              type: 'array',
              items: { type: 'string', example: 'transfer' },
              description: 'Métodos de pago utilizados',
            },
            references: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  referenceNumber: {
                    type: 'string',
                    example: '12345678901234567890',
                  },
                  method: { type: 'string', example: 'transfer' },
                  amount: { type: 'number', example: 50.0 },
                  bankCode: { type: 'string', example: '0102' },
                  expiresAt: { type: 'string', format: 'date-time' },
                },
              },
              description: 'Referencias generadas para pagos electrónicos',
            },
            cashAmount: {
              type: 'number',
              example: 0,
              description: 'Monto a pagar en efectivo',
            },
            status: {
              type: 'string',
              example: 'incomplete',
              enum: ['complete', 'incomplete'],
              description: 'Estado del grupo de pagos',
            },
            instructions: {
              type: 'string',
              example:
                'Realiza los pagos electrónicos y confirma cada uno individualmente',
            },
          },
        },
      },
    },
  })
  async payWithMultipleMethods(
    @Param('rideId') rideId: string,
    @Body() body: PayWithMultipleMethodsDto,
    @Req() req: any,
  ) {
    // Validar que el viaje existe y pertenece al usuario
    const ride = await this.flow.getTransportRideStatus(Number(rideId));
    if (!ride) {
      throw new Error('Viaje no encontrado');
    }
    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Validar que el viaje esté en estado correcto para pago
    if (ride.paymentStatus !== 'pending') {
      throw new Error(
        `El viaje ya tiene estado de pago: ${ride.paymentStatus}`,
      );
    }

    // Validar que los montos sumen el total correcto
    const rideAmount = Number(ride.farePrice || 0);

    // Validación adicional por seguridad
    if (!body.payments || !Array.isArray(body.payments)) {
      throw new Error('La propiedad payments es requerida y debe ser un array');
    }

    const totalPayments = body.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    if (Math.abs(totalPayments - body.totalAmount) > 0.01) {
      throw new Error(
        'Los montos de los pagos no coinciden con el total especificado',
      );
    }

    if (Math.abs(body.totalAmount - rideAmount) > 0.01) {
      throw new Error(
        `El monto total (${body.totalAmount}) no coincide con el precio del viaje (${rideAmount})`,
      );
    }

    // Determinar si es pago único o múltiple
    const isSinglePayment = body.payments.length === 1;

    if (isSinglePayment) {
      // PAGO ÚNICO
      const payment = body.payments[0];

      if (payment.method === 'cash') {
        // Pago en efectivo - confirmar inmediatamente
        const result = await this.flow.confirmTransportPayment(
          Number(rideId),
          payment.method,
        );

        // 🆕 NUEVO: Notificar conductores inmediatamente para pagos en efectivo
        try {
          await this.flow.notifyDriversAfterPayment(Number(rideId));
        } catch (error) {
          console.error(
            `Failed to notify drivers for cash payment ride ${rideId}:`,
            error,
          );
          // No fallar el pago por error en notificación
        }

        return {
          data: {
            rideId: Number(rideId),
            totalAmount: body.totalAmount,
            paymentMethods: ['cash'],
            status: 'complete',
            message: 'Pago en efectivo confirmado exitosamente',
            cashAmount: body.totalAmount,
          },
        };
      } else if (payment.method === 'wallet') {
        // 🆕 NUEVO: Pago con wallet - procesar inmediatamente
        try {
          // Verificar saldo de wallet y procesar pago
          const walletResult = await this.paymentsService.processWalletPayment(
            req.user.id,
            payment.amount,
            'ride',
            Number(rideId),
          );

          // Confirmar el pago en el ride
          await this.flow.confirmTransportPayment(
            Number(rideId),
            payment.method,
          );

          // 🆕 NUEVO: Notificar conductores inmediatamente para pagos con wallet
          try {
            await this.flow.notifyDriversAfterPayment(Number(rideId));
          } catch (error) {
            console.error(
              `Failed to notify drivers for wallet payment ride ${rideId}:`,
              error,
            );
            // No fallar el pago por error en notificación
          }

          return {
            data: {
              rideId: Number(rideId),
              totalAmount: body.totalAmount,
              paymentMethods: ['wallet'],
              status: 'complete',
              message: 'Pago con wallet procesado exitosamente',
              walletBalance: walletResult.walletBalance,
              transactionId: walletResult.transactionId,
            },
          };
        } catch (error) {
          throw new ConflictException({
            error: 'WALLET_PAYMENT_FAILED',
            message: error.message,
          });
        }
      } else {
        // Pago electrónico único - generar referencia
        const reference = await this.paymentsService.generateBankReference({
          serviceType: 'ride',
          serviceId: Number(rideId),
          amount: payment.amount,
          paymentMethod: payment.method,
          bankCode: payment.bankCode,
          userId: req.user.id,
        });

        return {
          data: {
            rideId: Number(rideId),
            totalAmount: body.totalAmount,
            paymentMethods: [payment.method],
            references: [
              {
                referenceNumber: reference.referenceNumber,
                method: payment.method,
                amount: payment.amount,
                bankCode: payment.bankCode,
                expiresAt: reference.expiresAt,
              },
            ],
            cashAmount: 0,
            status: 'incomplete',
            instructions: this.paymentsService.getPaymentInstructions(
              payment.method,
              reference.referenceNumber,
            ),
          },
        };
      }
    } else {
      // PAGOS MÚLTIPLES
      const electronicPayments = body.payments.filter(
        (p) => p.method !== 'cash',
      );
      const cashAmount = body.payments
        .filter((p) => p.method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);

      // Crear grupo de pagos múltiples
      const groupResult = await this.paymentsService.initiateMultiplePayments({
        serviceType: 'ride',
        serviceId: Number(rideId),
        totalAmount: body.totalAmount,
        userId: req.user.id,
        payments: body.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          bankCode: p.bankCode,
        })),
      });

      return {
        data: {
          groupId: groupResult.groupId,
          rideId: Number(rideId),
          totalAmount: body.totalAmount,
          paymentMethods: body.payments.map((p) => p.method),
          references: groupResult.references,
          cashAmount: groupResult.cashAmount,
          status: 'incomplete',
          instructions: groupResult.instructions,
        },
      };
    }
  }

  @Post(':rideId/generate-payment-reference')
  @ApiOperation({
    summary: '📄 Generar referencia para pago externo',
    description: `
    **PAGO EXTERNO - GENERACIÓN DE REFERENCIA**

    Genera una referencia bancaria que puede ser usada por cualquier persona para pagar el viaje externamente.

    **Casos de uso:**
    - ✅ Alguien más paga el viaje por ti
    - ✅ Pago desde otra app bancaria
    - ✅ Pago programado para más tarde
    - ✅ Compartir referencia con familiares/amigos

    **Proceso:**
    1. Usuario selecciona método de pago
    2. Sistema genera referencia única de 20 dígitos
    3. Usuario comparte la referencia con quien pagará
    4. Pagador usa la referencia en su banco/app
    5. Usuario confirma el pago realizado
    `,
  })
  @ApiBody({
    type: GeneratePaymentReferenceDto,
    examples: {
      transfer_reference: {
        summary: '💳 Referencia para transferencia bancaria',
        description:
          'Generar referencia que alguien puede usar para transferirte dinero',
        value: {
          method: 'transfer',
          bankCode: '0102',
        },
      },
      zelle_reference: {
        summary: '💰 Referencia para Zelle',
        description: 'Generar referencia para pago internacional vía Zelle',
        value: {
          method: 'zelle',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Referencia generada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            referenceNumber: {
              type: 'string',
              example: '12345678901234567890',
            },
            method: { type: 'string', example: 'transfer' },
            amount: { type: 'number', example: 25.5 },
            bankCode: { type: 'string', example: '0102' },
            expiresAt: { type: 'string', format: 'date-time' },
            instructions: {
              type: 'string',
              example: 'Realice la transferencia...',
            },
            shareableLink: {
              type: 'string',
              example: 'https://app.uber-clone.com/pay/12345678901234567890',
              description: 'Enlace para compartir con el pagador',
            },
          },
        },
      },
    },
  })
  async generatePaymentReference(
    @Param('rideId') rideId: string,
    @Body() body: GeneratePaymentReferenceDto,
    @Req() req: any,
  ) {
    // Validar viaje y usuario
    const ride = await this.flow.getTransportRideStatus(Number(rideId));
    if (!ride) {
      throw new Error('Viaje no encontrado');
    }
    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Generar referencia
    const reference = await this.paymentsService.generateBankReference({
      serviceType: 'ride',
      serviceId: Number(rideId),
      amount: Number(ride.farePrice || 0),
      paymentMethod: body.method,
      bankCode: body.bankCode,
      userId: req.user.id,
    });

    return {
      data: {
        rideId: Number(rideId),
        referenceNumber: reference.referenceNumber,
        method: body.method,
        amount: Number(ride.farePrice || 0),
        bankCode: body.bankCode,
        expiresAt: reference.expiresAt,
        instructions: this.paymentsService.getPaymentInstructions(
          body.method,
          reference.referenceNumber,
        ),
        shareableLink: `https://app.uber-clone.com/pay/${reference.referenceNumber}`,
      },
    };
  }

  @Post(':rideId/confirm-payment-with-reference')
  @ApiOperation({
    summary: '✅ Confirmar pago realizado con referencia externa',
    description: `
    **CONFIRMACIÓN DE PAGO EXTERNO**

    Confirma que un pago realizado con una referencia externa fue procesado correctamente.

    **Proceso:**
    1. Usuario ingresa la referencia de 20 dígitos
    2. Sistema valida que la referencia existe y pertenece al viaje
    3. Consulta al banco correspondiente
    4. Si el pago fue confirmado, actualiza el estado del viaje
    5. Notifica al usuario y conductor

    **Tiempo de procesamiento:**
    - ✅ Simulación desarrollo: inmediato
    - ⏱️ Producción real: 1-5 minutos por banco venezolano
    `,
  })
  @ApiBody({
    type: ConfirmPaymentWithReferenceDto,
    examples: {
      confirm_transfer: {
        summary: '✅ Confirmar transferencia realizada',
        description: 'Confirmar que la transferencia bancaria fue procesada',
        value: {
          referenceNumber: '12345678901234567890',
          bankCode: '0102',
        },
      },
      confirm_zelle: {
        summary: '✅ Confirmar pago Zelle',
        description: 'Confirmar pago internacional vía Zelle',
        value: {
          referenceNumber: '09876543210987654321',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago confirmado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            rideId: { type: 'number', example: 123 },
            referenceNumber: {
              type: 'string',
              example: '12345678901234567890',
            },
            amount: { type: 'number', example: 25.5 },
            transactionId: { type: 'string', example: 'BV-1725979200000' },
            confirmedAt: { type: 'string', format: 'date-time' },
            message: {
              type: 'string',
              example: 'Pago confirmado exitosamente',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago aún en proceso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: {
              type: 'string',
              example: 'Pago no encontrado o en proceso de confirmación',
            },
            referenceNumber: {
              type: 'string',
              example: '12345678901234567890',
            },
          },
        },
      },
    },
  })
  async confirmPaymentWithReference(
    @Param('rideId') rideId: string,
    @Body() body: ConfirmPaymentWithReferenceDto,
    @Req() req: any,
  ) {
    // Validar viaje y usuario
    const ride = await this.flow.getTransportRideStatus(Number(rideId));
    if (!ride) {
      throw new Error('Viaje no encontrado');
    }
    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Confirmar pago con referencia
    const result = await this.paymentsService.confirmBankReference(
      {
        referenceNumber: body.referenceNumber,
        bankCode: body.bankCode,
      },
      req.user.id,
    );

    return {
      data: {
        success: result.success,
        rideId: Number(rideId),
        referenceNumber: body.referenceNumber,
        amount: result.success ? result.transaction.amount : null,
        transactionId: result.success ? result.transaction.transactionId : null,
        confirmedAt: result.success ? result.transaction.timestamp : null,
        message: result.message,
      },
    };
  }

  @Post(':rideId/confirm-partial-payment')
  @ApiOperation({
    summary: '✅ Confirmar pago parcial en grupo múltiple',
    description: `
    **CONFIRMACIÓN DE PAGO PARCIAL**

    Confirma un pago individual dentro de un grupo de pagos múltiples.

    **Cuándo usar:**
    - Después de pagar una referencia específica en un grupo múltiple
    - Para actualizar el progreso del pago total
    - Cuando el grupo está parcialmente completo

    **Actualización automática:**
    - ✅ Grupo se marca como 'complete' cuando todos los pagos están confirmados
    - ✅ Viaje se actualiza cuando el grupo está completo
    - ✅ Notificaciones automáticas al usuario
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['referenceNumber'],
      properties: {
        referenceNumber: {
          type: 'string',
          example: '12345678901234567890',
          description: 'Referencia del pago parcial a confirmar',
          minLength: 20,
          maxLength: 20,
        },
        bankCode: {
          type: 'string',
          example: '0102',
          description: 'Código del banco (opcional)',
          minLength: 4,
          maxLength: 4,
        },
      },
    },
    examples: {
      confirm_partial_transfer: {
        summary: '✅ Confirmar transferencia parcial',
        description: 'Confirmar una de las transferencias en un pago múltiple',
        value: {
          referenceNumber: '12345678901234567890',
          bankCode: '0102',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago parcial confirmado exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
            rideId: { type: 'number', example: 123 },
            referenceNumber: {
              type: 'string',
              example: '12345678901234567890',
            },
            amount: { type: 'number', example: 25.0 },
            groupStatus: {
              type: 'string',
              example: 'incomplete',
              enum: ['incomplete', 'complete'],
            },
            paidAmount: { type: 'number', example: 25.0 },
            remainingAmount: { type: 'number', example: 50.5 },
            message: {
              type: 'string',
              example: 'Pago parcial confirmado. Grupo: incomplete',
            },
          },
        },
      },
    },
  })
  async confirmPartialPayment(
    @Param('rideId') rideId: string,
    @Body() body: { referenceNumber: string; bankCode?: string },
    @Req() req: any,
  ) {
    // Validar viaje y usuario
    const ride = await this.flow.getTransportRideStatus(Number(rideId));
    if (!ride) {
      throw new Error('Viaje no encontrado');
    }
    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Confirmar pago parcial
    const result = await this.paymentsService.confirmPartialPayment(
      {
        referenceNumber: body.referenceNumber,
        bankCode: body.bankCode,
      },
      req.user.id,
    );

    return {
      data: {
        success: result.success,
        groupId: result.groupId,
        rideId: Number(rideId),
        referenceNumber: body.referenceNumber,
        amount: result.success ? result.transaction?.amount : null,
        groupStatus: result.groupId ? 'updated' : 'unknown',
        isPartial: result.isPartial,
        message: result.message,
      },
    };
  }

  @Get(':rideId/payment-status')
  @ApiOperation({
    summary: '📊 Consultar estado de pagos múltiples',
    description: `
    **ESTADO COMPLETO DE PAGOS**

    Obtiene información detallada sobre el estado de un grupo de pagos múltiples.

    **Información incluida:**
    - ✅ Estado general del grupo (incomplete/complete/cancelled/expired)
    - ✅ Monto total vs pagado vs pendiente
    - ✅ Lista de todos los pagos con sus estados
    - ✅ Estadísticas de confirmación
    - ✅ Fechas importantes (creación, expiración, completado)

    **Útil para:**
    - Mostrar progreso en la UI
    - Depurar pagos pendientes
    - Historial de transacciones múltiples
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de pagos obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
            totalAmount: { type: 'number', example: 75.5 },
            paidAmount: { type: 'number', example: 25.0 },
            remainingAmount: { type: 'number', example: 50.5 },
            status: {
              type: 'string',
              example: 'incomplete',
              enum: ['incomplete', 'complete', 'cancelled', 'expired'],
            },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            statistics: {
              type: 'object',
              properties: {
                totalReferences: { type: 'number', example: 3 },
                confirmedReferences: { type: 'number', example: 1 },
                pendingReferences: { type: 'number', example: 2 },
                confirmationRate: { type: 'number', example: 33.33 },
              },
            },
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  referenceNumber: {
                    type: 'string',
                    example: '12345678901234567890',
                  },
                  method: { type: 'string', example: 'transfer' },
                  amount: { type: 'number', example: 25.0 },
                  status: { type: 'string', example: 'confirmed' },
                  bankCode: { type: 'string', example: '0102' },
                  createdAt: { type: 'string', format: 'date-time' },
                  confirmedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getPaymentStatus(@Param('rideId') rideId: string, @Req() req: any) {
    // Validar viaje y usuario
    const ride = await this.flow.getTransportRideStatus(Number(rideId));
    if (!ride) {
      throw new Error('Viaje no encontrado');
    }
    if (ride.userId !== req.user.id) {
      throw new Error('Este viaje no pertenece al usuario actual');
    }

    // Buscar si existe un grupo de pagos para este viaje
    const paymentGroup = await this.prisma.paymentGroup.findFirst({
      where: {
        serviceType: 'ride',
        serviceId: Number(rideId),
        userId: req.user.id,
      },
      include: {
        paymentReferences: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (!paymentGroup) {
      // No hay grupo de pagos, devolver estado simple
      return {
        data: {
          rideId: Number(rideId),
          totalAmount: Number(ride.farePrice || 0),
          paidAmount:
            ride.paymentStatus === 'paid' ? Number(ride.farePrice || 0) : 0,
          remainingAmount:
            ride.paymentStatus === 'paid' ? 0 : Number(ride.farePrice || 0),
          status: ride.paymentStatus === 'paid' ? 'complete' : 'pending',
          hasPaymentGroup: false,
          message: 'Viaje sin grupo de pagos múltiples',
        },
      };
    }

    // Calcular estadísticas
    const totalReferences = paymentGroup.paymentReferences.length;
    const confirmedReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'confirmed',
    ).length;
    const pendingReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'pending',
    ).length;
    const expiredReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'expired',
    ).length;

    return {
      data: {
        rideId: Number(rideId),
        groupId: paymentGroup.id,
        totalAmount: Number(paymentGroup.totalAmount),
        paidAmount: Number(paymentGroup.paidAmount),
        remainingAmount: Number(paymentGroup.remainingAmount),
        status: paymentGroup.status,
        expiresAt: paymentGroup.expiresAt,
        createdAt: paymentGroup.createdAt,
        completedAt: paymentGroup.completedAt,
        hasPaymentGroup: true,
        statistics: {
          totalReferences,
          confirmedReferences,
          pendingReferences,
          expiredReferences,
          confirmationRate:
            totalReferences > 0
              ? (confirmedReferences / totalReferences) * 100
              : 0,
        },
        payments: paymentGroup.paymentReferences.map((ref) => ({
          referenceNumber: ref.referenceNumber,
          method: ref.paymentMethod,
          amount: Number(ref.amount),
          status: ref.status,
          bankCode: ref.bankCode,
          createdAt: ref.createdAt,
          confirmedAt: ref.confirmedAt,
          expiresAt: ref.expiresAt,
        })),
      },
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
    description:
      'Conductores simulados encontrados (misma estructura que el endpoint real)',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              firstName: { type: 'string', example: 'Carlos' },
              lastName: { type: 'string', example: 'Rodriguez' },
              profileImageUrl: { type: 'string', example: 'https://...' },
              carModel: { type: 'string', example: 'Toyota Camry' },
              licensePlate: { type: 'string', example: 'ABC-123' },
              carSeats: { type: 'number', example: 4 },
              vehicleType: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'car' },
                  displayName: { type: 'string', example: 'Carro' },
                  icon: { type: 'string', example: '🚗' },
                },
              },
              currentLocation: {
                type: 'object',
                properties: {
                  lat: { type: 'number', example: 10.4998 },
                  lng: { type: 'number', example: -66.8517 },
                },
              },
              lastLocationUpdate: { type: 'string', format: 'date-time' },
              locationAccuracy: { type: 'number', example: 5.0 },
              distance: {
                type: 'number',
                example: 1.2,
                description: 'Distancia en km',
              },
              estimatedMinutes: {
                type: 'number',
                example: 5,
                description: 'Tiempo estimado en minutos',
              },
              rating: { type: 'number', example: 4.5 },
            },
          },
        },
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
        include: {
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

        // Actualizar ubicación del conductor usando el LocationTrackingService
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

        // Calcular distancia desde el centro usando el método del LocationTrackingService
        const distanceFromCenter =
          this.locationTrackingService.calculateDistance(
            centerLat,
            centerLng,
            newLat,
            newLng,
          );

        // Calculate estimated time (assuming average speed of 30 km/h in city)
        const estimatedMinutes = Math.round((distanceFromCenter / 30) * 60);

        simulatedDrivers.push({
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          profileImageUrl: driver.profileImageUrl,
          carModel: driver.vehicles?.[0]
            ? `${driver.vehicles[0].make} ${driver.vehicles[0].model}`
            : 'Unknown',
          licensePlate: driver.vehicles?.[0]?.licensePlate || '',
          carSeats: driver.vehicles?.[0]?.seatingCapacity || 0,
          vehicleType:
            driver.vehicles?.[0]?.vehicleType?.displayName || 'Unknown',
          currentLocation: {
            lat: newLat,
            lng: newLng,
          },
          lastLocationUpdate: driver.lastLocationUpdate,
          locationAccuracy: driver.locationAccuracy
            ? Number(driver.locationAccuracy)
            : null,
          distance: Math.round(distanceFromCenter * 100) / 100, // Round to 2 decimal places
          estimatedMinutes,
          rating: 4.5, // Simulated rating
        });
      }

      return { data: simulatedDrivers };
    } catch (error) {
      console.error('Error simulating driver locations:', error);
      throw error;
    }
  }
}
