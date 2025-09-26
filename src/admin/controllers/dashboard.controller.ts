import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { AdminPermission } from '../interfaces/admin.interface';

import { DashboardService } from '../services/dashboard.service';
import { DashboardResponseDto } from '../dto/dashboard.dto';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener métricas del dashboard',
    description:
      'Retorna métricas principales del sistema, KPIs y alertas activas para el panel de administración',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    type: DashboardResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: {
          type: 'string',
          example: 'Permisos insuficientes. Se requieren: analytics:read',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
      },
    },
  })
  async getDashboard(): Promise<DashboardResponseDto> {
    const [metrics, alerts] = await Promise.all([
      this.dashboardService.getDashboardMetrics(),
      this.dashboardService.getDashboardAlerts(),
    ]);

    return {
      metrics,
      alerts,
      timestamp: new Date(),
    };
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener solo métricas del dashboard',
    description: 'Retorna únicamente las métricas principales sin las alertas',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        metrics: { $ref: '#/components/schemas/DashboardMetricsDto' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getMetrics() {
    const metrics = await this.dashboardService.getDashboardMetrics();
    return {
      metrics,
      timestamp: new Date(),
    };
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener alertas del sistema',
    description: 'Retorna únicamente las alertas activas del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Alertas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        alerts: {
          type: 'array',
          items: { $ref: '#/components/schemas/DashboardAlertDto' },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getAlerts() {
    const alerts = await this.dashboardService.getDashboardAlerts();
    return {
      alerts,
      timestamp: new Date(),
    };
  }
}
