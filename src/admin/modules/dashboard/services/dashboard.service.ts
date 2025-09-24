import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DashboardMetrics } from '../dtos/metrics.dto';
import { subDays, subMonths, subWeeks, startOfDay } from 'date-fns';

interface RevenueData {
  total_amount: number | null;
  total_count: bigint;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the label for the previous period
   * @param period Current period (day, week, month, year)
   * @returns Label for the previous period
   */
  private getPreviousPeriodLabel(period: string): string {
    switch (period.toLowerCase()) {
      case 'day':
        return 'yesterday';
      case 'week':
        return 'last week';
      case 'month':
        return 'last month';
      case 'year':
        return 'last year';
      default:
        return 'previous period';
    }
  }

  async getRevenueData(period: string = 'month'): Promise<{
    totalRevenue: number;
    currency: string;
    period: string;
    transactionCount: number;
    averageTransactionValue: number;
    comparison: {
      percentageChange: number;
      isIncrease: boolean;
      previousPeriodAmount: number;
      previousPeriod: string;
    };
    breakdown: Array<{
      date: string;
      amount: number;
      transactionCount: number;
      averageValue: number;
    }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period.toLowerCase()) {
        case 'day':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subWeeks(startOfDay(now), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = subMonths(now, 1);
          break;
      }

      // Get revenue data from the database
      const revenueData = await this.prisma.$queryRaw<RevenueData[]>`
        SELECT 
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as total_count
        FROM "Transaction"
        WHERE "createdAt" >= ${startDate.toISOString()}::timestamp
          AND "createdAt" <= ${now.toISOString()}::timestamp
          AND status = 'COMPLETED'
          AND type = 'RIDE_PAYMENT'
      `;

      // Get comparison data (previous period)
      let comparisonStartDate: Date;
      let comparisonEndDate = startDate;

      if (period === 'day') {
        comparisonStartDate = subDays(startDate, 1);
      } else if (period === 'week') {
        comparisonStartDate = subWeeks(startDate, 1);
      } else if (period === 'month') {
        comparisonStartDate = subMonths(startDate, 1);
      } else {
        // year
        comparisonStartDate = new Date(now.getFullYear() - 1, 0, 1);
        comparisonEndDate = new Date(now.getFullYear() - 1, 11, 31);
      }

      // Get comparison data for the previous period
      const comparisonData = await this.prisma.$queryRaw<RevenueData[]>`
        SELECT 
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as total_count
        FROM "Transaction"
        WHERE "createdAt" >= ${comparisonStartDate.toISOString()}::timestamp
          AND "createdAt" <= ${comparisonEndDate.toISOString()}::timestamp
          AND status = 'COMPLETED'
          AND type = 'RIDE_PAYMENT'
      `;

      // Calculate percentage change
      const currentAmount = Number(
        revenueData[0]?.total_amount?.toString() || 0,
      );
      const previousAmount = Number(
        comparisonData[0]?.total_amount?.toString() || 0,
      );
      let percentageChange = 0;

      if (previousAmount > 0) {
        percentageChange =
          ((currentAmount - previousAmount) / previousAmount) * 100;
      } else if (currentAmount > 0) {
        percentageChange = 100; // Infinite growth (from 0 to some value)
      }

      // Get daily breakdown for the period
      const dailyBreakdown = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COALESCE(SUM(amount), 0) as amount,
          COUNT(*) as transaction_count
        FROM "Transaction"
        WHERE "createdAt" >= ${startDate.toISOString()}::timestamp
          AND "createdAt" <= ${now.toISOString()}::timestamp
          AND status = 'COMPLETED'
          AND type = 'RIDE_PAYMENT'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `;

      const totalTransactions = Number(
        revenueData[0]?.total_count?.toString() || 0,
      );

      return {
        totalRevenue: currentAmount,
        currency: 'USD',
        period: period.toLowerCase(),
        transactionCount: totalTransactions,
        averageTransactionValue:
          totalTransactions > 0 ? currentAmount / totalTransactions : 0,
        comparison: {
          percentageChange: parseFloat(percentageChange.toFixed(2)),
          isIncrease: percentageChange >= 0,
          previousPeriodAmount: previousAmount,
          previousPeriod: this.getPreviousPeriodLabel(period),
        },
        breakdown: (Array.isArray(dailyBreakdown) ? dailyBreakdown : []).map(
          (item) => ({
            date: new Date(item.date).toISOString().split('T')[0],
            amount: parseFloat(Number(item.amount || 0).toFixed(2)),
            transactionCount: parseInt(item.transaction_count || '0', 10),
            averageValue: parseFloat(
              (
                Number(item.amount || 0) /
                (parseInt(item.transaction_count || '0', 10) || 1)
              ).toFixed(2),
            ),
          }),
        ),
      };
    } catch (error) {
      this.logger.error(
        `Error getting revenue data: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to fetch revenue data');
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get current date and calculate date ranges
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );

      // Execute all queries in parallel
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        totalDrivers,
        onlineDrivers,
        pendingVerifications,
        approvedDrivers,
        suspendedDrivers,
        activeRides,
        completedRidesToday,
        cancelledRidesToday,
        completedRidesThisWeek,
        totalRides,
        activeOrders,
        completedOrdersToday,
        completedOrdersThisWeek,
        totalOrders,
        totalRevenueResult,
        revenueTodayResult,
        revenueThisWeekResult,
        revenueThisMonthResult,
        pendingPaymentsResult,
        totalWalletBalanceResult,
        totalStores,
        activeStores,
        pendingStores,
        totalNotificationsSent,
      ] = await Promise.all([
        // Total users
        this.prisma.user.count({
          where: { userType: 'user' },
        }),

        // Active users (logged in last 30 days)
        this.prisma.user.count({
          where: {
            userType: 'user',
            lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),

        // New users today
        this.prisma.user.count({
          where: {
            userType: 'user',
            createdAt: { gte: today },
          },
        }),

        // New users this week
        this.prisma.user.count({
          where: {
            userType: 'user',
            createdAt: { gte: weekAgo },
          },
        }),

        // New users this month
        this.prisma.user.count({
          where: {
            userType: 'user',
            createdAt: { gte: monthAgo },
          },
        }),

        // Total drivers
        this.prisma.driver.count(),

        // Online drivers (based on recent rides)
        this.prisma.driver.count({
          where: {
            rides: {
              some: {
                createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
              },
            },
          },
        }),

        // Pending verifications
        this.prisma.driver.count({
          where: { verificationStatus: 'PENDING' },
        }),

        // Approved drivers
        this.prisma.driver.count({
          where: { verificationStatus: 'APPROVED' },
        }),

        // Suspended drivers
        this.prisma.driver.count({
          where: { verificationStatus: 'SUSPENDED' },
        }),

        // Active rides
        this.prisma.ride.count({
          where: {
            paymentStatus: {
              in: ['PENDING', 'PROCESSING'],
            },
          },
        }),

        // Completed rides today
        this.prisma.ride.count({
          where: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: today },
          },
        }),

        // Cancelled rides today
        this.prisma.ride.count({
          where: {
            paymentStatus: 'CANCELLED',
            createdAt: { gte: today },
          },
        }),

        // Completed rides this week
        this.prisma.ride.count({
          where: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: weekAgo },
          },
        }),

        // Total rides
        this.prisma.ride.count(),

        // Active delivery orders
        this.prisma.deliveryOrder.count({
          where: {
            status: {
              in: ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'IN_PROGRESS'],
            },
          },
        }),

        // Completed orders today
        this.prisma.deliveryOrder.count({
          where: {
            status: 'DELIVERED',
            createdAt: { gte: today },
          },
        }),

        // Completed orders this week
        this.prisma.deliveryOrder.count({
          where: {
            status: 'DELIVERED',
            createdAt: { gte: weekAgo },
          },
        }),

        // Total orders
        this.prisma.deliveryOrder.count(),

        // Total revenue (from completed rides)
        this.prisma.ride.aggregate({
          _sum: { farePrice: true },
          where: { paymentStatus: 'COMPLETED' },
        }),

        // Today's revenue
        this.prisma.ride.aggregate({
          _sum: { farePrice: true },
          where: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: today },
          },
        }),

        // This week's revenue
        this.prisma.ride.aggregate({
          _sum: { farePrice: true },
          where: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: weekAgo },
          },
        }),

        // This month's revenue
        this.prisma.ride.aggregate({
          _sum: { farePrice: true },
          where: {
            paymentStatus: 'COMPLETED',
            createdAt: { gte: monthAgo },
          },
        }),

        // Pending payments
        this.prisma.ride.aggregate({
          _sum: { farePrice: true },
          where: {
            paymentStatus: 'PENDING',
          },
        }),

        // Total wallet balance
        this.prisma.wallet.aggregate({
          _sum: { balance: true },
        }),

        // Total stores
        this.prisma.store.count(),

        // Active stores (assuming active means they have at least one product)
        this.prisma.store.count({
          where: {
            products: {
              some: {},
            },
          },
        }),

        // Pending stores (assuming no specific field, using empty string for name as pending)
        this.prisma.store.count({
          where: {
            name: '',
          },
        }),

        // Total notifications sent
        this.prisma.notification.count(),
      ]);

      // Calculate system uptime (simplified to 99.9% for example)
      const systemUptime = '99.9%';

      return {
        // Users
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,

        // Drivers
        totalDrivers,
        onlineDrivers,
        pendingVerifications,
        approvedDrivers,
        suspendedDrivers,

        // Rides
        activeRides,
        completedRidesToday,
        cancelledRidesToday,
        completedRidesThisWeek,
        totalRides,

        // Delivery
        activeOrders,
        completedOrdersToday,
        completedOrdersThisWeek,
        totalOrders,

        // Financial
        totalRevenue: totalRevenueResult?._sum?.farePrice?.toNumber() || 0,
        revenueToday: revenueTodayResult?._sum?.farePrice?.toNumber() || 0,
        revenueThisWeek:
          revenueThisWeekResult?._sum?.farePrice?.toNumber() || 0,
        revenueThisMonth:
          revenueThisMonthResult?._sum?.farePrice?.toNumber() || 0,
        pendingPayments:
          pendingPaymentsResult?._sum?.farePrice?.toNumber() || 0,
        totalWalletBalance:
          totalWalletBalanceResult?._sum?.balance?.toNumber() || 0,

        // Stores
        totalStores,
        activeStores,
        pendingStores,

        // System
        totalNotificationsSent,
        systemUptime,
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }
}
