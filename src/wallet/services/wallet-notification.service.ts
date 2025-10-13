import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface WalletNotificationData {
  userId: number;
  type:
    | 'transaction_success'
    | 'transaction_failed'
    | 'wallet_blocked'
    | 'wallet_unblocked'
    | 'balance_low'
    | 'transfer_received'
    | 'transfer_sent'
    | 'refund_processed';
  amount?: number;
  balance?: number;
  transactionId?: string;
  description?: string;
  recipientName?: string;
  senderName?: string;
  reason?: string;
  metadata?: any;
}

@Injectable()
export class WalletNotificationService {
  private readonly logger = new Logger(WalletNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendWalletNotification(data: WalletNotificationData): Promise<void> {
    try {
      this.logger.log(
        `📱 Enviando notificación de wallet: ${data.type} para usuario ${data.userId}`,
      );

      // Get user preferences
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          notificationPreferences: true,
          pushTokens: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `⚠️ Usuario ${data.userId} no encontrado para notificación`,
        );
        return;
      }

      // Check if user wants wallet notifications
      const prefs = user.notificationPreferences;
      if (prefs && !prefs.emailEnabled) {
        this.logger.log(
          `📵 Usuario ${data.userId} tiene notificaciones de wallet deshabilitadas`,
        );
        return;
      }

      // Create notification content
      const notification = this.createNotificationContent(data);

      // Send push notification
      if (user.pushTokens && user.pushTokens.length > 0) {
        await this.sendPushNotification(user.pushTokens, notification);
      }

      // Send email notification for important events
      if (this.isImportantEvent(data.type)) {
        await this.sendEmailNotification(user.email, notification, data);
      }

      // Store notification in database
      await this.storeNotification(data.userId, notification, data);

      this.logger.log(
        `✅ Notificación enviada exitosamente: ${data.type} para usuario ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error enviando notificación de wallet: ${error.message}`,
      );
    }
  }

  private createNotificationContent(data: WalletNotificationData): {
    title: string;
    body: string;
    data?: any;
  } {
    const {
      type,
      amount,
      balance,
      description,
      recipientName,
      senderName,
      reason,
    } = data;

    switch (type) {
      case 'transaction_success':
        return {
          title: '💰 Transacción Exitosa',
          body: `Se agregaron $${amount?.toFixed(2)} a tu wallet. Balance actual: $${balance?.toFixed(2)}`,
          data: {
            type: 'wallet_transaction',
            amount,
            balance,
            transactionId: data.transactionId,
          },
        };

      case 'transaction_failed':
        return {
          title: '❌ Transacción Fallida',
          body: `No se pudo procesar la transacción: ${description}`,
          data: {
            type: 'wallet_transaction_failed',
            amount,
            reason: description,
          },
        };

      case 'wallet_blocked':
        return {
          title: '🚫 Wallet Bloqueada',
          body: `Tu wallet ha sido bloqueada. Razón: ${reason}`,
          data: {
            type: 'wallet_blocked',
            reason,
          },
        };

      case 'wallet_unblocked':
        return {
          title: '✅ Wallet Desbloqueada',
          body: `Tu wallet ha sido desbloqueada y está disponible nuevamente.`,
          data: {
            type: 'wallet_unblocked',
          },
        };

      case 'balance_low':
        return {
          title: '⚠️ Balance Bajo',
          body: `Tu balance actual es $${balance?.toFixed(2)}. Considera agregar fondos.`,
          data: {
            type: 'balance_low',
            balance,
          },
        };

      case 'transfer_received':
        return {
          title: '💸 Transferencia Recibida',
          body: `${senderName} te envió $${amount?.toFixed(2)}. Balance actual: $${balance?.toFixed(2)}`,
          data: {
            type: 'transfer_received',
            amount,
            balance,
            senderName,
            transactionId: data.transactionId,
          },
        };

      case 'transfer_sent':
        return {
          title: '📤 Transferencia Enviada',
          body: `Enviaste $${amount?.toFixed(2)} a ${recipientName}. Balance actual: $${balance?.toFixed(2)}`,
          data: {
            type: 'transfer_sent',
            amount,
            balance,
            recipientName,
            transactionId: data.transactionId,
          },
        };

      case 'refund_processed':
        return {
          title: '🔄 Reembolso Procesado',
          body: `Se procesó un reembolso de $${amount?.toFixed(2)}. Balance actual: $${balance?.toFixed(2)}`,
          data: {
            type: 'refund_processed',
            amount,
            balance,
            transactionId: data.transactionId,
            reason: description,
          },
        };

      default:
        return {
          title: '📱 Notificación de Wallet',
          body: description || 'Nueva actividad en tu wallet',
          data: {
            type: 'wallet_general',
          },
        };
    }
  }

  private async sendPushNotification(
    pushTokens: any[],
    notification: any,
  ): Promise<void> {
    try {
      for (const token of pushTokens) {
        await this.notificationsService.sendNotification({
          userId: '0',
          type: 'push' as any,
          title: notification.title,
          message: notification.body,
          data: notification.data,
        });
      }
    } catch (error) {
      this.logger.error(
        `❌ Error enviando push notification: ${error.message}`,
      );
    }
  }

  private async sendEmailNotification(
    email: string,
    notification: any,
    data: WalletNotificationData,
  ): Promise<void> {
    try {
      const emailContent = this.createEmailContent(notification, data);

      await this.notificationsService.sendNotification({
        userId: '0',
        type: 'email' as any,
        title: notification.title,
        message: emailContent.content,
        data: emailContent,
      });
    } catch (error) {
      this.logger.error(
        `❌ Error enviando email notification: ${error.message}`,
      );
    }
  }

  private createEmailContent(
    notification: any,
    data: WalletNotificationData,
  ): any {
    return {
      title: notification.title,
      body: notification.body,
      amount: data.amount,
      balance: data.balance,
      transactionId: data.transactionId,
      timestamp: new Date().toLocaleString('es-ES'),
      type: data.type,
      metadata: data.metadata,
    };
  }

  private async storeNotification(
    userId: number,
    notification: any,
    data: WalletNotificationData,
  ): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.body,
          type: 'wallet',
          data: {
            ...notification.data,
            originalData: data,
          },
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error(`❌ Error almacenando notificación: ${error.message}`);
    }
  }

  private isImportantEvent(type: string): boolean {
    const importantEvents = [
      'wallet_blocked',
      'wallet_unblocked',
      'transaction_failed',
      'balance_low',
    ];
    return importantEvents.includes(type);
  }

  // Helper methods for specific notification types
  async notifyTransactionSuccess(
    userId: number,
    amount: number,
    balance: number,
    transactionId: string,
    description?: string,
  ): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'transaction_success',
      amount,
      balance,
      transactionId,
      description,
    });
  }

  async notifyTransactionFailed(
    userId: number,
    amount: number,
    description: string,
  ): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'transaction_failed',
      amount,
      description,
    });
  }

  async notifyWalletBlocked(userId: number, reason: string): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'wallet_blocked',
      reason,
    });
  }

  async notifyWalletUnblocked(userId: number, reason: string): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'wallet_unblocked',
      reason,
    });
  }

  async notifyBalanceLow(userId: number, balance: number): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'balance_low',
      balance,
    });
  }

  async notifyTransferReceived(
    userId: number,
    amount: number,
    balance: number,
    senderName: string,
    transactionId: string,
  ): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'transfer_received',
      amount,
      balance,
      senderName,
      transactionId,
    });
  }

  async notifyTransferSent(
    userId: number,
    amount: number,
    balance: number,
    recipientName: string,
    transactionId: string,
  ): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'transfer_sent',
      amount,
      balance,
      recipientName,
      transactionId,
    });
  }

  async notifyRefundProcessed(
    userId: number,
    amount: number,
    balance: number,
    reason: string,
    transactionId: string,
  ): Promise<void> {
    await this.sendWalletNotification({
      userId,
      type: 'refund_processed',
      amount,
      balance,
      description: reason,
      transactionId,
    });
  }
}
