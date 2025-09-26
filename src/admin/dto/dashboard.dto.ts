import { ApiProperty } from '@nestjs/swagger';
import {
  DashboardMetrics,
  DashboardAlert,
} from '../services/dashboard.service';

export class DashboardMetricsDto implements DashboardMetrics {
  @ApiProperty({
    description: 'Número de rides activos actualmente',
    example: 15,
  })
  activeRides: number;

  @ApiProperty({
    description: 'Rides completados hoy',
    example: 245,
  })
  completedRidesToday: number;

  @ApiProperty({
    description: 'Rides cancelados hoy',
    example: 12,
  })
  cancelledRidesToday: number;

  @ApiProperty({
    description: 'Total de rides esta semana',
    example: 1847,
  })
  totalRidesThisWeek: number;

  @ApiProperty({
    description: 'Revenue generado hoy',
    example: 1250.5,
  })
  revenueToday: number;

  @ApiProperty({
    description: 'Revenue generado esta semana',
    example: 8750.25,
  })
  revenueThisWeek: number;

  @ApiProperty({
    description: 'Tarifa promedio por ride',
    example: 18.75,
  })
  averageFare: number;

  @ApiProperty({
    description: 'Total de transacciones hoy',
    example: 245,
  })
  totalTransactions: number;

  @ApiProperty({
    description: 'Drivers conectados y disponibles',
    example: 28,
  })
  onlineDrivers: number;

  @ApiProperty({
    description: 'Drivers ocupados en rides',
    example: 15,
  })
  busyDrivers: number;

  @ApiProperty({
    description: 'Drivers disponibles para asignación',
    example: 13,
  })
  availableDrivers: number;

  @ApiProperty({
    description: 'Rating promedio de drivers',
    example: 4.7,
  })
  averageDriverRating: number;

  @ApiProperty({
    description: 'Usuarios activos hoy',
    example: 156,
  })
  activeUsersToday: number;

  @ApiProperty({
    description: 'Nuevos usuarios registrados esta semana',
    example: 89,
  })
  newUsersThisWeek: number;

  @ApiProperty({
    description: 'Total de usuarios registrados',
    example: 15420,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Rating promedio de usuarios',
    example: 4.2,
  })
  averageUserRating: number;

  @ApiProperty({
    description: 'Estado general del sistema',
    enum: ['healthy', 'warning', 'critical'],
    example: 'healthy',
  })
  systemStatus: 'healthy' | 'warning' | 'critical';

  @ApiProperty({
    description: 'Última actualización de métricas',
    example: '2024-01-15T10:30:00Z',
  })
  lastUpdated: Date;
}

export class DashboardAlertDto implements DashboardAlert {
  @ApiProperty({
    description: 'ID único de la alerta',
    example: 'low_driver_availability',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo de alerta',
    enum: ['performance', 'financial', 'technical'],
    example: 'performance',
  })
  type: 'performance' | 'financial' | 'technical';

  @ApiProperty({
    description: 'Severidad de la alerta',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'Título de la alerta',
    example: 'Baja Disponibilidad de Drivers',
  })
  title: string;

  @ApiProperty({
    description: 'Mensaje descriptivo de la alerta',
    example:
      'Solo 3 drivers están online. Se recomienda aumentar la capacidad.',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp de la alerta',
    example: '2024-01-15T10:25:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Si la alerta ha sido reconocida',
    example: false,
  })
  acknowledged: boolean;
}

export class DashboardResponseDto {
  @ApiProperty({
    description: 'Métricas principales del dashboard',
    type: DashboardMetricsDto,
  })
  metrics: DashboardMetricsDto;

  @ApiProperty({
    description: 'Lista de alertas activas del sistema',
    type: [DashboardAlertDto],
  })
  alerts: DashboardAlertDto[];

  @ApiProperty({
    description: 'Timestamp de la respuesta',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: Date;
}
