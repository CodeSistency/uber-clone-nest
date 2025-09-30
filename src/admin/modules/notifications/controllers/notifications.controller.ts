import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { NotificationsService } from '../services/notifications.service';
import {
  GetNotificationsQueryDto,
  SendNotificationDto,
  BroadcastNotificationDto,
  CreateNotificationTemplateDto,
  NotificationListResponseDto,
  SendNotificationResponseDto,
  NotificationTemplatesResponseDto,
  NotificationStatsDto,
  NotificationTemplateDto,
} from '../dtos/notifications.dto';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(AdminPermission.NOTIFICATIONS_READ)
  @ApiOperation({
    summary: 'Listar notificaciones con filtros',
    description:
      'Obtiene una lista paginada de notificaciones con filtros avanzados para administración',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones obtenida exitosamente',
    type: NotificationListResponseDto,
  })
  async getNotifications(
    @Query() query: GetNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const filters = {
      type: query.type,
      status: query.status,
      userId: query.userId,
      channel: query.channel,
      isRead: query.isRead,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    return this.notificationsService.getNotifications(
      filters,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar notificación personalizada',
    description:
      'Envía una notificación personalizada a usuarios o drivers específicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación enviada exitosamente',
    type: SendNotificationResponseDto,
  })
  async sendNotification(
    @Body() sendDto: SendNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    const notificationData = {
      ...sendDto,
      scheduledFor: sendDto.scheduledFor
        ? new Date(sendDto.scheduledFor)
        : undefined,
    };

    return this.notificationsService.sendNotification(notificationData);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar notificación broadcast',
    description:
      'Envía una notificación a un segmento amplio de usuarios o drivers',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación broadcast enviada exitosamente',
    type: SendNotificationResponseDto,
  })
  async broadcastNotification(
    @Body() broadcastDto: BroadcastNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    return this.notificationsService.broadcastNotification(broadcastDto);
  }

  @Get('templates')
  @RequirePermissions(AdminPermission.NOTIFICATIONS_READ)
  @ApiOperation({
    summary: 'Obtener plantillas de notificación',
    description: 'Obtiene la lista de plantillas de notificación disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantillas obtenidas exitosamente',
    type: NotificationTemplatesResponseDto,
  })
  async getNotificationTemplates(): Promise<NotificationTemplatesResponseDto> {
    const templates =
      await this.notificationsService.getNotificationTemplates();
    return { templates };
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Crear plantilla de notificación',
    description: 'Crea una nueva plantilla de notificación reutilizable',
  })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada exitosamente',
    type: NotificationTemplateDto,
  })
  async createNotificationTemplate(
    @Body() templateDto: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplateDto> {
    return this.notificationsService.createNotificationTemplate(templateDto);
  }

  @Get('stats')
  @RequirePermissions(AdminPermission.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Obtener estadísticas de notificaciones',
    description:
      'Obtiene métricas y estadísticas de rendimiento del sistema de notificaciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: NotificationStatsDto,
  })
  async getNotificationStats(
    @Query() query: GetNotificationsQueryDto,
  ): Promise<NotificationStatsDto> {
    const filters = {
      type: query.type,
      status: query.status,
      userId: query.userId,
      channel: query.channel,
      isRead: query.isRead,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    return this.notificationsService.getNotificationStats(filters);
  }

  @Get('user/:userId')
  @RequirePermissions(AdminPermission.NOTIFICATIONS_READ)
  @ApiOperation({
    summary: 'Obtener notificaciones de usuario',
    description:
      'Obtiene las notificaciones de un usuario específico (para soporte)',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones del usuario obtenidas exitosamente',
  })
  async getUserNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getUserNotifications(
      userId,
      page || 1,
      limit || 20,
    );
  }

  @Put(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description:
      'Marca una notificación específica como leída (útil para soporte)',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'ID de la notificación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída',
  })
  async markNotificationAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.notificationsService.markNotificationAsRead(
      notificationId,
      userId,
    );
  }

  @Delete(':notificationId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Eliminar notificación',
    description:
      'Elimina una notificación específica (útil para soporte o moderación)',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'ID de la notificación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación eliminada exitosamente',
  })
  async deleteNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.notificationsService.deleteNotification(notificationId, userId);
  }

  // Quick actions for common notifications
  @Post('quick/welcome')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar notificación de bienvenida',
    description:
      'Envía una notificación de bienvenida rápida a nuevos usuarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación de bienvenida enviada',
  })
  async sendWelcomeNotification(
    @Body() body: { userIds?: number[] },
  ): Promise<SendNotificationResponseDto> {
    return this.notificationsService.sendNotification({
      type: 'welcome',
      title: 'Welcome to Uber Clone!',
      message:
        'Welcome! Start your first ride and get 20% off with code WELCOME20.',
      data: { promoCode: 'WELCOME20', discount: 20 },
      userIds: body.userIds,
      channels: ['push', 'email'],
    });
  }

  @Post('quick/maintenance')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar notificación de mantenimiento',
    description: 'Envía una notificación de mantenimiento del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación de mantenimiento enviada',
  })
  async sendMaintenanceNotification(
    @Body() body: { scheduledTime?: string },
  ): Promise<SendNotificationResponseDto> {
    const scheduledTime = body.scheduledTime || 'in 2 hours';

    return this.notificationsService.broadcastNotification({
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for ${scheduledTime}. Service may be temporarily unavailable.`,
      data: { maintenanceTime: scheduledTime },
      targetAudience: 'all_users',
      channels: ['push', 'email'],
    });
  }

  @Post('quick/promotion')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar promoción especial',
    description: 'Envía una promoción especial a usuarios activos',
  })
  @ApiResponse({
    status: 200,
    description: 'Promoción enviada exitosamente',
  })
  async sendPromotionNotification(
    @Body() body: { discount?: number; code?: string },
  ): Promise<SendNotificationResponseDto> {
    const discount = body.discount || 15;
    const code = body.code || `PROMO${Date.now().toString().slice(-4)}`;

    return this.notificationsService.broadcastNotification({
      type: 'promotion',
      title: 'Special Promotion!',
      message: `Get ${discount}% off your next ride with code ${code}. Limited time offer!`,
      data: { promoCode: code, discount },
      targetAudience: 'active_users',
      channels: ['push', 'email'],
    });
  }

  @Post('quick/driver-alert')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.NOTIFICATIONS_SEND)
  @ApiOperation({
    summary: 'Enviar alerta a drivers',
    description: 'Envía una alerta importante a todos los drivers activos',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerta enviada a drivers',
  })
  async sendDriverAlert(
    @Body() body: { message: string; urgent?: boolean },
  ): Promise<SendNotificationResponseDto> {
    return this.notificationsService.broadcastNotification({
      type: 'driver_alert',
      title: body.urgent ? 'URGENT: Driver Alert' : 'Driver Alert',
      message: body.message,
      data: { urgent: body.urgent || false },
      targetAudience: 'active_drivers',
      channels: ['push', 'sms'],
    });
  }
}
