import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { ConfirmRidePaymentDto, DefineRideDto, RateRideFlowDto, SelectVehicleDto } from './dto/transport-flow.dtos';
import { PaymentsService } from '../../payments/payments.service';

@ApiTags('rides-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/transport')
export class TransportClientController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('tiers')
  @ApiOperation({
    summary: 'Get all available ride tiers for transport flow',
    description: 'Retrieve all available ride tiers with their pricing information. Frontend should validate which combinations are allowed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all available ride tiers',
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
              baseFare: { type: 'number', example: 2.50 },
              perMinuteRate: { type: 'number', example: 0.15 },
              perMileRate: { type: 'number', example: 1.25 },
              imageUrl: { type: 'string', example: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideTiers(): Promise<{ data: any[] }> {
    const tiers = await this.flow.getAvailableRideTiers();
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
    3. Notifies nearby drivers via WebSocket
    4. Returns ride ID for real-time tracking

    **Real-time Events:**
    - \`ride:requested\` - Broadcast to nearby drivers
    - \`ride:accepted\` - When driver accepts the ride
    - \`ride:location\` - Live driver location updates
    `
  })
  @ApiBody({
    type: DefineRideDto,
    examples: {
      'city_ride': {
        summary: 'Basic city ride',
        value: {
          originAddress: 'Calle 123 #45-67, Bogotá, Colombia',
          originLat: 4.6097,
          originLng: -74.0817,
          destinationAddress: 'Carrera 7 #23-45, Medellín, Colombia',
          destinationLat: 6.2518,
          destinationLng: -75.5636,
          minutes: 25,
          tierId: 1
        }
      },
      'airport_pickup': {
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
          vehicleTypeId: 1
        }
      }
    }
  })
  async defineRide(@Body() body: DefineRideDto, @Req() req: any) {
    const ride = await this.flow.defineTransportRide({
      userId: Number(req.user.id),
      origin: { address: body.originAddress, lat: body.originLat, lng: body.originLng },
      destination: { address: body.destinationAddress, lat: body.destinationLat, lng: body.destinationLng },
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
    `
  })
  @ApiBody({
    type: SelectVehicleDto,
    examples: {
      'no_changes': {
        summary: 'Sin cambios (retorna datos actuales) - RECOMENDADO PARA PRUEBAS',
        description: 'Envía un objeto vacío para obtener los datos actuales sin hacer cambios',
        value: {}
      },
      'update_tier': {
        summary: 'Actualizar solo el tier',
        value: {
          tierId: 2
        }
      },
      'update_vehicle': {
        summary: 'Actualizar solo el tipo de vehículo',
        value: {
          vehicleTypeId: 1
        }
      },
      'update_both': {
        summary: 'Actualizar tier y vehículo',
        value: {
          tierId: 2,
          vehicleTypeId: 1
        }
      }
    }
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
            originAddress: { type: 'string', example: 'Calle 123 #45-67, Bogotá, Colombia' },
            destinationAddress: { type: 'string', example: 'Carrera 7 #23-45, Medellín, Colombia' },
            tierId: { type: 'number', example: 2 },
            requestedVehicleTypeId: { type: 'number', example: 1, nullable: true },
            tier: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                name: { type: 'string', example: 'Premium' },
                baseFare: { type: 'string', example: '6' },
                perMinuteRate: { type: 'string', example: '0.35' },
                perMileRate: { type: 'string', example: '3' }
              }
            },
            requestedVehicleType: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Carro' },
                displayName: { type: 'string', example: 'Carro' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT requerido' })
  @ApiResponse({ status: 404, description: 'Viaje no encontrado' })
  async selectVehicle(
    @Param('rideId') rideId: string,
    @Body() body: SelectVehicleDto,
  ) {
    console.log(`🚗 Transport Client Controller - selectVehicle called`);
    console.log(`📊 Parameters: rideId=${rideId}, body=`, JSON.stringify(body, null, 2));
    console.log(`📝 Body type:`, typeof body);
    console.log(`🔍 Body keys:`, Object.keys(body || {}));
    console.log(`❓ tierId defined:`, body?.tierId !== undefined);
    console.log(`❓ vehicleTypeId defined:`, body?.vehicleTypeId !== undefined);

    const numericRideId = Number(rideId);
    console.log(`🔢 Converted rideId: ${numericRideId}`);

    // Handle Swagger sending null values instead of undefined
    const tierId = (body?.tierId !== null && body?.tierId !== undefined) ? body.tierId : undefined;
    const vehicleTypeId = (body?.vehicleTypeId !== null && body?.vehicleTypeId !== undefined) ? body.vehicleTypeId : undefined;

    console.log(`🔧 Processed values: tierId=${tierId}, vehicleTypeId=${vehicleTypeId}`);

    try {
      const ride = await this.flow.selectTransportVehicle(numericRideId, tierId, vehicleTypeId);
      console.log(`✅ selectVehicle completed successfully`);
      return { data: ride };
    } catch (error) {
      console.error(`❌ selectVehicle failed:`, error);
      throw error;
    }
  }

  @Post(':rideId/request-driver')
  @ApiOperation({ summary: 'Request driver matching for this ride (notify nearby drivers)' })
  async requestDriver(@Param('rideId') rideId: string) {
    return this.flow.requestTransportDriver(Number(rideId));
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
    - \`transfer\`: Transferencia bancaria
    - \`pago_movil\`: Pago móvil
    - \`zelle\`: Zelle
    - \`bitcoin\`: Bitcoin

    **Flujo de pago:**
    1. Usuario confirma pago → Obtiene referencia bancaria
    2. Usuario paga usando la referencia en su app bancaria
    3. Usuario confirma pago realizado
    4. Sistema valida con el banco
    5. Viaje se confirma cuando pago es validado
    `
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
                referenceNumber: { type: 'string', example: '12345678901234567890' },
                bankCode: { type: 'string', example: '0102' },
                amount: { type: 'number', example: 25.50 },
                expiresAt: { type: 'string', format: 'date-time' },
                instructions: { type: 'string', example: 'Realice la transferencia...' }
              }
            }
          }
        }
      }
    }
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
      const updated = await this.flow.confirmTransportPayment(Number(rideId), body.method);
      return { data: { ...updated, paymentMethod: 'cash' } };
    }

    // Generar referencia bancaria usando el servicio de pagos venezolano
    const reference = await this.paymentsService.generateBankReference({
      serviceType: 'ride',
      serviceId: Number(rideId),
      amount: Number(ride.farePrice || 0),
      paymentMethod: body.method,
      bankCode: body.bankCode,
      userId: req.user.id
    });

    return {
      data: {
        rideId: Number(rideId),
        paymentStatus: 'pending_reference',
        reference: reference,
        instructions: this.paymentsService.getPaymentInstructions(body.method, reference.referenceNumber)
      }
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
  async cancel(@Param('rideId') rideId: string, @Body() body: { reason?: string }) {
    return this.flow.cancelTransport(Number(rideId), body?.reason);
  }

  @Post(':rideId/rate')
  @ApiOperation({ summary: 'Rate the completed ride' })
  async rate(
    @Param('rideId') rideId: string,
    @Body() body: RateRideFlowDto,
    @Req() req: any,
  ) {
    const rating = await this.flow.rateTransport(Number(rideId), { ...body, userId: String(req.user.id) });
    return { data: rating };
  }
}


