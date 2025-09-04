import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealTimeService } from '../websocket/real-time.service';
import { DeliveryOrder, OrderItem, Rating } from '@prisma/client';
import { NotificationType, NotificationChannel } from '../notifications/interfaces/notification.interface';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { RateOrderDto } from './dto/rate-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realTimeService: RealTimeService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userClerkId: string): Promise<DeliveryOrder> {
    const { items, ...orderData } = createOrderDto;

    // Validar que la tienda existe y está abierta
    const store = await this.prisma.store.findUnique({
      where: { id: orderData.storeId },
      select: { id: true, isOpen: true, latitude: true, longitude: true, name: true },
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    if (!store.isOpen) {
      throw new BadRequestException('Store is currently closed');
    }

    // Validar productos
    await this.validateOrderItems(items, orderData.storeId);

    // Calcular total
    const totalPrice = await this.calculateOrderTotal(items);

    // Calcular delivery fee basado en distancia
    const deliveryFee = await this.calculateDeliveryFee(
      Number(store.latitude),
      Number(store.longitude),
      orderData.deliveryLatitude,
      orderData.deliveryLongitude,
    );

    // Crear orden
    const order = await this.prisma.deliveryOrder.create({
      data: {
        ...orderData,
        userClerkId,
        totalPrice,
        deliveryFee,
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            specialRequests: item.specialRequests,
          })),
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        store: true,
      },
    });

    // Notificar tienda sobre nuevo pedido
    await this.notifyStoreNewOrder(order);

    // Notificar conductores disponibles
    await this.notifyNearbyCouriers(order);

    return order;
  }

  async getUserOrders(
    userClerkId: string,
    status?: string,
    limit: number = 20,
  ): Promise<DeliveryOrder[]> {
    return this.prisma.deliveryOrder.findMany({
      where: {
        userClerkId,
        ...(status && { status }),
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        store: {
          select: { id: true, name: true, logoUrl: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true },
        },
        ratings: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getOrderDetails(orderId: number, userClerkId: string): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        orderId,
        userClerkId,
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        store: true,
        courier: true,
        ratings: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: number, userClerkId: string): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        orderId,
        userClerkId,
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        store: true,
        courier: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or cannot be cancelled');
    }

    const updatedOrder = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: {
        status: 'cancelled',
        paymentStatus: 'refunded',
      },
      include: {
        store: true,
        courier: true,
      },
    });

    // Notificar tienda y conductor
    await this.notificationsService.sendNotification({
      userId: order.store.ownerClerkId!,
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Order #${orderId} has been cancelled by the customer`,
      data: { orderId },
      channels: [NotificationChannel.PUSH],
    });

    if (order.courierId) {
      await this.notificationsService.sendNotification({
        userId: order.courierId.toString(),
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order Cancelled',
        message: `Order #${orderId} has been cancelled`,
        data: { orderId },
        channels: [NotificationChannel.PUSH],
      });
    }

    return updatedOrder;
  }

  async getAvailableOrdersForDelivery(): Promise<DeliveryOrder[]> {
    return this.prisma.deliveryOrder.findMany({
      where: {
        status: 'confirmed',
        courierId: null,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // Últimos 30 min
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        store: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  }

  async acceptOrderForDelivery(orderId: number, driverId: number): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: {
        store: true,
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.courierId) {
      throw new BadRequestException('Order already assigned to another driver');
    }

    if (order.status !== 'confirmed') {
      throw new BadRequestException('Order is not available for delivery');
    }

    const updatedOrder = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: {
        courierId: driverId,
        status: 'accepted',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 min
      },
      include: {
        store: true,
        user: true,
        courier: true,
        orderItems: { include: { product: true } },
      },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: NotificationType.ORDER_ACCEPTED,
      title: 'Order Accepted!',
      message: `Your order from ${order.store.name} is being prepared`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    // Notificar tienda
    await this.notificationsService.sendNotification({
      userId: order.store.ownerClerkId!,
      type: NotificationType.ORDER_ASSIGNED,
      title: 'New Order Assigned',
      message: `Order #${order.orderId} has been assigned to a courier`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return updatedOrder;
  }

  async markOrderPickedUp(orderId: number, driverId: number): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        orderId,
        courierId: driverId,
        status: 'accepted',
      },
      include: { user: true, store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not assigned to you');
    }

    const updatedOrder = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: {
        status: 'picked_up',
      },
      include: { user: true, store: true },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: NotificationType.ORDER_PICKED_UP,
      title: 'Order Picked Up!',
      message: `Your order from ${order.store.name} is on the way`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return updatedOrder;
  }

  async markOrderDelivered(orderId: number, driverId: number): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        orderId,
        courierId: driverId,
        status: 'picked_up',
      },
      include: { user: true, store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not ready for delivery');
    }

    const updatedOrder = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: {
        status: 'delivered',
        actualDeliveryTime: new Date(),
      },
      include: { user: true, store: true },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order Delivered!',
      message: `Your order from ${order.store.name} has been delivered`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    // Notificar tienda
    await this.notificationsService.sendNotification({
      userId: order.store.ownerClerkId!,
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order Delivered',
      message: `Order #${order.orderId} has been successfully delivered`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return updatedOrder;
  }

  async rateOrder(orderId: number, ratingDto: RateOrderDto, userClerkId: string): Promise<Rating[]> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        orderId,
        userClerkId,
        status: 'delivered',
      },
      include: { courier: true, store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not eligible for rating');
    }

    const ratings: Rating[] = [];

    // Rating de la tienda
    if (ratingDto.rating) {
      const storeRating = await this.prisma.rating.create({
        data: {
          orderId,
          storeId: order.storeId,
          ratedByClerkId: userClerkId,
          ratingValue: ratingDto.rating,
          comment: ratingDto.comment,
          createdAt: new Date(),
        },
      });
      ratings.push(storeRating);

      // Actualizar rating promedio de la tienda
      await this.updateStoreRating(order.storeId);
    }

    // Rating del conductor
    if (ratingDto.driverRating && order.courierId) {
      const driverRating = await this.prisma.rating.create({
        data: {
          orderId,
          ratedClerkId: order.courierId.toString(),
          ratedByClerkId: userClerkId,
          ratingValue: ratingDto.driverRating,
          comment: ratingDto.driverComment,
          createdAt: new Date(),
        },
      });
      ratings.push(driverRating);
    }

    return ratings;
  }

  private async validateOrderItems(items: OrderItemDto[], storeId: number): Promise<void> {
    for (const item of items) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          storeId,
          isAvailable: true,
        },
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found or not available`);
      }

      if (product.stock !== null && item.quantity > product.stock) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }
    }
  }

  private async calculateOrderTotal(items: OrderItemDto[]): Promise<number> {
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }
    return Math.round(total * 100) / 100; // Redondear a 2 decimales
  }

  private async calculateDeliveryFee(
    storeLat: number,
    storeLng: number,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<number> {
    const distance = this.calculateDistance(storeLat, storeLng, deliveryLat, deliveryLng);

    // Tarifa base + por km
    const baseFee = 2.99;
    const perKmFee = 0.75;
    const totalFee = baseFee + distance * perKmFee;

    return Math.round(totalFee * 100) / 100;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async notifyStoreNewOrder(order: DeliveryOrder & { store: { ownerClerkId: string | null; name: string } }): Promise<void> {
    await this.notificationsService.sendNotification({
      userId: order.store.ownerClerkId!,
      type: NotificationType.ORDER_CREATED,
      title: 'New Order Received',
      message: `New order #${order.orderId} for $${order.totalPrice}`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });
  }

  private async notifyNearbyCouriers(order: DeliveryOrder & { store: { name: string } }): Promise<void> {
    // Buscar conductores cercanos que puedan hacer deliveries
    const nearbyCouriers = await this.prisma.driver.findMany({
      where: {
        canDoDeliveries: true,
        status: 'online',
        verificationStatus: 'approved',
      },
      take: 10,
    });

    // Notificar cada courier
    for (const courier of nearbyCouriers) {
      await this.notificationsService.sendNotification({
        userId: courier.id.toString(),
        type: NotificationType.DELIVERY_AVAILABLE,
        title: 'New Delivery Available',
        message: `Delivery order from ${order.store.name}`,
        data: { orderId: order.orderId },
        channels: [NotificationChannel.PUSH],
      });
    }
  }

  private async updateStoreRating(storeId: number): Promise<void> {
    const ratings = await this.prisma.rating.findMany({
      where: { storeId },
      select: { ratingValue: true },
    });

    if (ratings.length === 0) {
      return;
    }

    const averageRating = ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) / ratings.length;

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        rating: Math.round(averageRating * 100) / 100,
      },
    });
  }
}
