import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  NotificationType,
  NotificationChannel,
} from '../../notifications/interfaces/notification.interface';
import { WebSocketGatewayClass } from '../../websocket/websocket.gateway';
import { WalletService } from '../../wallet/wallet.service';
import { RidesService } from '../rides.service';
import { OrdersService } from '../../orders/orders.service';
import { StripeService } from '../../stripe/stripe.service';
import { ErrandsService } from '../../errands/errands.service';
import { ParcelsService } from '../../parcels/parcels.service';
import { LocationTrackingService } from '../../redis/location-tracking.service';
import { CreateErrandDto } from './dto/errand-flow.dtos';

@Injectable()
export class RidesFlowService {
  private readonly logger = new Logger(RidesFlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gateway: WebSocketGatewayClass,
    private readonly ridesService: RidesService,
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
    private readonly errandsService: ErrandsService,
    private readonly parcelsService: ParcelsService,
    private readonly locationTrackingService: LocationTrackingService,
    private readonly walletService: WalletService,
  ) {}

  // Método para obtener tiers organizados por tipo de vehículo
  async getAvailableRideTiersByVehicleType() {
    // Obtener todas las combinaciones válidas con la información completa
    const combinations = await this.prisma.tierVehicleType.findMany({
      where: {
        isActive: true,
      },
      include: {
        tier: true,
        vehicleType: true,
      },
      orderBy: [
        { vehicleType: { displayName: 'asc' } },
        { tier: { baseFare: 'asc' } },
      ],
    });

    // Agrupar por tipo de vehículo
    const groupedByVehicleType = combinations.reduce((acc, combo) => {
      const vehicleName = combo.vehicleType.name; // "car", "motorcycle", "bicycle"

      if (!acc[vehicleName]) {
        acc[vehicleName] = [];
      }

      acc[vehicleName].push({
        id: combo.tier.id,
        name: combo.tier.name,
        baseFare: combo.tier.baseFare,
        perMinuteRate: combo.tier.perMinuteRate,
        perMileRate: combo.tier.perMileRate,
        imageUrl: combo.tier.imageUrl,
        vehicleTypeId: combo.vehicleTypeId,
        vehicleTypeName: combo.vehicleType.displayName,
        vehicleTypeIcon: combo.vehicleType.icon,
      });

      return acc;
    }, {});

    return groupedByVehicleType;
  }

  // Método para validar si una combinación tier + vehicleType es válida
  async isValidTierVehicleCombination(
    tierId: number,
    vehicleTypeId: number,
  ): Promise<boolean> {
    const combination = await this.prisma.tierVehicleType.findFirst({
      where: {
        tierId,
        vehicleTypeId,
        isActive: true,
      },
    });

    return !!combination;
  }

  async defineTransportRide(payload: {
    userId: number;
    origin: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
    minutes: number;
    vehicleTypeId?: number;
    tierId?: number;
  }) {
    // Validar que la combinación tier + vehicleType sea válida
    if (payload.tierId && payload.vehicleTypeId) {
      const isValidCombination = await this.isValidTierVehicleCombination(
        payload.tierId,
        payload.vehicleTypeId,
      );

      if (!isValidCombination) {
        throw new Error(
          `Invalid combination: Tier ${payload.tierId} is not available for vehicle type ${payload.vehicleTypeId}`,
        );
      }
    }

    const ride = await this.ridesService.createRide({
      origin_address: payload.origin.address,
      destination_address: payload.destination.address,
      origin_latitude: payload.origin.lat,
      origin_longitude: payload.origin.lng,
      destination_latitude: payload.destination.lat,
      destination_longitude: payload.destination.lng,
      ride_time: payload.minutes,
      fare_price: 0,
      payment_status: 'pending',
      user_id: payload.userId,
      tier_id: payload.tierId,
      vehicle_type_id: payload.vehicleTypeId,
      driver_id: undefined,
    } as any);

    // Join WS room logically and notify pending
    this.gateway.server?.to(`ride-${ride.rideId}`).emit('ride:requested', {
      rideId: ride.rideId,
      userId: payload.userId,
      timestamp: new Date(),
    });

    return ride;
  }

  async selectTransportVehicle(
    rideId: number,
    tierId?: number,
    vehicleTypeId?: number,
  ) {
    console.log(
      `🔍 selectTransportVehicle called with rideId: ${rideId}, tierId: ${tierId}, vehicleTypeId: ${vehicleTypeId}`,
    );

    try {
      // First check if ride exists
      const existingRide = await this.prisma.ride.findUnique({
        where: { rideId },
      });

      console.log(`📊 Existing ride found:`, existingRide ? 'YES' : 'NO');

      if (!existingRide) {
        throw new Error(`Ride with id ${rideId} not found`);
      }

      // Determinar los valores finales (usar existentes si no se proporcionan)
      const finalTierId = tierId !== undefined ? tierId : existingRide.tierId;
      const finalVehicleTypeId =
        vehicleTypeId !== undefined
          ? vehicleTypeId
          : existingRide.requestedVehicleTypeId;

      // Validar combinación si ambos valores están definidos
      if (finalTierId && finalVehicleTypeId) {
        const isValidCombination = await this.isValidTierVehicleCombination(
          finalTierId,
          finalVehicleTypeId,
        );

        if (!isValidCombination) {
          throw new Error(
            `Invalid combination: Tier ${finalTierId} is not available for vehicle type ${finalVehicleTypeId}`,
          );
        }
      }

      // Prepare update data - only include fields that are provided
      const updateData: any = {};
      if (tierId !== undefined) {
        updateData.tierId = tierId;
      }
      if (vehicleTypeId !== undefined) {
        updateData.requestedVehicleTypeId = vehicleTypeId;
      }

      console.log(`📝 Update data prepared:`, updateData);

      // Only update if there's something to update
      if (Object.keys(updateData).length === 0) {
        console.log(`🔄 No updates needed, fetching existing ride`);
        const ride = await this.prisma.ride.findUnique({
          where: { rideId },
          include: { tier: true, requestedVehicleType: true },
        });
        console.log(`✅ Ride fetched successfully:`, ride ? 'YES' : 'NO');
        return ride;
      }

      console.log(`🔄 Updating ride with data:`, updateData);
      const ride = await this.prisma.ride.update({
        where: { rideId },
        data: updateData,
        include: { tier: true, requestedVehicleType: true },
      });

      console.log(`✅ Ride updated successfully:`, ride ? 'YES' : 'NO');
      console.log(`📊 Ride data:`, {
        rideId: ride?.rideId,
        tierId: ride?.tierId,
        requestedVehicleTypeId: ride?.requestedVehicleTypeId,
      });

      if (ride) {
        this.gateway.server?.to(`ride-${rideId}`).emit('ride:updated', {
          rideId,
          tierId: ride.tierId,
          vehicleTypeId: ride.requestedVehicleTypeId,
        });
        console.log(`📡 WebSocket event emitted`);
      }

      return ride;
    } catch (error) {
      console.error(`❌ Error in selectTransportVehicle:`, error);
      throw error;
    }
  }

  async confirmTransportPayment(
    rideId: number,
    method: 'cash' | 'card',
    _clientSecret?: string,
  ) {
    let payment:
      | { clientSecret?: string; paymentIntentId?: string }
      | undefined;
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: { user: true },
    });
    if (!ride) throw new Error('Ride not found');

    if (method === 'card') {
      // Create PaymentIntent for fare (or 0 for preauth)
      const amount = Number(ride.farePrice || 0);
      try {
        const pi = await this.stripeService.createPaymentIntent({
          name: 'Ride Payment',
          email: ride.user?.email || 'user@example.com',
          amount: amount > 0 ? amount : 1,
        } as any);
        payment = {
          clientSecret: pi.paymentIntent.client_secret,
          paymentIntentId: pi.paymentIntent.id,
        };
      } catch (e) {
        // Fallback to pending without PI
      }
    }

    const updated = await this.prisma.ride.update({
      where: { rideId },
      data: { paymentStatus: 'pending' },
    });

    this.gateway.server?.to(`ride-${rideId}`).emit('ride:payment:initiated', {
      rideId,
      method,
      paymentIntentId: payment?.paymentIntentId,
    });

    return { ...updated, ...payment };
  }

  async getTransportStatus(rideId: number) {
    return this.prisma.ride.findUnique({
      where: { rideId },
      include: {
        driver: true,
        tier: true,
        requestedVehicleType: true,
        ratings: true,
      },
    });
  }

  async cancelTransport(rideId: number, reason?: string) {
    const ride = await this.prisma.ride.findUnique({ where: { rideId } });
    if (!ride) throw new Error('Ride not found');
    // Soft-cancel via notification and WS; DB status stays via paymentStatus for now
    await this.notifications.notifyRideStatusUpdate(
      rideId,
      ride.userId.toString(),
      ride.driverId ?? 0,
      'cancelled',
      { reason },
    );
    this.gateway.server
      ?.to(`ride-${rideId}`)
      .emit('ride:cancelled', { rideId, reason });
    return { ok: true };
  }

  async rateTransport(
    rideId: number,
    data: { rating: number; comment?: string; userId: string },
  ) {
    return this.prisma.rating.create({
      data: {
        rideId,
        ratedByUserId: Number(data.userId),
        ratingValue: data.rating,
        comment: data.comment,
      },
    });
  }

  // Driver actions
  async driverAcceptTransport(
    rideId: number,
    driverId: number,
    userId: string,
  ) {
    const ride = await this.prisma.ride.update({
      where: { rideId },
      data: { driverId },
    });
    await this.notifications.notifyRideStatusUpdate(
      rideId,
      userId,
      driverId,
      'accepted',
    );
    this.gateway.server
      ?.to(`ride-${rideId}`)
      .emit('ride:accepted', { rideId, driverId });
    return ride;
  }

  async driverArrivedTransport(
    rideId: number,
    driverId: number,
    userId: string,
  ) {
    await this.notifications.notifyRideStatusUpdate(
      rideId,
      userId,
      driverId,
      'arrived',
    );
    this.gateway.server
      ?.to(`ride-${rideId}`)
      .emit('ride:arrived', { rideId, driverId });
    return { ok: true };
  }

  async driverStartTransport(rideId: number, driverId: number, userId: string) {
    await this.notifications.notifyRideStatusUpdate(
      rideId,
      userId,
      driverId,
      'in_progress',
    );
    this.gateway.server
      ?.to(`ride-${rideId}`)
      .emit('ride:started', { rideId, driverId });
    return { ok: true };
  }

  async driverCompleteTransport(
    rideId: number,
    driverId: number,
    userId: string,
    fare: number,
  ) {
    const ride = await this.prisma.ride.update({
      where: { rideId },
      data: { farePrice: fare, paymentStatus: 'paid' },
    });
    await this.notifications.notifyRideStatusUpdate(
      rideId,
      userId,
      driverId,
      'completed',
      { fare },
    );
    this.gateway.server
      ?.to(`ride-${rideId}`)
      .emit('ride:completed', { rideId, driverId, fare });
    return ride;
  }

  // Delivery flow
  async createDeliveryOrder(userId: number, dto: any) {
    const order = await this.ordersService.createOrder(dto, userId);
    this.gateway.server?.to(`order-${order.orderId}`).emit('order:created', {
      orderId: order.orderId,
      userId,
    });
    return order;
  }

  async confirmDeliveryPayment(
    orderId: number,
    method: 'cash' | 'card' | 'wallet',
  ) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: { user: true },
    });
    if (!order) throw new Error('Order not found');

    // Para el sistema venezolano, solo marcamos como pendiente
    // La referencia bancaria se generará desde el controlador
    const updated = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: { paymentStatus: 'pending' },
    });

    this.gateway.server
      ?.to(`order-${orderId}`)
      .emit('order:payment:initiated', {
      orderId,
      method,
        message: 'Esperando confirmación de pago venezolano',
    });

    return updated;
  }

  async getDeliveryStatus(orderId: number) {
    return this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: {
        store: true,
        courier: true,
        orderItems: { include: { product: true } },
        ratings: true,
      },
    });
  }

  async cancelDelivery(orderId: number, reason?: string) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
    });
    if (!order) throw new Error('Order not found');
    await this.notifications.sendNotification({
      userId: order.userId.toString(),
      type: 'order_cancelled' as any,
      title: 'Order Cancelled',
      message: reason || 'Your order was cancelled',
      data: { orderId },
      channels: [1 as any],
    } as any);
    this.gateway.server
      ?.to(`order-${orderId}`)
      .emit('order:cancelled', { orderId, reason });
    return { ok: true };
  }

  async driverAcceptDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.acceptOrderForDelivery(
      orderId,
      driverId,
    );
    this.gateway.server
      ?.to(`order-${orderId}`)
      .emit('order:accepted', { orderId, driverId });
    return order;
  }

  async driverPickupDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.markOrderPickedUp(orderId, driverId);
    this.gateway.server
      ?.to(`order-${orderId}`)
      .emit('order:picked_up', { orderId, driverId });
    return order;
  }

  async driverDeliverDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.markOrderDelivered(
      orderId,
      driverId,
    );
    this.gateway.server
      ?.to(`order-${orderId}`)
      .emit('order:delivered', { orderId, driverId });
    return order;
  }

  // Errand flow using database persistence
  async createErrand(userId: number, dto: CreateErrandDto) {
    return this.errandsService.createErrand(userId, dto);
  }

  async updateErrandShopping(
    errandId: number,
    data: { itemsCost: number; notes?: string },
  ) {
    return this.errandsService.updateErrandShopping(errandId, {
      itemsCost: data.itemsCost,
      notes: data.notes,
    });
  }

  async driverAcceptErrand(errandId: number, driverId: number) {
    return this.errandsService.acceptErrand(errandId, driverId);
  }

  async driverStartErrand(errandId: number, driverId: number) {
    return this.errandsService.startErrandDelivery(errandId);
  }

  async driverCompleteErrand(errandId: number, driverId: number) {
    return this.errandsService.completeErrand(errandId);
  }

  async getErrandStatus(errandId: number) {
    return this.errandsService.getErrandStatus(errandId);
  }

  // Helper method to get transport ride status
  async getTransportRideStatus(rideId: number) {
    return this.prisma.ride.findUnique({
      where: { rideId },
      select: {
        rideId: true,
        userId: true,
        farePrice: true,
        paymentStatus: true,
      },
    });
  }

  async cancelErrand(errandId: number, reason?: string) {
    return this.errandsService.cancelErrand(errandId, reason);
  }

  // Parcel flow using database persistence
  async createParcel(userId: number, dto: any) {
    return this.parcelsService.createParcel(userId, dto);
  }

  async driverAcceptParcel(parcelId: number, driverId: number) {
    return this.parcelsService.acceptParcel(parcelId, driverId);
  }

  async driverPickupParcel(parcelId: number, driverId: number) {
    return this.parcelsService.pickupParcel(parcelId);
  }

  async driverDeliverParcel(
    parcelId: number,
    driverId: number,
    proof?: { signatureImageUrl?: string; photoUrl?: string },
  ) {
    return this.parcelsService.deliverParcel(parcelId, {
      photoUrl: proof?.photoUrl,
      signatureUrl: proof?.signatureImageUrl,
    });
  }

  async getParcelStatus(parcelId: number) {
    return this.parcelsService.getParcelStatus(parcelId);
  }

  async cancelParcel(parcelId: number, reason?: string) {
    return this.parcelsService.cancelParcel(parcelId, reason);
  }

  // =========================================
  // NUEVOS MÉTODOS PARA BÚSQUEDA DE CONDUCTORES
  // =========================================

  // Método auxiliar para calcular distancia entre dos puntos
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // === NUEVOS MÉTODOS PARA MATCHING AUTOMÁTICO ===

  /**
   * Encuentra el mejor conductor disponible usando algoritmo de scoring
   */
  async findBestDriverMatch(params: {
    lat: number;
    lng: number;
    tierId?: number;
    vehicleTypeId?: number;
    radiusKm?: number;
  }) {
    const { lat, lng, tierId, vehicleTypeId, radiusKm = 5 } = params;
    const startTime = Date.now();

    this.logger.log(`🎯 [MATCHING] Iniciando búsqueda de conductor - Usuario: (${lat}, ${lng}) - Radio: ${radiusKm}km - Tier: ${tierId || 'auto'} - VehicleType: ${vehicleTypeId || 'auto'}`);

    try {
      // 0. DEBUG: Verificar estado general del sistema
      this.logger.log(`🔍 [MATCHING] DEBUG - Verificando estado del sistema antes de búsqueda`);
      const totalDriversOnline = await this.prisma.driver.count({
        where: { status: 'online', verificationStatus: 'approved' }
      });
      this.logger.log(`📊 [MATCHING] DEBUG - Total conductores online en BD: ${totalDriversOnline}`);

      // Verificar location tracking service
      try {
        // Intentar obtener un conductor cualquiera para verificar si el service funciona
        const sampleDriver = await this.prisma.driver.findFirst({
          where: { status: 'online', verificationStatus: 'approved' },
          select: { id: true, firstName: true, lastName: true }
        });

        if (sampleDriver) {
          const locationCheck = await this.locationTrackingService.getDriverLocation(sampleDriver.id);
          this.logger.log(`🔍 [MATCHING] DEBUG - Location tracking funciona: ${locationCheck ? '✅ SÍ' : '❌ NO'} (ejemplo conductor ${sampleDriver.firstName})`);
        }
      } catch (locationError) {
        this.logger.error(`🔍 [MATCHING] DEBUG - Error en location tracking service:`, locationError);
      }

      // 1. Obtener conductores candidatos con filtros básicos
      const filters: any = {
        status: 'online',
        verificationStatus: 'approved',
      };

      // 2. Aplicar filtros de compatibilidad si se especifican
    if (tierId) {
        const compatibleVehicleTypes =
          await this.prisma.tierVehicleType.findMany({
            where: { tierId, isActive: true },
        select: { vehicleTypeId: true },
      });

      if (compatibleVehicleTypes.length > 0) {
          const vehicleTypeIds = compatibleVehicleTypes.map(
            (vt) => vt.vehicleTypeId,
          );
          filters.vehicleTypeId =
            vehicleTypeIds.length === 1
              ? vehicleTypeIds[0]
              : { in: vehicleTypeIds };
      }
    }

      if (vehicleTypeId) {
        filters.vehicleTypeId = vehicleTypeId;
      }

      this.logger.log(`🔍 [MATCHING] DEBUG - Filtros aplicados:`, JSON.stringify(filters));
      this.logger.log(`🔍 [MATCHING] DEBUG - Parámetros de búsqueda: lat=${lat}, lng=${lng}, radiusKm=${radiusKm}`);

      // 3. Buscar conductores usando LocationTrackingService
      this.logger.log(`🔍 [MATCHING] Buscando conductores cercanos - Ubicación: (${lat}, ${lng}) - Radio: ${radiusKm}km - Filtros: ${JSON.stringify(filters)}`);

      let candidateDrivers =
        await this.locationTrackingService.findNearbyDrivers(
      lat,
      lng,
          radiusKm / 1000, // Convertir a metros para el servicio
          filters,
        );

      this.logger.log(`📊 [MATCHING] Encontrados ${candidateDrivers.length} conductores candidatos por ubicación GPS`);

      // Log detallado de cada conductor encontrado con su ubicación
      candidateDrivers.forEach((driver, index) => {
        this.logger.log(`👤 [MATCHING] Conductor ${index + 1}: ID=${driver.id} - Distancia=${driver.distance}km - Ubicación=(${driver.currentLocation?.lat || 'N/A'}, ${driver.currentLocation?.lng || 'N/A'})`);
      });

      // 🚨 FALLBACK: Si no hay conductores con ubicación GPS, buscar conductores online sin ubicación
      if (candidateDrivers.length === 0) {
        this.logger.warn(`⚠️ [MATCHING] No se encontraron conductores con ubicación GPS. Intentando fallback...`);

        // Buscar todos los conductores online sin filtro de ubicación
        const onlineDrivers = await this.prisma.driver.findMany({
          where: {
            status: 'online',
            verificationStatus: 'approved',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            carModel: true,
            licensePlate: true,
            carSeats: true,
            vehicleTypeId: true,
          },
        });

        this.logger.log(`🔄 [MATCHING] Fallback: Encontrados ${onlineDrivers.length} conductores online sin filtro de ubicación`);

        // Log detallado de conductores encontrados en fallback
        if (onlineDrivers.length > 0) {
          onlineDrivers.forEach((driver, index) => {
            this.logger.log(`👤 [MATCHING] Fallback - Conductor ${index + 1}: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
          });
        }

        if (onlineDrivers.length > 0) {
          // Convertir a formato esperado por el algoritmo de scoring
          // Para fallback, necesitamos obtener información adicional de cada conductor
          candidateDrivers = await Promise.all(
            onlineDrivers.map(async (driver) => {
              // Obtener información detallada del conductor
              const driverDetails = await this.getDriverDetailedInfo(driver.id);

              return {
                id: driver.id,
                driverId: driver.id,
                distance: radiusKm / 2, // Asumir distancia media
                estimatedMinutes: Math.round((radiusKm / 2) / 30 * 60), // Estimar tiempo basado en distancia
                currentLocation: { lat, lng }, // Usar ubicación del usuario como aproximación
                firstName: driver.firstName,
                lastName: driver.lastName,
                profileImageUrl: driverDetails.profileImageUrl,
                carModel: driver.carModel,
                licensePlate: driver.licensePlate,
                carSeats: driver.carSeats,
                vehicleType: driverDetails.vehicleType,
                rating: driverDetails.rating,
                totalRides: driverDetails.totalRides,
                createdAt: driverDetails.createdAt,
                lastLocationUpdate: null,
                locationAccuracy: null,
                isLocationActive: false,
              };
            })
          );

          this.logger.log(`✅ [MATCHING] Fallback exitoso: Usando ${candidateDrivers.length} conductores online`);
        } else {
          this.logger.error(`❌ [MATCHING] Fallback falló: No hay conductores online disponibles`);
          this.logger.error(`💡 [MATCHING] Verificar que los conductores estén marcados como 'online' en la base de datos`);
        }
      }

      if (candidateDrivers.length === 0) {
        this.logger.error(`❌ [MATCHING] No se encontraron conductores disponibles en el área (${lat}, ${lng}) dentro de ${radiusKm}km ni en fallback`);
        throw new Error('NO_DRIVERS_AVAILABLE');
      }

      // 4. Calcular scores para cada conductor
      this.logger.log(`🧮 [MATCHING] Calculando scores para ${candidateDrivers.length} conductores...`);

      const scoredDrivers = await Promise.all(
        candidateDrivers.map(async (driver) => {
          const score = await this.calculateDriverScore(driver, lat, lng);
          this.logger.log(`📈 [MATCHING] Conductor ID=${driver.id} - Score=${score.toFixed(1)} - Distancia=${driver.distance}km`);
          return { ...driver, score };
        }),
      );

      // 5. Ordenar por score descendente y tomar el mejor
      scoredDrivers.sort((a, b) => b.score - a.score);
      const bestDriver = scoredDrivers[0];

      this.logger.log(`🏆 [MATCHING] Mejor conductor seleccionado: ID=${bestDriver.id} - Score=${bestDriver.score.toFixed(1)} - Distancia=${bestDriver.distance}km - Ubicación=(${bestDriver.currentLocation?.lat || 'N/A'}, ${bestDriver.currentLocation?.lng || 'N/A'})`);

      // Log ranking completo
      this.logger.log(`📊 [MATCHING] Ranking completo:`);
      scoredDrivers.slice(0, 5).forEach((driver, index) => {
        this.logger.log(`   ${index + 1}. ID=${driver.id} - Score=${driver.score.toFixed(1)} - Distancia=${driver.distance}km`);
      });

      // 6. Obtener información adicional del conductor
      const driverDetails = await this.getDriverDetailedInfo(bestDriver.id);

      // 7. Calcular tiempo estimado de llegada (velocidad promedio 30 km/h en ciudad)
      const estimatedMinutes = Math.max(
        1,
        Math.round(((bestDriver.distance * 1000) / 30) * 60),
      ); // Convertir km a minutos

      // 8. Preparar respuesta
      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ [MATCHING] Matching completado exitosamente en ${processingTime}ms - Conductor: ${driverDetails.firstName} ${driverDetails.lastName} (ID: ${bestDriver.id}) - Distancia: ${bestDriver.distance}km - ETA: ${estimatedMinutes}min`);

      const result = {
        matchedDriver: {
          driver: {
            driverId: bestDriver.id,
            firstName: driverDetails.firstName,
            lastName: driverDetails.lastName,
            profileImageUrl: driverDetails.profileImageUrl,
            rating: driverDetails.rating,
            totalRides: driverDetails.totalRides,
            memberSince: driverDetails.createdAt,
          },
          vehicle: {
            carModel: driverDetails.carModel,
            licensePlate: driverDetails.licensePlate,
            carSeats: driverDetails.carSeats,
            vehicleType: driverDetails.vehicleType || null,
          },
          location: {
            distance: Math.round(bestDriver.distance * 100) / 100, // Redondear a 2 decimales
            estimatedArrival: estimatedMinutes,
            currentLocation: bestDriver.currentLocation,
          },
          pricing: {
            tierId: tierId || 1,
            tierName: await this.getTierName(tierId || 1),
            estimatedFare: await this.calculateEstimatedFare(
              tierId || 1,
              estimatedMinutes,
              bestDriver.distance,
            ),
          },
          matchScore: Math.round(bestDriver.score * 100) / 100,
          matchedAt: new Date(),
        },
        searchCriteria: {
          lat,
          lng,
          tierId,
          vehicleTypeId,
          radiusKm,
          searchDuration: (Date.now() - startTime) / 1000, // En segundos
        },
      };

      this.logger.log(`📋 [MATCHING] Respuesta final preparada - Score: ${result.matchedDriver.matchScore} - Tiempo de búsqueda: ${result.searchCriteria.searchDuration}s`);

      return result;
    } catch (error) {
      console.error('Error in findBestDriverMatch:', error);
      throw error;
    }
  }

  /**
   * Calcula el score de un conductor basado en múltiples factores
   */
  private async calculateDriverScore(
    driver: any,
    userLat: number,
    userLng: number,
  ): Promise<number> {
    try {
      // Pesos para cada factor (suman 100)
      const WEIGHTS = {
        DISTANCE: 40, // 40% - Más cercano = mejor
        RATING: 35, // 35% - Mejor rating = mejor
        ETA: 25, // 25% - Menor tiempo de llegada = mejor
      };

      // 1. Factor de distancia (inverso - más cercano = score más alto)
      const distanceKm = driver.distance;
      const distanceScore = Math.max(
        0,
        Math.min(WEIGHTS.DISTANCE, WEIGHTS.DISTANCE * (1 / (1 + distanceKm))),
      );

      // 2. Factor de rating (directo - mejor rating = score más alto)
      const driverDetails = await this.getDriverDetailedInfo(driver.driverId);
      const ratingScore = (driverDetails.rating / 5) * WEIGHTS.RATING; // Normalizar a 0-5

      // 3. Factor de tiempo estimado (inverso - menor tiempo = score más alto)
      const estimatedMinutes = Math.max(1, Math.round((distanceKm / 30) * 60)); // 30 km/h promedio
      const etaScore = Math.max(
        0,
        Math.min(WEIGHTS.ETA, WEIGHTS.ETA * (1 / (1 + estimatedMinutes / 10))),
      );

      // Score total
      const totalScore = distanceScore + ratingScore + etaScore;

      return Math.min(100, Math.max(0, totalScore)); // Asegurar rango 0-100
    } catch (error) {
      console.error(
        `Error calculating score for driver ${driver.driverId}:`,
        error,
      );
      return 0; // Score mínimo si hay error
    }
  }

  /**
   * Obtiene información detallada de un conductor
   */
  private async getDriverDetailedInfo(driverId: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicleType: true,
        rides: {
          where: {
            status: 'completed',
            paymentStatus: 'paid',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
            },
          },
          select: {
            rideId: true,
            ratings: {
              select: { ratingValue: true },
            },
          },
        },
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Calcular rating promedio de los últimos 30 días
    const recentRatings = driver.rides.flatMap((ride) =>
      ride.ratings.map((r) => r.ratingValue),
    );
    const avgRating =
      recentRatings.length > 0
        ? recentRatings.reduce((sum, rating) => sum + rating, 0) /
          recentRatings.length
        : 4.5; // Rating por defecto si no hay calificaciones recientes

    return {
      ...driver,
      rating: Math.round(avgRating * 10) / 10, // Redondear a 1 decimal
      totalRides: driver.rides.length,
    };
  }

  /**
   * Obtiene el nombre de un tier
   */
  private async getTierName(tierId: number): Promise<string> {
    const tier = await this.prisma.rideTier.findUnique({
      where: { id: tierId },
      select: { name: true },
    });
    return tier?.name || 'Economy';
  }

  /**
   * Calcula tarifa estimada
   */
  private async calculateEstimatedFare(
    tierId: number,
    minutes: number,
    distanceKm: number,
  ): Promise<number> {
    const tier = await this.prisma.rideTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) return 0;

    const baseFare = Number(tier.baseFare);
    const perMinuteRate = Number(tier.perMinuteRate);
    const perMileRate = Number(tier.perMileRate);

    const fare = baseFare + minutes * perMinuteRate + distanceKm * perMileRate;
    return Math.round(fare * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Confirma conductor para un viaje y envía notificación
   */
  async confirmDriverForRide(
    rideId: number,
    driverId: number,
    userId: number,
    notes?: string,
  ) {
    try {
      // 1. Verificar que el viaje existe y pertenece al usuario
      const ride = await this.prisma.ride.findUnique({
        where: { rideId },
        include: { user: true },
      });

    if (!ride) {
      throw new Error('Ride not found');
    }

      if (ride.userId !== userId) {
        throw new Error('Ride does not belong to user');
      }

      if (ride.driverId) {
        throw new Error('RIDE_ALREADY_HAS_DRIVER');
      }

      // 2. Verificar que el conductor esté disponible
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
        select: {
          id: true,
          status: true,
          verificationStatus: true,
          firstName: true,
          lastName: true,
        },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (driver.status !== 'online') {
        throw new Error('DRIVER_NOT_AVAILABLE');
    }

    if (driver.verificationStatus !== 'approved') {
        throw new Error('Driver not verified');
      }

      // 3. Actualizar el viaje con el conductor confirmado
      const updatedRide = await this.prisma.ride.update({
        where: { rideId },
        data: {
          driverId: driverId,
          status: 'driver_confirmed',
          updatedAt: new Date(),
        },
      });

      // 4. Calcular tiempo de expiración (2 minutos)
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

      // 5. Enviar notificación al conductor
      const notificationSent = await this.sendDriverRideRequest(
        driverId,
        rideId,
        ride,
        notes,
      );

      // 6. Emitir evento WebSocket
      this.gateway.server
        ?.to(`driver-${driverId}`)
        .emit('driver:ride-request', {
          rideId,
          userName: ride.user?.name || 'Usuario',
          userRating: 4.9, // TODO: Calcular rating real del usuario
          pickupAddress: ride.originAddress,
          dropoffAddress: ride.destinationAddress,
          estimatedFare: ride.farePrice,
          distance: 0, // TODO: Calcular distancia real
          duration: ride.rideTime,
          pickupLocation: {
            lat: Number(ride.originLatitude),
            lng: Number(ride.originLongitude),
          },
          notes: notes || null,
          expiresAt: expiresAt.toISOString(),
          requestedAt: new Date().toISOString(),
        });

      return {
        rideId,
        driverId,
        status: 'driver_confirmed',
        message: 'Conductor notificado exitosamente',
        notificationSent,
        responseTimeoutMinutes: 2,
        expiresAt,
      };
    } catch (error) {
      console.error('Error confirming driver for ride:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de solicitud de viaje al conductor
   */
  private async sendDriverRideRequest(
    driverId: number,
    rideId: number,
    ride: any,
    notes?: string,
  ): Promise<boolean> {
    try {
      // Calcular distancia aproximada (simplificada)
      const distance = 5; // TODO: Calcular distancia real
      const duration = ride.rideTime || 15;

    await this.notifications.sendNotification({
        userId: `driver_${driverId}`, // Placeholder - debería ser el userId real del conductor
      type: 'RIDE_REQUEST' as any,
        title: 'Nueva Solicitud de Viaje',
        message: `Tienes una solicitud de viaje desde ${ride.originAddress} hasta ${ride.destinationAddress}`,
      data: {
        rideId,
          isDirectRequest: true,
        pickupLocation: {
          lat: Number(ride.originLatitude),
            lng: Number(ride.originLongitude),
          },
          dropoffLocation: {
            lat: Number(ride.destinationLatitude),
            lng: Number(ride.destinationLongitude),
          },
          estimatedFare: ride.farePrice,
          distance,
          duration,
          notes: notes || null,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        },
        channels: ['push' as any],
        priority: 'high',
      });

      return true;
    } catch (error) {
      console.error('Error sending driver notification:', error);
      return false;
    }
  }

  /**
   * Maneja la respuesta del conductor a una solicitud específica
   */
  async handleDriverRideResponse(
    rideId: number,
    driverId: number,
    response: 'accept' | 'reject',
    reason?: string,
    estimatedArrivalMinutes?: number,
  ) {
    try {
      // 1. Verificar que el viaje existe y está en estado driver_confirmed
      const ride = await this.prisma.ride.findUnique({
        where: { rideId },
        include: {
          user: true,
          driver: true,
        },
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.status !== 'driver_confirmed') {
        throw new Error('REQUEST_NOT_FOUND');
      }

      if (ride.driverId !== driverId) {
        throw new Error('RIDE_ALREADY_ASSIGNED');
      }

      // 2. Verificar que no haya expirado el tiempo límite (2 minutos)
      const confirmedAt = ride.updatedAt;
      const now = new Date();
      const timeDiff = now.getTime() - confirmedAt.getTime();
      const timeLimit = 2 * 60 * 1000; // 2 minutos en milisegundos

      if (timeDiff > timeLimit) {
        // Tiempo expirado - liberar el viaje
        await this.prisma.ride.update({
          where: { rideId },
          data: {
            driverId: null,
            status: 'pending',
            updatedAt: new Date(),
          },
        });

        // Notificar al usuario que el tiempo expiró
        await this.notifications.sendNotification({
          userId: ride.userId.toString(),
          type: 'RIDE_REQUEST_EXPIRED' as any,
          title: 'Tiempo Agotado',
          message:
            'El conductor no respondió a tiempo. Puedes buscar otro conductor.',
          data: { rideId },
      channels: ['push' as any],
        });

        throw new Error('REQUEST_EXPIRED');
      }

      if (response === 'accept') {
        // 3a. ACEPTAR: Actualizar estado del viaje
        const updatedRide = await this.prisma.ride.update({
          where: { rideId },
          data: {
            status: 'accepted',
            updatedAt: new Date(),
          },
        });

        // Notificar al usuario
        await this.notifications.sendNotification({
          userId: ride.userId.toString(),
          type: 'RIDE_ACCEPTED' as any,
          title: '¡Viaje Aceptado!',
          message: `El conductor ${ride.driver?.firstName} ${ride.driver?.lastName} ha aceptado tu viaje.`,
          data: {
            rideId,
            driverId,
            driverName: `${ride.driver?.firstName} ${ride.driver?.lastName}`,
            estimatedArrivalMinutes: estimatedArrivalMinutes || 5,
          },
          channels: ['push' as any],
    });

    // Emitir evento WebSocket
        this.gateway.server?.to(`ride-${rideId}`).emit('ride:accepted', {
      rideId,
          driverId,
          driverName: `${ride.driver?.firstName} ${ride.driver?.lastName}`,
          estimatedArrivalMinutes: estimatedArrivalMinutes || 5,
          timestamp: new Date(),
    });

    return {
      rideId,
      driverId,
          response: 'accept',
          status: 'accepted',
          message: 'Viaje aceptado exitosamente',
          userNotified: true,
          estimatedArrivalMinutes: estimatedArrivalMinutes || 5,
        };
      } else if (response === 'reject') {
        // 3b. RECHAZAR: Liberar el viaje para otros conductores
        await this.prisma.ride.update({
          where: { rideId },
          data: {
            driverId: null,
            status: 'pending',
            updatedAt: new Date(),
          },
        });

        // Notificar al usuario
        await this.notifications.sendNotification({
          userId: ride.userId.toString(),
          type: 'RIDE_REJECTED' as any,
          title: 'Viaje Rechazado',
          message: `El conductor no pudo aceptar tu viaje. Puedes buscar otro conductor.`,
          data: {
            rideId,
            driverId,
            reason: reason || 'Conductor no disponible',
          },
          channels: ['push' as any],
        });

        // Emitir evento WebSocket
        this.gateway.server?.to(`ride-${rideId}`).emit('ride:rejected', {
          rideId,
          driverId,
          reason: reason || 'Conductor no disponible',
          timestamp: new Date(),
        });

        return {
          rideId,
          driverId,
          response: 'reject',
          status: 'pending',
          message: 'Viaje liberado para otros conductores',
          userNotified: true,
          reason: reason || 'Conductor no disponible',
        };
      } else {
        throw new Error('INVALID_RESPONSE');
      }
    } catch (error) {
      console.error('Error handling driver ride response:', error);
      throw error;
    }
  }

  /**
   * Cancela un viaje y procesa reembolso automático al pasajero
   */
  async cancelRideWithRefund(
    rideId: number,
    driverId: number,
    cancellationData: {
      reason: string;
      location?: { lat: number; lng: number };
      notes?: string;
      refundType:
        | 'driver_cancellation'
        | 'passenger_cancellation'
        | 'system_cancellation';
    },
  ) {
    try {
      // 1. Verificar que el viaje existe y pertenece al conductor
      const ride = await this.prisma.ride.findUnique({
        where: { rideId },
        include: {
          user: true,
          driver: true,
          tier: true,
        },
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.driverId !== driverId) {
        throw new Error('Driver not authorized for this ride');
      }

      // 2. Verificar que el viaje esté en estado válido para cancelación
      if (ride.status === 'completed' || ride.status === 'cancelled') {
        throw new Error('Ride already completed or cancelled');
      }

      // 3. Solo permitir cancelación si el pago fue exitoso
      if (ride.paymentStatus !== 'paid') {
        throw new Error('Cannot refund unpaid ride');
      }

      const refundAmount = Number(ride.farePrice);
      this.logger.log(
        `💰 Procesando reembolso de $${refundAmount} para viaje ${rideId}`,
      );

      // 4. Procesar reembolso en wallet del pasajero
      const { wallet, transaction } = await this.walletService.processRefund(
        ride.userId,
        refundAmount,
        `Cancelación por conductor: ${cancellationData.reason}`,
        'ride_cancellation',
        rideId.toString(),
      );

      // 5. Actualizar estado del viaje
      await this.prisma.ride.update({
        where: { rideId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'driver',
          cancellationReason: cancellationData.reason,
          cancellationNotes: cancellationData.notes,
          updatedAt: new Date(),
        },
      });

      // 6. Crear registro de cancelación
      await this.prisma.rideCancellation.create({
        data: {
          rideId,
          cancelledBy: 'driver',
          reason: cancellationData.reason,
          notes: cancellationData.notes,
          refundAmount,
          refundProcessed: true,
          locationLat: cancellationData.location?.lat,
          locationLng: cancellationData.location?.lng,
          cancelledAt: new Date(),
        },
      });

      // 7. Notificar al pasajero sobre el reembolso
      await this.notifications.sendNotification({
        userId: ride.userId.toString(),
        type: NotificationType.RIDE_REFUND_PROCESSED,
        title: 'Viaje Cancelado - Reembolso Procesado',
        message: `Tu viaje ha sido cancelado por el conductor. Se te ha reembolsado $${refundAmount.toFixed(2)} a tu wallet.`,
        data: {
          rideId,
          refundAmount,
          newBalance: wallet.balance,
          reason: cancellationData.reason,
          driverName: ride.driver?.firstName + ' ' + ride.driver?.lastName,
          cancellationNotes: cancellationData.notes,
        },
        channels: [NotificationChannel.PUSH],
      });

      // 8. Notificar al conductor sobre la cancelación exitosa
      await this.notifications.sendNotification({
        userId: driverId.toString(),
        type: NotificationType.DRIVER_CANCEL_RIDE,
        title: 'Viaje Cancelado Exitosamente',
        message: `Has cancelado el viaje ${rideId}. El pasajero ha sido reembolsado automáticamente.`,
        data: {
          rideId,
          refundAmount,
          passengerNotified: true,
          reason: cancellationData.reason,
        },
        channels: [NotificationChannel.PUSH],
      });

      // 9. Emitir evento WebSocket
      this.gateway.server?.to(`ride-${rideId}`).emit('ride:cancelled', {
        rideId,
        cancelledBy: 'driver',
        reason: cancellationData.reason,
        refundAmount,
        newBalance: wallet.balance,
        timestamp: new Date(),
      });

      this.logger.log(
        `✅ Viaje ${rideId} cancelado por conductor con reembolso procesado`,
      );

      return {
        rideId,
        status: 'cancelled',
        refundProcessed: true,
        refundAmount,
        newWalletBalance: wallet.balance,
        passengerNotified: true,
        driverNotified: true,
        cancellationReason: cancellationData.reason,
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.error(`❌ Error cancelando viaje ${rideId}:`, error);
      throw error;
    }
  }

  async simulateRideRequest(driverId: number) {
    try {
      this.logger.log(
        `🎯 Simulando solicitud de viaje para conductor ${driverId}`,
      );

      // 1. Buscar un usuario aleatorio (excluyendo al conductor)
      const randomUser = await this.prisma.user.findFirst({
        where: {
          id: { not: driverId }, // Excluir al conductor
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!randomUser) {
        throw new Error('NO_USERS_AVAILABLE');
      }

      // 2. Datos de prueba para el viaje (Bogotá)
      const rideData = {
        origin_address: 'Parque de la 93, Bogotá, Colombia',
        destination_address: 'Zona Rosa, Bogotá, Colombia',
        origin_latitude: 4.6767,
        origin_longitude: -74.0483,
        destination_latitude: 4.6567,
        destination_longitude: -74.0583,
        ride_time: 20, // 20 minutos
        fare_price: 18.5,
        payment_status: 'pending',
        user_id: randomUser.id,
        tier_id: 1, // Premium
        vehicle_type_id: 1, // Carro
      };

      // 3. Crear el viaje usando el servicio de rides
      const ride = await this.ridesService.createRide(rideData as any);

      this.logger.log(
        `✅ Viaje simulado creado: ${ride.rideId} para usuario ${randomUser.name}`,
      );

      // 4. Confirmar conductor para el viaje (esto pone status: 'driver_confirmed')
      const confirmation = await this.confirmDriverForRide(
        ride.rideId,
        driverId,
        randomUser.id,
        'Solicitud simulada para testing',
      );

      this.logger.log(
        `✅ Conductor ${driverId} asignado al viaje ${ride.rideId}`,
      );

      return {
        rideId: ride.rideId,
        driverId,
        userId: randomUser.id,
        userName: randomUser.name,
        originAddress: rideData.origin_address,
        destinationAddress: rideData.destination_address,
        farePrice: rideData.fare_price,
        tierName: 'Premium',
        status: 'driver_confirmed',
        message: 'Solicitud simulada creada exitosamente',
        expiresAt: confirmation.expiresAt,
        notificationSent: confirmation.notificationSent,
      };
    } catch (error) {
      this.logger.error(`❌ Error simulando solicitud de viaje:`, error);
      throw error;
    }
  }

  async updateDriverLocation(
    driverId: number,
    locationData: {
      lat: number;
      lng: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      rideId?: number;
    }
  ) {
    try {
      this.logger.log(`📍 [LOCATION-UPDATE] Actualizando ubicación del conductor ${driverId}: (${locationData.lat}, ${locationData.lng})`);

      // Actualizar ubicación usando el location tracking service
      await this.locationTrackingService.updateDriverLocation(
        driverId,
        { lat: locationData.lat, lng: locationData.lng },
        locationData.rideId,
        {
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading,
          source: 'api'
        }
      );

      this.logger.log(`✅ [LOCATION-UPDATE] Ubicación del conductor ${driverId} actualizada exitosamente`);

      return {
        driverId,
        location: {
          lat: locationData.lat,
          lng: locationData.lng
        },
        updatedAt: new Date(),
        accuracy: locationData.accuracy
      };

    } catch (error) {
      this.logger.error(`❌ [LOCATION-UPDATE] Error actualizando ubicación del conductor ${driverId}:`, error);
      throw error;
    }
  }

  async getDriverPendingRequests(driverId: number) {
    try {
      this.logger.log(`📋 Buscando solicitudes pendientes para driver ${driverId}`);

      // Verificar que el driver existe y está online
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          status: true,
          firstName: true,
          lastName: true,
          verificationStatus: true,
        },
      });

      if (!driver) {
        this.logger.error(`❌ Driver ${driverId} no encontrado en base de datos`);
        return [];
      }

      this.logger.log(`👤 Driver encontrado: ${driver.firstName} ${driver.lastName} (${driver.status})`);

      // 🔍 Obtener ubicación actual del conductor desde LocationTrackingService
      let driverLocation: any = null;
      try {
        const locationData = await this.locationTrackingService.getDriverLocation(driverId);
        driverLocation = locationData;
        this.logger.log(`📍 [PENDING-REQUESTS] Ubicación actual del conductor ${driverId}: (${driverLocation?.lat || 'N/A'}, ${driverLocation?.lng || 'N/A'}) - Última actualización: ${driverLocation?.lastUpdate ? new Date(driverLocation.lastUpdate).toISOString() : 'N/A'}`);
      } catch (error) {
        this.logger.warn(`⚠️ [PENDING-REQUESTS] No se pudo obtener ubicación del conductor ${driverId}: ${error.message}`);
        this.logger.warn(`🔍 Verificar que el conductor esté enviando actualizaciones de ubicación (POST /location)`);
      }

      this.logger.log(`🔍 Buscando rides con status 'driver_confirmed' asignados a driver ${driverId}`);

      // Buscar rides donde el conductor está asignado y status es 'driver_confirmed'
      const pendingRequests = await this.prisma.ride.findMany({
        where: {
          driverId: driverId,
          status: 'driver_confirmed',
          // Opcional: filtrar por tiempo de expiración
          updatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos para evitar rides muy antiguos
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc', // Más recientes primero
        },
      });

      this.logger.log(`📊 [PENDING-REQUESTS] Encontrados ${pendingRequests.length} rides pendientes para conductor ${driverId}`);

      // Log detallado de cada ride pendiente
      pendingRequests.forEach((ride, index) => {
        const assignedAt = new Date(ride.updatedAt);
        const expiresAt = new Date(assignedAt.getTime() + 2 * 60 * 1000);
        const now = new Date();
        const timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

        this.logger.log(`📋 [PENDING-REQUESTS] Ride ${index + 1}: ID=${ride.rideId} - Usuario: ${ride.user?.name || 'N/A'} - Origen: ${ride.originAddress.substring(0, 30)}... - Asignado: ${assignedAt.toISOString()} - Expira en: ${timeRemainingSeconds}s`);
      });

      // Formatear respuesta
      const formattedRequests = pendingRequests.map((ride) => {
        // Calcular tiempo restante para expiración (2 minutos desde la asignación)
        const assignedAt = new Date(ride.updatedAt);
        const expiresAt = new Date(assignedAt.getTime() + 2 * 60 * 1000);
        const now = new Date();
        const timeRemainingSeconds = Math.max(
          0,
          Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
        );

        return {
          rideId: ride.rideId,
          status: ride.status,
          originAddress: ride.originAddress,
          destinationAddress: ride.destinationAddress,
          farePrice: Number(ride.farePrice),
          estimatedDistance: 0, // TODO: Calcular distancia real
          duration: ride.rideTime,
          passenger: {
            name: ride.user?.name || 'Usuario',
            phone: '+57xxxxxxxxxx', // TODO: Agregar teléfono real del usuario
            rating: 4.9, // TODO: Calcular rating real del pasajero
          },
          tier: {
            name: ride.tier?.name || 'Standard',
          },
          requestedAt: assignedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          timeRemainingSeconds: timeRemainingSeconds,
          pickupLocation: {
            lat: Number(ride.originLatitude),
            lng: Number(ride.originLongitude),
          },
        };
      });

      if (formattedRequests.length === 0) {
        this.logger.log(`📭 [PENDING-REQUESTS] No se encontraron solicitudes pendientes para conductor ${driverId}`);
        this.logger.log(`💡 [PENDING-REQUESTS] Posibles causas:`);
        this.logger.log(`   - No hay usuarios solicitando rides en este momento`);
        this.logger.log(`   - Las solicitudes expiraron (2 minutos máximo)`);
        this.logger.log(`   - El conductor no fue seleccionado por el algoritmo de matching`);
        this.logger.log(`   - Verificar ubicación del conductor: ${driverLocation ? `(${driverLocation.lat}, ${driverLocation.lng})` : 'NO DISPONIBLE'}`);
      } else {
        this.logger.log(`✅ [PENDING-REQUESTS] Encontradas ${formattedRequests.length} solicitudes pendientes para conductor ${driverId}`);
      }

      return formattedRequests;
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo solicitudes pendientes para conductor ${driverId}:`,
        error,
      );
      throw error;
    }
  }
}
