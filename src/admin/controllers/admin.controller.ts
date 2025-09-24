import {
  Controller,
  Get,
  UseGuards,
  Query,
  BadRequestException,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { Permission } from '../entities/admin.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('Admin Dashboard')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing authentication token',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
      error: { type: 'string', example: 'Unauthorized' },
    },
  },
})
@ApiForbiddenResponse({
  description: 'Forbidden - User does not have required permissions',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'Forbidden resource' },
      error: { type: 'string', example: 'Forbidden' },
    },
  },
})
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

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
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
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

      const revenueData = await this.getRevenueData();

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

  @Get('revenue')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({
    summary: 'Get Revenue Statistics',
    description: `Retrieves revenue statistics for the specified time period. 
    Data can be filtered by day, week, month, or year.`,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Time period for aggregating revenue data',
    example: 'month',
  })
  @ApiOkResponse({
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
              example: 125000.5,
              description: 'Total revenue for the specified period',
            },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Currency code for the revenue amounts',
            },
            period: {
              type: 'string',
              example: 'month',
              description: 'The time period for the data',
            },
            breakdown: {
              type: 'array',
              description:
                'Revenue breakdown by time interval within the period',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number', example: 4500.75 },
                  rides: { type: 'number', example: 120 },
                  averageOrderValue: { type: 'number', example: 37.5 },
                },
              },
            },
            comparison: {
              type: 'object',
              description: 'Comparison with previous period',
              properties: {
                percentageChange: {
                  type: 'number',
                  example: 15.5,
                  description: 'Percentage change from previous period',
                },
                isIncrease: {
                  type: 'boolean',
                  example: true,
                  description:
                    'Whether the revenue increased compared to previous period',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid period parameter',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid period parameter' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async getRevenue(@Query('period') period = 'month') {
    try {
      const data = await this.getRevenueData(period);
      return { success: true, data };
    } catch (error) {
      throw new BadRequestException('Failed to fetch revenue data');
    }
  }

  @Get('users/:id')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: 'Get User Details',
    description: `Retrieves comprehensive information about a specific user including 
    profile details, ride history, wallet transactions, and account status.`,
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Unique identifier of the user',
    type: 'integer',
    example: 1,
  })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
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
          description: 'User details object',
          properties: {
            id: {
              type: 'number',
              example: 1,
              description: 'Unique identifier for the user',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: "User's email address",
              format: 'email',
            },
            name: {
              type: 'string',
              example: 'John Doe',
              description: "User's full name",
            },
            phone: {
              type: 'string',
              example: '+1234567890',
              description: "User's phone number in E.164 format",
            },
            status: {
              type: 'string',
              example: 'active',
              enum: ['active', 'inactive', 'suspended', 'pending_verification'],
              description: 'Current status of the user account',
            },
            profileImageUrl: {
              type: 'string',
              example: 'https://example.com/profiles/1.jpg',
              description: "URL to the user's profile image",
              nullable: true,
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: "Timestamp of the user's last login",
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user account was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user account was last updated',
            },
            rides: {
              type: 'array',
              description: 'Recent rides taken by the user',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  status: { type: 'string' },
                  pickupLocation: { type: 'string' },
                  dropoffLocation: { type: 'string' },
                  fare: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            wallet: {
              type: 'object',
              nullable: true,
              description: "User's wallet information",
              properties: {
                balance: {
                  type: 'number',
                  example: 500.75,
                  description: 'Current wallet balance',
                },
                currency: {
                  type: 'string',
                  example: 'USD',
                  description: 'Currency code for the wallet balance',
                },
                lastTransaction: {
                  type: 'object',
                  nullable: true,
                  description: 'Most recent wallet transaction',
                  properties: {
                    id: { type: 'number' },
                    amount: { type: 'number' },
                    type: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    date: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
            preferences: {
              type: 'object',
              description: 'User preferences',
              properties: {
                language: {
                  type: 'string',
                  example: 'en',
                  description: "User's preferred language code",
                },
                notificationSettings: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean' },
                    push: { type: 'boolean' },
                    sms: { type: 'boolean' },
                  },
                },
              },
            },
            verificationStatus: {
              type: 'object',
              description: 'User verification status',
              properties: {
                emailVerified: { type: 'boolean' },
                phoneVerified: { type: 'boolean' },
                identityVerified: { type: 'boolean' },
                verificationLevel: {
                  type: 'string',
                  enum: ['basic', 'verified', 'full'],
                  description: 'Current verification level of the user',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to access user details',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  async getUserDetails(@Param('id', ParseIntPipe) id: number) {
    try {
      // First check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          rides: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              tier: true,
              driver: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImageUrl: true,
                },
              },
            },
          },
          wallet: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Get wallet transactions if wallet exists
      let walletTransactions: Array<{
        id: number;
        walletId: number;
        amount: number;
        transactionType: string;
        description: string | null;
        createdAt: Date;
      }> = [];

      if (user.wallet) {
        const transactions = await this.prisma.walletTransaction.findMany({
          where: { walletId: user.wallet.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            walletId: true,
            amount: true,
            transactionType: true,
            description: true,
            createdAt: true,
          },
        });

        // Convert Decimal to number for the amount field
        walletTransactions = transactions.map((tx) => ({
          ...tx,
          amount: tx.amount.toNumber(),
        }));
      }

      // Combine the data
      const userWithTransactions = {
        ...user,
        walletTransactions,
      };

      return { success: true, data: userWithTransactions };
    } catch (error) {
      throw new BadRequestException('Failed to fetch user details');
    }
  }

  private async getRevenueData(period: string = 'month') {
    const now = new Date();
    const startDate = this.getStartDate(period, now);

    const [rideRevenue, deliveryRevenue] = await Promise.all([
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.deliveryOrder.aggregate({
        _sum: { totalPrice: true },
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      rides: Number(rideRevenue._sum.farePrice || 0),
      delivery: Number(deliveryRevenue._sum.totalPrice || 0),
      total:
        Number(rideRevenue._sum.farePrice || 0) +
        Number(deliveryRevenue._sum.totalPrice || 0),
      period: {
        start: startDate,
        end: now,
        type: period,
      },
    };
  }

  private getStartDate(period: string, now: Date): Date {
    const date = new Date(now);

    switch (period) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      case 'month':
      default:
        date.setMonth(date.getMonth() - 1);
        break;
    }

    return date;
  }
}
