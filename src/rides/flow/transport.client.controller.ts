import { Body, Controller, Get, Param, Post, Req, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationTrackingService } from '../../redis/location-tracking.service';
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
    private readonly prisma: PrismaService,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  @Get('tiers')
  @ApiOperation({
    summary: 'Get ride tiers organized by vehicle type',
    description: 'Retrieve all available ride tiers grouped by compatible vehicle types for easy frontend consumption.',
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
                  baseFare: { type: 'number', example: 2.50 },
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
                  baseFare: { type: 'number', example: 2.50 },
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
    const tiersByVehicleType = await this.flow.getAvailableRideTiersByVehicleType();
    return { data: tiersByVehicleType };
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

  @Get('nearby-drivers')
  @ApiOperation({
    summary: 'Buscar conductores cercanos disponibles',
    description: `
    **FUNCIONALIDAD PRINCIPAL:** Permite al cliente buscar conductores cercanos disponibles para su viaje.

    **¿Qué hace?**
    - Busca conductores online en un radio específico
    - Filtra por tipo de vehículo compatible con el tier seleccionado
    - Calcula distancia estimada y tiempo de llegada
    - Ordena por proximidad y calificación

    **Parámetros requeridos:**
    - \`lat\`, \`lng\`: Ubicación actual del cliente
    - \`tierId\`: Tier seleccionado (opcional, filtra vehículos compatibles)
    - \`vehicleTypeId\`: Tipo de vehículo específico (opcional)

    **Información devuelta:**
    - Datos del conductor (nombre, foto, calificación)
    - Información del vehículo (modelo, placa, asientos)
    - Distancia estimada y tiempo de llegada
    - Estado de verificación del conductor

    **Uso típico:**
    1. Cliente define su viaje
    2. Cliente busca conductores cercanos
    3. Cliente selecciona conductor preferido
    4. Cliente solicita viaje específico al conductor
    `
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitud actual del cliente',
    example: 4.6097,
    type: Number,
    required: true
  })
  @ApiQuery({
    name: 'lng', 
    description: 'Longitud actual del cliente',
    example: -74.0817,
    type: Number,
    required: true
  })
  @ApiQuery({
    name: 'radius',
    description: 'Radio de búsqueda en kilómetros',
    example: 5,
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'tierId',
    description: 'ID del tier seleccionado (filtra vehículos compatibles)',
    example: 1,
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'vehicleTypeId',
    description: 'ID del tipo de vehículo específico',
    example: 1,
    type: Number,
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Conductores cercanos encontrados exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driverId: { type: 'number', example: 1 },
              firstName: { type: 'string', example: 'Carlos' },
              lastName: { type: 'string', example: 'Rodriguez' },
              profileImageUrl: { type: 'string', example: 'https://...' },
              rating: { type: 'number', example: 4.8 },
              carModel: { type: 'string', example: 'Toyota Camry' },
              licensePlate: { type: 'string', example: 'ABC-123' },
              carSeats: { type: 'number', example: 4 },
              vehicleType: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'car' },
                  displayName: { type: 'string', example: 'Carro' },
                  icon: { type: 'string', example: '🚗' }
                }
              },
              distance: { type: 'number', example: 1.2, description: 'Distancia en km' },
              estimatedArrival: { type: 'number', example: 5, description: 'Tiempo estimado en minutos' },
              verificationStatus: { type: 'string', example: 'approved' },
              isOnline: { type: 'boolean', example: true }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 3 },
            radius: { type: 'number', example: 5 },
            searchLocation: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 4.6097 },
                lng: { type: 'number', example: -74.0817 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parámetros de ubicación requeridos' })
  @ApiResponse({ status: 500, description: 'Error al buscar conductores' })
  async getNearbyDrivers(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '5',
    @Query('tierId') tierId?: string,
    @Query('vehicleTypeId') vehicleTypeId?: string,
  ) {
    const nearbyDrivers = await this.flow.getNearbyDrivers({
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
      tierId: tierId ? Number(tierId) : undefined,
      vehicleTypeId: vehicleTypeId ? Number(vehicleTypeId) : undefined,
    });
    return { data: nearbyDrivers };
  }

  @Post(':rideId/request-driver')
  @ApiOperation({ 
    summary: 'Solicitar conductor específico para este viaje',
    description: `
    **FUNCIONALIDAD:** Permite al cliente solicitar un conductor específico para su viaje.

    **¿Qué hace?**
    - Envía notificación específica al conductor seleccionado
    - Crea una solicitud de viaje dirigida
    - El conductor puede aceptar o rechazar

    **Uso típico:**
    1. Cliente busca conductores cercanos con /nearby-drivers
    2. Cliente selecciona conductor preferido
    3. Cliente usa este endpoint para solicitar específicamente a ese conductor
    4. Conductor recibe notificación y puede aceptar/rechazar
    `
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        driverId: {
          type: 'number',
          example: 1,
          description: 'ID del conductor específico a solicitar'
        }
      },
      required: ['driverId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud enviada al conductor específico',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 123 },
            driverId: { type: 'number', example: 1 },
            status: { type: 'string', example: 'requested' },
            message: { type: 'string', example: 'Solicitud enviada al conductor' }
          }
        }
      }
    }
  })
  async requestSpecificDriver(
    @Param('rideId') rideId: string,
    @Body() body: { driverId: number }
  ) {
    return this.flow.requestSpecificDriver(Number(rideId), body.driverId);
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
    `
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
          description: 'Latitud del centro del área a simular'
        },
        centerLng: {
          type: 'number',
          example: -66.8517,
          minimum: -180,
          maximum: 180,
          description: 'Longitud del centro del área a simular'
        },
        radiusKm: {
          type: 'number',
          example: 5,
          minimum: 0.1,
          maximum: 10,
          description: 'Radio en kilómetros para distribuir conductores'
        },
        driverCount: {
          type: 'number',
          example: 20,
          minimum: 1,
          maximum: 50,
          description: 'Número de conductores a simular'
        },
        vehicleTypeIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'Tipos de vehículo a asignar (opcional, si no se especifica se asignan aleatoriamente)'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Ubicaciones de conductores simuladas exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully simulated 20 driver locations'
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
                  lng: { type: 'number' }
                }
              },
              distanceFromCenter: { type: 'number' },
              vehicleType: { type: 'string' }
            }
          }
        },
        center: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        radiusKm: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async simulateDriverLocations(@Body() data: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    driverCount: number;
    vehicleTypeIds?: number[];
  }) {
    const { centerLat, centerLng, radiusKm, driverCount, vehicleTypeIds } = data;

    // Validaciones
    if (radiusKm > 10) {
      throw new Error('Radius cannot exceed 10km for simulation');
    }
    if (driverCount > 50) {
      throw new Error('Cannot simulate more than 50 drivers at once');
    }
    if (centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
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
          vehicleTypeId: true,
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        },
        orderBy: { id: 'asc' }
      });

      if (existingDrivers.length === 0) {
        throw new Error('No drivers found in database. Please create some drivers first.');
      }

      // Obtener tipos de vehículo disponibles si no se especificaron
      let availableVehicleTypes = vehicleTypeIds;
      if (!availableVehicleTypes || availableVehicleTypes.length === 0) {
        const vehicleTypes = await this.prisma.vehicleType.findMany({
          select: { id: true }
        });
        availableVehicleTypes = vehicleTypes.map(vt => vt.id);
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
        const lngOffset = (distance / (111.32 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);

        const newLat = centerLat + latOffset;
        const newLng = centerLng + lngOffset;

        // Asignar tipo de vehículo si no tiene uno
        let vehicleTypeId = driver.vehicleTypeId;
        if (!vehicleTypeId && availableVehicleTypes.length > 0) {
          vehicleTypeId = availableVehicleTypes[Math.floor(Math.random() * availableVehicleTypes.length)];
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
            source: 'simulated'
          }
        );

        // Cambiar estado a online si no lo está
        await this.prisma.driver.update({
          where: { id: driver.id },
          data: {
            status: 'online',
            vehicleTypeId: vehicleTypeId,
            updatedAt: new Date()
          }
        });

        // Calcular distancia desde el centro usando el método del LocationTrackingService
        const distanceFromCenter = this.locationTrackingService.calculateDistance(centerLat, centerLng, newLat, newLng);

        simulatedDrivers.push({
          driverId: driver.id,
          name: `${driver.firstName} ${driver.lastName}`,
          location: { lat: newLat, lng: newLng },
          distanceFromCenter: Math.round(distanceFromCenter * 100) / 100,
          vehicleType: driver.vehicleType?.displayName || 'Unknown',
          status: 'online',
          locationActive: true
        });
      }

      return {
        message: `Successfully simulated ${simulatedDrivers.length} driver locations`,
        simulatedDrivers,
        center: { lat: centerLat, lng: centerLng },
        radiusKm,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error simulating driver locations:', error);
      throw error;
    }
  }
}


