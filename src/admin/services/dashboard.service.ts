import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardMetrics {
  // Rides metrics
  activeRides: number;
  completedRidesToday: number;
  cancelledRidesToday: number;
  totalRidesThisWeek: number;

  // Financial metrics
  revenueToday: number;
  revenueThisWeek: number;
  averageFare: number;
  totalTransactions: number;

  // Drivers metrics
  onlineDrivers: number;
  busyDrivers: number;
  availableDrivers: number;
  averageDriverRating: number;

  // Users metrics
  activeUsersToday: number;
  newUsersThisWeek: number;
  totalUsers: number;
  averageUserRating: number;

  // System health
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface DashboardAlert {
  id: string;
  type: 'performance' | 'financial' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard_metrics';
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get this week's date range
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Execute all metrics queries in parallel
      const [
        activeRides,
        ridesToday,
        ridesThisWeek,
        revenueData,
        driverStats,
        userStats,
        systemHealth,
      ] = await Promise.all([
        this.getActiveRidesCount(),
        this.getRidesStats(today, tomorrow),
        this.getRidesStats(weekStart, weekEnd),
        this.getRevenueStats(today, tomorrow, weekStart, weekEnd),
        this.getDriverStats(),
        this.getUserStats(today, tomorrow, weekStart, weekEnd),
        this.checkSystemHealth(),
      ]);

      const metrics: DashboardMetrics = {
        // Rides metrics
        activeRides,
        completedRidesToday: ridesToday.completed,
        cancelledRidesToday: ridesToday.cancelled,
        totalRidesThisWeek: ridesThisWeek.total,

        // Financial metrics
        revenueToday: revenueData.today,
        revenueThisWeek: revenueData.week,
        averageFare: revenueData.averageFare,
        totalTransactions: revenueData.totalTransactions,

        // Drivers metrics
        onlineDrivers: driverStats.online,
        busyDrivers: driverStats.busy,
        availableDrivers: driverStats.available,
        averageDriverRating: driverStats.averageRating,

        // Users metrics
        activeUsersToday: userStats.activeToday,
        newUsersThisWeek: userStats.newThisWeek,
        totalUsers: userStats.total,
        averageUserRating: userStats.averageRating,

        // System health
        systemStatus: systemHealth.status,
        lastUpdated: new Date(),
      };

      // Cache the results
      this.setCachedData(cacheKey, metrics);

      this.logger.debug('Dashboard metrics calculated successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Error calculating dashboard metrics:', error);
      throw error;
    }
  }

  async getDashboardAlerts(): Promise<DashboardAlert[]> {
    const cacheKey = 'dashboard_alerts';
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    const alerts: DashboardAlert[] = [];

    try {
      // Check for performance alerts
      const performanceAlerts = await this.checkPerformanceAlerts();
      alerts.push(...performanceAlerts);

      // Check for financial alerts
      const financialAlerts = await this.checkFinancialAlerts();
      alerts.push(...financialAlerts);

      // Check for technical alerts
      const technicalAlerts = await this.checkTechnicalAlerts();
      alerts.push(...technicalAlerts);

      // Cache the results
      this.setCachedData(cacheKey, alerts);

      return alerts;
    } catch (error) {
      this.logger.error('Error getting dashboard alerts:', error);
      return [];
    }
  }

  private async getActiveRidesCount(): Promise<number> {
    return this.prisma.ride.count({
      where: {
        status: {
          in: ['accepted', 'driver_confirmed', 'arrived', 'in_progress'],
        },
      },
    });
  }

  private async getRidesStats(startDate: Date, endDate: Date) {
    const rides = await this.prisma.ride.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        status: true,
      },
    });

    const completed = rides.filter((r) => r.status === 'completed').length;
    const cancelled = rides.filter((r) => r.status === 'cancelled').length;
    const total = rides.length;

    return { completed, cancelled, total };
  }

  private async getRevenueStats(
    todayStart: Date,
    todayEnd: Date,
    weekStart: Date,
    weekEnd: Date,
  ) {
    const [todayRevenue, weekRevenue, allCompletedRides] = await Promise.all([
      this.prisma.ride.aggregate({
        where: {
          status: 'completed',
          updatedAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        _sum: {
          farePrice: true,
        },
        _count: true,
      }),
      this.prisma.ride.aggregate({
        where: {
          status: 'completed',
          updatedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        _sum: {
          farePrice: true,
        },
      }),
      this.prisma.ride.findMany({
        where: {
          status: 'completed',
        },
        select: {
          farePrice: true,
        },
        take: 1000, // Sample for average calculation
      }),
    ]);

    const today = Number(todayRevenue._sum.farePrice || 0);
    const week = Number(weekRevenue._sum.farePrice || 0);
    const totalTransactions = todayRevenue._count;

    const averageFare =
      allCompletedRides.length > 0
        ? allCompletedRides.reduce(
            (sum, ride) => sum + Number(ride.farePrice),
            0,
          ) / allCompletedRides.length
        : 0;

    return {
      today,
      week,
      averageFare: Math.round(averageFare * 100) / 100,
      totalTransactions,
    };
  }

  private async getDriverStats() {
    const [onlineDrivers, busyDrivers, allDrivers] = await Promise.all([
      this.prisma.driver.count({
        where: { status: 'online' },
      }),
      this.prisma.driver.count({
        where: {
          status: 'busy',
        },
      }),
      this.prisma.driver.findMany({
        where: {
          averageRating: { not: null },
        },
        select: {
          averageRating: true,
        },
      }),
    ]);

    const availableDrivers = onlineDrivers - busyDrivers;

    const averageRating =
      allDrivers.length > 0
        ? allDrivers.reduce(
            (sum, driver) => sum + Number(driver.averageRating || 0),
            0,
          ) / allDrivers.length
        : 0;

    return {
      online: onlineDrivers,
      busy: busyDrivers,
      available: Math.max(0, availableDrivers),
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  private async getUserStats(
    todayStart: Date,
    todayEnd: Date,
    weekStart: Date,
    weekEnd: Date,
  ) {
    const [activeToday, newThisWeek, totalUsers, allUsers] = await Promise.all([
      this.prisma.user.count({
        where: {
          lastLogin: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      this.prisma.user.count(),
      this.prisma.rating.groupBy({
        by: ['ratedByUserId'],
        _avg: {
          ratingValue: true,
        },
      }),
    ]);

    const averageRating =
      allUsers.length > 0
        ? allUsers.reduce(
            (sum, user) => sum + Number(user._avg?.ratingValue || 0),
            0,
          ) / allUsers.length
        : 0;

    return {
      activeToday,
      newThisWeek,
      total: totalUsers,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  private async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check for critical issues
      const criticalIssues = await this.prisma.ride.count({
        where: {
          status: 'in_progress',
          updatedAt: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Older than 2 hours
          },
        },
      });

      if (criticalIssues > 0) {
        return { status: 'critical' };
      }

      // Check for warning conditions
      const activeRides = await this.getActiveRidesCount();
      const onlineDrivers = await this.prisma.driver.count({
        where: { status: 'online' },
      });

      if (activeRides > onlineDrivers * 2) {
        return { status: 'warning' };
      }

      return { status: 'healthy' };
    } catch (error) {
      this.logger.error('System health check failed:', error);
      return { status: 'critical' };
    }
  }

  private async checkPerformanceAlerts(): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check driver availability
    const onlineDrivers = await this.prisma.driver.count({
      where: { status: 'online' },
    });

    if (onlineDrivers < 5) {
      alerts.push({
        id: 'low_driver_availability',
        type: 'performance',
        severity: 'high',
        title: 'Baja Disponibilidad de Drivers',
        message: `Solo ${onlineDrivers} drivers están online. Se recomienda aumentar la capacidad.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // Check cancellation rate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ridesToday = await this.prisma.ride.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const cancelledToday = await this.prisma.ride.count({
      where: {
        status: 'cancelled',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const cancellationRate =
      ridesToday > 0 ? (cancelledToday / ridesToday) * 100 : 0;

    if (cancellationRate > 30) {
      alerts.push({
        id: 'high_cancellation_rate',
        type: 'performance',
        severity: 'medium',
        title: 'Alta Tasa de Cancelaciones',
        message: `Tasa de cancelación del ${cancellationRate.toFixed(1)}% hoy. Revisar calidad del servicio.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    return alerts;
  }

  private async checkFinancialAlerts(): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check revenue drop
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [yesterdayRevenue, todayRevenue] = await Promise.all([
      this.prisma.ride.aggregate({
        where: {
          status: 'completed',
          updatedAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _sum: { farePrice: true },
      }),
      this.prisma.ride.aggregate({
        where: {
          status: 'completed',
          updatedAt: {
            gte: today,
            lt: new Date(),
          },
        },
        _sum: { farePrice: true },
      }),
    ]);

    const yesterdayAmount = Number(yesterdayRevenue._sum.farePrice || 0);
    const todayAmount = Number(todayRevenue._sum.farePrice || 0);

    if (yesterdayAmount > 0) {
      const changePercent =
        ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100;

      if (changePercent < -50) {
        alerts.push({
          id: 'revenue_drop',
          type: 'financial',
          severity: 'high',
          title: 'Caída Significativa en Revenue',
          message: `Revenue bajó ${Math.abs(changePercent).toFixed(1)}% comparado con ayer.`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  private async checkTechnicalAlerts(): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check for stuck rides
    const stuckRides = await this.prisma.ride.count({
      where: {
        status: 'in_progress',
        updatedAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000), // Older than 1 hour
        },
      },
    });

    if (stuckRides > 0) {
      alerts.push({
        id: 'stuck_rides',
        type: 'technical',
        severity: 'medium',
        title: 'Rides Atascados',
        message: `${stuckRides} rides han estado en progreso por más de 1 hora.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    return alerts;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
    });
  }

  // Method to clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }
}
