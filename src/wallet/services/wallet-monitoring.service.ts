import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletNotificationService } from './wallet-notification.service';

@Injectable()
export class WalletMonitoringService {
  private readonly logger = new Logger(WalletMonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletNotification: WalletNotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDailyLimits(): Promise<void> {
    this.logger.log('🔍 Verificando límites diarios de wallets...');

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Find wallets that need daily limit reset
      const walletsToReset = await this.prisma.wallet.findMany({
        where: {
          dailyLimitResetAt: {
            lt: today,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Reset daily limits
      for (const wallet of walletsToReset) {
        await this.prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            dailyLimitUsed: 0,
            dailyLimitResetAt: now,
          },
        });

        this.logger.log(`🔄 Límite diario reseteado para wallet ${wallet.id} (usuario ${wallet.userId})`);
      }

      this.logger.log(`✅ Verificación de límites completada. ${walletsToReset.length} wallets reseteadas.`);
    } catch (error) {
      this.logger.error(`❌ Error verificando límites diarios: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkLowBalances(): Promise<void> {
    this.logger.log('🔍 Verificando balances bajos...');

    try {
      const lowBalanceThreshold = 10.0; // $10 threshold

      const lowBalanceWallets = await this.prisma.wallet.findMany({
        where: {
          balance: {
            lt: lowBalanceThreshold,
          },
          isBlocked: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              notificationPreferences: true,
            },
          },
        },
      });

      // Send notifications for low balances
      for (const wallet of lowBalanceWallets) {
        const prefs = wallet.user.notificationPreferences;
        if (prefs && prefs.emailEnabled) {
          await this.walletNotification.notifyBalanceLow(
            wallet.userId,
            Number(wallet.balance)
          );
        }
      }

      this.logger.log(`⚠️ ${lowBalanceWallets.length} wallets con balance bajo encontradas.`);
    } catch (error) {
      this.logger.error(`❌ Error verificando balances bajos: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailyReport(): Promise<void> {
    this.logger.log('📊 Generando reporte diario de wallets...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get daily statistics
      const stats = await this.getDailyStats(yesterday, today);

      // Log the report
      this.logger.log(`📈 Reporte diario de wallets (${yesterday.toISOString().split('T')[0]}):`);
      this.logger.log(`   💰 Total de transacciones: ${stats.totalTransactions}`);
      this.logger.log(`   📈 Total de créditos: $${stats.totalCredits.toFixed(2)}`);
      this.logger.log(`   📉 Total de débitos: $${stats.totalDebits.toFixed(2)}`);
      this.logger.log(`   🔄 Transferencias: ${stats.transfers}`);
      this.logger.log(`   🚫 Wallets bloqueadas: ${stats.blockedWallets}`);
      this.logger.log(`   ⚠️ Wallets con balance bajo: ${stats.lowBalanceWallets}`);

      // Store report in database (optional)
      await this.storeDailyReport(stats, yesterday);

    } catch (error) {
      this.logger.error(`❌ Error generando reporte diario: ${error.message}`);
    }
  }

  async checkSuspiciousActivity(userId: number): Promise<boolean> {
    this.logger.log(`🔍 Verificando actividad sospechosa para usuario ${userId}`);

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Check for high frequency transactions
      const recentTransactions = await this.prisma.walletTransaction.count({
        where: {
          wallet: { userId },
          createdAt: { gte: oneHourAgo },
        },
      });

      // Check for large amounts
      const largeTransactions = await this.prisma.walletTransaction.findMany({
        where: {
          wallet: { userId },
          createdAt: { gte: oneHourAgo },
          amount: { gt: 500 }, // $500 threshold
        },
      });

      // Check for multiple failed transactions
      const failedTransactions = await this.prisma.walletTransaction.count({
        where: {
          wallet: { userId },
          createdAt: { gte: oneHourAgo },
          status: 'FAILED' as any,
        },
      });

      const isSuspicious = 
        recentTransactions > 10 || // More than 10 transactions in 1 hour
        largeTransactions.length > 3 || // More than 3 large transactions
        failedTransactions > 5; // More than 5 failed transactions

      if (isSuspicious) {
        this.logger.warn(`⚠️ Actividad sospechosa detectada para usuario ${userId}`);
        await this.flagSuspiciousActivity(userId, {
          recentTransactions,
          largeTransactions: largeTransactions.length,
          failedTransactions,
        });
      }

      return isSuspicious;
    } catch (error) {
      this.logger.error(`❌ Error verificando actividad sospechosa: ${error.message}`);
      return false;
    }
  }

  async getWalletHealthScore(userId: number): Promise<{
    score: number;
    factors: string[];
    recommendations: string[];
  }> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
        include: {
          walletTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!wallet) {
        return {
          score: 0,
          factors: ['Wallet no encontrada'],
          recommendations: ['Crear wallet'],
        };
      }

      let score = 100;
      const factors: string[] = [];
      const recommendations: string[] = [];

      // Check balance
      const balance = Number(wallet.balance);
      if (balance < 10) {
        score -= 30;
        factors.push('Balance muy bajo');
        recommendations.push('Agregar fondos a la wallet');
      } else if (balance < 50) {
        score -= 10;
        factors.push('Balance bajo');
        recommendations.push('Considerar agregar más fondos');
      }

      // Check transaction frequency
      const recentTransactions = wallet.walletTransactions.filter(
        t => t.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentTransactions.length === 0) {
        score -= 20;
        factors.push('Sin actividad reciente');
        recommendations.push('Usar la wallet regularmente');
      }

      // Check failed transactions
      const failedTransactions = wallet.walletTransactions.filter(
        t => t.status === 'FAILED'
      );
      
      if (failedTransactions.length > 5) {
        score -= 25;
        factors.push('Muchas transacciones fallidas');
        recommendations.push('Verificar información de pago');
      }

      // Check if wallet is blocked
      if (wallet.isBlocked) {
        score = 0;
        factors.push('Wallet bloqueada');
        recommendations.push('Contactar soporte');
      }

      // Check daily limit usage
      const dailyUsage = Number(wallet.dailyLimitUsed);
      if (dailyUsage > 800) { // 80% of $1000 limit
        score -= 15;
        factors.push('Límite diario casi alcanzado');
        recommendations.push('Esperar hasta mañana para más transacciones');
      }

      return {
        score: Math.max(0, score),
        factors,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`❌ Error calculando health score: ${error.message}`);
      return {
        score: 0,
        factors: ['Error en cálculo'],
        recommendations: ['Contactar soporte'],
      };
    }
  }

  private async getDailyStats(startDate: Date, endDate: Date): Promise<{
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    transfers: number;
    blockedWallets: number;
    lowBalanceWallets: number;
  }> {
    const [
      totalTransactions,
      creditTransactions,
      debitTransactions,
      transferTransactions,
      blockedWallets,
      lowBalanceWallets,
    ] = await Promise.all([
      this.prisma.walletTransaction.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          transactionType: 'credit',
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          transactionType: 'debit',
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          referenceType: 'user_transfer',
        },
      }),
      this.prisma.wallet.count({
        where: {
          isBlocked: true,
          blockedAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.wallet.count({
        where: {
          balance: { lt: 10 },
          isBlocked: false,
        },
      }),
    ]);

    return {
      totalTransactions,
      totalCredits: Number(creditTransactions._sum.amount || 0),
      totalDebits: Math.abs(Number(debitTransactions._sum.amount || 0)),
      transfers: transferTransactions,
      blockedWallets,
      lowBalanceWallets,
    };
  }

  private async storeDailyReport(stats: any, date: Date): Promise<void> {
    try {
      // You can store this in a separate reports table if needed
      this.logger.log(`📊 Reporte almacenado para ${date.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.error(`❌ Error almacenando reporte: ${error.message}`);
    }
  }

  private async flagSuspiciousActivity(userId: number, metadata: any): Promise<void> {
    try {
      // Log suspicious activity
      await this.prisma.walletAuditLog.create({
        data: {
          adminId: userId, // Using userId as adminId for system logs
          action: 'suspicious_activity_detected',
          resource: 'wallet',
          resourceId: userId.toString(),
          newValue: {
            type: 'suspicious_activity',
            metadata,
            detectedAt: new Date(),
          },
          timestamp: new Date(),
        },
      });

      this.logger.warn(`🚨 Actividad sospechosa registrada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error registrando actividad sospechosa: ${error.message}`);
    }
  }

  async getGeneralStats(): Promise<{
    totalWallets: number;
    totalBalance: number;
    blockedWallets: number;
    lowBalanceWallets: number;
    dailyTransactions: number;
    monthlyTransactions: number;
    averageTransaction: number;
    topUsers: Array<{
      userId: number;
      name: string;
      balance: number;
      transactionCount: number;
    }>;
  }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalWallets,
        totalBalanceResult,
        blockedWallets,
        lowBalanceWallets,
        dailyTransactions,
        monthlyTransactions,
        averageTransactionResult,
        topUsers,
      ] = await Promise.all([
        this.prisma.wallet.count(),
        this.prisma.wallet.aggregate({
          _sum: { balance: true },
        }),
        this.prisma.wallet.count({
          where: { isBlocked: true },
        }),
        this.prisma.wallet.count({
          where: {
            balance: { lt: 10 },
            isBlocked: false,
          },
        }),
        this.prisma.walletTransaction.count({
          where: {
            createdAt: { gte: today },
          },
        }),
        this.prisma.walletTransaction.count({
          where: {
            createdAt: { gte: monthStart },
          },
        }),
        this.prisma.walletTransaction.aggregate({
          _avg: { amount: true },
        }),
        this.prisma.wallet.findMany({
          take: 10,
          orderBy: { balance: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { walletTransactions: true },
            },
          },
        }),
      ]);

      return {
        totalWallets,
        totalBalance: Number(totalBalanceResult._sum.balance || 0),
        blockedWallets,
        lowBalanceWallets,
        dailyTransactions,
        monthlyTransactions,
        averageTransaction: Number(averageTransactionResult._avg.amount || 0),
        topUsers: topUsers.map(wallet => ({
          userId: wallet.userId,
          name: wallet.user.name,
          balance: Number(wallet.balance),
          transactionCount: wallet._count.walletTransactions,
        })),
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas generales: ${error.message}`);
      throw error;
    }
  }

  async performHealthCheck(): Promise<{
    status: string;
    checks: Array<{
      name: string;
      status: string;
      message: string;
    }>;
    timestamp: Date;
  }> {
    interface HealthCheck {
      name: string;
      status: string;
      message: string;
    }
    
    const checks: HealthCheck[] = [];
    let overallStatus = 'healthy';

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: 'Database Connection',
        status: 'ok',
        message: 'Connected successfully',
      });
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'error',
        message: `Connection failed: ${error.message}`,
      });
      overallStatus = 'unhealthy';
    }

    try {
      // Check wallet service
      const walletCount = await this.prisma.wallet.count();
      checks.push({
        name: 'Wallet Service',
        status: 'ok',
        message: `${walletCount} wallets accessible`,
      });
    } catch (error) {
      checks.push({
        name: 'Wallet Service',
        status: 'error',
        message: `Service error: ${error.message}`,
      });
      overallStatus = 'unhealthy';
    }

    try {
      // Check transaction service
      const transactionCount = await this.prisma.walletTransaction.count();
      checks.push({
        name: 'Transaction Service',
        status: 'ok',
        message: `${transactionCount} transactions accessible`,
      });
    } catch (error) {
      checks.push({
        name: 'Transaction Service',
        status: 'error',
        message: `Service error: ${error.message}`,
      });
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
    };
  }

  async getSuspiciousActivityReport(limit: number = 20): Promise<{
    suspiciousUsers: Array<{
      userId: number;
      name: string;
      email: string;
      riskScore: number;
      reasons: string[];
      lastActivity: Date;
    }>;
    totalSuspicious: number;
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Get users with suspicious activity patterns
      const suspiciousUsers = await this.prisma.user.findMany({
        take: limit,
        where: {
          wallet: {
            walletTransactions: {
              some: {
                createdAt: { gte: oneHourAgo },
              },
            },
          },
        },
        include: {
          wallet: {
            include: {
              walletTransactions: {
                where: {
                  createdAt: { gte: oneHourAgo },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      const suspiciousUsersWithScores = suspiciousUsers.map(user => {
        const transactions = user.wallet?.walletTransactions || [];
        const reasons: string[] = [];
        let riskScore = 0;

        // High frequency transactions
        if (transactions.length > 10) {
          reasons.push('Alta frecuencia de transacciones');
          riskScore += 30;
        }

        // Large amounts
        const largeTransactions = transactions.filter(t => Math.abs(Number(t.amount)) > 500);
        if (largeTransactions.length > 3) {
          reasons.push('Múltiples transacciones de gran monto');
          riskScore += 25;
        }

        // Failed transactions
        const failedTransactions = transactions.filter(t => t.status === 'FAILED');
        if (failedTransactions.length > 5) {
          reasons.push('Múltiples transacciones fallidas');
          riskScore += 20;
        }

        // Rapid succession
        const rapidTransactions = transactions.filter((t, i) => {
          if (i === 0) return false;
          const prev = transactions[i - 1];
          return t.createdAt.getTime() - prev.createdAt.getTime() < 60000; // Less than 1 minute
        });
        if (rapidTransactions.length > 5) {
          reasons.push('Transacciones en rápida sucesión');
          riskScore += 15;
        }

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          riskScore: Math.min(100, riskScore),
          reasons,
          lastActivity: transactions[0]?.createdAt || user.updatedAt,
        };
      }).filter(user => user.riskScore > 50); // Only users with risk score > 50

      return {
        suspiciousUsers: suspiciousUsersWithScores,
        totalSuspicious: suspiciousUsersWithScores.length,
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo reporte de actividad sospechosa: ${error.message}`);
      throw error;
    }
  }
}
