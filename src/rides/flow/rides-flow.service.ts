import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationManagerService } from '../../notifications/notification-manager.service';
import {
  NotificationType,
  NotificationChannel,
} from '../../notifications/interfaces/notification.interface';
import { WebSocketGatewayClass } from '../../websocket/websocket.gateway';
import { WalletService } from '../../wallet/wallet.service';
import { MatchingEngine } from './matching-engine';
import { MatchingMetricsService } from './matching-metrics.service';
import { RidesService } from '../rides.service';
import { RedisService } from '../../redis/redis.service';
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
    private readonly notificationManager: NotificationManagerService,
    private readonly gateway: WebSocketGatewayClass,
    private readonly ridesService: RidesService,
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
    private readonly errandsService: ErrandsService,
    private readonly parcelsService: ParcelsService,
    private readonly locationTrackingService: LocationTrackingService,
    private readonly walletService: WalletService,
    private readonly redisService: RedisService,
    private readonly matchingMetrics: MatchingMetricsService,
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
        perKmRate: combo.tier.perKmRate,
        imageUrl: combo.tier.imageUrl,
        vehicleTypeId: combo.vehicleTypeId,
        vehicleTypeName: combo.vehicleType.displayName,
        vehicleTypeIcon: combo.vehicleType.icon,
      });

      return acc;
    }, {});

    return groupedByVehicleType;
  }

  // Método para obtener tiers de viaje disponibles
  async getAvailableRideTiers() {
    return this.prisma.rideTier.findMany({
      orderBy: { baseFare: 'asc' }, // Ordenar por precio base (del más barato al más caro)
    });
  }

  // Método para obtener tiers disponibles para un tipo de vehículo específico
  async getAvailableTiersForVehicleType(vehicleTypeId: number) {
    const combinations = await this.prisma.tierVehicleType.findMany({
      where: {
        vehicleTypeId,
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
        perKmRate: combo.tier.perKmRate,
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

    // Calcular precio usando el servicio de pricing avanzado
    // Usamos las coordenadas de origen para pricing geográfico
    const pricingResult = await this.ridesService.getFareEstimate(
      payload.tierId || 1, // Default tier si no se especifica
      payload.minutes,
      this.calculateDistance(
        payload.origin.lat,
        payload.origin.lng,
        payload.destination.lat,
        payload.destination.lng,
      ), // Calcular millas basado en coordenadas
      payload.origin.lat,
      payload.origin.lng,
    );

    // Verificar si el área está permitida
    if (!pricingResult.restrictions.isAllowed) {
      throw new Error(pricingResult.restrictions.reason || 'Service not available in this area');
    }

    // Calcular distancia en millas (1 km ≈ 0.621371 millas)
    const distanceKm = this.calculateDistance(
      payload.origin.lat,
      payload.origin.lng,
      payload.destination.lat,
      payload.destination.lng,
    );
    const distanceMiles = distanceKm * 0.621371;

    const ride = await this.ridesService.createRide({
      origin_address: payload.origin.address,
      destination_address: payload.destination.address,
      origin_latitude: payload.origin.lat,
      origin_longitude: payload.origin.lng,
      destination_latitude: payload.destination.lat,
      destination_longitude: payload.destination.lng,
      ride_time: payload.minutes,
      fare_price: pricingResult.totalFare, // ✅ Usar precio calculado correctamente
      payment_status: 'pending',
      user_id: payload.userId,
      tier_id: payload.tierId,
      vehicle_type_id: payload.vehicleTypeId,
      driver_id: undefined,
    } as any);

    // Log del cálculo de precio para debugging
    this.logger.log(`💰 Ride ${ride.rideId} created with calculated price: ${pricingResult.totalFare}`);
    this.logger.log(`📍 Geographic pricing applied: City=${pricingResult.geographic?.city}, Total multiplier=${pricingResult.breakdown.geographicMultiplier}`);

    // Note: Driver notifications moved to after payment confirmation
    // This ensures users pay before drivers are notified

    return ride;
  }

  /**
   * Notifica conductores cercanos después de que el pago sea confirmado
   * Se ejecuta automáticamente cuando paymentStatus cambia a 'paid'
   */
  async notifyDriversAfterPayment(rideId: number): Promise<void> {
    this.logger.log(
      `🚗 [POST-PAYMENT] Starting driver notification for ride ${rideId}`,
    );

    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: { user: true, tier: true },
    });

    if (!ride) {
      throw new Error(`Ride ${rideId} not found`);
    }

    if (ride.paymentStatus !== 'paid') {
      throw new Error(
        `Ride ${rideId} payment not confirmed (status: ${ride.paymentStatus})`,
      );
    }

    // Notificar conductores cercanos via WebSocket
    this.gateway.server?.to(`ride-${ride.rideId}`).emit('ride:requested', {
      rideId: ride.rideId,
      userId: ride.userId,
      timestamp: new Date(),
      paymentConfirmed: true, // Flag adicional para indicar que ya está pagado
      origin: {
        lat: ride.originLatitude,
        lng: ride.originLongitude,
        address: ride.originAddress,
      },
      destination: {
        lat: ride.destinationLatitude,
        lng: ride.destinationLongitude,
        address: ride.destinationAddress,
      },
      tier: ride.tier,
      farePrice: ride.farePrice,
    });

    this.logger.log(
      `✅ [POST-PAYMENT] Successfully notified drivers for paid ride ${rideId}`,
    );
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
    method: 'cash' | 'card' | 'wallet',
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
    } else if (method === 'wallet') {
      // Wallet payment already processed, just confirm the ride
      // No additional processing needed
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
    await this.notificationManager.notifyRideStatusUpdate(
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
    await this.notificationManager.notifyRideStatusUpdate(
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
    await this.notificationManager.notifyRideStatusUpdate(
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
    await this.notificationManager.notifyRideStatusUpdate(
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
    await this.notificationManager.notifyRideStatusUpdate(
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
    await this.notificationManager.sendNotification({
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
   * Valida que los servicios críticos estén funcionando
   */
  private async validateSystemHealth(): Promise<void> {
    try {
      // 🗄️ [TIMING] Database Health Check
      if (process.env.NODE_ENV === 'development') {
        console.time('🗄️ Database Health Check');
      }

      // Verificar conexión a base de datos
      await this.prisma.$queryRaw`SELECT 1`;

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🗄️ Database Health Check');
      }

      // 🔴 [TIMING] Redis Health Check
      if (process.env.NODE_ENV === 'development') {
        console.time('🔴 Redis Health Check');
      }

      // Verificar Redis si está disponible
      if (this.redisService) {
        await this.redisService.ping();
      }

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🔴 Redis Health Check');
      }
    } catch (error) {
      this.logger.error(
        '❌ [MATCHING] Error en validación de servicios críticos:',
        error,
      );
      throw new Error('Sistema no disponible temporalmente');
    }
  }

  /**
   * Extrae y centraliza toda la lógica de debug
   */
  private logDebugInfo(
    step: string,
    data: any,
    level: 'info' | 'warn' | 'error' = 'info',
  ): void {
    if (process.env.NODE_ENV !== 'development' || !process.env.MATCHING_DEBUG) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      step,
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
    };

    switch (level) {
      case 'error':
        this.logger.error(`🔍 [DEBUG] ${step}:`, logData);
        break;
      case 'warn':
        this.logger.warn(`🔍 [DEBUG] ${step}:`, logData);
        break;
      default:
        this.logger.log(`🔍 [DEBUG] ${step}:`, logData);
    }
  }

  /**
   * Construye filtros de tipo de vehículo basados en tier y vehicleTypeId
   */
  private async buildVehicleTypeFilters(
    tierId?: number,
    vehicleTypeId?: number,
  ): Promise<any> {
    if (vehicleTypeId) {
      return vehicleTypeId;
    }

    if (tierId) {
      const compatibleTypes = await this.prisma.tierVehicleType.findMany({
        where: { tierId, isActive: true },
        select: { vehicleTypeId: true },
      });

      if (compatibleTypes.length === 0) return null;
      if (compatibleTypes.length === 1) return compatibleTypes[0].vehicleTypeId;

      return { in: compatibleTypes.map((vt) => vt.vehicleTypeId) };
    }

    return null;
  }

  /**
   * Busca conductores cercanos con manejo de errores mejorado
   */
  private async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    filters: any,
  ): Promise<any[]> {
    try {
      const drivers = await this.locationTrackingService.findNearbyDrivers(
        lat,
        lng,
        radiusKm,
        filters,
      );

      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `✅ [MATCHING] Encontrados ${drivers.length} conductores cercanos`,
        );
      }

      return drivers;
    } catch (error) {
      this.logger.error(
        '❌ [MATCHING] Error buscando conductores cercanos:',
        error,
      );

      // Fallback: buscar conductores online sin considerar ubicación GPS
      this.logger.warn(
        '⚠️ [MATCHING] Usando fallback - buscando conductores online sin GPS',
      );
      return await this.fallbackDriverSearch(filters);
    }
  }

  /**
   * Búsqueda de fallback cuando el GPS falla
   */
  private async fallbackDriverSearch(filters: any): Promise<any[]> {
    try {
      const drivers = await this.prisma.driver.findMany({
        where: filters,
        include: {
          vehicles: {
            where: { isDefault: true },
            take: 1,
          },
        },
        take: 10, // Limitar resultados en fallback
      });

      return drivers.map((driver) => ({
        ...driver,
        distance: 999, // Distancia máxima para ordenar al final
        currentLocation: null,
        lastLocationUpdate: null,
      }));
    } catch (error) {
      this.logger.error('❌ [MATCHING] Error en búsqueda de fallback:', error);
      return [];
    }
  }

  /**
   * Sistema de caché inteligente para matching con prefetching y expiración adaptativa
   */
  private async getCachedDriversList(
    cacheKey: string,
    fetchFunction: () => Promise<any[]>,
    ttlSeconds: number = 30,
    options?: {
      enablePrefetching?: boolean;
      compression?: boolean;
      adaptiveTTL?: boolean;
    },
  ): Promise<any[]> {
    const {
      enablePrefetching = true,
      compression = false,
      adaptiveTTL = true,
    } = options || {};

    try {
      // Calcular TTL adaptativo basado en frecuencia de uso
      let actualTTL = ttlSeconds;
      if (adaptiveTTL) {
        actualTTL = await this.calculateAdaptiveTTL(cacheKey, ttlSeconds);
      }

      // 🔍 [TIMING] Cache Lookup
      if (process.env.NODE_ENV === 'development') {
        console.time('🔍 Cache Lookup');
      }

      // Intentar obtener del caché (con descompresión si aplica)
      let cached = await this.redisService.get(cacheKey);

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🔍 Cache Lookup');
      }

      if (cached) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.log(`✅ [CACHE] Hit para ${cacheKey}`);
        }

        // Descomprimir si fue comprimido
        if (compression && cached.startsWith('COMPRESSED:')) {
          cached = cached.substring('COMPRESSED:'.length);
          // Nota: En producción usaríamos zlib, aquí simulamos
        }

        const parsedData = JSON.parse(cached);

        // Registrar acceso para métricas de prefetching
        if (enablePrefetching) {
          await this.updateAccessPatterns(cacheKey, parsedData);
        }

        return parsedData;
      }

      // 📡 [TIMING] Database Fetch (Cache Miss)
      if (process.env.NODE_ENV === 'development') {
        console.time('📡 Database Fetch');
      }

      // Si no está en caché, obtener datos frescos
      const data = await fetchFunction();

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📡 Database Fetch');
      }

      // 🚀 [PREFETCHING] Prefetch datos relacionados si está habilitado
      if (enablePrefetching && data.length > 0) {
        await this.prefetchRelatedData(cacheKey, data);
      }

      // 💾 [TIMING] Cache Storage
      if (process.env.NODE_ENV === 'development') {
        console.time('💾 Cache Storage');
      }

      // Preparar datos para caché (con compresión si aplica)
      let cacheData = JSON.stringify(data);
      if (compression && cacheData.length > 1000) {
        // Comprimir si > 1KB
        // Nota: En producción usaríamos zlib, aquí simulamos compresión
        cacheData = 'COMPRESSED:' + cacheData;
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🗜️ [CACHE] Datos comprimidos para ${cacheKey} (${cacheData.length} chars)`,
          );
        }
      }

      // Guardar en caché con TTL adaptativo
      await this.redisService.set(cacheKey, cacheData, actualTTL);

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('💾 Cache Storage');
        this.logger.log(
          `💾 [CACHE] Miss para ${cacheKey} - guardado por ${actualTTL}s (adaptativo: ${adaptiveTTL})`,
        );
      }

      return data;
    } catch (error) {
      this.logger.warn(`⚠️ [CACHE] Error con caché ${cacheKey}:`, error);

      // 🗂️ [TIMING] Fallback Fetch
      if (process.env.NODE_ENV === 'development') {
        console.time('🗂️ Fallback Fetch');
      }

      // Fallback: obtener datos frescos sin caché
      const data = await fetchFunction();

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🗂️ Fallback Fetch');
      }

      return data;
    }
  }

  /**
   * Calcular TTL adaptativo basado en frecuencia de uso
   */
  private async calculateAdaptiveTTL(
    cacheKey: string,
    baseTTL: number,
  ): Promise<number> {
    try {
      // Obtener contador de accesos para esta clave
      const accessKey = `cache:access:${cacheKey}`;
      const accessCount = parseInt(
        (await this.redisService.get(accessKey)) || '0',
      );

      // Incrementar contador de accesos
      await this.redisService.incr(accessKey);
      // Expirar contador en 1 hora
      await this.redisService.expire(accessKey, 3600);

      // TTL adaptativo: más accesos = más tiempo en caché
      if (accessCount > 10) {
        return baseTTL * 2; // Doble tiempo para datos muy accedidos
      } else if (accessCount > 5) {
        return Math.floor(baseTTL * 1.5); // 50% más para datos moderadamente accedidos
      } else if (accessCount > 2) {
        return Math.floor(baseTTL * 1.2); // 20% más para datos poco accedidos
      }

      return baseTTL; // TTL base para datos nuevos
    } catch (error) {
      // En caso de error, usar TTL base
      return baseTTL;
    }
  }

  /**
   * Actualizar patrones de acceso para prefetching inteligente
   */
  private async updateAccessPatterns(
    cacheKey: string,
    data: any[],
  ): Promise<void> {
    try {
      // Solo para datos de conductores
      if (cacheKey.includes('drivers:available') && data.length > 0) {
        const patternKey = 'cache:patterns:driver_access';
        const driverIds = data.map((d) => d.id).join(',');

        // Registrar patrón de acceso reciente
        await this.redisService.set(`pattern:${Date.now()}`, driverIds, 300); // 5 minutos

        // Mantener solo los últimos 10 patrones
        const patternKeys = await this.redisService.keys('pattern:*');
        if (patternKeys.length > 10) {
          // Eliminar patrones antiguos (simplificado)
          for (let i = 0; i < patternKeys.length - 10; i++) {
            await this.redisService.del(patternKeys[i]);
          }
        }
      }
    } catch (error) {
      // No crítico, continuar sin prefetching
    }
  }

  /**
   * Prefetch datos relacionados basados en patrones de acceso
   */
  private async prefetchRelatedData(
    cacheKey: string,
    data: any[],
  ): Promise<void> {
    try {
      // Prefetch de detalles de conductores si tenemos datos de disponibilidad
      if (cacheKey.includes('drivers:available') && data.length > 0) {
        const driverIds = data
          .map((d) => d.id || d.driverId)
          .filter((id) => id);

        if (driverIds.length > 0 && driverIds.length <= 10) {
          // Limitar prefetch a 10 conductores
          // Prefetch en background sin esperar
          setImmediate(async () => {
            try {
              const detailsKey = `drivers:details:${driverIds.sort().join(',')}`;
              const existing = await this.redisService.get(detailsKey);

              if (!existing) {
                // Solo prefetch si no existe en caché
                await this.getDriverDetailsWithCache(driverIds);
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    `🚀 [PREFETCH] Detalles prefetched para ${driverIds.length} conductores`,
                  );
                }
              }
            } catch (error) {
              // Prefetch falló, no crítico
            }
          });
        }
      }
    } catch (error) {
      // Prefetch falló, continuar normalmente
    }
  }

  /**
   * Calcular distancias con control de concurrencia para evitar sobrecargar Redis
   */
  private async calculateDistancesWithConcurrencyLimit(
    drivers: any[],
    userLat: number,
    userLng: number,
    maxDistance: number,
    concurrencyLimit: number = 8,
  ): Promise<any[]> {
    const results: any[] = [];
    const batches: any[][] = [];

    // Dividir conductores en lotes según límite de concurrencia
    for (let i = 0; i < drivers.length; i += concurrencyLimit) {
      batches.push(drivers.slice(i, i + concurrencyLimit));
    }

    // Procesar cada lote
    for (const batch of batches) {
      const batchPromises = batch.map(async (driver) => {
        try {
          const driverLocation =
            await this.locationTrackingService.getDriverLocation(driver.id);
          if (driverLocation) {
            const distance = this.calculateDistance(
              userLat,
              userLng,
              driverLocation.location.lat,
              driverLocation.location.lng,
            );
            return { ...driver, distance, currentLocation: driverLocation };
          } else {
            // Si no hay ubicación, usar distancia máxima
            return { ...driver, distance: maxDistance, currentLocation: null };
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ [MATCHING] Error obteniendo ubicación para driver ${driver.id}:`,
            error,
          );
          return { ...driver, distance: maxDistance, currentLocation: null };
        }
      });

      // Esperar a que termine el lote actual antes de procesar el siguiente
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pequeña pausa entre lotes para no sobrecargar (opcional)
      if (batches.length > 1 && batch !== batches[batches.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 5)); // 5ms pause
      }
    }

    return results;
  }

  /**
   * Obtener conductores disponibles con caché inteligente
   */
  private async getAvailableDriversWithCache(
    filters: any,
    radiusKm: number,
    userLat: number,
    userLng: number,
  ): Promise<any[]> {
    const cacheKey = `drivers:available:${JSON.stringify(filters)}:r${radiusKm}`;

    return this.getCachedDriversList(
      cacheKey,
      () => this.findNearbyDrivers(userLat, userLng, radiusKm, filters),
      30, // 30 segundos base
      {
        enablePrefetching: true,
        compression: false, // Datos de disponibilidad son pequeños
        adaptiveTTL: true,
      },
    );
  }

  /**
   * Obtener información detallada de conductores con caché
   */
  private async getDriverDetailsWithCache(driverIds: number[]): Promise<any[]> {
    if (driverIds.length === 0) return [];

    const cacheKey = `drivers:details:${driverIds.sort().join(',')}`;

    return this.getCachedDriversList(
      cacheKey,
      () => this.getDriverDetailedInfoBatch(driverIds),
      300, // 5 minutos base
      {
        enablePrefetching: false, // Los detalles ya son el resultado final
        compression: true, // Datos de detalles pueden ser grandes
        adaptiveTTL: true,
      },
    );
  }

  /**
   * Obtener información detallada de múltiples conductores
   */
  private async getDriverDetailedInfoBatch(
    driverIds: number[],
  ): Promise<any[]> {
    if (driverIds.length === 0) return [];

    try {
      // Query optimizada: seleccionar solo campos necesarios
      const drivers = await this.prisma.driver.findMany({
        where: {
          id: { in: driverIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          createdAt: true,
          // Incluir solo vehículo por defecto con campos esenciales
          vehicles: {
            where: { isDefault: true },
            take: 1,
            select: {
              make: true,
              model: true,
              licensePlate: true,
              seatingCapacity: true,
              vehicleType: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          // Optimizar query de ratings: usar agregación en lugar de cargar todos
          _count: {
            select: {
              rides: true,
            },
          },
          rides: {
            take: 20, // Aumentar para mejor promedio
            orderBy: { createdAt: 'desc' },
            select: {
              ratings: {
                select: {
                  ratingValue: true,
                },
                take: 1, // Solo necesitamos el rating de cada ride
              },
            },
          },
        },
      });

      return drivers.map((driver) => {
        // Calcular promedio de ratings de forma optimizada
        const recentRatings = (driver.rides || [])
          .flatMap(
            (ride: any) => ride.ratings?.map((r: any) => r.ratingValue) || [],
          )
          .filter(Boolean);

        const avgRating =
          recentRatings.length > 0
            ? recentRatings.reduce(
                (sum: number, rating: number) => sum + rating,
                0,
              ) / recentRatings.length
            : 0;

        return {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          profileImageUrl: driver.profileImageUrl,
          rating: avgRating,
          totalRides: driver._count?.rides || 0, // Usar el contador optimizado
          createdAt: driver.createdAt,
          vehicles: driver.vehicles || [],
        };
      });
    } catch (error) {
      this.logger.error(
        '❌ Error obteniendo información detallada de conductores:',
        error,
      );
      return [];
    }
  }

  /**
   * Invalidar caché de matching cuando cambie el estado de conductores
   */
  async invalidateDriverCache(driverId?: number): Promise<void> {
    try {
      const patterns = [
        'drivers:available:*',
        'drivers:details:*',
        'pricing:*',
      ];

      for (const pattern of patterns) {
        // Nota: En Redis, para invalidar patrones necesitamos usar KEYS (solo para desarrollo)
        // En producción usar sets de claves relacionadas
        if (process.env.NODE_ENV === 'development') {
          const keys = await this.redisService.keys(pattern);
          if (keys.length > 0) {
            await this.redisService.del(...keys);
            this.logger.log(
              `🗑️ [CACHE] Invalidado ${keys.length} claves con patrón ${pattern}`,
            );
          }
        }
      }

      if (driverId) {
        this.logger.log(
          `🗑️ [CACHE] Caché invalidado para conductor ${driverId}`,
        );
      } else {
        this.logger.log(`🗑️ [CACHE] Caché global de matching invalidado`);
      }
    } catch (error) {
      this.logger.warn('⚠️ [CACHE] Error invalidando caché:', error);
    }
  }

  /**
   * Calcula scores para múltiples conductores usando MatchingEngine
   */
  private async calculateDriversScores(
    drivers: any[],
    userLat: number,
    userLng: number,
    searchRadius?: number,
  ): Promise<any[]> {
    const engine = new MatchingEngine(
      this.prisma,
      this.matchingMetrics,
      this.logger,
    );
    return engine.calculateBatchScores(drivers, userLat, userLng, searchRadius);
  }

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

    // Log inicial solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(
        `🎯 [MATCHING] Iniciando búsqueda de conductor - Usuario: (${lat}, ${lng}) - Radio: ${radiusKm}km - Tier: ${tierId || 'auto'} - VehicleType: ${vehicleTypeId || 'auto'}`,
      );
    }

    try {
      // 🔍 [TIMING] Health Check Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🔍 Health Check');
      }

      // Verificar servicios críticos antes de proceder
      await this.validateSystemHealth();

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🔍 Health Check');
      }

      // 🔧 [TIMING] Filters Building Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🔧 Filters Building');
      }

      // 1. Obtener conductores candidatos con filtros básicos
      const driverFilters: any = {
        status: 'online' as const,
        verificationStatus: 'approved' as const,
      };

      // 2. Aplicar filtros de compatibilidad de vehículo
      if (tierId || vehicleTypeId) {
        const vehicleTypeFilters = await this.buildVehicleTypeFilters(
          tierId,
          vehicleTypeId,
        );
        if (vehicleTypeFilters) {
          driverFilters.vehicleTypeId = vehicleTypeFilters;
        }
      }

      this.logDebugInfo('Filtros aplicados', {
        driverFilters,
        searchParams: { lat, lng, radiusKm },
      });

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🔧 Filters Building');
      }

      // 🗂️ [TIMING] Drivers Search Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🗂️ Drivers Search');
      }

      // 3. Buscar conductores candidatos cercanos (con caché inteligente)
      const candidateDrivers = await this.getAvailableDriversWithCache(
        driverFilters,
        radiusKm,
        lat,
        lng,
      );

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🗂️ Drivers Search');
      }

      this.logDebugInfo('Conductores candidatos encontrados', {
        count: candidateDrivers.length,
        searchArea: { lat, lng, radiusKm },
      });

      // Si no hay conductores candidatos, retornar null
      if (candidateDrivers.length === 0) {
        this.logger.warn(
          `⚠️ [MATCHING] No se encontraron conductores disponibles en el área`,
        );
        return null;
      }

      // 📋 [TIMING] Driver Details Fetch Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('📋 Driver Details Fetch');
      }

      // 4. Obtener información detallada de conductores para scoring (con caché)
      const driverIds = candidateDrivers.map((d) => d.id || d.driverId);
      const detailedDrivers = await this.getDriverDetailsWithCache(driverIds);

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📋 Driver Details Fetch');
      }

      // 📏 [TIMING] Distance Calculation Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('📏 Distance Calculation');
      }

      if (detailedDrivers.length === 0) {
        this.logger.error(
          '❌ [MATCHING] No se pudo obtener información detallada de conductores',
        );
        return null;
      }

      // 📏 [TIMING] Distance Calculation Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('📏 Distance Calculation');
      }

      // 5. Calcular distancias con paralelización controlada
      // Limitar concurrencia para evitar sobrecargar Redis
      const driversWithDistance =
        await this.calculateDistancesWithConcurrencyLimit(
          detailedDrivers,
          lat,
          lng,
          radiusKm || 5,
        );

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📏 Distance Calculation');
      }

      // 🧮 [TIMING] Scoring Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🧮 Scoring');
      }

      // 6. Calcular scores para todos los conductores usando MatchingEngine optimizado
      const scoredDrivers = await this.calculateDriversScores(
        driversWithDistance,
        lat,
        lng,
        radiusKm,
      );

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🧮 Scoring');
      }

      // 🏆 [TIMING] Winner Details Fetch Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🏆 Winner Details Fetch');
      }

      if (scoredDrivers.length === 0) {
        this.logger.warn(
          '⚠️ [MATCHING] No se pudieron calcular scores para los conductores',
        );
        return null;
      }

      // 6. Seleccionar el mejor conductor
      const bestDriver = scoredDrivers[0];

      this.logDebugInfo('Mejor conductor seleccionado', {
        driverId: bestDriver.id,
        score: bestDriver.score.toFixed(2),
        distance: bestDriver.distance.toFixed(2),
        location: bestDriver.currentLocation,
      });

      // 🏆 [TIMING] Winner Details Fetch Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('🏆 Winner Details Fetch');
      }

      // 6. Preparar respuesta final
      const driverDetails = await this.getDriverDetailedInfo(bestDriver.id);

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🏆 Winner Details Fetch');
      }

      // ⏰ [TIMING] ETA Calculation Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('⏰ ETA Calculation');
      }

      // 7. Calcular tiempo estimado de llegada (velocidad promedio 30 km/h en ciudad)
      const estimatedMinutes = Math.max(
        1,
        Math.round(((bestDriver.distance * 1000) / 30) * 60),
      ); // Convertir km a minutos

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('⏰ ETA Calculation');
      }

      // 📊 [TIMING] Response Preparation Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('📊 Response Preparation');
      }

      // 8. Preparar respuesta
      const processingTime = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `✅ [MATCHING] Matching completado en ${processingTime}ms - Conductor: ${driverDetails.firstName} ${driverDetails.lastName} (ID: ${bestDriver.id})`,
        );
      }

      // 📈 [TIMING] Metrics Recording Phase
      if (process.env.NODE_ENV === 'development') {
        console.time('📈 Metrics Recording');
      }

      // Registrar métricas completas de matching
      await this.matchingMetrics.recordMatchingMetrics({
        duration: processingTime,
        driversFound: candidateDrivers.length,
        driversScored: scoredDrivers.length,
        winnerScore: bestDriver.score,
        winnerDistance: bestDriver.distance,
        winnerRating: Number(
          driverDetails.rating || driverDetails.averageRating || 0,
        ),
        searchRadius: radiusKm,
        hasWinner: true,
        tierId,
        strategy: 'balanced',
      });

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📈 Metrics Recording');
        console.timeEnd('📊 Response Preparation');
        console.log(`🎯 [TIMING] Total Matching Process: ${processingTime}ms`);
      }

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
            carModel: driverDetails.vehicles?.[0]
              ? `${driverDetails.vehicles[0].make} ${driverDetails.vehicles[0].model}`
              : 'Unknown',
            licensePlate: driverDetails.vehicles?.[0]?.licensePlate || '',
            carSeats: driverDetails.vehicles?.[0]?.seatingCapacity || 0,
            vehicleType:
              driverDetails.vehicles?.[0]?.vehicleType?.displayName || null,
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
        vehicles: {
          where: { isDefault: true, status: 'active' },
          take: 1,
          include: { vehicleType: true },
        },
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
    const recentRatings = (driver.rides || []).flatMap((ride) =>
      (ride.ratings || []).map((r) => r.ratingValue),
    );
    const avgRating =
      recentRatings.length > 0
        ? recentRatings.reduce((sum, rating) => sum + rating, 0) /
          recentRatings.length
        : 4.5; // Rating por defecto si no hay calificaciones recientes

    return {
      ...driver,
      rating: Math.round(avgRating * 10) / 10, // Redondear a 1 decimal
      totalRides: (driver.rides || []).length,
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
    const perKmRate = Number(tier.perKmRate);

    const fare = baseFare + minutes * perMinuteRate + distanceKm * perKmRate;
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

      await this.notificationManager.sendNotification({
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
        await this.notificationManager.sendNotification({
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
        await this.notificationManager.sendNotification({
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
        await this.notificationManager.sendNotification({
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
      await this.notificationManager.sendNotification({
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
      await this.notificationManager.sendNotification({
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
    },
  ) {
    console.log(`🔄 [RIDES-FLOW] === INICIO updateDriverLocation ===`);
    console.log(`🔄 [RIDES-FLOW] DriverId recibido: ${driverId}`);
    console.log(`🔄 [RIDES-FLOW] Datos de ubicación:`, {
      lat: locationData.lat,
      lng: locationData.lng,
      accuracy: locationData.accuracy,
      speed: locationData.speed,
      heading: locationData.heading,
      rideId: locationData.rideId,
    });

    try {
      console.log(
        `🔄 [RIDES-FLOW] Llamando a locationTrackingService.updateDriverLocation...`,
      );

      // Actualizar ubicación usando el location tracking service
      await this.locationTrackingService.updateDriverLocation(
        driverId,
        { lat: locationData.lat, lng: locationData.lng },
        locationData.rideId,
        {
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading,
          source: 'api',
        },
      );

      console.log(
        `✅ [RIDES-FLOW] locationTrackingService.updateDriverLocation completado para driver ${driverId}`,
      );

      // Verificar que se guardó correctamente en BD
      const driverAfterUpdate = await this.prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          currentLatitude: true,
          currentLongitude: true,
          isLocationActive: true,
          lastLocationUpdate: true,
          locationAccuracy: true,
        },
      });

      console.log(`🔍 [RIDES-FLOW] Verificación BD después de update:`, {
        driverId: driverAfterUpdate?.id,
        currentLatitude: driverAfterUpdate?.currentLatitude,
        currentLongitude: driverAfterUpdate?.currentLongitude,
        isLocationActive: driverAfterUpdate?.isLocationActive,
        lastLocationUpdate: driverAfterUpdate?.lastLocationUpdate,
        locationAccuracy: driverAfterUpdate?.locationAccuracy,
      });

      console.log(
        `✅ [RIDES-FLOW] Ubicación del conductor ${driverId} actualizada exitosamente`,
      );

      return {
        driverId,
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
        },
        updatedAt: new Date(),
        accuracy: locationData.accuracy,
      };
    } catch (error) {
      this.logger.error(
        `❌ [LOCATION-UPDATE] Error actualizando ubicación del conductor ${driverId}:`,
        error,
      );
      throw error;
    }
  }

  async setDriverOnline(driverId: number) {
    try {
      this.logger.log(
        `🚗 [DRIVER-STATUS] Poniendo conductor ${driverId} online`,
      );

      // Verificar que el conductor existe y está verificado
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          verificationStatus: true,
        },
      });

      if (!driver) {
        throw new Error('DRIVER_NOT_FOUND');
      }

      if (driver.verificationStatus !== 'approved') {
        throw new Error('DRIVER_NOT_VERIFIED');
      }

      // Actualizar estado a online
      const updatedDriver = await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          status: 'online',
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `✅ [DRIVER-STATUS] Conductor ${driverId} (${driver.firstName} ${driver.lastName}) está ahora online`,
      );

      return {
        driverId: updatedDriver.id,
        status: updatedDriver.status,
        onlineAt: updatedDriver.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `❌ [DRIVER-STATUS] Error poniendo conductor ${driverId} online:`,
        error,
      );

      if (error.message === 'DRIVER_NOT_FOUND') {
        throw new NotFoundException({
          error: 'DRIVER_NOT_FOUND',
          message: 'Conductor no encontrado',
        });
      }

      if (error.message === 'DRIVER_NOT_VERIFIED') {
        throw new ForbiddenException({
          error: 'DRIVER_NOT_VERIFIED',
          message: 'Conductor no está verificado',
        });
      }

      throw error;
    }
  }

  async setDriverOffline(driverId: number) {
    try {
      this.logger.log(
        `🔴 [DRIVER-STATUS] Poniendo conductor ${driverId} offline`,
      );

      // Verificar que no tenga rides activos
      const activeRide = await this.prisma.ride.findFirst({
        where: {
          driverId: driverId,
          status: { in: ['accepted', 'arrived', 'in_progress'] },
        },
      });

      if (activeRide) {
        throw new Error('DRIVER_HAS_ACTIVE_RIDE');
      }

      // Actualizar estado a offline
      const updatedDriver = await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          status: 'offline',
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `✅ [DRIVER-STATUS] Conductor ${driverId} está ahora offline`,
      );

      return {
        driverId: updatedDriver.id,
        status: updatedDriver.status,
        offlineAt: updatedDriver.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `❌ [DRIVER-STATUS] Error poniendo conductor ${driverId} offline:`,
        error,
      );

      if (error.message === 'DRIVER_HAS_ACTIVE_RIDE') {
        throw new ConflictException({
          error: 'DRIVER_HAS_ACTIVE_RIDE',
          message: 'No se puede poner offline con un ride activo',
        });
      }

      throw error;
    }
  }

  async getDriverPendingRequests(driverId: number) {
    try {
      this.logger.log(
        `📋 Buscando solicitudes pendientes para driver ${driverId}`,
      );

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
        this.logger.error(
          `❌ Driver ${driverId} no encontrado en base de datos`,
        );
        return [];
      }

      this.logger.log(
        `👤 Driver encontrado: ${driver.firstName} ${driver.lastName} (${driver.status})`,
      );

      // 🔍 Obtener ubicación actual del conductor desde LocationTrackingService
      let driverLocation: any = null;
      try {
        // Primero intentar obtener de memoria
        driverLocation =
          this.locationTrackingService.getDriverLocation(driverId);

        // Si no está en memoria, buscar en base de datos
        if (!driverLocation) {
          this.logger.debug(
            `📍 [PENDING-REQUESTS] Ubicación no encontrada en memoria, consultando BD para conductor ${driverId}`,
          );
          driverLocation =
            await this.locationTrackingService.getDriverLocationFromDB(
              driverId,
            );
        }

        this.logger.log(
          `📍 [PENDING-REQUESTS] Ubicación actual del conductor ${driverId}: (${driverLocation?.lat || 'N/A'}, ${driverLocation?.lng || 'N/A'}) - Última actualización: ${driverLocation?.lastUpdate ? new Date(driverLocation.lastUpdate).toISOString() : 'N/A'}`,
        );
      } catch (error) {
        this.logger.warn(
          `⚠️ [PENDING-REQUESTS] No se pudo obtener ubicación del conductor ${driverId}: ${error.message}`,
        );
        this.logger.warn(
          `🔍 Verificar que el conductor esté enviando actualizaciones de ubicación (POST /location)`,
        );
      }

      this.logger.log(
        `🔍 Buscando rides con status 'driver_confirmed' asignados a driver ${driverId}`,
      );

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

      this.logger.log(
        `📊 [PENDING-REQUESTS] Encontrados ${pendingRequests.length} rides pendientes para conductor ${driverId}`,
      );

      // Log detallado de cada ride pendiente
      pendingRequests.forEach((ride, index) => {
        const assignedAt = new Date(ride.updatedAt);
        const expiresAt = new Date(assignedAt.getTime() + 2 * 60 * 1000);
        const now = new Date();
        const timeRemainingSeconds = Math.max(
          0,
          Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
        );

        this.logger.log(
          `📋 [PENDING-REQUESTS] Ride ${index + 1}: ID=${ride.rideId} - Usuario: ${ride.user?.name || 'N/A'} - Origen: ${ride.originAddress.substring(0, 30)}... - Asignado: ${assignedAt.toISOString()} - Expira en: ${timeRemainingSeconds}s`,
        );
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
        this.logger.log(
          `📭 [PENDING-REQUESTS] No se encontraron solicitudes pendientes para conductor ${driverId}`,
        );
        this.logger.log(`💡 [PENDING-REQUESTS] Posibles causas:`);
        this.logger.log(
          `   - No hay usuarios solicitando rides en este momento`,
        );
        this.logger.log(`   - Las solicitudes expiraron (2 minutos máximo)`);
        this.logger.log(
          `   - El conductor no fue seleccionado por el algoritmo de matching`,
        );
        this.logger.log(
          `   - Verificar ubicación del conductor: ${driverLocation ? `(${driverLocation.lat}, ${driverLocation.lng})` : 'NO DISPONIBLE'}`,
        );
      } else {
        this.logger.log(
          `✅ [PENDING-REQUESTS] Encontradas ${formattedRequests.length} solicitudes pendientes para conductor ${driverId}`,
        );
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

  // =========================================
  // RATING DEL CONDUCTOR AL PASAJERO
  // =========================================

  /**
   * Permite al conductor calificar al pasajero después de completar un viaje
   */
  async driverRatePassenger(
    rideId: number,
    driverId: number,
    driverUserId: string,
    rating: number,
    comment?: string,
  ): Promise<{
    ratingId: number;
    rideId: number;
    passengerId: number;
    rating: number;
    comment?: string;
    createdAt: Date;
    message: string;
  }> {
    this.logger.log(
      `⭐ [DRIVER-RATE-PASSENGER] Conductor ${driverId} califica viaje ${rideId}`,
    );

    // Verificar que el viaje existe y está completado
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: { user: true },
    });

    if (!ride) {
      this.logger.error(
        `❌ [DRIVER-RATE-PASSENGER] Viaje ${rideId} no encontrado`,
      );
      throw new Error('RIDE_NOT_FOUND');
    }

    // Verificar que el viaje está completado
    if (ride.status !== 'completed') {
      this.logger.error(
        `❌ [DRIVER-RATE-PASSENGER] Viaje ${rideId} no está completado (status: ${ride.status})`,
      );
      throw new Error('RIDE_NOT_COMPLETED');
    }

    // Verificar que el conductor es quien realizó el viaje
    if (ride.driverId !== driverId) {
      this.logger.error(
        `❌ [DRIVER-RATE-PASSENGER] Conductor ${driverId} no está autorizado para viaje ${rideId} (conductor del viaje: ${ride.driverId})`,
      );
      throw new Error('DRIVER_NOT_AUTHORIZED');
    }

    // Verificar que no existe ya un rating del conductor para este viaje
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        rideId,
        ratedByUserId: Number(driverUserId),
        ratedUserId: ride.userId, // El conductor califica al pasajero
      },
    });

    if (existingRating) {
      this.logger.error(
        `❌ [DRIVER-RATE-PASSENGER] Ya existe rating del conductor ${driverId} para viaje ${rideId}`,
      );
      throw new Error('RATING_ALREADY_EXISTS');
    }

    // Crear el rating
    const newRating = await this.prisma.rating.create({
      data: {
        rideId,
        ratedByUserId: Number(driverUserId), // Conductor
        ratedUserId: ride.userId, // Pasajero
        ratingValue: rating,
        comment: comment || null,
      },
    });

    this.logger.log(
      `✅ [DRIVER-RATE-PASSENGER] Rating creado exitosamente: ID ${newRating.id}, ${rating} estrellas`,
    );

    // Notificar al pasajero sobre la calificación recibida
    try {
      await this.notificationManager.sendNotification({
        userId: ride.userId.toString(),
        type: NotificationType.PASSENGER_RATED_BY_DRIVER,
        title: 'Calificación Recibida',
        message: `El conductor te ha calificado con ${rating} estrella${rating !== 1 ? 's' : ''}${comment ? `. Comentario: "${comment}"` : ''}`,
        data: {
          rideId,
          rating: rating,
          comment: comment,
          ratedBy: 'driver',
        },
        channels: [NotificationChannel.PUSH],
      });

      this.logger.log(
        `📱 [DRIVER-RATE-PASSENGER] Notificación enviada al pasajero ${ride.userId}`,
      );
    } catch (notificationError) {
      this.logger.warn(
        `⚠️ [DRIVER-RATE-PASSENGER] Error enviando notificación al pasajero:`,
        notificationError,
      );
      // No fallar por error de notificación
    }

    return {
      ratingId: newRating.id,
      rideId: ride.rideId,
      passengerId: ride.userId,
      rating: newRating.ratingValue,
      comment: newRating.comment || undefined,
      createdAt: newRating.createdAt,
      message: 'Calificación registrada exitosamente',
    };
  }
}
