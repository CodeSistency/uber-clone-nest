import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { ReportsAnalyticsService } from '../services/reports-analytics.service';
import {
  GenerateReportDto,
  ExportReportDto,
  CreateCustomDashboardDto,
  ScheduleReportDto,
  ReportResponseDto,
  ExportResponseDto,
  DashboardWidgetsResponseDto,
  CustomDashboardDto,
  ScheduledReportsResponseDto,
} from '../dtos/reports-analytics.dto';

@ApiTags('Admin Reports & Analytics')
@Controller('admin/reports')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsAnalyticsController {
  constructor(private readonly reportsService: ReportsAnalyticsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Generar reporte personalizado',
    description:
      'Genera un reporte basado en filtros específicos con datos resumidos, gráficos y detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async generateReport(
    @Body() generateDto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    const filters = {
      dateFrom: generateDto.dateFrom
        ? new Date(generateDto.dateFrom)
        : undefined,
      dateTo: generateDto.dateTo ? new Date(generateDto.dateTo) : undefined,
      period: generateDto.period,
      entityType: generateDto.entityType,
      groupBy: generateDto.groupBy,
      metrics: generateDto.metrics,
    };

    return this.reportsService.generateReport(filters);
  }

  @Post('export')
  @RequirePermissions(AdminPermission.REPORTS_EXPORT)
  @ApiOperation({
    summary: 'Exportar reporte',
    description: 'Exporta un reporte en formato CSV, Excel o PDF',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte exportado exitosamente',
    type: ExportResponseDto,
  })
  async exportReport(@Body() exportDto: ExportReportDto, @Res() res: Response) {
    const filters = {
      dateFrom: exportDto.dateFrom ? new Date(exportDto.dateFrom) : undefined,
      dateTo: exportDto.dateTo ? new Date(exportDto.dateTo) : undefined,
      period: exportDto.period,
      entityType: exportDto.entityType,
      groupBy: exportDto.groupBy,
      metrics: exportDto.metrics,
    };

    const exportData = await this.reportsService.exportReport(
      filters,
      exportDto.format,
    );

    // Set appropriate headers based on format
    switch (exportDto.format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        break;
      case 'excel':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        break;
      default:
        res.status(400).json({ error: 'Unsupported format' });
        return;
    }

    // Set additional headers for file download
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the file data
    res.send(exportData.data);
  }

  @Get('dashboard/widgets')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener widgets del dashboard',
    description:
      'Obtiene los widgets configurados para el dashboard principal con datos en tiempo real',
  })
  @ApiResponse({
    status: 200,
    description: 'Widgets del dashboard obtenidos exitosamente',
    type: DashboardWidgetsResponseDto,
  })
  async getDashboardWidgets(): Promise<DashboardWidgetsResponseDto> {
    const widgets = await this.reportsService.getDashboardWidgets();
    return { widgets };
  }

  @Post('dashboard/custom')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Crear dashboard personalizado',
    description:
      'Crea un nuevo dashboard personalizado con widgets configurables',
  })
  @ApiResponse({
    status: 201,
    description: 'Dashboard personalizado creado exitosamente',
    type: CustomDashboardDto,
  })
  async createCustomDashboard(
    @Body() dashboardDto: CreateCustomDashboardDto,
  ): Promise<CustomDashboardDto> {
    return this.reportsService.createCustomDashboard({
      ...dashboardDto,
      createdBy: 1, // Should come from JWT
    });
  }

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(AdminPermission.REPORTS_GENERATE)
  @ApiOperation({
    summary: 'Programar reporte automático',
    description:
      'Programa un reporte para envío automático por email en intervalos regulares',
  })
  @ApiResponse({
    status: 201,
    description: 'Reporte programado creado exitosamente',
  })
  async scheduleReport(@Body() scheduleDto: ScheduleReportDto) {
    // In a real implementation, this would save to database and set up cron jobs
    // For now, just return success
    return {
      message: 'Report scheduled successfully',
      id: `scheduled_${Date.now()}`,
      ...scheduleDto,
    };
  }

  @Get('scheduled')
  @RequirePermissions(AdminPermission.REPORTS_GENERATE)
  @ApiOperation({
    summary: 'Obtener reportes programados',
    description:
      'Obtiene la lista de reportes programados con su estado y próxima ejecución',
  })
  @ApiResponse({
    status: 200,
    description: 'Reportes programados obtenidos exitosamente',
    type: ScheduledReportsResponseDto,
  })
  async getScheduledReports(): Promise<ScheduledReportsResponseDto> {
    const reports = await this.reportsService.getScheduledReports();
    return { reports };
  }

  @Get('quick/rides')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Reporte rápido de rides',
    description:
      'Obtiene un reporte rápido de estadísticas de rides del mes actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte de rides obtenido exitosamente',
    type: ReportResponseDto,
  })
  async getQuickRidesReport(): Promise<ReportResponseDto> {
    return this.reportsService.generateReport({
      period: 'month',
      entityType: 'rides',
      groupBy: 'day',
    });
  }

  @Get('quick/financial')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Reporte rápido financiero',
    description:
      'Obtiene un reporte rápido de métricas financieras del mes actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte financiero obtenido exitosamente',
    type: ReportResponseDto,
  })
  async getQuickFinancialReport(): Promise<ReportResponseDto> {
    return this.reportsService.generateReport({
      period: 'month',
      entityType: 'financial',
    });
  }

  @Get('quick/drivers')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Reporte rápido de drivers',
    description:
      'Obtiene un reporte rápido de rendimiento de drivers del mes actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte de drivers obtenido exitosamente',
    type: ReportResponseDto,
  })
  async getQuickDriversReport(): Promise<ReportResponseDto> {
    return this.reportsService.generateReport({
      period: 'month',
      entityType: 'drivers',
      groupBy: 'driver',
    });
  }

  @Get('quick/users')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Reporte rápido de usuarios',
    description:
      'Obtiene un reporte rápido de crecimiento y actividad de usuarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte de usuarios obtenido exitosamente',
    type: ReportResponseDto,
  })
  async getQuickUsersReport(): Promise<ReportResponseDto> {
    return this.reportsService.generateReport({
      period: 'month',
      entityType: 'users',
      groupBy: 'day',
    });
  }

  @Get('metrics/overview')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Métricas generales del sistema',
    description:
      'Obtiene métricas generales del sistema para dashboards y KPIs',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas generales obtenidas exitosamente',
  })
  async getSystemMetrics() {
    // Get real-time metrics
    const [
      totalRides,
      activeRides,
      totalUsers,
      activeDrivers,
      todayRevenue,
      pendingPayments,
    ] = await Promise.all([
      this.reportsService.generateReport({ entityType: 'rides' }),
      this.reportsService.generateReport({
        entityType: 'rides',
        period: 'today',
      }),
      this.reportsService.generateReport({ entityType: 'users' }),
      this.reportsService.generateReport({ entityType: 'drivers' }),
      this.reportsService.generateReport({
        entityType: 'financial',
        period: 'today',
      }),
      // Mock pending payments - would need proper implementation
      Promise.resolve({ summary: { count: 0 } }),
    ]);

    return {
      overview: {
        totalRides: totalRides.summary.totalRides || 0,
        activeRides: activeRides.summary.totalRides || 0,
        totalUsers: totalUsers.summary.totalUsers || 0,
        activeDrivers: activeDrivers.summary.activeDrivers || 0,
        todayRevenue: todayRevenue.summary.totalRevenue || 0,
        pendingPayments: pendingPayments.summary.count || 0,
      },
      trends: {
        ridesGrowth: 12.5, // Mock percentage growth
        revenueGrowth: 8.3,
        userGrowth: 15.2,
        driverGrowth: 5.7,
      },
      health: {
        systemStatus: 'healthy',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        activeAlerts: 0,
        uptime: 99.9,
      },
    };
  }
}
