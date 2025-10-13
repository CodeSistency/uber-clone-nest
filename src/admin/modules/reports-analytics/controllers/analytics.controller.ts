import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { ReportsAnalyticsService, AnalyticsFilters } from '../services/reports-analytics.service';
import {
  DashboardAnalyticsResponseDto,
  RideAnalyticsResponseDto,
  FinancialAnalyticsResponseDto,
  UserAnalyticsResponseDto,
  DriverAnalyticsResponseDto,
  GeographyAnalyticsResponseDto,
  DashboardAnalyticsQueryDto,
  RideAnalyticsQueryDto,
  FinancialAnalyticsQueryDto,
  UserAnalyticsQueryDto,
  DriverAnalyticsQueryDto,
  GeographyAnalyticsQueryDto,
} from '../dtos/analytics.dto';

@ApiTags('Admin Analytics')
@Controller('admin/reports-analytics/analytics')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: ReportsAnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics del dashboard',
    description:
      'Obtiene métricas y datos agregados para el dashboard principal',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics del dashboard obtenidos exitosamente',
    type: DashboardAnalyticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async getDashboardAnalytics(
    @Query() query: DashboardAnalyticsQueryDto,
  ): Promise<DashboardAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      countryId: query.countryId,
      stateId: query.stateId,
      cityId: query.cityId,
      groupBy: query.groupBy,
    };

    return this.analyticsService.getDashboardAnalytics(filters);
  }

  @Get('rides')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics de rides',
    description: 'Obtiene métricas detalladas de viajes y rendimiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics de rides obtenidos exitosamente',
    type: RideAnalyticsResponseDto,
  })
  async getRideAnalytics(
    @Query() query: RideAnalyticsQueryDto,
  ): Promise<RideAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      countryId: query.countryId,
      stateId: query.stateId,
      cityId: query.cityId,
      zoneId: query.zoneId,
      status: query.status,
      rideTierId: query.rideTierId,
      groupBy: query.groupBy,
    };

    return this.analyticsService.getRideAnalytics(filters);
  }

  @Get('financial')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics financieros',
    description: 'Obtiene métricas financieras y datos de ingresos',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics financieros obtenidos exitosamente',
    type: FinancialAnalyticsResponseDto,
  })
  async getFinancialAnalytics(
    @Query() query: FinancialAnalyticsQueryDto,
  ): Promise<FinancialAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      countryId: query.countryId,
      stateId: query.stateId,
      cityId: query.cityId,
      groupBy: query.groupBy,
      includeStripeFees: query.includeStripeFees ?? true,
      includeTaxes: query.includeTaxes ?? true,
    };

    return this.analyticsService.getFinancialAnalytics(filters);
  }

  @Get('users')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics de usuarios',
    description: 'Obtiene métricas de usuarios y comportamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics de usuarios obtenidos exitosamente',
    type: UserAnalyticsResponseDto,
  })
  async getUserAnalytics(
    @Query() query: UserAnalyticsQueryDto,
  ): Promise<UserAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      countryId: query.countryId,
      stateId: query.stateId,
      cityId: query.cityId,
      userType: query.userType,
      segment: query.segment,
    };

    return this.analyticsService.getUserAnalytics(filters);
  }

  @Get('drivers')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics de conductores',
    description: 'Obtiene métricas de conductores y rendimiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics de conductores obtenidos exitosamente',
    type: DriverAnalyticsResponseDto,
  })
  async getDriverAnalytics(
    @Query() query: DriverAnalyticsQueryDto,
  ): Promise<DriverAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      countryId: query.countryId,
      stateId: query.stateId,
      cityId: query.cityId,
      status: query.status,
      performance: query.performance,
    };

    return this.analyticsService.getDriverAnalytics(filters);
  }

  @Get('geography')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener analytics geográficos',
    description:
      'Obtiene métricas de cobertura geográfica y rendimiento por zona',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics geográficos obtenidos exitosamente',
    type: GeographyAnalyticsResponseDto,
  })
  async getGeographyAnalytics(
    @Query() query: GeographyAnalyticsQueryDto,
  ): Promise<GeographyAnalyticsResponseDto> {
    const filters = {
      dateRange: query.dateRange,
      countryId: query.countryId,
      stateId: query.stateId,
      metric: query.metric,
    };

    return this.analyticsService.getGeographyAnalytics(filters);
  }
}
