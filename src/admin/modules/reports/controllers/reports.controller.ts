import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  Post,
  Body,
  Res,
  Param,
  Delete,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { 
  ReportsService, 
  ReportTypeDefinition, 
  ReportParameters,
  ReportType,
  ReportFormat,
  DateRange 
} from '../services/reports.service';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/reports')
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ 
    summary: 'Get Revenue Statistics', 
    description: `Retrieves revenue statistics for the specified time period. 
    Data can be filtered by day, week, month, or year.`
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['day', 'week', 'month', 'year'], 
    description: 'Time period for aggregating revenue data',
    example: 'month'
  })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Revenue data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalRevenue: { 
              type: 'number', 
              example: 125000.50,
              description: 'Total revenue for the specified period'
            },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Currency code for the revenue amounts'
            },
            period: {
              type: 'string',
              example: 'month',
              description: 'The time period for the data'
            },
            breakdown: {
              type: 'array',
              description: 'Revenue breakdown by time interval within the period',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number', example: 4500.75 },
                  rides: { type: 'number', example: 120 },
                  averageOrderValue: { type: 'number', example: 37.50 }
                }
              }
            },
            comparison: {
              type: 'object',
              description: 'Comparison with previous period',
              properties: {
                percentageChange: { 
                  type: 'number', 
                  example: 15.5,
                  description: 'Percentage change from previous period'
                },
                isIncrease: { 
                  type: 'boolean', 
                  example: true,
                  description: 'Whether the revenue increased compared to previous period'
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid period parameter',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid period parameter' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async getRevenue(@Query('period') period = 'month') {
    try {
      const data = await this.reportsService.getRevenueData(period);
      return { success: true, data };
    } catch (error) {
      throw new BadRequestException('Failed to fetch revenue data');
    }
  }

  @Get('types')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get available report types',
    description: 'Retrieve a list of available report types and their parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Report types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'sales' },
              name: { type: 'string', example: 'Sales Report' },
              description: { type: 'string', example: 'Detailed sales report with revenue breakdown' },
              parameters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'dateRange' },
                    type: { type: 'string', example: 'select' },
                    required: { type: 'boolean', example: true },
                    options: {
                      type: 'array',
                      items: { type: 'string', example: 'today' },
                    },
                    default: { type: 'string', example: 'this_month' },
                  },
                },
              },
              formats: {
                type: 'array',
                items: { type: 'string', enum: ['json', 'csv', 'pdf', 'excel'] },
              },
              defaultFormat: { type: 'string', enum: ['json', 'csv', 'pdf', 'excel'] },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getReportTypes(): Promise<{ success: boolean; data: ReportTypeDefinition[] }> {
    this.logger.log('Fetching available report types');
    return this.reportsService.getReportTypes();
  }

  @Get('generate')
  @RequirePermissions(Permission.REPORTS_GENERATE)
  @ApiOperation({
    summary: 'Generate a report',
    description: 'Generate a report based on the specified type and parameters',
  })
  @ApiQuery({
    name: 'type',
    enum: ['sales', 'users', 'drivers', 'stores', 'rides', 'custom'],
    required: true,
    description: 'Type of report to generate',
    example: 'sales',
  })
  @ApiQuery({
    name: 'format',
    enum: ['json', 'csv', 'pdf', 'excel'],
    required: false,
    description: 'Output format of the report',
    example: 'json',
  })
  @ApiQuery({
    name: 'dateRange',
    enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'custom'],
    required: false,
    description: 'Date range for the report',
    example: 'this_month',
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Start date for custom date range (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'End date for custom date range (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            metadata: {
              type: 'object',
              properties: {
                generatedAt: { type: 'string', format: 'date-time' },
                dateRange: {
                  type: 'object',
                  properties: {
                    from: { type: 'string', format: 'date' },
                    to: { type: 'string', format: 'date' },
                  },
                },
                parameters: { type: 'object' },
              },
            },
          },
        },
      },
      'text/csv': {
        schema: {
          type: 'string',
          example: 'Date,Revenue,Orders\n2023-01-01,1500,25\n2023-01-02,1800,30',
        },
      },
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async generateReport(
    @Query('type') type: ReportType,
    @Query('format') format: ReportFormat = 'json',
    @Query('dateRange') dateRange: DateRange = 'this_month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    this.logger.log(`Generating ${type} report in ${format} format`);
    
    const params = {
      dateRange,
      startDate,
      endDate,
      // Add other parameters as needed
    };

    const result = await this.reportsService.generateReport(type, format, params);

    // If format is JSON, return as JSON
    if (format === 'json') {
      return result;
    }

    // For file downloads, set appropriate headers
    if (res) {
      let contentType = 'text/plain';
      let extension = 'txt';
      let filename = `report-${type}-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'csv':
          contentType = 'text/csv';
          extension = 'csv';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
      
      // If the result is a buffer (PDF, Excel), send it directly
      if (Buffer.isBuffer(result)) {
        return result;
      }
      
      // For CSV/text, send as string
      return String(result);
    }

    // If we reach here, it means we're not sending a file response
    // So we expect the result to be in the standard format
    if (typeof result === 'object' && result !== null && 'success' in result) {
      return result as { success: boolean; data: any; metadata: any };
    }
    
    // Fallback for unexpected response types
    return {
      success: true,
      data: result,
      metadata: {
        generatedAt: new Date().toISOString(),
        format,
        type,
      },
    };
  }

  @Post('schedule')
  @RequirePermissions(Permission.REPORTS_SCHEDULE)
  @ApiOperation({
    summary: 'Schedule a recurring report',
    description: 'Schedule a report to be generated and delivered on a recurring basis',
  })
  @ApiResponse({
    status: 201,
    description: 'Report scheduled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sched_123456789' },
            type: { type: 'string', example: 'sales' },
            format: { type: 'string', example: 'pdf' },
            frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
            recipients: {
              type: 'array',
              items: { type: 'string', format: 'email' },
            },
            nextRun: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            parameters: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async scheduleReport(
    @Body('type') type: ReportType,
    @Body('format') format: ReportFormat,
    @Body('frequency') frequency: 'daily' | 'weekly' | 'monthly',
    @Body('recipients') recipients: string[],
    @Body('parameters') parameters: ReportParameters,
  ): Promise<{ success: boolean; data: any }> {
    this.logger.log(`Scheduling ${frequency} ${type} report in ${format} format`);
    return this.reportsService.scheduleReport({
      type,
      format,
      frequency,
      recipients,
      parameters,
    });
  }

  @Get('scheduled')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get scheduled reports',
    description: 'Retrieve a list of all scheduled reports',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled reports retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'sched_123456789' },
              type: { type: 'string', example: 'sales' },
              format: { type: 'string', example: 'pdf' },
              frequency: { type: 'string', example: 'weekly' },
              recipients: {
                type: 'array',
                items: { type: 'string', example: 'admin@example.com' },
              },
              nextRun: { type: 'string', format: 'date-time' },
              lastRun: { type: 'string', format: 'date-time' },
              status: { type: 'string', example: 'active' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getScheduledReports() {
    this.logger.log('Fetching scheduled reports');
    return this.reportsService.getScheduledReports();
  }

  @Post('scheduled/:id/status')
  @RequirePermissions(Permission.REPORTS_SCHEDULE)
  @ApiOperation({
    summary: 'Update scheduled report status',
    description: 'Enable or disable a scheduled report',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Scheduled report status updated' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sched_123456789' },
            status: { type: 'string', example: 'inactive' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateScheduledReportStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    this.logger.log(`Updating status for scheduled report ${id} to ${isActive ? 'active' : 'inactive'}`);
    return this.reportsService.updateScheduledReportStatus(id, isActive);
  }

  @Delete('scheduled/:id')
  @RequirePermissions(Permission.REPORTS_SCHEDULE)
  @ApiOperation({
    summary: 'Delete a scheduled report',
    description: 'Permanently delete a scheduled report',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Scheduled report deleted successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async deleteScheduledReport(@Param('id') id: string) {
    this.logger.log(`Deleting scheduled report ${id}`);
    return this.reportsService.deleteScheduledReport(id);
  }
}
