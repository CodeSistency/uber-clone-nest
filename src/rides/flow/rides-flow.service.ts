import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { WebSocketGatewayClass } from '../../websocket/websocket.gateway';
import { RidesService } from '../rides.service';
import { OrdersService } from '../../orders/orders.service';
import { StripeService } from '../../stripe/stripe.service';

@Injectable()
export class RidesFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gateway: WebSocketGatewayClass,
    private readonly ridesService: RidesService,
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
  ) {}

  async defineTransportRide(payload: {
    userId: number;
    origin: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
    minutes: number;
    vehicleTypeId?: number;
    tierId?: number;
  }) {
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

  async selectTransportVehicle(rideId: number, tierId?: number, vehicleTypeId?: number) {
    console.log(`🔍 selectTransportVehicle called with rideId: ${rideId}, tierId: ${tierId}, vehicleTypeId: ${vehicleTypeId}`);

    try {
      // First check if ride exists
      const existingRide = await this.prisma.ride.findUnique({
        where: { rideId },
      });

      console.log(`📊 Existing ride found:`, existingRide ? 'YES' : 'NO');

      if (!existingRide) {
        throw new Error(`Ride with id ${rideId} not found`);
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
        requestedVehicleTypeId: ride?.requestedVehicleTypeId
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

  async requestTransportDriver(rideId: number) {
    const ride = await this.prisma.ride.findUnique({ where: { rideId } });
    if (!ride) throw new Error('Ride not found');
    await this.notifications.notifyNearbyDrivers(rideId, {
      lat: Number(ride.originLatitude),
      lng: Number(ride.originLongitude),
    });
    return { ok: true };
  }

  async confirmTransportPayment(rideId: number, method: 'cash' | 'card', _clientSecret?: string) {
    let payment:
      | { clientSecret?: string; paymentIntentId?: string }
      | undefined;
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: { user: true }
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
      include: { driver: true, tier: true, requestedVehicleType: true, ratings: true },
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
    this.gateway.server?.to(`ride-${rideId}`).emit('ride:cancelled', { rideId, reason });
    return { ok: true };
  }

  async rateTransport(rideId: number, data: { rating: number; comment?: string; userId: string }) {
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
  async driverAcceptTransport(rideId: number, driverId: number, userId: string) {
    const ride = await this.prisma.ride.update({
      where: { rideId },
      data: { driverId },
    });
    await this.notifications.notifyRideStatusUpdate(rideId, userId, driverId, 'accepted');
    this.gateway.server?.to(`ride-${rideId}`).emit('ride:accepted', { rideId, driverId });
    return ride;
  }

  async driverArrivedTransport(rideId: number, driverId: number, userId: string) {
    await this.notifications.notifyRideStatusUpdate(rideId, userId, driverId, 'arrived');
    this.gateway.server?.to(`ride-${rideId}`).emit('ride:arrived', { rideId, driverId });
    return { ok: true };
  }

  async driverStartTransport(rideId: number, driverId: number, userId: string) {
    await this.notifications.notifyRideStatusUpdate(rideId, userId, driverId, 'in_progress');
    this.gateway.server?.to(`ride-${rideId}`).emit('ride:started', { rideId, driverId });
    return { ok: true };
  }

  async driverCompleteTransport(rideId: number, driverId: number, userId: string, fare: number) {
    const ride = await this.prisma.ride.update({
      where: { rideId },
      data: { farePrice: fare, paymentStatus: 'paid' },
    });
    await this.notifications.notifyRideStatusUpdate(rideId, userId, driverId, 'completed', { fare });
    this.gateway.server?.to(`ride-${rideId}`).emit('ride:completed', { rideId, driverId, fare });
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

  async confirmDeliveryPayment(orderId: number, method: 'cash' | 'card' | 'wallet') {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: { user: true }
    });
    if (!order) throw new Error('Order not found');

    // Para el sistema venezolano, solo marcamos como pendiente
    // La referencia bancaria se generará desde el controlador
    const updated = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: { paymentStatus: 'pending' },
    });

    this.gateway.server?.to(`order-${orderId}`).emit('order:payment:initiated', {
      orderId,
      method,
      message: 'Esperando confirmación de pago venezolano'
    });

    return updated;
  }

  async getDeliveryStatus(orderId: number) {
    return this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: { store: true, courier: true, orderItems: { include: { product: true } }, ratings: true },
    });
  }

  async cancelDelivery(orderId: number, reason?: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { orderId } });
    if (!order) throw new Error('Order not found');
    await this.notifications.sendNotification({
      userId: order.userId.toString(),
      type: 'order_cancelled' as any,
      title: 'Order Cancelled',
      message: reason || 'Your order was cancelled',
      data: { orderId },
      channels: [1 as any],
    } as any);
    this.gateway.server?.to(`order-${orderId}`).emit('order:cancelled', { orderId, reason });
    return { ok: true };
  }

  async driverAcceptDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.acceptOrderForDelivery(orderId, driverId);
    this.gateway.server?.to(`order-${orderId}`).emit('order:accepted', { orderId, driverId });
    return order;
  }

  async driverPickupDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.markOrderPickedUp(orderId, driverId);
    this.gateway.server?.to(`order-${orderId}`).emit('order:picked_up', { orderId, driverId });
    return order;
  }

  async driverDeliverDelivery(orderId: number, driverId: number) {
    const order = await this.ordersService.markOrderDelivered(orderId, driverId);
    this.gateway.server?.to(`order-${orderId}`).emit('order:delivered', { orderId, driverId });
    return order;
  }

  // Errand flow (in-memory orchestration persisted minimally if needed)
  private errands = new Map<number, any>();
  private nextErrandId = 1;

  async createErrand(userId: number, dto: any) {
    const id = this.nextErrandId++;
    const errand = {
      id,
      userId,
      status: 'requested',
      ...dto,
      itemsCost: 0,
      createdAt: new Date(),
    };
    this.errands.set(id, errand);
    this.gateway.server?.to(`errand-${id}`).emit('errand:created', { errandId: id, userId });
    return errand;
  }

  async updateErrandShopping(errandId: number, driverId: number, data: { itemsCost: number; notes?: string }) {
    const e = this.errands.get(errandId);
    if (!e) throw new Error('Errand not found');
    e.itemsCost = data.itemsCost;
    e.shoppingNotes = data.notes;
    e.status = 'shopping_in_progress';
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:shopping_update', { errandId, driverId, ...data });
    await this.notifications.sendNotification({
      userId: String(e.userId),
      type: 'errand_update' as any,
      title: 'Errand update',
      message: `Items cost updated to ${data.itemsCost}`,
      data: { errandId },
      channels: [1 as any],
    } as any);
    return e;
  }

  async driverAcceptErrand(errandId: number, driverId: number) {
    const e = this.errands.get(errandId);
    if (!e) throw new Error('Errand not found');
    e.driverId = driverId;
    e.status = 'accepted';
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:accepted', { errandId, driverId });
    await this.notifications.sendNotification({
      userId: String(e.userId),
      type: 'errand_accepted' as any,
      title: 'Errand accepted',
      message: 'A driver accepted your errand',
      data: { errandId, driverId },
      channels: [1 as any],
    } as any);
    return e;
  }

  async driverStartErrand(errandId: number, driverId: number) {
    const e = this.errands.get(errandId);
    if (!e) throw new Error('Errand not found');
    e.status = 'en_route';
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:started', { errandId, driverId });
    return e;
  }

  async driverCompleteErrand(errandId: number, driverId: number) {
    const e = this.errands.get(errandId);
    if (!e) throw new Error('Errand not found');
    e.status = 'completed';
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:completed', { errandId, driverId, itemsCost: e.itemsCost });
    await this.notifications.sendNotification({
      userId: String(e.userId),
      type: 'errand_completed' as any,
      title: 'Errand completed',
      message: 'Your errand has been completed',
      data: { errandId },
      channels: [1 as any],
    } as any);
    return e;
  }

  async getErrandStatus(errandId: number) {
    return this.errands.get(errandId);
  }

  // Helper method to get transport ride status
  async getTransportRideStatus(rideId: number) {
    return this.prisma.ride.findUnique({
      where: { rideId },
      select: {
        rideId: true,
        userId: true,
        farePrice: true,
        paymentStatus: true
      }
    });
  }

  async cancelErrand(errandId: number, reason?: string) {
    const e = this.errands.get(errandId);
    if (!e) throw new Error('Errand not found');
    e.status = 'cancelled';
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:cancelled', { errandId, reason });
    return { ok: true };
  }

  // Parcel flow (in-memory orchestration)
  private parcels = new Map<number, any>();
  private nextParcelId = 1;

  async createParcel(userId: number, dto: any) {
    const id = this.nextParcelId++;
    const p = { id, userId, status: 'requested', ...dto, createdAt: new Date() };
    this.parcels.set(id, p);
    this.gateway.server?.to(`parcel-${id}`).emit('parcel:created', { parcelId: id, userId });
    return p;
  }

  async driverAcceptParcel(parcelId: number, driverId: number) {
    const p = this.parcels.get(parcelId);
    if (!p) throw new Error('Parcel not found');
    p.driverId = driverId;
    p.status = 'accepted';
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:accepted', { parcelId, driverId });
    return p;
  }

  async driverPickupParcel(parcelId: number, driverId: number) {
    const p = this.parcels.get(parcelId);
    if (!p) throw new Error('Parcel not found');
    p.status = 'picked_up';
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:picked_up', { parcelId, driverId });
    return p;
  }

  async driverDeliverParcel(parcelId: number, driverId: number, proof?: { signatureImageUrl?: string; photoUrl?: string }) {
    const p = this.parcels.get(parcelId);
    if (!p) throw new Error('Parcel not found');
    p.status = 'delivered';
    p.proof = proof;
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:delivered', { parcelId, driverId, proof });
    return p;
  }

  async getParcelStatus(parcelId: number) {
    return this.parcels.get(parcelId);
  }

  async cancelParcel(parcelId: number, reason?: string) {
    const p = this.parcels.get(parcelId);
    if (!p) throw new Error('Parcel not found');
    p.status = 'cancelled';
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:cancelled', { parcelId, reason });
    return { ok: true };
  }
}


