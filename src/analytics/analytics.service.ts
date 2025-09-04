import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStoreAnalytics(storeId: number): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ventas totales
    const orders = await this.prisma.deliveryOrder.findMany({
      where: {
        storeId,
        createdAt: { gte: thirtyDaysAgo },
        status: 'delivered',
      },
      include: {
        orderItems: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Productos más vendidos
    const productSales = new Map<number, { name: string; sold: number; revenue: number }>();

    for (const order of orders) {
      for (const item of order.orderItems) {
        const existing = productSales.get(item.productId) || { name: '', sold: 0, revenue: 0 };
        existing.sold += item.quantity;
        existing.revenue += Number(item.priceAtPurchase) * item.quantity;

        if (!existing.name) {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          existing.name = product?.name || 'Unknown Product';
        }

        productSales.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Horas pico
    const hourlyOrders = new Map<number, number>();
    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourlyOrders.set(hour, (hourlyOrders.get(hour) || 0) + 1);
    }

    const peakHours = Array.from(hourlyOrders.entries())
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => b.orders - a.orders);

    // Satisfacción del cliente
    const ratings = await this.prisma.rating.findMany({
      where: {
        storeId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { ratingValue: true },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) / ratings.length
      : 0;

    return {
      period: '30d',
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      peakHours,
      averageRating,
      totalRatings: ratings.length,
    };
  }

  async getDriverAnalytics(driverId: number): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Deliveries completadas
    const deliveries = await this.prisma.deliveryOrder.findMany({
      where: {
        courierId: driverId,
        status: 'delivered',
        actualDeliveryTime: { gte: thirtyDaysAgo },
      },
    });

    const totalDeliveries = deliveries.length;

    // Ingresos totales
    const totalEarnings = deliveries.reduce((sum, delivery) => {
      return sum + Number(delivery.deliveryFee) + Number(delivery.tip);
    }, 0);

    // Tiempo promedio de entrega
    const deliveriesWithTime = deliveries.filter(d => d.actualDeliveryTime && d.createdAt);
    const averageDeliveryTime = deliveriesWithTime.length > 0
      ? deliveriesWithTime.reduce((sum, delivery) => {
          const timeDiff = delivery.actualDeliveryTime!.getTime() - delivery.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60)); // Convertir a minutos
        }, 0) / deliveriesWithTime.length
      : 0;

    // Rating promedio
    const ratings = await this.prisma.rating.findMany({
      where: {
        ratedClerkId: driverId.toString(),
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { ratingValue: true },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) / ratings.length
      : 0;

    // Tasa de aceptación (simplificada)
    const totalAssigned = await this.prisma.deliveryOrder.count({
      where: {
        courierId: driverId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const acceptanceRate = totalAssigned > 0 ? (totalDeliveries / totalAssigned) * 100 : 0;

    return {
      period: '30d',
      totalDeliveries,
      totalEarnings,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      totalRatings: ratings.length,
    };
  }

  async getPlatformAnalytics(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Métricas generales
    const totalStores = await this.prisma.store.count();
    const totalDrivers = await this.prisma.driver.count({ where: { canDoDeliveries: true } });
    const totalOrders = await this.prisma.deliveryOrder.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const deliveredOrders = await this.prisma.deliveryOrder.findMany({
      where: {
        status: 'delivered',
        actualDeliveryTime: { gte: thirtyDaysAgo }
      },
      select: {
        totalPrice: true,
        deliveryFee: true,
        actualDeliveryTime: true,
        createdAt: true
      },
    });

    const totalRevenue = deliveredOrders.reduce((sum, order) =>
      sum + Number(order.totalPrice) + Number(order.deliveryFee), 0
    );

    // Tiempo promedio de entrega
    const averageDeliveryTime = deliveredOrders.length > 0
      ? deliveredOrders.reduce((sum, order) => {
          const timeDiff = order.actualDeliveryTime!.getTime() - order.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60)); // Convertir a minutos
        }, 0) / deliveredOrders.length
      : 0;

    // Categorías más populares
    const categoryStats = await this.prisma.store.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
    });

    return {
      period: '30d',
      totalStores,
      totalDrivers,
      totalOrders,
      totalRevenue,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      popularCategories: categoryStats.slice(0, 10),
    };
  }
}
