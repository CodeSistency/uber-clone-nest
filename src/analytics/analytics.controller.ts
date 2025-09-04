import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../drivers/guards/driver.guard';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stores/:storeId/summary')
  @ApiOperation({
    summary: 'Get store analytics summary',
    description: 'Get comprehensive analytics for a store including sales, products, and ratings'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Store analytics retrieved successfully' })
  async getStoreSummary(@Query('storeId') storeId: number, @Query('period') period: string = '30d') {
    const analytics = await this.analyticsService.getStoreAnalytics(storeId);
    return { data: analytics };
  }

  @Get('drivers/:driverId/summary')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Get driver delivery analytics',
    description: 'Get analytics about driver deliveries, earnings, and ratings'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Driver analytics retrieved successfully' })
  async getDriverSummary(@Query('driverId') driverId: number, @Query('period') period: string = '30d') {
    const analytics = await this.analyticsService.getDriverAnalytics(driverId);
    return { data: analytics };
  }

  @Get('platform/summary')
  @ApiOperation({
    summary: 'Get platform-wide analytics',
    description: 'Get overall platform analytics (admin only)'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Platform analytics retrieved successfully' })
  async getPlatformSummary(@Query('period') period: string = '30d') {
    const analytics = await this.analyticsService.getPlatformAnalytics();
    return { data: analytics };
  }

  @Get('user/orders')
  @ApiOperation({
    summary: 'Get user order analytics',
    description: 'Get analytics about user orders, spending patterns, and preferences'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Query('period') period: string = '30d', @Req() req) {
    // TODO: Implement getUserAnalytics method in service
    return {
      data: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteStores: [],
        orderFrequency: 0,
        period,
      },
      message: 'User analytics - coming soon'
    };
  }

  @Get('stores/:storeId/revenue')
  @ApiOperation({
    summary: 'Get store revenue analytics',
    description: 'Get detailed revenue breakdown for a store'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Store revenue analytics retrieved successfully' })
  async getStoreRevenue(@Query('storeId') storeId: number, @Query('period') period: string = '30d') {
    // TODO: Implement getStoreRevenue method in service
    return {
      data: {
        dailyRevenue: [],
        weeklyRevenue: [],
        monthlyRevenue: [],
        revenueByCategory: [],
        period,
      },
      message: 'Store revenue analytics - coming soon'
    };
  }

  @Get('drivers/:driverId/performance')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Get driver performance metrics',
    description: 'Get detailed performance metrics for a driver'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Driver performance retrieved successfully' })
  async getDriverPerformance(@Query('driverId') driverId: number, @Query('period') period: string = '30d') {
    // TODO: Implement getDriverPerformance method in service
    return {
      data: {
        deliveryTimes: [],
        customerRatings: [],
        acceptanceRate: 0,
        earningsBreakdown: [],
        period,
      },
      message: 'Driver performance analytics - coming soon'
    };
  }
}
