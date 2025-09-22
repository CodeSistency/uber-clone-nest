import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Response } from 'express';

interface RevenueData {
  total_amount: number | null;
  total_count: bigint;
}
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { subDays, subMonths, subWeeks, startOfDay, format } from 'date-fns';
// Import pdfmake with dynamic import to handle both ESM and CommonJS
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');

// Register the fonts
if (typeof pdfFonts === 'function') {
  // For newer versions of pdfmake
  pdfMake.vfs = pdfFonts().pdfMake.vfs;
} else if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  // For older versions of pdfmake
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

export type ReportType = 'sales' | 'users' | 'drivers' | 'stores' | 'rides' | 'custom';
export type ReportFormat = 'json' | 'csv' | 'pdf' | 'excel';
export type DateRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface ReportParameters {
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export interface ReportTypeDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: any[];
    default?: any;
  }>;
  formats: ReportFormat[];
  defaultFormat: ReportFormat;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get available report types and their parameters
   */
  getReportTypes() {
    const reportTypes: ReportTypeDefinition[] = [
      {
        id: 'sales',
        name: 'Sales Report',
        description: 'Detailed sales report with revenue breakdown',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'today',
              'yesterday',
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
            ],
            default: 'this_month',
          },
          {
            name: 'groupBy',
            type: 'select',
            required: false,
            options: ['day', 'week', 'month', 'year', 'store', 'category'],
            default: 'day',
          },
        ],
        formats: ['json', 'csv', 'pdf', 'excel'],
        defaultFormat: 'json',
      },
      {
        id: 'users',
        name: 'User Activity Report',
        description: 'Report on user signups, activity, and engagement',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
            ],
            default: 'this_month',
          },
          {
            name: 'userType',
            type: 'select',
            required: false,
            options: ['all', 'customer', 'driver', 'store_owner'],
            default: 'all',
          },
        ],
        formats: ['json', 'csv', 'excel'],
        defaultFormat: 'json',
      },
      {
        id: 'drivers',
        name: 'Driver Performance Report',
        description: 'Report on driver performance metrics and ratings',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
            ],
            default: 'this_month',
          },
          {
            name: 'minTrips',
            type: 'number',
            required: false,
            default: 0,
          },
        ],
        formats: ['json', 'csv', 'pdf', 'excel'],
        defaultFormat: 'json',
      },
      {
        id: 'stores',
        name: 'Store Performance Report',
        description: 'Report on store sales, orders, and performance metrics',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
            ],
            default: 'this_month',
          },
          {
            name: 'storeType',
            type: 'select',
            required: false,
            options: ['all', 'restaurant', 'grocery', 'pharmacy', 'convenience', 'other'],
            default: 'all',
          },
        ],
        formats: ['json', 'csv', 'excel'],
        defaultFormat: 'json',
      },
      {
        id: 'rides',
        name: 'Ride Analytics Report',
        description: 'Detailed analytics on ride requests, completions, and cancellations',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'today',
              'yesterday',
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
            ],
            default: 'this_month',
          },
          {
            name: 'rideType',
            type: 'select',
            required: false,
            options: ['all', 'standard', 'xl', 'premium', 'bike', 'delivery'],
            default: 'all',
          },
        ],
        formats: ['json', 'csv', 'pdf', 'excel'],
        defaultFormat: 'json',
      },
      {
        id: 'custom',
        name: 'Custom Report',
        description: 'Create a custom report with specific parameters',
        parameters: [
          {
            name: 'dateRange',
            type: 'select',
            required: true,
            options: [
              'today',
              'yesterday',
              'this_week',
              'last_week',
              'this_month',
              'last_month',
              'this_year',
              'custom',
              'all_time',
            ],
            default: 'this_month',
          },
          {
            name: 'metrics',
            type: 'multiselect',
            required: true,
            options: [
              'revenue',
              'orders',
              'users',
              'drivers',
              'stores',
              'rides',
              'ratings',
              'cancellations',
            ],
            default: ['revenue', 'orders'],
          },
          {
            name: 'groupBy',
            type: 'select',
            required: false,
            options: ['day', 'week', 'month', 'year', 'category', 'none'],
            default: 'day',
          },
        ],
        formats: ['json', 'csv', 'pdf', 'excel'],
        defaultFormat: 'json',
      },
    ];

    return {
      success: true,
      data: reportTypes,
    };
  }

  /**
   * Generate a report based on type and parameters
   */
  async generateReport(
    type: ReportType,
    format: ReportFormat = 'json',
    parameters: ReportParameters = { dateRange: 'this_month' },
  ) {
    this.logger.log(`Generating ${type} report in ${format} format`);

    // Parse and validate date range
    const { startDate, endDate } = this.getDateRange(parameters.dateRange, parameters.startDate, parameters.endDate);
    
    // Generate the report data based on type
    let reportData: any;
    
    switch (type) {
      case 'sales':
        reportData = await this.generateSalesReport(startDate, endDate, parameters);
        break;
      case 'users':
        reportData = await this.generateUsersReport(startDate, endDate, parameters);
        break;
      case 'drivers':
        reportData = await this.generateDriversReport(startDate, endDate, parameters);
        break;
      case 'stores':
        reportData = await this.generateStoresReport(startDate, endDate, parameters);
        break;
      case 'rides':
        reportData = await this.generateRidesReport(startDate, endDate, parameters);
        break;
      case 'custom':
        reportData = await this.generateCustomReport(startDate, endDate, parameters);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    // Format the report data based on the requested format
    switch (format) {
      case 'json':
        return {
          success: true,
          data: reportData.data,
          metadata: {
            generatedAt: new Date().toISOString(),
            dateRange: {
              from: startDate.toISOString().split('T')[0],
              to: endDate.toISOString().split('T')[0],
            },
            parameters,
          },
        };
      case 'csv':
        return this.convertToCsv(reportData.data, reportData.columns);
      case 'pdf':
        return this.convertToPdf(reportData, parameters);
      case 'excel':
        return this.convertToExcel(reportData, parameters);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(data: {
    type: ReportType;
    format: ReportFormat;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    parameters: Record<string, any>;
  }) {
    // In a real implementation, this would save to a database
    const scheduledReport = {
      id: `sched_${Date.now()}`,
      ...data,
      status: 'active',
      nextRun: this.calculateNextRun(data.frequency),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logger.log(`Scheduled ${data.frequency} ${data.type} report`);

    return {
      success: true,
      message: 'Report scheduled successfully',
      data: scheduledReport,
    };
  }

  /**
   * Get all scheduled reports
   */
  async getScheduledReports() {
    // In a real implementation, this would query the database
    const scheduledReports = [];
    
    return {
      success: true,
      data: scheduledReports,
    };
  }

  /**
   * Update a scheduled report's status
   */
  async updateScheduledReportStatus(id: string, isActive: boolean) {
    // In a real implementation, this would update the database
    this.logger.log(`Updated status for scheduled report ${id} to ${isActive ? 'active' : 'inactive'}`);
    
    return {
      success: true,
      message: 'Scheduled report status updated',
      data: {
        id,
        status: isActive ? 'active' : 'inactive',
        updatedAt: new Date(),
      },
    };
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(id: string) {
    // In a real implementation, this would delete from the database
    this.logger.log(`Deleted scheduled report ${id}`);
    
    return {
      success: true,
      message: 'Scheduled report deleted successfully',
    };
  }

  /**
   * Helper method to calculate date range
   */
  private getDateRange(
    range: DateRange,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        // Start of week (Sunday)
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        // End of week (Saturday)
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last_week':
        // Start of last week (Sunday)
        startDate.setDate(now.getDate() - now.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        // End of last week (Saturday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        // Start of month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // End of month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last_month':
        // Start of last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // End of last month
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this_year':
        // Start of year
        startDate = new Date(now.getFullYear(), 0, 1);
        // End of year
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          throw new Error('Custom date range requires both startDate and endDate');
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error(`Unsupported date range: ${range}`);
    }

    return { startDate, endDate };
  }

  /**
   * Helper method to calculate next run time for scheduled reports
   */
  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const nextRun = new Date();
    
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
        nextRun.setHours(0, 0, 0, 0);
        break;
    }
    
    return nextRun;
  }

  /**
   * Generate sales report
   */
  private async generateSalesReport(startDate: Date, endDate: Date, params: any) {
    // In a real implementation, this would query the database
    // This is a simplified example
    const data = [
      { date: '2023-01-01', revenue: 1500, orders: 25, averageOrder: 60 },
      { date: '2023-01-02', revenue: 1800, orders: 30, averageOrder: 60 },
      // ... more data
    ];

    return {
      data,
      columns: ['date', 'revenue', 'orders', 'averageOrder'],
      title: 'Sales Report',
      description: `Sales data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Generate users report
   */
  private async generateUsersReport(startDate: Date, endDate: Date, params: any) {
    // In a real implementation, this would query the database
    const data = [
      { date: '2023-01-01', signups: 10, activeUsers: 150, orders: 120 },
      { date: '2023-01-02', signups: 15, activeUsers: 155, orders: 130 },
      // ... more data
    ];

    return {
      data,
      columns: ['date', 'signups', 'activeUsers', 'orders'],
      title: 'User Activity Report',
      description: `User activity from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Generate drivers report
   */
  private async generateDriversReport(startDate: Date, endDate: Date, params: any) {
    // In a real implementation, this would query the database
    const data = [
      { driver: 'John Doe', trips: 25, rating: 4.8, earnings: 1250 },
      { driver: 'Jane Smith', trips: 30, rating: 4.9, earnings: 1500 },
      // ... more data
    ];

    return {
      data,
      columns: ['driver', 'trips', 'rating', 'earnings'],
      title: 'Driver Performance Report',
      description: `Driver performance from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Generate stores report
   */
  private async generateStoresReport(startDate: Date, endDate: Date, params: any) {
    // In a real implementation, this would query the database
    const data = [
      { store: 'Pizza Palace', orders: 120, revenue: 3500, rating: 4.5 },
      { store: 'Burger Joint', orders: 95, revenue: 2850, rating: 4.3 },
      // ... more data
    ];

    return {
      data,
      columns: ['store', 'orders', 'revenue', 'rating'],
      title: 'Store Performance Report',
      description: `Store performance from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Generate rides report
   */
  private async generateRidesReport(startDate: Date, endDate: Date, params: any) {
    // In a real implementation, this would query the database
    const data = [
      { date: '2023-01-01', requests: 150, completed: 140, cancelled: 10, revenue: 3500 },
      { date: '2023-01-02', requests: 160, completed: 155, cancelled: 5, revenue: 3875 },
      // ... more data
    ];

    return {
      data,
      columns: ['date', 'requests', 'completed', 'cancelled', 'revenue'],
      title: 'Ride Analytics Report',
      description: `Ride analytics from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(startDate: Date, endDate: Date, params: any) {
    // This would dynamically generate a report based on the selected metrics
    const data = [
      { metric: 'Total Revenue', value: 12500, change: 12.5 },
      { metric: 'Total Orders', value: 350, change: 8.2 },
      { metric: 'Active Users', value: 1250, change: 5.7 },
      { metric: 'Active Drivers', value: 85, change: 3.2 },
      { metric: 'Active Stores', value: 42, change: 2.1 },
    ];

    return {
      data,
      columns: ['metric', 'value', 'change'],
      title: 'Custom Analytics Report',
      description: `Custom report from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    };
  }

  /**
   * Convert data to CSV format
   */
  private convertToCsv(data: any[], columns: string[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Use provided columns or get them from the first data object
    const headers = columns || Object.keys(data[0]);
    
    // Create CSV header
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header];
        let stringValue: string;
        
        if (value === null || value === undefined) {
          stringValue = '';
        } else if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }
        
        // Escape quotes and wrap in quotes if needed
        if (stringValue.includes('"') || stringValue.includes(',')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csv += values.join(',') + '\n';
    }
    
    return csv;
  }

  /**
   * Convert data to PDF format
   */
  private async convertToPdf(reportData: {
    data: any[];
    title: string;
    description: string;
    columns?: string[];
  }, params: Record<string, any> = {}): Promise<Buffer> {
    const { data = [], title = 'Report', description = '' } = reportData;
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data provided for PDF generation');
    }
    
    // Prepare document definition with proper typing
    interface PdfDocumentDefinition {
      pageSize: string;
      pageOrientation: 'portrait' | 'landscape';
      content: any[];
      styles: Record<string, any>;
      defaultStyle: {
        fontSize: number;
      };
    }
    
    const docDefinition: PdfDocumentDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      content: [
        { text: title, style: 'header' },
        { text: description, style: 'subheader' },
        { text: `Generated on: ${new Date().toLocaleString()}`, style: 'subheader' },
        { text: '\n' }, // Add some space
        {
          style: 'table',
          table: {
            headerRows: 1,
            widths: Array.isArray(data[0]) ? 
              new Array(data[0].length).fill('*') : 
              Object.keys(data[0]).map(() => '*'),
            body: this.preparePdfTableData(data),
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        small: {
          fontSize: 8,
          color: 'gray',
        },
        table: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f2f2f2',
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    try {
      // Generate PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Return a promise that resolves with the PDF buffer
      return new Promise<Buffer>((resolve, reject) => {
        pdfDoc.getBuffer((buffer: Buffer) => {
          if (buffer && buffer.length > 0) {
            resolve(buffer);
          } else {
            reject(new Error('Failed to generate PDF buffer'));
          }
        });
      });
    } catch (error) {
      this.logger.error('Error generating PDF', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Prepare data for PDF table
   */
  private preparePdfTableData(data: any[]): any[] {
    if (!data || data.length === 0) {
      return [];
    }

    // If data is an array of arrays
    if (Array.isArray(data[0])) {
      return data;
    }

    // If data is an array of objects
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]));
    
    // Add header row with styling
    return [
      headers.map(header => ({ text: header, style: 'tableHeader' })),
      ...rows,
    ];
  }

  /**
   * Get revenue data for a specific period
   * @param period The time period to get revenue data for (day, week, month, year)
   * @returns Revenue data for the specified period
   */

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
      } else { // year
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
      const currentAmount = Number(revenueData[0]?.total_amount?.toString() || 0);
      const previousAmount = Number(comparisonData[0]?.total_amount?.toString() || 0);
      let percentageChange = 0;
      
      if (previousAmount > 0) {
        percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
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

      const totalTransactions = Number(revenueData[0]?.total_count?.toString() || 0);
      
      return {
        totalRevenue: currentAmount,
        currency: 'USD',
        period: period.toLowerCase(),
        transactionCount: totalTransactions,
        averageTransactionValue: totalTransactions > 0 
          ? currentAmount / totalTransactions 
          : 0,
        comparison: {
          percentageChange: parseFloat(percentageChange.toFixed(2)),
          isIncrease: percentageChange >= 0,
          previousPeriodAmount: previousAmount,
          previousPeriod: this.getPreviousPeriodLabel(period)
        },
        breakdown: (Array.isArray(dailyBreakdown) ? dailyBreakdown : []).map((item) => ({
          date: new Date(item.date).toISOString().split('T')[0],
          amount: parseFloat(Number(item.amount || 0).toFixed(2)),
          transactionCount: parseInt(item.transaction_count || '0', 10),
          averageValue: parseFloat((Number(item.amount || 0) / (parseInt(item.transaction_count || '0', 10) || 1)).toFixed(2))
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting revenue data: ${error.message}`, error.stack);
      throw new Error('Failed to fetch revenue data');
    }
  }

  /**
   * Convert data to Excel format
   */
  private async convertToExcel(reportData: any, params: any): Promise<Buffer> {
    const { data, title, description } = reportData;
    
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    // Add title and description
    worksheet.addRow([title]);
    worksheet.addRow([description]);
    worksheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);
    
    // Add data to worksheet
    if (data && data.length > 0) {
      // Add headers
      const headers = Array.isArray(data[0]) ? 
        data[0].map((_, i) => `Column ${i + 1}`) : 
        Object.keys(data[0]);
      
      worksheet.addRow(headers);
      
      // Style header row
      const headerRow = worksheet.getRow(5);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      
      // Add data rows
      const rows = Array.isArray(data[0]) ? 
        data : 
        data.map(row => Object.values(row));
      
      worksheet.addRows(rows);
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (!column) return;
        
        let maxLength = 0;
        if (column.eachCell) {
          column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell?.value ? cell.value.toString().length : 0;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
        }
        
        if (typeof column.width === 'number') {
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });
    }
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
