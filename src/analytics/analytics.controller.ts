import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '../stores/guards/store-owner.guard';
import { DriverGuard } from '../drivers/guards/driver.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stores/:storeId/summary')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store analytics',
    description: 'Get detailed analytics for a store (store owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns store analytics data',
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found or not owned by user',
  })
  async getStoreSummary(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any,
  ) {
    return this.analyticsService.getStoreAnalytics(storeId, req.user.id);
  }

  @Get('drivers/:driverId/summary')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get driver analytics',
    description: 'Get detailed analytics for a driver (driver only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns driver analytics data',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
  })
  async getDriverSummary(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.analyticsService.getDriverAnalytics(driverId);
  }

  @Get('platform/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get platform analytics',
    description: 'Get overall platform analytics (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns platform analytics data',
  })
  async getPlatformOverview(@Req() req: any) {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      throw new Error('Unauthorized');
    }

    return this.analyticsService.getPlatformAnalytics();
  }
}
