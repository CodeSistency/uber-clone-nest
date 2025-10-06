import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  NotificationType,
  NotificationChannel,
} from '../../notifications/interfaces/notification.interface';

export interface IssueReport {
  type: 'traffic_jam' | 'breakdown' | 'accident' | 'passenger_issue' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: {
    lat: number;
    lng: number;
  };
  estimatedDelay?: number; // minutos
  requiresCancellation?: boolean;
}

export interface ReportResponse {
  reportId: number;
  rideId: number;
  type: string;
  severity: string;
  status: 'reported' | 'acknowledged' | 'resolved';
  adminNotified: boolean;
  passengerNotified: boolean;
  requiresCancellation: boolean;
  createdAt: Date;
}

@Injectable()
export class DriverReportsService {
  private readonly logger = new Logger(DriverReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Reportar un problema durante un viaje
   */
  async reportIssue(
    rideId: number,
    driverId: number,
    report: IssueReport,
  ): Promise<ReportResponse> {
    this.logger.log(
      `🔔 Conductor ${driverId} reportando problema en viaje ${rideId}: ${report.type}`,
    );

    // Verificar que el viaje existe y pertenece al conductor
    const ride = await this.prisma.ride.findUnique({
      where: { rideId },
      include: { user: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new Error('Driver not authorized for this ride');
    }

    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      throw new Error('Cannot report issues on completed or cancelled rides');
    }

    // Crear registro del reporte
    const reportRecord = await this.prisma.driverReport.create({
      data: {
        rideId,
        driverId,
        reportType: report.type,
        description: report.description,
        severity: report.severity,
        locationLat: report.location?.lat,
        locationLng: report.location?.lng,
        estimatedDelay: report.estimatedDelay,
        requiresCancellation: report.requiresCancellation || false,
        status: 'reported',
        reportedAt: new Date(),
      },
    });

    // Notificar al administrador/soporte
    await this.notifyAdminAboutReport(reportRecord, ride);

    // Notificar al pasajero si el problema afecta el viaje
    if (report.severity === 'high' || report.requiresCancellation) {
      await this.notifyPassengerAboutReport(reportRecord, ride);
    }

    // Si requiere cancelación, marcar para procesamiento
    if (report.requiresCancellation) {
      this.logger.log(
        `⚠️ Reporte requiere cancelación automática para viaje ${rideId}`,
      );
      // Aquí podríamos disparar un proceso automático de cancelación
    }

    return {
      reportId: reportRecord.id,
      rideId,
      type: report.type,
      severity: report.severity,
      status: 'reported',
      adminNotified: true,
      passengerNotified:
        report.severity === 'high' || report.requiresCancellation || false,
      requiresCancellation: report.requiresCancellation || false,
      createdAt: reportRecord.reportedAt,
    };
  }

  /**
   * Obtener reportes de un conductor
   */
  async getDriverReports(driverId: number, limit: number = 20) {
    const reports = await this.prisma.driverReport.findMany({
      where: { driverId },
      include: {
        ride: {
          select: {
            rideId: true,
            status: true,
            originAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    });

    return reports.map((report) => ({
      reportId: report.id,
      rideId: report.rideId,
      type: report.reportType,
      description: report.description,
      severity: report.severity,
      status: report.status,
      requiresCancellation: report.requiresCancellation,
      estimatedDelay: report.estimatedDelay,
      reportedAt: report.reportedAt,
      resolvedAt: report.resolvedAt,
      ride: report.ride,
    }));
  }

  /**
   * Obtener reportes de un viaje específico
   */
  async getRideReports(rideId: number) {
    const reports = await this.prisma.driverReport.findMany({
      where: { rideId },
      orderBy: { reportedAt: 'desc' },
    });

    return reports;
  }

  /**
   * Actualizar estado de un reporte (para administradores)
   */
  async updateReportStatus(
    reportId: number,
    status: 'acknowledged' | 'resolved',
    notes?: string,
  ) {
    const report = await this.prisma.driverReport.findUnique({
      where: { id: reportId },
      include: { ride: { include: { user: true, driver: true } } },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    await this.prisma.driverReport.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
        adminNotes: notes,
      },
    });

    // Notificar al conductor sobre la resolución
    if (status === 'resolved' && report.ride?.driver) {
      await this.notifications.sendNotification({
        userId: report.driverId.toString(),
        type: NotificationType.DRIVER_MESSAGE,
        title: 'Reporte Resuelto',
        message: `Tu reporte sobre "${report.description}" ha sido resuelto.`,
        data: { reportId, rideId: report.rideId },
      });
    }

    return { success: true, status };
  }

  /**
   * Notificar al administrador sobre un reporte
   */
  private async notifyAdminAboutReport(report: any, ride: any) {
    // En un sistema real, esto enviaría notificación a administradores
    // Por ahora, solo loggeamos
    this.logger.warn(`🚨 REPORTE DE CONDUCTOR - Viaje ${ride.rideId}:
Tipo: ${report.reportType}
Severidad: ${report.severity}
Descripción: ${report.description}
Conductor: ${ride.driver?.firstName} ${ride.driver?.lastName}
Pasajero: ${ride.user?.name}
Requiere cancelación: ${report.requiresCancellation}`);

    // Aquí podríamos enviar email/SMS a administradores
    // await this.notifications.sendToAdmins({...});
  }

  /**
   * Notificar al pasajero sobre un reporte
   */
  private async notifyPassengerAboutReport(report: any, ride: any) {
    let title = '';
    let message = '';

    switch (report.reportType) {
      case 'traffic_jam':
        title = 'Retraso por Tráfico';
        message = `Tu conductor reporta tráfico intenso. Posible retraso de ${report.estimatedDelay || 'unos'} minutos.`;
        break;
      case 'breakdown':
        title = 'Problema con el Vehículo';
        message =
          'Tu conductor reporta un problema con el vehículo. Estamos coordinando una solución.';
        break;
      case 'accident':
        title = 'Incidente en Ruta';
        message =
          'Ha ocurrido un incidente en la ruta. Tu conductor está coordinando con las autoridades.';
        break;
      default:
        title = 'Actualización del Viaje';
        message = `Tu conductor reporta: ${report.description}`;
    }

    // Agregar información adicional si requiere cancelación
    if (report.requiresCancellation) {
      message +=
        ' El viaje podría necesitar cancelarse. Te mantendremos informado.';
    }

    await this.notifications.sendNotification({
      userId: ride.userId.toString(),
      type: this.getNotificationTypeForReport(report.reportType),
      title,
      message,
      data: {
        rideId: ride.rideId,
        reportType: report.reportType,
        severity: report.severity,
        estimatedDelay: report.estimatedDelay,
        requiresCancellation: report.requiresCancellation,
      },
      channels: [NotificationChannel.PUSH],
    });
  }

  /**
   * Obtener el tipo de notificación apropiado para un reporte
   */
  private getNotificationTypeForReport(reportType: string): NotificationType {
    switch (reportType) {
      case 'traffic_jam':
        return NotificationType.DRIVER_REPORT_TRAFFIC;
      case 'breakdown':
        return NotificationType.DRIVER_REPORT_BREAKDOWN;
      case 'accident':
        return NotificationType.DRIVER_REPORT_ACCIDENT;
      case 'passenger_issue':
        return NotificationType.DRIVER_REPORT_PASSENGER_ISSUE;
      default:
        return NotificationType.DRIVER_MESSAGE;
    }
  }
}
