import {
  Controller,
  Get,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { DashboardService } from '../services/dashboard.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/dashboard')
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @RequirePermissions(Permission.DASHBOARD_READ)
  @ApiOperation({
    summary: 'Get Admin Dashboard Overview',
    description: `Retrieves key metrics and statistics for the admin dashboard including user counts, 
    driver counts, ride statistics, recent activities, and revenue data.`,
  })
  @ApiOkResponse({
    description: 'Dashboard overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
          description: 'Indicates if the request was successful',
        },
        data: {
          type: 'object',
          description: 'Dashboard data object',
          properties: {
            stats: {
              type: 'object',
              description: 'Key metrics and statistics',
              properties: {
                totalUsers: {
                  type: 'number',
                  example: 1500,
                  description: 'Total number of registered users',
                },
                totalDrivers: {
                  type: 'number',
                  example: 250,
                  description: 'Total number of registered drivers',
                },
                totalRides: {
                  type: 'number',
                  example: 8500,
                  description: 'Total number of completed rides',
                },
                totalStores: {
                  type: 'number',
                  example: 120,
                  description: 'Total number of registered stores',
                },
              },
            },
            recentRides: {
              type: 'array',
              description: 'List of recent rides with basic information',
              items: {
                type: 'object',
              },
            },
            revenue: {
              type: 'object',
              description: 'Revenue statistics and metrics',
            },
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred while fetching dashboard data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to fetch dashboard data' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getDashboardOverview() {
    try {
      const [usersCount, driversCount, ridesCount, storesCount] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.driver.count(),
          this.prisma.ride.count(),
          this.prisma.store.count(),
        ]);

      const recentRides = await this.prisma.ride.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      });

      const revenueData = await this.dashboardService.getRevenueData('month');

      return {
        success: true,
        data: {
          stats: {
            totalUsers: usersCount,
            totalDrivers: driversCount,
            totalRides: ridesCount,
            totalStores: storesCount,
          },
          recentRides,
          revenue: revenueData,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch dashboard data');
    }
  }

  @Get('metrics')
  @RequirePermissions(Permission.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description:
      'Retrieve comprehensive dashboard metrics including users, drivers, rides, deliveries, and financial data',
  })
  @ApiOkResponse({
    description: 'Dashboard metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        activeUsers: { type: 'number', example: 120 },
        newUsersToday: { type: 'number', example: 5 },
        totalDrivers: { type: 'number', example: 45 },
        onlineDrivers: { type: 'number', example: 32 },
        activeRides: { type: 'number', example: 8 },
        completedRidesToday: { type: 'number', example: 127 },
        totalRevenue: { type: 'number', example: 15420.5 },
        revenueToday: { type: 'number', example: 2340.75 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getDashboardMetrics() {
    this.logger.log('Fetching dashboard metrics');
    return this.dashboardService.getDashboardMetrics();
  }
}
