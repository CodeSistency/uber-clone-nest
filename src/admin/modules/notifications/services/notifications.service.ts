import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface NotificationFilters {
  type?: string[];
  status?: string[];
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  channel?: 'push' | 'email' | 'sms';
  isRead?: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'push' | 'email' | 'sms';
  subject?: string;
  title?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendNotificationDto {
  type: string;
  title?: string;
  message: string;
  data?: any;
  userIds?: number[];
  driverIds?: number[];
  broadcast?: boolean;
  channels?: ('push' | 'email' | 'sms')[];
  scheduledFor?: Date;
}

export interface BroadcastNotificationDto {
  type: string;
  title?: string;
  message: string;
  data?: any;
  targetAudience:
    | 'all_users'
    | 'all_drivers'
    | 'active_users'
    | 'active_drivers'
    | 'custom';
  channels: ('push' | 'email' | 'sms')[];
  userIds?: number[];
  driverIds?: number[];
  filters?: {
    minRides?: number;
    maxRides?: number;
    verificationStatus?: string[];
    lastActiveDays?: number;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async getNotifications(
    filters: NotificationFilters,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.status) {
      if (filters.status.includes('sent')) {
        where.OR = [{ pushSent: true }, { emailSent: true }, { smsSent: true }];
      }
      if (filters.status.includes('pending')) {
        where.OR = [
          { pushSent: false },
          { emailSent: false },
          { smsSent: false },
        ];
      }
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.channel) {
      switch (filters.channel) {
        case 'push':
          where.pushSent = true;
          break;
        case 'email':
          where.emailSent = true;
          break;
        case 'sms':
          where.smsSent = true;
          break;
      }
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const total = await this.prisma.notification.count({ where });

    const notifications = await this.prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        user: n.user || undefined,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async sendNotification(sendDto: SendNotificationDto): Promise<any> {
    const { userIds = [], driverIds = [], broadcast = false } = sendDto;

    // Get recipients
    let recipients: any[] = [];

    if (broadcast) {
      // Get all active users and drivers
      const [users, drivers] = await Promise.all([
        this.prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, email: true, phone: true },
        }),
        this.prisma.driver.findMany({
          where: { status: { in: ['online', 'busy'] } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        }),
      ]);

      recipients = [
        ...users.map((u) => ({ type: 'user', ...u })),
        ...drivers.map((d) => ({
          type: 'driver',
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
        })),
      ];
    } else {
      // Get specific users and drivers
      if (userIds.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { id: { in: userIds }, isActive: true },
          select: { id: true, name: true, email: true, phone: true },
        });
        recipients.push(...users.map((u) => ({ type: 'user', ...u })));
      }

      if (driverIds.length > 0) {
        const drivers = await this.prisma.driver.findMany({
          where: { id: { in: driverIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        });
        recipients.push(...drivers.map((d) => ({ type: 'driver', ...d })));
      }
    }

    const results: {
      totalRecipients: number;
      pushSent: number;
      emailSent: number;
      smsSent: number;
      errors: { recipient: string; channel?: string; error: string }[];
    } = {
      totalRecipients: recipients.length,
      pushSent: 0,
      emailSent: 0,
      smsSent: 0,
      errors: [],
    };

    // Send notifications via each channel
    for (const recipient of recipients) {
      try {
        // Create notification record
        const notification = await this.prisma.notification.create({
          data: {
            userId: recipient.type === 'user' ? recipient.id : null,
            type: sendDto.type,
            title: sendDto.title || sendDto.type,
            message: sendDto.message,
            data: sendDto.data,
          },
        });

        // Send via specified channels
        const channels = sendDto.channels || ['push'];

        for (const channel of channels) {
          try {
            switch (channel) {
              case 'push':
                await this.sendPushNotification(recipient, sendDto);
                await this.prisma.notification.update({
                  where: { id: notification.id },
                  data: { pushSent: true, pushSentAt: new Date() },
                });
                results.pushSent++;
                break;

              case 'email':
                if (recipient.email) {
                  await this.sendEmailNotification(recipient, sendDto);
                  await this.prisma.notification.update({
                    where: { id: notification.id },
                    data: { emailSent: true, emailSentAt: new Date() },
                  });
                  results.emailSent++;
                }
                break;

              case 'sms':
                if (recipient.phone) {
                  await this.sendSmsNotification(recipient, sendDto);
                  await this.prisma.notification.update({
                    where: { id: notification.id },
                    data: { smsSent: true, smsSentAt: new Date() },
                  });
                  results.smsSent++;
                }
                break;
            }
          } catch (channelError) {
            this.logger.error(
              `Failed to send ${channel} notification to ${recipient.email || recipient.phone}:`,
              channelError,
            );
            results.errors.push({
              recipient: recipient.email || recipient.phone,
              channel,
              error: channelError.message,
            });
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to process notification for recipient:`,
          error,
        );
        results.errors.push({
          recipient: recipient.email || recipient.phone,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Notification sent to ${results.totalRecipients} recipients: ${results.pushSent} push, ${results.emailSent} email, ${results.smsSent} SMS`,
    );

    return results;
  }

  async broadcastNotification(
    broadcastDto: BroadcastNotificationDto,
  ): Promise<any> {
    const { targetAudience, filters } = broadcastDto;

    // Build recipient query based on target audience
    const userWhere: any = { isActive: true };
    const driverWhere: any = {};

    switch (targetAudience) {
      case 'all_users':
        // Already set
        break;
      case 'all_drivers':
        // Already set for drivers
        break;
      case 'active_users':
        userWhere.lastLogin = {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        };
        break;
      case 'active_drivers':
        driverWhere.status = { in: ['online', 'busy'] };
        break;
      case 'custom':
        if (filters) {
          if (
            filters.minRides !== undefined ||
            filters.maxRides !== undefined
          ) {
            userWhere.totalRides = {};
            if (filters.minRides !== undefined) {
              userWhere.totalRides.gte = filters.minRides;
            }
            if (filters.maxRides !== undefined) {
              userWhere.totalRides.lte = filters.maxRides;
            }
          }

          if (
            filters.verificationStatus &&
            filters.verificationStatus.length > 0
          ) {
            driverWhere.verificationStatus = { in: filters.verificationStatus };
          }

          if (filters.lastActiveDays) {
            const cutoffDate = new Date(
              Date.now() - filters.lastActiveDays * 24 * 60 * 60 * 1000,
            );
            userWhere.lastLogin = { gte: cutoffDate };
            driverWhere.lastActive = { gte: cutoffDate };
          }
        }
        break;
    }

    // Get recipients
    const [users, drivers] = await Promise.all([
      targetAudience.includes('users')
        ? this.prisma.user.findMany({
            where: userWhere,
            select: { id: true, name: true, email: true, phone: true },
          })
        : [],
      targetAudience.includes('drivers')
        ? this.prisma.driver.findMany({
            where: driverWhere,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          })
        : [],
    ]);

    const userIds = users.map((u) => u.id);
    const driverIds = drivers.map((d) => d.id);

    // Send the notification
    return this.sendNotification({
      ...broadcastDto,
      userIds: userIds.length > 0 ? userIds : undefined,
      driverIds: driverIds.length > 0 ? driverIds : undefined,
      broadcast: true,
    });
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    // In a real implementation, this would fetch from database
    return [
      {
        id: 'ride_completed',
        name: 'Ride Completed',
        type: 'push',
        title: 'Ride Completed',
        body: 'Your ride has been completed successfully. Rate your driver!',
        variables: ['driver_name', 'ride_fare'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'driver_assigned',
        name: 'Driver Assigned',
        type: 'push',
        title: 'Driver Assigned',
        body: '{driver_name} is on the way to pick you up.',
        variables: ['driver_name', 'eta_minutes'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'payment_received',
        name: 'Payment Received',
        type: 'email',
        subject: 'Payment Confirmation',
        body: 'Your payment of ${amount} has been processed successfully.',
        variables: ['amount', 'ride_id'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'account_suspended',
        name: 'Account Suspended',
        type: 'email',
        subject: 'Account Suspended',
        body: 'Your account has been suspended due to: {reason}',
        variables: ['reason', 'appeal_link'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async createNotificationTemplate(
    template: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    // In a real implementation, this would save to database
    const newTemplate: NotificationTemplate = {
      id: `template_${Date.now()}`,
      name: template.name || 'New Template',
      type: template.type || 'push',
      body: template.body || '',
      variables: template.variables || [],
      isActive: template.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...template,
    };

    this.logger.log(`Created notification template: ${newTemplate.name}`);

    return newTemplate;
  }

  async getNotificationStats(filters: NotificationFilters) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [
      totalNotifications,
      pushSent,
      emailSent,
      smsSent,
      readNotifications,
    ] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, pushSent: true } }),
      this.prisma.notification.count({ where: { ...where, emailSent: true } }),
      this.prisma.notification.count({ where: { ...where, smsSent: true } }),
      this.prisma.notification.count({ where: { ...where, isRead: true } }),
    ]);

    const deliveryRate =
      totalNotifications > 0
        ? ((pushSent + emailSent + smsSent) / (totalNotifications * 3)) * 100
        : 0;
    const readRate =
      totalNotifications > 0
        ? (readNotifications / totalNotifications) * 100
        : 0;

    return {
      totalNotifications,
      deliveryStats: {
        push: pushSent,
        email: emailSent,
        sms: smsSent,
        total: pushSent + emailSent + smsSent,
      },
      engagementStats: {
        read: readNotifications,
        unread: totalNotifications - readNotifications,
        readRate: Math.round(readRate * 100) / 100,
      },
      overallStats: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        successRate:
          totalNotifications > 0
            ? ((pushSent + emailSent + smsSent) / totalNotifications) * 100
            : 0,
      },
    };
  }

  async markNotificationAsRead(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId,
      },
    });
  }

  // Private methods for sending notifications via different channels
  private async sendPushNotification(
    recipient: any,
    notification: SendNotificationDto,
  ): Promise<void> {
    // In a real implementation, this would integrate with Firebase/APNs
    this.logger.log(
      `Sending push notification to ${recipient.email || recipient.phone}: ${notification.title}`,
    );

    // Simulate API call to push service
    // await firebase.messaging().send({...});
  }

  private async sendEmailNotification(
    recipient: any,
    notification: SendNotificationDto,
  ): Promise<void> {
    // In a real implementation, this would integrate with SendGrid/Mailgun/etc
    this.logger.log(
      `Sending email notification to ${recipient.email}: ${notification.title}`,
    );

    // Simulate email sending
    // await sendgrid.send({...});
  }

  private async sendSmsNotification(
    recipient: any,
    notification: SendNotificationDto,
  ): Promise<void> {
    // In a real implementation, this would integrate with Twilio/etc
    this.logger.log(
      `Sending SMS notification to ${recipient.phone}: ${notification.message}`,
    );

    // Simulate SMS sending
    // await twilio.messages.create({...});
  }

  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const total = await this.prisma.notification.count({
      where: { userId },
    });

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
