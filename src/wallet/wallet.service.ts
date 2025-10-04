import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet, WalletTransaction } from '@prisma/client';
import { AddFundsDto } from './dto/add-funds.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';
import { BlockWalletDto } from './dto/block-wallet.dto';
import { UnblockWalletDto } from './dto/unblock-wallet.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { WalletValidationService } from './services/wallet-validation.service';
import { WalletAuditService } from './services/wallet-audit.service';
import { WalletNotificationService } from './services/wallet-notification.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private walletValidation: WalletValidationService,
    private walletAudit: WalletAuditService,
    private walletNotification: WalletNotificationService,
  ) {}

  async getUserWallet(
    userId: number,
  ): Promise<{ wallet: Wallet; transactions: WalletTransaction[] } | null> {
    this.logger.log(`🔍 Obteniendo wallet para usuario ${userId}`);

    // Find or create wallet for user
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
    });

    if (!wallet) {
      this.logger.log(`📝 Creando nueva wallet para usuario ${userId}`);
      wallet = await this.prisma.wallet.create({
        data: { userId: userId },
      });
    }

    // Get wallet transactions
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limitar a las últimas 50 transacciones
    });

    // Log access
    await this.walletAudit.logWalletAccess(userId, 'wallet_accessed');

    this.logger.log(`✅ Wallet obtenida: Usuario ${userId}, Balance: ${wallet.balance}`);
    return { wallet, transactions };
  }

  async getWalletBalance(userId: number): Promise<{
    balance: number;
    currency: string;
    lastUpdated: Date;
  }> {
    this.logger.log(`🔍 Obteniendo balance para usuario ${userId}`);

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    await this.walletAudit.logWalletAccess(userId, 'balance_checked');

    return {
      balance: Number(wallet.balance),
      currency: 'USD',
      lastUpdated: wallet.updatedAt,
    };
  }

  async getTransactionHistory(
    userId: number,
    options: {
      page: number;
      limit: number;
      type?: 'credit' | 'debit' | 'all';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    transactions: WalletTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.logger.log(`🔍 Obteniendo historial para usuario ${userId}, página ${options.page}`);

    const { page, limit, type, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Get wallet first
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    where.walletId = wallet.id;

    // Filter by type
    if (type && type !== 'all') {
      where.transactionType = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    await this.walletAudit.logWalletAccess(userId, 'transaction_history_accessed');

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addFunds(
    addFundsDto: AddFundsDto, 
    userId: number, 
    ipAddress?: string
  ): Promise<{
    success: boolean;
    wallet: Wallet;
    transaction: WalletTransaction;
  }> {
    const { amount, description, source, externalTransactionId } = addFundsDto;

    this.logger.log(`💰 Agregando fondos: Usuario ${userId}, Monto: ${amount}`);

    try {
      // Validate operation
      await this.walletValidation.validateAddFunds(userId, amount);

      // Process with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Find or create wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId },
          });
        }

        // Create transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            transactionType: 'credit',
            description,
            referenceType: source || 'manual',
            referenceId: externalTransactionId || `TXN-${Date.now()}`,
          },
        });

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        return { wallet: updatedWallet, transaction };
      });

      // Log audit
      await this.walletAudit.logTransaction(result.transaction, userId, ipAddress);

      // Send notification
      await this.walletNotification.notifyTransactionSuccess(
        userId,
        amount,
        Number(result.wallet.balance),
        result.transaction.id.toString(),
        description
      );

      this.logger.log(`✅ Fondos agregados exitosamente: Usuario ${userId}, Nuevo balance: ${result.wallet.balance}`);

      return {
        success: true,
        wallet: result.wallet,
        transaction: result.transaction,
      };
    } catch (error) {
      this.logger.error(`❌ Error agregando fondos: Usuario ${userId}, Error: ${error.message}`);
      throw error;
    }
  }

  async deductFunds(
    userId: number,
    amount: number,
    description: string,
    ipAddress?: string
  ): Promise<Wallet> {
    this.logger.log(`💸 Descontando fondos: Usuario ${userId}, Monto: ${amount}`);

    try {
      // Validate operation
      await this.walletValidation.validateDeductFunds(userId, amount);

      // Process with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException('Wallet no encontrada');
        }

        // Create transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount,
            transactionType: 'debit',
            description,
            referenceType: 'deduction',
            referenceId: `DED-${Date.now()}`,
          },
        });

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        // Log audit
        await this.walletAudit.logTransaction(transaction, userId, ipAddress);

        return updatedWallet;
      });

      this.logger.log(`✅ Fondos descontados exitosamente: Usuario ${userId}, Nuevo balance: ${result.balance}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error descontando fondos: Usuario ${userId}, Error: ${error.message}`);
      throw error;
    }
  }

  async transferFunds(
    dto: TransferFundsDto & { fromUserId: number },
    ipAddress?: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    fromBalance: number;
    toBalance: number;
    message: string;
  }> {
    const { fromUserId, toUserEmail, amount, description, referenceType } = dto;

    this.logger.log(`🔄 Transferencia: De ${fromUserId} a ${toUserEmail}, Monto: ${amount}`);

    try {
      // Find recipient user by email
      const toUser = await this.prisma.user.findUnique({
        where: { email: toUserEmail },
        select: { id: true, name: true, email: true, isActive: true }
      });

      if (!toUser) {
        throw new NotFoundException(`Usuario con email ${toUserEmail} no encontrado`);
      }

      if (!toUser.isActive) {
        throw new BadRequestException('Usuario destinatario inactivo');
      }

      const toUserId = toUser.id;

      // Validate transfer
      await this.walletValidation.validateTransfer(fromUserId, toUserId, amount);

      // Process transfer with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Get both wallets
        let fromWallet = await tx.wallet.findUnique({
          where: { userId: fromUserId },
        });

        let toWallet = await tx.wallet.findUnique({
          where: { userId: toUserId },
        });

        if (!fromWallet) {
          fromWallet = await tx.wallet.create({
            data: { userId: fromUserId },
          });
        }

        if (!toWallet) {
          toWallet = await tx.wallet.create({
            data: { userId: toUserId },
          });
        }

        // Create debit transaction
        const debitTransaction = await tx.walletTransaction.create({
          data: {
            walletId: fromWallet.id,
            amount: -amount,
            transactionType: 'debit',
            description: `Transferencia a usuario ${toUserId}: ${description}`,
            referenceType: referenceType || 'user_transfer',
            referenceId: `TRF-${Date.now()}`,
          },
        });

        // Create credit transaction
        const creditTransaction = await tx.walletTransaction.create({
          data: {
            walletId: toWallet.id,
            amount: amount,
            transactionType: 'credit',
            description: `Transferencia de usuario ${fromUserId}: ${description}`,
            referenceType: referenceType || 'user_transfer',
            referenceId: `TRF-${Date.now()}`,
          },
        });

        // Update balances
        const updatedFromWallet = await tx.wallet.update({
          where: { id: fromWallet.id },
          data: { balance: { decrement: amount } },
        });

        const updatedToWallet = await tx.wallet.update({
          where: { id: toWallet.id },
          data: { balance: { increment: amount } },
        });

        // Log audits
        await this.walletAudit.logTransaction(debitTransaction, fromUserId, ipAddress);
        await this.walletAudit.logTransaction(creditTransaction, toUserId, ipAddress);

        // Get sender user name for notifications
        const fromUser = await this.prisma.user.findUnique({ 
          where: { id: fromUserId }, 
          select: { name: true } 
        });

        const transactionId = `TRF-${Date.now()}`;

        // Send notifications
        await Promise.all([
          this.walletNotification.notifyTransferSent(
            fromUserId,
            amount,
            Number(updatedFromWallet.balance),
            toUser.name,
            transactionId
          ),
          this.walletNotification.notifyTransferReceived(
            toUserId,
            amount,
            Number(updatedToWallet.balance),
            fromUser?.name || 'Usuario',
            transactionId
          ),
        ]);

        return {
          fromBalance: Number(updatedFromWallet.balance),
          toBalance: Number(updatedToWallet.balance),
          transactionId,
        };
      });

      this.logger.log(`✅ Transferencia exitosa: De ${fromUserId} a ${toUserEmail}`);

      return {
        success: true,
        transactionId: result.transactionId,
        fromBalance: result.fromBalance,
        toBalance: result.toBalance,
        message: 'Transferencia exitosa',
      };
    } catch (error) {
      this.logger.error(`❌ Error en transferencia: De ${fromUserId} a ${toUserEmail}, Error: ${error.message}`);
      throw error;
    }
  }

  async getWalletStats(userId: number): Promise<{
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    averageTransaction: number;
    monthlyStats: Array<{
      month: string;
      credits: number;
      debits: number;
      net: number;
    }>;
  }> {
    this.logger.log(`📊 Obteniendo estadísticas para usuario ${userId}`);

    // Get wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    // Get all transactions
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const totalTransactions = transactions.length;
    const totalCredits = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDebits = Math.abs(transactions
      .filter(t => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Number(t.amount), 0));
    const averageTransaction = totalTransactions > 0 ? (totalCredits + totalDebits) / totalTransactions : 0;

    // Calculate monthly stats (last 12 months)
    interface MonthlyStat {
      month: string;
      credits: number;
      debits: number;
      net: number;
    }
    
    const monthlyStats: MonthlyStat[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      
      const monthTransactions = transactions.filter(t => 
        t.createdAt >= month && t.createdAt < nextMonth
      );
      
      const credits = monthTransactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const debits = Math.abs(monthTransactions
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Number(t.amount), 0));
      
      monthlyStats.push({
        month: month.toISOString().substring(0, 7), // YYYY-MM
        credits,
        debits,
        net: credits - debits,
      });
    }

    await this.walletAudit.logWalletAccess(userId, 'stats_accessed');

    return {
      totalTransactions,
      totalCredits,
      totalDebits,
      averageTransaction,
      monthlyStats,
    };
  }

  async getWalletLimits(userId: number): Promise<{
    dailyLimit: number;
    singleTransactionLimit: number;
    transferLimit: number;
    usedToday: number;
    remainingToday: number;
  }> {
    const limits = this.walletValidation.getLimits();
    const usedToday = await this.walletValidation['getDailyTransactionTotal'](userId);

    return {
      ...limits,
      usedToday,
      remainingToday: limits.dailyLimit - usedToday,
    };
  }

  async validateOperation(userId: number, operation: any): Promise<{
    valid: boolean;
    message: string;
    limits: any;
  }> {
    let toUserId = operation.toUserId;
    
    // If operation is transfer and toUserEmail is provided, resolve the user ID
    if (operation.operation === 'transfer' && operation.toUserEmail) {
      const toUser = await this.prisma.user.findUnique({
        where: { email: operation.toUserEmail },
        select: { id: true, isActive: true }
      });

      if (!toUser) {
        return {
          valid: false,
          message: `Usuario con email ${operation.toUserEmail} no encontrado`,
          limits: this.walletValidation.getLimits()
        };
      }

      if (!toUser.isActive) {
        return {
          valid: false,
          message: 'Usuario destinatario inactivo',
          limits: this.walletValidation.getLimits()
        };
      }

      toUserId = toUser.id;
    }

    return this.walletValidation.validateOperation(
      userId,
      operation.operation,
      operation.amount,
      toUserId
    );
  }

  /**
   * Procesar reembolso a wallet (usado para cancelaciones de viajes)
   */
  async processRefund(
    userId: number,
    amount: number,
    reason: string,
    referenceType:
      | 'ride_cancellation'
      | 'order_cancellation'
      | 'payment_refund',
    referenceId: string,
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    this.logger.log(`💸 Procesando reembolso: Usuario ${userId}, Monto: ${amount}, Razón: ${reason}`);

    // Find or create wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    // Process refund with transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create refund transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          transactionType: 'credit',
          description: `Reembolso: ${reason}`,
          referenceType,
          referenceId,
        },
      });

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    // Log audit
    await this.walletAudit.logTransaction(result.transaction, userId);

    // Send notification
    await this.walletNotification.notifyRefundProcessed(
      userId,
      amount,
      Number(result.wallet.balance),
      reason,
      result.transaction.id.toString()
    );

    this.logger.log(`✅ Reembolso procesado: Usuario ${userId}, Nuevo balance: ${result.wallet.balance}`);
    return result;
  }

  // Admin methods
  async blockWallet(dto: BlockWalletDto, ipAddress?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`🚫 Bloqueando wallet: Usuario ${dto.userId}, Admin: ${dto.adminId}`);

    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Update wallet status
      await this.prisma.wallet.update({
        where: { userId: dto.userId },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: dto.adminId,
          blockReason: dto.reason,
        },
      });

      // Log audit
      await this.walletAudit.logWalletBlock(
        dto.userId,
        dto.adminId,
        dto.reason,
        ipAddress
      );

      // Send notification
      await this.walletNotification.notifyWalletBlocked(
        dto.userId,
        dto.reason
      );

      this.logger.log(`✅ Wallet bloqueada: Usuario ${dto.userId}`);
      return {
        success: true,
        message: 'Wallet bloqueada exitosamente',
      };
    } catch (error) {
      this.logger.error(`❌ Error bloqueando wallet: ${error.message}`);
      throw error;
    }
  }

  async unblockWallet(dto: UnblockWalletDto, ipAddress?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`🔓 Desbloqueando wallet: Usuario ${dto.userId}, Admin: ${dto.adminId}`);

    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Update wallet status
      await this.prisma.wallet.update({
        where: { userId: dto.userId },
        data: {
          isBlocked: false,
          unblockedAt: new Date(),
          unblockedBy: dto.adminId,
          unblockReason: dto.reason,
        },
      });

      // Log audit
      await this.walletAudit.logWalletUnblock(
        dto.userId,
        dto.adminId,
        dto.reason,
        ipAddress
      );

      // Send notification
      await this.walletNotification.notifyWalletUnblocked(
        dto.userId,
        dto.reason
      );

      this.logger.log(`✅ Wallet desbloqueada: Usuario ${dto.userId}`);
      return {
        success: true,
        message: 'Wallet desbloqueada exitosamente',
      };
    } catch (error) {
      this.logger.error(`❌ Error desbloqueando wallet: ${error.message}`);
      throw error;
    }
  }

  async adjustBalance(dto: AdjustBalanceDto, ipAddress?: string): Promise<{
    success: boolean;
    wallet: Wallet;
    transaction: WalletTransaction;
  }> {
    this.logger.log(`⚖️ Ajustando balance: Usuario ${dto.userId}, Monto: ${dto.amount}, Admin: ${dto.adminId}`);

    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Process adjustment with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Get current wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId: dto.userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: dto.userId },
          });
        }

        const oldBalance = Number(wallet.balance);

        // Create adjustment transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: dto.amount,
            transactionType: dto.amount > 0 ? 'credit' : 'debit',
            description: `Ajuste administrativo: ${dto.description}`,
            referenceType: dto.adjustmentType,
            referenceId: `ADJ-${Date.now()}`,
          },
        });

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: dto.amount,
            },
          },
        });

        // Log audit
        await this.walletAudit.logBalanceAdjustment(
          dto.userId,
          dto.adminId,
          oldBalance,
          Number(updatedWallet.balance),
          dto.amount,
          dto.description,
          ipAddress
        );

        return { wallet: updatedWallet, transaction };
      });

      this.logger.log(`✅ Balance ajustado: Usuario ${dto.userId}, Nuevo balance: ${result.wallet.balance}`);
      return {
        success: true,
        wallet: result.wallet,
        transaction: result.transaction,
      };
    } catch (error) {
      this.logger.error(`❌ Error ajustando balance: ${error.message}`);
      throw error;
    }
  }
}
