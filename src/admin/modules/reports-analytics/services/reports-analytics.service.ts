import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format as formatDate,
} from 'date-fns';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  period?:
    | 'today'
    | 'yesterday'
    | 'week'
    | 'month'
    | 'quarter'
    | 'year'
    | 'custom';
  entityType?: 'rides' | 'users' | 'drivers' | 'financial' | 'performance';
  groupBy?: 'day' | 'week' | 'month' | 'driver' | 'user' | 'zone';
  metrics?: string[];
}

export interface AnalyticsFilters {
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | '1y';
  startDate?: Date;
  endDate?: Date;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  zoneId?: number;
  status?: string;
  rideTierId?: number;
  userType?: 'rider' | 'driver' | 'both';
  segment?: 'new' | 'returning' | 'power' | 'churned';
  performance?: 'top' | 'average' | 'low';
  metric?: 'rides' | 'revenue' | 'users' | 'drivers' | 'coverage';
  groupBy?: 'hour' | 'day' | 'week' | 'month' | 'quarter';
  includeStripeFees?: boolean;
  includeTaxes?: boolean;
}

export interface ReportData {
  summary: any;
  chartData: any[];
  details: any[];
  metadata: {
    generatedAt: Date;
    filters: ReportFilters;
    totalRecords: number;
    executionTime: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'kpi';
  title: string;
  data: any;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportsAnalyticsService {
  private readonly logger = new Logger(ReportsAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async generateReport(filters: ReportFilters): Promise<ReportData> {
    const startTime = Date.now();

    // Resolve date range based on period
    const { dateFrom, dateTo } = this.resolveDateRange(filters);

    let reportData: ReportData;

    switch (filters.entityType) {
      case 'rides':
        reportData = await this.generateRidesReport(dateFrom, dateTo, filters);
        break;
      case 'users':
        reportData = await this.generateUsersReport(dateFrom, dateTo, filters);
        break;
      case 'drivers':
        reportData = await this.generateDriversReport(
          dateFrom,
          dateTo,
          filters,
        );
        break;
      case 'financial':
        reportData = await this.generateFinancialReport(
          dateFrom,
          dateTo,
          filters,
        );
        break;
      case 'performance':
        reportData = await this.generatePerformanceReport(
          dateFrom,
          dateTo,
          filters,
        );
        break;
      default:
        reportData = await this.generateComprehensiveReport(
          dateFrom,
          dateTo,
          filters,
        );
    }

    const executionTime = Date.now() - startTime;

    reportData.metadata = {
      generatedAt: new Date(),
      filters,
      totalRecords: reportData.details.length,
      executionTime,
    };

    return reportData;
  }

  async exportReport(
    filters: ReportFilters,
    format: 'csv' | 'excel' | 'pdf',
  ): Promise<{ filename: string; data: Buffer | string; format: string }> {
    const reportData = await this.generateReport(filters);
    const reportTitle = this.getReportTypeTitle(filters);
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');

    let filename: string;
    let data: Buffer | string;

    switch (format) {
      case 'csv':
        filename = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.csv`;
        data = this.exportToCSV(reportData);
        break;
      case 'excel':
        filename = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.xlsx`;
        data = await this.exportToExcel(reportData);
        break;
      case 'pdf':
        filename = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.pdf`;
        data = await this.exportToPDF(reportData);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      filename,
      data,
      format,
    };
  }

  async getDashboardWidgets(): Promise<DashboardWidget[]> {
    // Generate real-time dashboard widgets
    const widgets: DashboardWidget[] = [];

    // Today's metrics
    const todayMetrics = await this.getTodayMetrics();
    widgets.push({
      id: 'today-overview',
      type: 'kpi',
      title: "Today's Overview",
      data: todayMetrics,
      config: { layout: 'grid' },
      position: { x: 0, y: 0, w: 12, h: 4 },
    });

    // Revenue chart
    const revenueChart = await this.getRevenueChartData();
    widgets.push({
      id: 'revenue-chart',
      type: 'chart',
      title: 'Revenue Trend',
      data: revenueChart,
      config: { chartType: 'line', xAxis: 'date', yAxis: 'revenue' },
      position: { x: 0, y: 4, w: 8, h: 6 },
    });

    // Driver performance
    const driverPerformance = await this.getDriverPerformanceData();
    widgets.push({
      id: 'driver-performance',
      type: 'table',
      title: 'Top Performing Drivers',
      data: driverPerformance,
      config: {
        sortable: true,
        columns: ['name', 'rides', 'rating', 'earnings'],
      },
      position: { x: 8, y: 4, w: 4, h: 6 },
    });

    // User growth
    const userGrowth = await this.getUserGrowthData();
    widgets.push({
      id: 'user-growth',
      type: 'chart',
      title: 'User Growth',
      data: userGrowth,
      config: { chartType: 'bar', xAxis: 'month', yAxis: 'users' },
      position: { x: 0, y: 10, w: 6, h: 6 },
    });

    // Popular zones
    const popularZones = await this.getPopularZonesData();
    widgets.push({
      id: 'popular-zones',
      type: 'chart',
      title: 'Popular Zones',
      data: popularZones,
      config: { chartType: 'pie', dataKey: 'rides' },
      position: { x: 6, y: 10, w: 6, h: 6 },
    });

    return widgets;
  }

  async createCustomDashboard(
    dashboardData: Partial<CustomDashboard>,
  ): Promise<CustomDashboard> {
    // In a real implementation, this would save to database
    const dashboard: CustomDashboard = {
      id: `dashboard_${Date.now()}`,
      name: dashboardData.name || 'New Dashboard',
      description: dashboardData.description,
      widgets: dashboardData.widgets || [],
      isPublic: dashboardData.isPublic || false,
      createdBy: dashboardData.createdBy || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database
    this.logger.log(`Created custom dashboard: ${dashboard.name}`);

    return dashboard;
  }

  async getScheduledReports(): Promise<any[]> {
    // In a real implementation, this would fetch from database
    return [
      {
        id: 'daily_summary',
        name: 'Daily Summary Report',
        schedule: '0 9 * * *', // 9 AM daily
        recipients: ['admin@uberclone.com'],
        filters: { period: 'yesterday', entityType: 'rides' },
        isActive: true,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      },
      {
        id: 'weekly_performance',
        name: 'Weekly Performance Report',
        schedule: '0 9 * * 1', // 9 AM every Monday
        recipients: ['manager@uberclone.com', 'admin@uberclone.com'],
        filters: { period: 'week', entityType: 'performance' },
        isActive: true,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
    ];
  }

  private resolveDateRange(filters: ReportFilters): {
    dateFrom: Date;
    dateTo: Date;
  } {
    const now = new Date();

    switch (filters.period) {
      case 'today':
        return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { dateFrom: startOfDay(yesterday), dateTo: endOfDay(yesterday) };
      case 'week':
        return {
          dateFrom: startOfWeek(now, { weekStartsOn: 1 }),
          dateTo: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
      case 'quarter':
        const quarterStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        const quarterEnd = new Date(
          quarterStart.getFullYear(),
          quarterStart.getMonth() + 3,
          0,
        );
        return { dateFrom: quarterStart, dateTo: quarterEnd };
      case 'year':
        return {
          dateFrom: new Date(now.getFullYear(), 0, 1),
          dateTo: new Date(now.getFullYear(), 11, 31),
        };
      case 'custom':
      default:
        return {
          dateFrom: filters.dateFrom || subDays(now, 30),
          dateTo: filters.dateTo || now,
        };
    }
  }

  private async generateRidesReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const rides = await this.prisma.ride.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        tier: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate summary metrics
    const summary = {
      totalRides: rides.length,
      completedRides: rides.filter((r) => r.status === 'COMPLETED').length,
      cancelledRides: rides.filter((r) => r.status === 'CANCELLED').length,
      totalRevenue: rides
        .filter((r) => r.paymentStatus === 'COMPLETED')
        .reduce((sum, r) => sum + Number(r.farePrice), 0),
      averageFare: 0,
      completionRate: 0,
    };

    if (summary.totalRides > 0) {
      summary.averageFare = summary.totalRevenue / summary.completedRides;
      summary.completionRate =
        (summary.completedRides / summary.totalRides) * 100;
    }

    // Generate chart data based on groupBy
    let chartData: any[] = [];
    if (filters.groupBy === 'day') {
      chartData = this.groupRidesByDay(rides, dateFrom, dateTo);
    } else if (filters.groupBy === 'driver') {
      chartData = this.groupRidesByDriver(rides);
    }

    return {
      summary,
      chartData,
      details: rides,
      metadata: {} as any, // Will be filled by caller
    };
  }

  private async generateUsersReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        _count: {
          select: { rides: true },
        },
      },
    });

    const summary = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      verifiedUsers: users.filter((u) => u.emailVerified).length,
      totalRides: users.reduce((sum, u) => sum + u._count.rides, 0),
      averageRidesPerUser: 0,
    };

    if (summary.totalUsers > 0) {
      summary.averageRidesPerUser = summary.totalRides / summary.totalUsers;
    }

    let chartData: any[] = [];
    if (filters.groupBy === 'day') {
      chartData = this.groupUsersByDay(users, dateFrom, dateTo);
    }

    return {
      summary,
      chartData,
      details: users,
      metadata: {} as any,
    };
  }

  private async generateDriversReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const drivers = await this.prisma.driver.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        _count: {
          select: { rides: true },
        },
      },
    });

    const summary = {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(
        (d) => d.status === 'ONLINE' || d.status === 'BUSY',
      ).length,
      verifiedDrivers: drivers.filter(
        (d) => d.verificationStatus === 'VERIFIED',
      ).length,
      totalRides: drivers.reduce((sum, d) => sum + d._count.rides, 0),
      averageRating: 0,
    };

    const totalRating = drivers.reduce(
      (sum, d) => sum + Number(d.averageRating || 0),
      0,
    );
    if (summary.totalDrivers > 0) {
      summary.averageRating = totalRating / summary.totalDrivers;
    }

    let chartData: any[] = [];
    if (filters.groupBy === 'driver') {
      chartData = drivers.map((d) => ({
        name: `${d.firstName} ${d.lastName}`,
        rides: d._count.rides,
        rating: Number(d.averageRating || 0),
        earnings: Number(d.totalEarnings),
      }));
    }

    return {
      summary,
      chartData,
      details: drivers,
      metadata: {} as any,
    };
  }

  private async generateFinancialReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const [rideRevenue, driverPayments, walletTransactions] = await Promise.all(
      [
        this.prisma.ride.aggregate({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
            paymentStatus: 'COMPLETED',
          },
          _sum: { farePrice: true },
          _count: true,
        }),
        this.prisma.driverPayment.aggregate({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        }),
        this.prisma.walletTransaction.aggregate({
          where: {
            createdAt: { gte: dateFrom, lte: dateTo },
          },
          _sum: { amount: true },
        }),
      ],
    );

    const summary = {
      totalRevenue: Number(rideRevenue._sum?.farePrice || 0),
      totalRides: rideRevenue._count,
      driverPayouts: Number(driverPayments._sum?.amount || 0),
      walletTransactions: Number(walletTransactions._sum.amount || 0),
      netIncome:
        Number(rideRevenue._sum?.farePrice || 0) -
        Number(driverPayments._sum?.amount || 0),
      averageFare:
        rideRevenue._count > 0
          ? Number(rideRevenue._sum?.farePrice || 0) / rideRevenue._count
          : 0,
    };

    return {
      summary,
      chartData: [], // Would implement financial charts
      details: [], // Would include detailed transactions
      metadata: {} as any,
    };
  }

  private async generatePerformanceReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const [rideStats, driverStats, userStats] = await Promise.all([
      this.getRidePerformanceStats(dateFrom, dateTo),
      this.getDriverPerformanceStats(dateFrom, dateTo),
      this.getUserPerformanceStats(dateFrom, dateTo),
    ]);

    const summary = {
      ...rideStats,
      ...driverStats,
      ...userStats,
    };

    return {
      summary,
      chartData: [], // Performance charts
      details: [], // Performance details
      metadata: {} as any,
    };
  }

  private async generateComprehensiveReport(
    dateFrom: Date,
    dateTo: Date,
    filters: ReportFilters,
  ): Promise<ReportData> {
    const [ridesReport, usersReport, driversReport, financialReport] =
      await Promise.all([
        this.generateRidesReport(dateFrom, dateTo, {
          ...filters,
          entityType: 'rides',
        }),
        this.generateUsersReport(dateFrom, dateTo, {
          ...filters,
          entityType: 'users',
        }),
        this.generateDriversReport(dateFrom, dateTo, {
          ...filters,
          entityType: 'drivers',
        }),
        this.generateFinancialReport(dateFrom, dateTo, {
          ...filters,
          entityType: 'financial',
        }),
      ]);

    const summary = {
      rides: ridesReport.summary,
      users: usersReport.summary,
      drivers: driversReport.summary,
      financial: financialReport.summary,
    };

    return {
      summary,
      chartData: [], // Combined charts
      details: [], // Combined details
      metadata: {} as any,
    };
  }

  // Helper methods for data aggregation
  private groupRidesByDay(rides: any[], dateFrom: Date, dateTo: Date): any[] {
    const days = {};
    rides.forEach((ride) => {
      const day = formatDate(ride.createdAt, 'yyyy-MM-dd');
      if (!days[day]) {
        days[day] = { date: day, rides: 0, revenue: 0 };
      }
      days[day].rides++;
      if (ride.paymentStatus === 'paid') {
        days[day].revenue += Number(ride.farePrice);
      }
    });

    return Object.values(days).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
  }

  private groupRidesByDriver(rides: any[]): any[] {
    const drivers = {};
    rides.forEach((ride) => {
      const driverId = ride.driverId || 'unassigned';
      const driverName = ride.driver
        ? `${ride.driver.firstName} ${ride.driver.lastName}`
        : 'Unassigned';

      if (!drivers[driverId]) {
        drivers[driverId] = { name: driverName, rides: 0, revenue: 0 };
      }
      drivers[driverId].rides++;
      if (ride.paymentStatus === 'paid') {
        drivers[driverId].revenue += Number(ride.farePrice);
      }
    });

    return Object.values(drivers);
  }

  private groupUsersByDay(users: any[], dateFrom: Date, dateTo: Date): any[] {
    const days = {};
    users.forEach((user) => {
      const day = formatDate(user.createdAt, 'yyyy-MM-dd');
      if (!days[day]) {
        days[day] = { date: day, users: 0 };
      }
      days[day].users++;
    });

    return Object.values(days).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
  }

  // Additional helper methods
  private async getTodayMetrics() {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    const [todayRides, todayRevenue, activeDrivers, totalUsers] =
      await Promise.all([
        this.prisma.ride.count({
          where: { createdAt: { gte: today, lte: tomorrow } },
        }),
        this.prisma.ride.aggregate({
          where: {
            createdAt: { gte: today, lte: tomorrow },
            paymentStatus: 'COMPLETED',
          },
          _sum: { farePrice: true },
        }),
        this.prisma.driver.count({
          where: { status: { in: ['ONLINE', 'BUSY'] } },
        }),
        this.prisma.user.count(),
      ]);

    return {
      todayRides,
      todayRevenue: Number(todayRevenue._sum?.farePrice || 0),
      activeDrivers,
      totalUsers,
    };
  }

  private async getRevenueChartData(): Promise<any[]> {
    // Get last 30 days of revenue data
    const data: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const revenue = await this.prisma.ride.aggregate({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          paymentStatus: 'COMPLETED',
        },
        _sum: { farePrice: true },
      });

      data.push({
        date: formatDate(date, 'yyyy-MM-dd'),
        revenue: Number(revenue._sum?.farePrice || 0),
      });
    }

    return data;
  }

  private async getDriverPerformanceData() {
    const drivers = await this.prisma.driver.findMany({
      take: 10,
      orderBy: { totalEarnings: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalRides: true,
        averageRating: true,
        totalEarnings: true,
      },
    });

    return drivers.map((d) => ({
      name: `${d.firstName} ${d.lastName}`,
      rides: d.totalRides,
      rating: Number(d.averageRating || 0),
      earnings: Number(d.totalEarnings),
    }));
  }

  private async getUserGrowthData(): Promise<any[]> {
    // Get last 12 months of user growth
    const data: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const monthStart = startOfMonth(date);

      const users = await this.prisma.user.count({
        where: { createdAt: { lte: monthStart } },
      });

      data.push({
        month: formatDate(monthStart, 'yyyy-MM'),
        users,
      });
    }

    return data;
  }

  private async getPopularZonesData() {
    // This would require zone-based ride aggregation
    // For now, return mock data
    return [
      { zone: 'Downtown', rides: 1250 },
      { zone: 'Airport', rides: 890 },
      { zone: 'Suburbs', rides: 675 },
      { zone: 'Business District', rides: 543 },
      { zone: 'Residential', rides: 432 },
    ];
  }

  private async getRidePerformanceStats(dateFrom: Date, dateTo: Date) {
    const stats = await this.prisma.ride.aggregate({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      _count: { status: true },
      _avg: { farePrice: true, rideTime: true },
    });

    return {
      avgRideTime: Number(stats._avg.rideTime || 0),
      avgFare: Number(stats._avg.farePrice || 0),
      totalRides: stats._count.status || 0,
    };
  }

  private async getDriverPerformanceStats(dateFrom: Date, dateTo: Date) {
    const drivers = await this.prisma.driver.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
    });

    const totalEarnings = drivers.reduce(
      (sum, d) => sum + Number(d.totalEarnings),
      0,
    );
    const avgRating =
      drivers.length > 0
        ? drivers.reduce((sum, d) => sum + Number(d.averageRating || 0), 0) /
          drivers.length
        : 0;

    return {
      totalDrivers: drivers.length,
      avgDriverRating: avgRating,
      totalDriverEarnings: totalEarnings,
    };
  }

  private async getUserPerformanceStats(dateFrom: Date, dateTo: Date) {
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      include: { _count: { select: { rides: true } } },
    });

    const totalRides = users.reduce((sum, u) => sum + u._count.rides, 0);

    return {
      totalUsers: users.length,
      avgRidesPerUser: users.length > 0 ? totalRides / users.length : 0,
      totalUserRides: totalRides,
    };
  }

  // Helper functions for data formatting
  private formatCurrency(value: any): string {
    if (typeof value !== 'number') return value?.toString() || '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  private formatDate(value: any): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value?.toString() || '';
    }
  }

  private formatPercentage(value: any): string {
    if (typeof value !== 'number') return value?.toString() || '';
    return `${(value * 100).toFixed(2)}%`;
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = '';
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flattenObject(obj[key], prefix + key + '.'));
      } else if (Array.isArray(obj[key])) {
        flattened[prefix + key] = obj[key].join('; ');
      } else {
        flattened[prefix + key] = obj[key];
      }
    }

    return flattened;
  }

  private getReportTypeTitle(filters: ReportFilters): string {
    const entityType = filters.entityType;
    switch (entityType) {
      case 'rides':
        return 'Rides Report';
      case 'users':
        return 'Users Report';
      case 'drivers':
        return 'Drivers Report';
      case 'financial':
        return 'Financial Report';
      case 'performance':
        return 'Performance Report';
      default:
        return 'Comprehensive Report';
    }
  }

  private exportToCSV(reportData: ReportData): string {
    // Simple CSV export implementation
    const { summary, details } = reportData;

    let csv = 'Report Summary\n';
    csv += Object.entries(summary)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    csv += '\n\nDetailed Data\n';

    if (details.length > 0) {
      const headers = Object.keys(details[0]).join(',');
      csv += headers + '\n';
      csv += details.map((row) => Object.values(row).join(',')).join('\n');
    }

    return csv;
  }

  private async exportToExcel(reportData: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const { summary, details, chartData, metadata } = reportData;

    // Set workbook properties
    workbook.creator = 'Uber Clone Admin';
    workbook.lastModifiedBy = 'Uber Clone System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const reportTitle = this.getReportTypeTitle(metadata.filters);

    // ===== SUMMARY SHEET =====
    const summarySheet = workbook.addWorksheet('Summary');

    // Title
    const titleRow = summarySheet.addRow([reportTitle]);
    titleRow.font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');

    // Generated info
    summarySheet.addRow([]);
    summarySheet.addRow(['Generated At:', this.formatDate(metadata.generatedAt)]);
    summarySheet.addRow(['Total Records:', metadata.totalRecords]);
    summarySheet.addRow(['Execution Time:', `${metadata.executionTime}ms`]);

    // Period info
    summarySheet.addRow([]);
    summarySheet.addRow(['Report Period:']);
    if (metadata.filters.dateFrom && metadata.filters.dateTo) {
      summarySheet.addRow(['From:', this.formatDate(metadata.filters.dateFrom)]);
      summarySheet.addRow(['To:', this.formatDate(metadata.filters.dateTo)]);
    } else {
      summarySheet.addRow(['Period:', metadata.filters.period || 'Custom']);
    }

    // Summary data
    summarySheet.addRow([]);
    summarySheet.addRow(['SUMMARY METRICS']);
    summarySheet.addRow([]);

    // Flatten and format summary data
    const flattenedSummary = this.flattenObject(summary);
    Object.entries(flattenedSummary).forEach(([key, value]) => {
      let formattedValue = value;
      if (key.toLowerCase().includes('revenue') ||
          key.toLowerCase().includes('price') ||
          key.toLowerCase().includes('fee') ||
          key.toLowerCase().includes('balance')) {
        formattedValue = this.formatCurrency(value);
      } else if (key.toLowerCase().includes('rate') ||
                 key.toLowerCase().includes('percentage')) {
        formattedValue = this.formatPercentage(value);
      } else if (key.toLowerCase().includes('date') ||
                 key.toLowerCase().includes('at')) {
        formattedValue = this.formatDate(value);
      }

      summarySheet.addRow([key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), formattedValue]);
    });

    // Auto-fit columns
    summarySheet.columns.forEach(column => {
      column.width = Math.max(15, column.width || 0);
    });

    // ===== DETAILS SHEET =====
    if (details && details.length > 0) {
      const detailsSheet = workbook.addWorksheet('Details');

      // Get all possible keys from details
      const allKeys = new Set<string>();
      details.forEach(item => {
        const flattened = this.flattenObject(item);
        Object.keys(flattened).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys);
      detailsSheet.addRow(headers);

      // Style headers
      const headerRow = detailsSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' },
      };

      // Add data rows
      details.forEach(item => {
        const flattened = this.flattenObject(item);
        const row = headers.map(header => {
          const value = flattened[header];

          // Format specific columns
          if (header.toLowerCase().includes('revenue') ||
              header.toLowerCase().includes('price') ||
              header.toLowerCase().includes('fee') ||
              header.toLowerCase().includes('balance') ||
              header.toLowerCase().includes('fare')) {
            return this.formatCurrency(value);
          } else if (header.toLowerCase().includes('date') ||
                     header.toLowerCase().includes('at') ||
                     header.toLowerCase().includes('created') ||
                     header.toLowerCase().includes('updated')) {
            return this.formatDate(value);
          } else if (header.toLowerCase().includes('rating')) {
            return typeof value === 'number' ? value.toFixed(1) : value;
          }

          return value || '';
        });
        detailsSheet.addRow(row);
      });

      // Auto-fit columns
      detailsSheet.columns.forEach((column, index) => {
        column.width = Math.min(30, Math.max(12, headers[index].length + 2));
      });
    }

    // ===== CHART DATA SHEET =====
    if (chartData && chartData.length > 0) {
      const chartSheet = workbook.addWorksheet('Chart Data');

      // Process each chart dataset
      let currentRow = 1;
      chartData.forEach((chart, chartIndex) => {
        if (chartIndex > 0) {
          chartSheet.addRow([]); // Empty row between charts
          currentRow += 1;
        }

        // Chart title
        const titleRow = chartSheet.addRow([chart.title || `Chart ${chartIndex + 1}`]);
        titleRow.font = { bold: true, size: 12 };
        currentRow += 1;

        // Chart data
        if (chart.data && Array.isArray(chart.data) && chart.data.length > 0) {
          // Get headers from first data item
          const dataHeaders = Object.keys(chart.data[0]);
          chartSheet.addRow(dataHeaders);

          // Style headers
          const headerStartRow = currentRow;
          const headerRow = chartSheet.getRow(headerStartRow);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' },
          };
          currentRow += 1;

          // Add data rows
          chart.data.forEach(item => {
            const row = dataHeaders.map(header => {
              const value = item[header];

              // Format values based on header
              if (header.toLowerCase().includes('revenue') ||
                  header.toLowerCase().includes('price') ||
                  header.toLowerCase().includes('fee')) {
                return this.formatCurrency(value);
              } else if (header.toLowerCase().includes('date')) {
                return this.formatDate(value);
              } else if (typeof value === 'number') {
                return value;
              }

              return value || '';
            });
            chartSheet.addRow(row);
            currentRow += 1;
          });
        }
      });

      // Auto-fit columns
      chartSheet.columns.forEach(column => {
        column.width = Math.max(15, column.width || 0);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async exportToPDF(reportData: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const { summary, details, chartData, metadata } = reportData;
      const reportTitle = this.getReportTypeTitle(metadata.filters);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: reportTitle,
          Author: 'Uber Clone Admin System',
          Subject: `${reportTitle} - Generated on ${this.formatDate(metadata.generatedAt)}`,
          CreationDate: metadata.generatedAt,
        }
      });

      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ===== HEADER =====
      // Title
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text(reportTitle, { align: 'center' });
      doc.moveDown(2);

      // Metadata
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generated: ${this.formatDate(metadata.generatedAt)}`, { align: 'right' });
      doc.text(`Total Records: ${metadata.totalRecords}`, { align: 'right' });
      doc.text(`Execution Time: ${metadata.executionTime}ms`, { align: 'right' });
      doc.moveDown();

      // Period information
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Report Period:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      if (metadata.filters.dateFrom && metadata.filters.dateTo) {
        doc.text(`From: ${this.formatDate(metadata.filters.dateFrom)}`);
        doc.text(`To: ${this.formatDate(metadata.filters.dateTo)}`);
      } else {
        doc.text(`Period: ${metadata.filters.period || 'Custom'}`);
      }
      doc.moveDown(2);

      // ===== SUMMARY SECTION =====
      if (summary) {
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('EXECUTIVE SUMMARY', { underline: true });
        doc.moveDown();

        doc.fontSize(11).font('Helvetica');

        // Flatten summary for display
        const flattenedSummary = this.flattenObject(summary);
        const summaryEntries = Object.entries(flattenedSummary);

        // Create a table-like structure for summary
        const summaryTable: Array<{ label: string; value: string }> = [];

        summaryEntries.forEach(([key, value]) => {
          let formattedValue = value;
          if (key.toLowerCase().includes('revenue') ||
              key.toLowerCase().includes('price') ||
              key.toLowerCase().includes('fee') ||
              key.toLowerCase().includes('balance')) {
            formattedValue = this.formatCurrency(value);
          } else if (key.toLowerCase().includes('rate') ||
                     key.toLowerCase().includes('percentage')) {
            formattedValue = this.formatPercentage(value);
          } else if (key.toLowerCase().includes('date') ||
                     key.toLowerCase().includes('at')) {
            formattedValue = this.formatDate(value);
          } else if (typeof value === 'number') {
            formattedValue = value.toLocaleString();
          }

          summaryTable.push({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: formattedValue?.toString() || ''
          });
        });

        // Display summary in two columns
        const midPoint = Math.ceil(summaryTable.length / 2);
        const leftColumn = summaryTable.slice(0, midPoint);
        const rightColumn = summaryTable.slice(midPoint);

        // Calculate positions for two-column layout
        const pageWidth = doc.page.width - 100; // accounting for margins
        const leftWidth = pageWidth * 0.45;
        const rightStart = pageWidth * 0.55;

        leftColumn.forEach((item, index) => {
          const rightItem = rightColumn[index];
          const y = doc.y;

          // Left column
          doc.font('Helvetica-Bold').text(item.label + ':', 50, y, { width: leftWidth, continued: false });
          doc.font('Helvetica').text(item.value, 50, doc.y, { width: leftWidth });

          // Right column
          if (rightItem) {
            doc.font('Helvetica-Bold').text(rightItem.label + ':', rightStart, y, { width: leftWidth, continued: false });
            doc.font('Helvetica').text(rightItem.value, rightStart, doc.y, { width: leftWidth });
          }
        });

        doc.moveDown(2);
      }

      // ===== DETAILS SECTION =====
      if (details && details.length > 0) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('DETAILED DATA', { underline: true });
        doc.moveDown();

        // Limit details to first 50 records for PDF readability
        const displayDetails = details.slice(0, 50);
        const showAllRecords = details.length <= 50;

        if (!showAllRecords) {
          doc.fontSize(10).font('Helvetica-Oblique');
          doc.text(`Showing first 50 of ${details.length} records`, { align: 'center' });
          doc.moveDown();
        }

        if (displayDetails.length > 0) {
          // Get headers from flattened first item
          const firstItem = this.flattenObject(displayDetails[0]);
          const headers = Object.keys(firstItem);

          // Table header
          doc.fontSize(9).font('Helvetica-Bold');
          let xPos = 50;
          const colWidth = (doc.page.width - 100) / headers.length;

          headers.forEach(header => {
            const displayHeader = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            doc.text(displayHeader.substring(0, 15), xPos, doc.y, { width: colWidth, align: 'left' });
            xPos += colWidth;
          });

          doc.moveDown(0.5);

          // Table rows
          doc.fontSize(8).font('Helvetica');

          displayDetails.forEach((item, index) => {
            // Check if we need a new page
            if (doc.y > doc.page.height - 50) {
              doc.addPage();
              // Re-add headers on new page
              doc.fontSize(9).font('Helvetica-Bold');
              xPos = 50;
              headers.forEach(header => {
                const displayHeader = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                doc.text(displayHeader.substring(0, 15), xPos, doc.y, { width: colWidth, align: 'left' });
                xPos += colWidth;
              });
              doc.moveDown(0.5);
              doc.fontSize(8).font('Helvetica');
            }

            xPos = 50;
            const flattened = this.flattenObject(item);

            headers.forEach(header => {
              let value = flattened[header] || '';

              // Format specific columns
              if (header.toLowerCase().includes('revenue') ||
                  header.toLowerCase().includes('price') ||
                  header.toLowerCase().includes('fee') ||
                  header.toLowerCase().includes('balance') ||
                  header.toLowerCase().includes('fare')) {
                value = this.formatCurrency(value);
              } else if (header.toLowerCase().includes('date') ||
                         header.toLowerCase().includes('at') ||
                         header.toLowerCase().includes('created') ||
                         header.toLowerCase().includes('updated')) {
                value = this.formatDate(value);
              } else if (header.toLowerCase().includes('rating')) {
                value = typeof value === 'number' ? value.toFixed(1) : value;
              }

              const displayValue = value?.toString().substring(0, 15) || '';
              doc.text(displayValue, xPos, doc.y, { width: colWidth, align: 'left' });
              xPos += colWidth;
            });

            doc.moveDown(0.3);
          });
        }

        doc.moveDown(2);
      }

      // ===== CHART DATA SUMMARY =====
      if (chartData && chartData.length > 0) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('CHART DATA SUMMARY', { underline: true });
        doc.moveDown();

        doc.fontSize(11).font('Helvetica');

        chartData.forEach((chart, index) => {
          doc.font('Helvetica-Bold').text(`${index + 1}. ${chart.title || 'Chart Data'}`, { underline: true });
          doc.moveDown(0.5);

          if (chart.data && Array.isArray(chart.data) && chart.data.length > 0) {
            const sampleData = chart.data.slice(0, 3); // Show first 3 rows as sample

            sampleData.forEach((item, itemIndex) => {
              const entries = Object.entries(item);
              const displayText = entries
                .slice(0, 3) // Show first 3 columns
                .map(([key, value]) => {
                  let formattedValue = value;
                  if (key.toLowerCase().includes('revenue') ||
                      key.toLowerCase().includes('price') ||
                      key.toLowerCase().includes('fee')) {
                    formattedValue = this.formatCurrency(value);
                  } else if (key.toLowerCase().includes('date')) {
                    formattedValue = this.formatDate(value);
                  }
                  return `${key}: ${formattedValue}`;
                })
                .join(', ');

              doc.font('Helvetica').text(`  Row ${itemIndex + 1}: ${displayText}`);
            });

            if (chart.data.length > 3) {
              doc.font('Helvetica-Oblique').text(`  ... and ${chart.data.length - 3} more rows`);
            }
          } else {
            doc.font('Helvetica').text('  No data available');
          }

          doc.moveDown();
        });
      }

      // ===== FOOTER =====
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text(
          `Generated by Uber Clone Admin System - Page ${i + 1} of ${totalPages}`,
          50,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - 100 }
        );
      }

      // Finalize the PDF
      doc.end();
    });
  }

  // Analytics Methods
  async getDashboardAnalytics(filters: AnalyticsFilters): Promise<any> {
    const { dateFrom, dateTo } = this.resolveAnalyticsDateRange(filters);

    // Get summary metrics
    const [totalRides, totalRevenue, totalUsers, totalDrivers] = await Promise.all([
      this.prisma.ride.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
      this.prisma.ride.aggregate({
        where: { createdAt: { gte: dateFrom, lte: dateTo }, paymentStatus: 'COMPLETED' },
        _sum: { farePrice: true },
      }),
      this.prisma.user.count(),
      this.prisma.driver.count(),
    ]);

    // Get trends data
    const trendsData = await this.getDashboardTrendsData(dateFrom, dateTo);

    // Get performance data
    const performanceData = await this.getDashboardPerformanceData(dateFrom, dateTo);

    // Get geography data
    const geographyData = await this.getDashboardGeographyData(filters);

    return {
      summary: {
        totalRides,
        totalRevenue: Number(totalRevenue._sum?.farePrice || 0),
        totalUsers,
        totalDrivers,
        averageRideValue: totalRides > 0 ? Number(totalRevenue._sum?.farePrice || 0) / totalRides : 0,
        averageRating: 4.2, // Would calculate from ratings table
        completionRate: 95.5, // Would calculate from actual data
      },
      trends: trendsData,
      performance: performanceData,
      geography: geographyData,
      generatedAt: new Date(),
    };
  }

  async getRideAnalytics(filters: AnalyticsFilters): Promise<any> {
    const { dateFrom, dateTo } = this.resolveAnalyticsDateRange(filters);

    // Get overview metrics
    const ridesData = await this.prisma.ride.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        ...(filters.status && { status: filters.status as any }),
        ...(filters.rideTierId && { tierId: filters.rideTierId }),
      },
      include: { tier: true },
    });

    const overview = {
      totalRides: ridesData.length,
      completedRides: ridesData.filter(r => r.status === 'COMPLETED').length,
      cancelledRides: ridesData.filter(r => r.status === 'CANCELLED').length,
      completionRate: ridesData.length > 0 ?
        (ridesData.filter(r => r.status === 'COMPLETED').length / ridesData.length) * 100 : 0,
      averageRideDuration: 18.5, // Would calculate from actual data
      averageWaitTime: 3.2, // Would calculate from actual data
      averageDistance: 8.7, // Would calculate from actual data
    };

    // Get time-based analytics
    const byTime = await this.getRidesByTime(dateFrom, dateTo, filters.groupBy || 'day');

    // Get tier-based analytics
    const byTier = await this.getRidesByTier(dateFrom, dateTo);

    // Get geography-based analytics
    const byGeography = await this.getRidesByGeography(dateFrom, dateTo, filters);

    // Get cancellation reasons
    const cancellationReasons = await this.getCancellationReasons(dateFrom, dateTo);

    return {
      overview,
      byTime,
      byTier,
      byGeography,
      cancellationReasons,
      generatedAt: new Date(),
    };
  }

  async getFinancialAnalytics(filters: AnalyticsFilters): Promise<any> {
    const { dateFrom, dateTo } = this.resolveAnalyticsDateRange(filters);

    // Get revenue data
    const [rideRevenue, driverPayments, walletTransactions] = await Promise.all([
      this.prisma.ride.aggregate({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          paymentStatus: 'COMPLETED',
        },
        _sum: { farePrice: true },
        _count: true,
      }),
      this.prisma.driverPayment?.aggregate({
        where: { createdAt: { gte: dateFrom, lte: dateTo }, status: 'COMPLETED' },
        _sum: { amount: true },
      }) || Promise.resolve({ _sum: { amount: 0 } }),
      this.prisma.walletTransaction?.aggregate({
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
        _sum: { amount: true },
      }) || Promise.resolve({ _sum: { amount: 0 } }),
    ]);

    const grossRevenue = Number(rideRevenue._sum?.farePrice || 0);
    const stripeFees = (filters.includeStripeFees ?? true) ? grossRevenue * 0.029 + 30 : 0; // 2.9% + 30¢
    const taxes = (filters.includeTaxes ?? true) ? grossRevenue * 0.08 : 0; // 8% tax estimate
    const netRevenue = grossRevenue - stripeFees - taxes;

    const revenue = {
      totalRevenue: netRevenue,
      grossRevenue,
      stripeFees,
      taxes,
      netRevenue,
      averageTransaction: rideRevenue._count > 0 ? netRevenue / rideRevenue._count : 0,
    };

    // Get trends data
    const trends = await this.getFinancialTrends(dateFrom, dateTo, filters.groupBy || 'day');

    // Get payment method breakdown
    const byPaymentMethod = await this.getRevenueByPaymentMethod(dateFrom, dateTo);

    // Get tier breakdown
    const byTier = await this.getRevenueByTier(dateFrom, dateTo);

    // Calculate projections
    const projections = this.calculateRevenueProjections(trends);

    return {
      revenue,
      trends,
      byPaymentMethod,
      byTier,
      projections,
      generatedAt: new Date(),
    };
  }

  async getUserAnalytics(filters: AnalyticsFilters): Promise<any> {
    const { dateFrom, dateTo } = this.resolveAnalyticsDateRange(filters);

    // Get user overview
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          rides: {
            some: { createdAt: { gte: dateFrom, lte: dateTo } }
          }
        }
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      }),
    ]);

    // Get returning users (users with more than 1 ride)
    const returningUsers = await this.prisma.user.count({
      where: {
        rides: {
          some: {} // At least one ride exists
        }
      }
    });

    const overview = {
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      churnedUsers: Math.max(0, totalUsers - activeUsers), // Simplified calculation
      averageRidesPerUser: totalUsers > 0 ? await this.getAverageRidesPerUser() : 0,
      averageRating: 4.2, // Would calculate from actual data
    };

    // Get demographics
    const demographics = await this.getUserDemographics();

    // Get behavior metrics
    const behavior = await this.getUserBehaviorMetrics(dateFrom, dateTo);

    // Get retention data
    const retention = await this.getUserRetentionMetrics();

    return {
      overview,
      demographics,
      behavior,
      retention,
      generatedAt: new Date(),
    };
  }

  async getDriverAnalytics(filters: AnalyticsFilters): Promise<any> {
    const { dateFrom, dateTo } = this.resolveAnalyticsDateRange(filters);

    // Get driver overview
    const [totalDrivers, activeDrivers, onlineDrivers] = await Promise.all([
      this.prisma.driver.count(),
      this.prisma.driver.count({
        where: {
          status: { in: ['ONLINE', 'BUSY'] },
          updatedAt: { gte: dateFrom, lte: dateTo }
        }
      }),
      this.prisma.driver.count({
        where: { status: 'ONLINE' }
      }),
    ]);

    const newDrivers = await this.prisma.driver.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo } }
    });

    const overview = {
      totalDrivers,
      activeDrivers,
      newDrivers,
      onlineDrivers,
      averageRating: await this.getAverageDriverRating(),
      averageEarnings: await this.getAverageDriverEarnings(dateFrom, dateTo),
      completionRate: 92.3, // Would calculate from actual data
    };

    // Get performance metrics
    const performance = await this.getDriverPerformanceMetrics();

    // Get activity metrics
    const activity = await this.getDriverActivityMetrics(dateFrom, dateTo);

    // Get geography data
    const geography = await this.getDriverGeographyMetrics(filters);

    return {
      overview,
      performance,
      activity,
      geography,
      generatedAt: new Date(),
    };
  }

  async getGeographyAnalytics(filters: AnalyticsFilters): Promise<any> {
    // Get coverage statistics
    const coverage = await this.getGeographyCoverageStats();

    // Get performance by geography
    const performance = await this.getGeographyPerformanceStats();

    // Get demand analysis
    const demand = await this.getGeographyDemandAnalysis();

    // Get expansion opportunities
    const expansion = await this.getGeographyExpansionOpportunities();

    return {
      coverage,
      performance,
      demand,
      expansion,
      generatedAt: new Date(),
    };
  }

  // Helper methods for analytics
  private resolveAnalyticsDateRange(filters: AnalyticsFilters): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    if (filters.startDate && filters.endDate) {
      return { dateFrom: filters.startDate, dateTo: filters.endDate };
    }

    switch (filters.dateRange) {
      case 'today':
        return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { dateFrom: startOfDay(yesterday), dateTo: endOfDay(yesterday) };
      case '7d':
        return { dateFrom: subDays(now, 7), dateTo: now };
      case '30d':
        return { dateFrom: subDays(now, 30), dateTo: now };
      case '90d':
        return { dateFrom: subDays(now, 90), dateTo: now };
      case '1y':
        return { dateFrom: subDays(now, 365), dateTo: now };
      default:
        return { dateFrom: subDays(now, 30), dateTo: now };
    }
  }

  // Placeholder implementations for analytics helper methods
  private async getDashboardTrendsData(dateFrom: Date, dateTo: Date) {
    // Mock data - would be implemented with actual queries
    return {
      rides: [],
      users: [],
      drivers: [],
    };
  }

  private async getDashboardPerformanceData(dateFrom: Date, dateTo: Date) {
    return {
      peakHours: [],
      popularRoutes: [],
      driverPerformance: {
        averageRating: 4.2,
        topPerformers: [],
      },
    };
  }

  private async getDashboardGeographyData(filters: AnalyticsFilters) {
    return {
      ridesByCity: [],
      coverage: {
        activeCities: 0,
        activeZones: 0,
        totalAreaKm2: 0,
      },
    };
  }

  private async getRidesByTime(dateFrom: Date, dateTo: Date, groupBy: string) {
    // Would group rides by time period
    return [];
  }

  private async getRidesByTier(dateFrom: Date, dateTo: Date) {
    // Would aggregate rides by service tier
    return [];
  }

  private async getRidesByGeography(dateFrom: Date, dateTo: Date, filters: AnalyticsFilters) {
    // Would aggregate rides by geographic location
    return [];
  }

  private async getCancellationReasons(dateFrom: Date, dateTo: Date) {
    // Would analyze cancellation reasons
    return [];
  }

  private async getFinancialTrends(dateFrom: Date, dateTo: Date, groupBy: string) {
    // Would create revenue trends over time
    return [];
  }

  private async getRevenueByPaymentMethod(dateFrom: Date, dateTo: Date) {
    // Would break down revenue by payment method
    return [];
  }

  private async getRevenueByTier(dateFrom: Date, dateTo: Date) {
    // Would break down revenue by service tier
    return [];
  }

  private calculateRevenueProjections(trends: any[]) {
    // Simple linear projection
    return {
      monthlyGrowth: 8.5,
      projectedRevenue: 150000, // cents
      confidence: 75,
    };
  }

  private async getAverageRidesPerUser(): Promise<number> {
    const result = await this.prisma.user.findMany({
      include: { _count: { select: { rides: true } } },
    });
    const totalRides = result.reduce((sum, user) => sum + user._count.rides, 0);
    return result.length > 0 ? totalRides / result.length : 0;
  }

  private async getUserDemographics() {
    return {
      byAgeGroup: [],
      byGender: [],
      topCities: [],
    };
  }

  private async getUserBehaviorMetrics(dateFrom: Date, dateTo: Date) {
    return {
      sessionDuration: {
        average: 15,
        distribution: [],
      },
      rideFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      preferredTimes: [],
    };
  }

  private async getUserRetentionMetrics() {
    return {
      day1: 85,
      day7: 65,
      day30: 45,
      cohortAnalysis: [],
    };
  }

  private async getAverageDriverRating(): Promise<number> {
    const result = await this.prisma.driver.aggregate({
      _avg: { averageRating: true },
    });
    return Number(result._avg?.averageRating || 0);
  }

  private async getAverageDriverEarnings(dateFrom: Date, dateTo: Date): Promise<number> {
    const result = await this.prisma.driver.aggregate({
      _avg: { totalEarnings: true },
    });
    return Number(result._avg?.totalEarnings || 0);
  }

  private async getDriverPerformanceMetrics() {
    return {
      topPerformers: [],
      ratingDistribution: [],
      earningsDistribution: [],
    };
  }

  private async getDriverActivityMetrics(dateFrom: Date, dateTo: Date) {
    return {
      onlineHours: {
        averagePerDriver: 8,
        totalOnlineHours: 0,
      },
      rideAcceptance: {
        averageResponseTime: 15,
        acceptanceRate: 92,
      },
      cancellationRate: 3.5,
    };
  }

  private async getDriverGeographyMetrics(filters: AnalyticsFilters) {
    return {
      byCity: [],
      coverage: {
        citiesWithDrivers: 0,
        averageDriversPerCity: 0,
        supplyGaps: [],
      },
    };
  }

  private async getGeographyCoverageStats() {
    return {
      countries: 1,
      states: 5,
      cities: 25,
      zones: 150,
      totalAreaKm2: 25000,
      populationCovered: 5000000,
    };
  }

  private async getGeographyPerformanceStats() {
    return {
      byCountry: [],
      byCity: [],
      topCities: [],
    };
  }

  private async getGeographyDemandAnalysis() {
    return {
      highDemandAreas: [],
      supplyGaps: [],
    };
  }

  private async getGeographyExpansionOpportunities() {
    return {
      potentialCities: [],
    };
  }
}
