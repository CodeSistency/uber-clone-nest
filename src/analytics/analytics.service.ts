import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAnalytics } from './dto/store-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStoreAnalytics(
    storeId: number,
    ownerId: number,
  ): Promise<StoreAnalytics> {
    // Verify store ownership
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerId !== ownerId) {
      throw new NotFoundException('Store not found');
    }

    // Get orders for the store
    const orders = await this.prisma.deliveryOrder.findMany({
      where: {
        storeId,
        paymentStatus: 'completed',
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate basic metrics
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0,
    );
    const ordersCount = orders.length;
    const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    // Calculate product analytics
    const productSales = new Map<number, { name: string; sold: number }>();
    const lowStockProducts: { id: number; name: string; stock: number }[] = [];

    // Get all products for the store
    const products = await this.prisma.product.findMany({
      where: { storeId },
      select: { id: true, name: true, stock: true },
    });

    // Process order items for product sales
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          name: item.product.name,
          sold: 0,
        };
        existing.sold += item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    // Get low stock products
    products.forEach((product) => {
      if (product.stock !== null && product.stock <= 5) {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          stock: product.stock,
        });
      }
    });

    // Top products
    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        sold: data.sold,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Calculate customer satisfaction
    const ratings = await this.prisma.rating.findMany({
      where: { storeId },
      select: { ratingValue: true },
    });

    const customerSatisfaction =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) /
          ratings.length
        : 0;

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await this.prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(total_price) as amount
      FROM delivery_orders
      WHERE store_id = ${storeId}
        AND payment_status = 'completed'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;

    // Peak hours
    const peakHours = await this.prisma.$queryRaw`
      SELECT
        EXTRACT(hour from created_at) as hour,
        COUNT(*) as orders
      FROM delivery_orders
      WHERE store_id = ${storeId}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY EXTRACT(hour from created_at)
      ORDER BY orders DESC
      LIMIT 5
    `;

    return {
      totalRevenue,
      ordersCount,
      averageOrderValue,
      topProducts,
      lowStockProducts,
      averagePreparationTime: 15, // This would need to be calculated from actual data
      customerSatisfaction,
      revenueByDay: revenueByDay as { date: string; amount: number }[],
      peakHours: peakHours as { hour: number; orders: number }[],
    };
  }

  async getDriverAnalytics(driverId: number): Promise<any> {
    // Verify driver exists
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Get completed deliveries
    const deliveries = await this.prisma.deliveryOrder.findMany({
      where: {
        courierId: driverId,
        status: 'delivered',
      },
      select: {
        totalPrice: true,
        deliveryFee: true,
        tip: true,
        createdAt: true,
      },
    });

    const totalDeliveries = deliveries.length;
    const totalEarnings = deliveries.reduce(
      (sum, delivery) =>
        sum + Number(delivery.deliveryFee) + Number(delivery.tip),
      0,
    );
    const averageTip =
      deliveries.length > 0
        ? deliveries.reduce((sum, delivery) => sum + Number(delivery.tip), 0) /
          deliveries.length
        : 0;

    // Ratings
    const ratings = await this.prisma.rating.findMany({
      where: {
        ratedUserId: driverId,
        orderId: { not: null }, // Delivery order ratings
      },
      select: { ratingValue: true },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) /
          ratings.length
        : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: ratings.filter((r) => r.ratingValue === stars).length,
    }));

    // Earnings by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const earningsByDay = await this.prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(delivery_fee + tip) as amount
      FROM delivery_orders
      WHERE courier_id = ${driverId}
        AND status = 'delivered'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;

    return {
      totalDeliveries,
      completedDeliveries: totalDeliveries,
      acceptanceRate: 95, // This would need to be calculated from actual data
      averageDeliveryTime: 25, // This would need to be calculated from actual data
      totalEarnings,
      averageTip,
      earningsByDay: earningsByDay as { date: string; amount: number }[],
      averageRating,
      ratingDistribution,
    };
  }

  async getPlatformAnalytics(): Promise<any> {
    // Total metrics
    const totalUsers = await this.prisma.user.count();
    const totalDrivers = await this.prisma.driver.count();
    const totalStores = await this.prisma.store.count();
    const totalOrders = await this.prisma.deliveryOrder.count();

    // Revenue metrics
    const totalRevenue = await this.prisma.deliveryOrder.aggregate({
      where: { paymentStatus: 'completed' },
      _sum: { totalPrice: true },
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await this.prisma.deliveryOrder.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const recentRevenue = await this.prisma.deliveryOrder.aggregate({
      where: {
        paymentStatus: 'completed',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { totalPrice: true },
    });

    return {
      overview: {
        totalUsers,
        totalDrivers,
        totalStores,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      },
      recent: {
        orders: recentOrders,
        revenue: recentRevenue._sum.totalPrice || 0,
      },
    };
  }
}
