import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletTransaction } from '@prisma/client';

@Injectable()
export class WalletAuditService {
  private readonly logger = new Logger(WalletAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logTransaction(
    transaction: WalletTransaction, 
    userId: number, 
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.walletAuditLog.create({
        data: {
          adminId: userId, // Usar userId como adminId para logs de usuario
          action: 'transaction_created',
          resource: 'wallet_transaction',
          resourceId: transaction.id.toString(),
          oldValue: undefined,
          newValue: {
            transactionId: transaction.id,
            amount: transaction.amount,
            type: transaction.transactionType,
            description: transaction.description,
            referenceType: transaction.referenceType,
            referenceId: transaction.referenceId,
            timestamp: transaction.createdAt,
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`📝 Log de transacción creado: TXN-${transaction.id} para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando log de transacción: ${error.message}`);
    }
  }

  async logWalletAccess(
    userId: number, 
    action: string, 
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    try {
      await this.prisma.walletAuditLog.create({
        data: {
          adminId: userId,
          action,
          resource: 'wallet',
          resourceId: userId.toString(),
          oldValue: undefined,
          newValue: {
            action,
            details: details || {},
            timestamp: new Date(),
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`📝 Log de acceso a wallet creado: ${action} para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando log de acceso: ${error.message}`);
    }
  }

  async logWalletBlock(
    userId: number,
    adminId: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.walletAuditLog.create({
        data: {
          adminId,
          action: 'wallet_blocked',
          resource: 'wallet',
          resourceId: userId.toString(),
          oldValue: { status: 'active' },
          newValue: { 
            status: 'blocked', 
            reason,
            blockedAt: new Date(),
            blockedBy: adminId
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`📝 Log de bloqueo de wallet creado: Usuario ${userId} bloqueado por admin ${adminId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando log de bloqueo: ${error.message}`);
    }
  }

  async logWalletUnblock(
    userId: number,
    adminId: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.walletAuditLog.create({
        data: {
          adminId,
          action: 'wallet_unblocked',
          resource: 'wallet',
          resourceId: userId.toString(),
          oldValue: { status: 'blocked' },
          newValue: { 
            status: 'active', 
            reason,
            unblockedAt: new Date(),
            unblockedBy: adminId
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`📝 Log de desbloqueo de wallet creado: Usuario ${userId} desbloqueado por admin ${adminId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando log de desbloqueo: ${error.message}`);
    }
  }

  async logBalanceAdjustment(
    userId: number,
    adminId: number,
    oldBalance: number,
    newBalance: number,
    adjustment: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.walletAuditLog.create({
        data: {
          adminId,
          action: 'balance_adjusted',
          resource: 'wallet',
          resourceId: userId.toString(),
          oldValue: { balance: oldBalance },
          newValue: { 
            balance: newBalance,
            adjustment,
            reason,
            adjustedAt: new Date(),
            adjustedBy: adminId
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`📝 Log de ajuste de balance creado: Usuario ${userId}, Ajuste: ${adjustment} por admin ${adminId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando log de ajuste: ${error.message}`);
    }
  }

  async getAuditHistory(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    logs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.walletAuditLog.findMany({
        where: {
          OR: [
            { adminId: userId }, // Logs del usuario
            { resourceId: userId.toString() }, // Logs sobre el usuario
          ],
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          oldValue: true,
          newValue: true,
          ipAddress: true,
          timestamp: true,
        },
      }),
      this.prisma.walletAuditLog.count({
        where: {
          OR: [
            { adminId: userId },
            { resourceId: userId.toString() },
          ],
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
