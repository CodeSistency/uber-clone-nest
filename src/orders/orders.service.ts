import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: number) {
    const { storeId, items, deliveryAddress, deliveryLatitude, deliveryLongitude, specialInstructions, paymentMethod, promoCode } = createOrderDto;

    // Verify store exists and is open
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, isOpen: true, name: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (!store.isOpen) {
      throw new BadRequestException('Store is currently closed');
    }

    // Calculate order total and validate products
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, price: true, isAvailable: true, storeId: true, name: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (!product.isAvailable) {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }

      if (product.storeId !== storeId) {
        throw new BadRequestException(`Product ${item.productId} does not belong to store ${storeId}`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        specialInstructions: item.specialInstructions,
      });
    }

    // Calculate delivery fee (simple calculation)
    const deliveryFee = 3.99; // Fixed delivery fee

    // Apply promo code if provided
    let discount = 0;
    if (promoCode) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { promoCode },
      });

      if (promotion && promotion.isActive && promotion.expiryDate && promotion.expiryDate > new Date()) {
        if (promotion.discountPercentage) {
          discount = subtotal * (Number(promotion.discountPercentage) / 100);
        } else if (promotion.discountAmount) {
          discount = Math.min(Number(promotion.discountAmount), subtotal);
        }
      }
    }

    const totalPrice = subtotal + deliveryFee - discount;

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.deliveryOrder.create({
        data: {
          userId,
          storeId,
          deliveryAddress,
          deliveryLatitude,
          deliveryLongitude,
          totalPrice,
          deliveryFee,
          status: 'pending',
          paymentStatus: 'pending',
          ...(specialInstructions && { specialInstructions }),
        },
        include: {
          store: true,
          user: true,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: newOrder.orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
          ...(item.specialInstructions && { specialInstructions: item.specialInstructions }),
        })),
      });

      return newOrder;
    });

    // Notify store owner about new order
    await this.notifyStoreOwner(order);

    return order;
  }

  async getUserOrders(userId: number, status?: string) {
    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    const orders = await this.prisma.deliveryOrder.findMany({
      where: whereClause,
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, profileImageUrl: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        ratings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }

  async getAvailableOrdersForDelivery() {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: {
        status: 'pending',
        courierId: null,
      },
      include: {
        store: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return orders;
  }

  async acceptOrderForDelivery(orderId: number, driverId: number) {
    // Verify driver exists and is available
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, status: true, verificationStatus: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.status !== 'online') {
      throw new BadRequestException('Driver is not available');
    }

    if (driver.verificationStatus !== 'approved') {
      throw new BadRequestException('Driver is not verified');
    }

    // Update order with driver assignment
    const order = await this.prisma.deliveryOrder.update({
      where: {
        orderId,
        status: 'pending', // Only accept pending orders
        courierId: null,   // Only orders without driver
      },
      data: {
        courierId: driverId,
        status: 'accepted',
      },
      include: {
        store: true,
        user: true,
        courier: true,
      },
    });

    // Update driver status to busy
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'busy' },
    });

    // Notify customer and store
    await this.notifyOrderAccepted(order);

    return order;
  }

  async markOrderPickedUp(orderId: number, driverId: number) {
    const order = await this.prisma.deliveryOrder.update({
      where: {
        orderId,
        courierId: driverId,
        status: 'accepted',
      },
      data: {
        status: 'picked_up',
      },
      include: {
        user: true,
        store: true,
      },
    });

    await this.notifyOrderPickedUp(order);

    return order;
  }

  async markOrderDelivered(orderId: number, driverId: number) {
    const order = await this.prisma.deliveryOrder.update({
      where: {
        orderId,
        courierId: driverId,
        status: 'picked_up',
      },
      data: {
        status: 'delivered',
        actualDeliveryTime: new Date(),
      },
      include: {
        user: true,
        store: true,
        courier: true,
      },
    });

    // Free up driver
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'online' },
    });

    await this.notifyOrderDelivered(order);

    return order;
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: {
        store: true,
        courier: {
          select: { id: true, firstName: true, lastName: true, profileImageUrl: true },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        ratings: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns the order or is the courier or store owner
    if (order.userId !== userId && order.courierId !== userId && order.store.ownerId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async notifyStoreOwner(order: any) {
    // Implementation for store owner notification
    // This would integrate with your notification system
    console.log(`New order ${order.orderId} for store ${order.store.name}`);
  }

  private async notifyOrderAccepted(order: any) {
    // Implementation for order accepted notification
    console.log(`Order ${order.orderId} accepted by driver ${order.courier.firstName}`);
  }

  private async notifyOrderPickedUp(order: any) {
    // Implementation for order picked up notification
    console.log(`Order ${order.orderId} picked up`);
  }

  private async notifyOrderDelivered(order: any) {
    // Implementation for order delivered notification
    console.log(`Order ${order.orderId} delivered`);
  }
}