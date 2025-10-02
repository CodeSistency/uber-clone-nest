import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/config.service';
import { WalletService } from '../../wallet/wallet.service';
import { NotificationManagerService } from '../../notifications/notification-manager.service';
import {
  Referral,
  ReferralReward as PrismaReferralReward,
  ReferralTransaction,
} from '@prisma/client';

@Injectable()
export class ReferralRewardsService {
  private readonly logger = new Logger(ReferralRewardsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
    private walletService: WalletService,
    private notificationManager: NotificationManagerService,
  ) {}

  /**
   * Calcula el monto de recompensa basado en el tier del referente
   */
  private calculateRewardAmount(tier: string, baseAmount: number): number {
    const config = this.configService.referral;

    switch (tier) {
      case 'BASIC':
        return baseAmount;
      case 'ADVANCED':
        return baseAmount * config.advancedMultiplier;
      case 'VIP':
        return baseAmount * config.vipMultiplier;
      default:
        return baseAmount;
    }
  }

  /**
   * Determina el tier actual de un usuario basado en sus referidos convertidos
   */
  async getUserCurrentTier(userId: number): Promise<string> {
    try {
      const convertedReferrals = await this.prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'converted',
        },
      });

      if (convertedReferrals >= 21) {
        return 'VIP';
      } else if (convertedReferrals >= 6) {
        return 'ADVANCED';
      } else {
        return 'BASIC';
      }
    } catch (error) {
      this.logger.error(
        `Error getting current tier for user ${userId}:`,
        error,
      );
      return 'BASIC';
    }
  }

  /**
   * Obtiene todas las configuraciones de recompensas activas
   */
  async getActiveRewardConfigurations(): Promise<PrismaReferralReward[]> {
    try {
      return await this.prisma.referralReward.findMany({
        where: { isActive: true },
        orderBy: [{ tier: 'asc' }, { minReferrals: 'asc' }],
      });
    } catch (error) {
      this.logger.error('Error getting active reward configurations:', error);
      throw error;
    }
  }

  /**
   * Calcula la recompensa para un referido específico
   */
  async calculateReferralReward(referralId: number): Promise<{
    referrerReward: number;
    refereeReward: number;
    tier: string;
    conditions: any;
  }> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
        include: { referrer: true },
      });

      if (!referral) {
        throw new BadRequestException('Referral not found');
      }

      // Obtener tier actual del referente
      const tier = await this.getUserCurrentTier(referral.referrerId);

      // Calcular recompensas base
      const baseReferrerReward = this.configService.referral.referrerBaseReward;
      const baseRefereeReward = this.configService.referral.refereeBaseReward;

      // Aplicar multiplicadores de tier
      const referrerReward = this.calculateRewardAmount(
        tier,
        baseReferrerReward,
      );
      const refereeReward = baseRefereeReward; // Referees always get base amount

      return {
        referrerReward,
        refereeReward,
        tier,
        conditions: {
          minRideValue: 15.0, // Configurable
          firstRideCompleted: true,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error calculating reward for referral ${referralId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Aplica recompensas cuando un referido se convierte
   */
  async applyReferralRewards(referralId: number): Promise<{
    referrerTransactionId?: string;
    refereeTransactionId?: string;
  }> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
        include: { referrer: true, referee: true },
      });

      if (!referral || referral.status !== 'converted') {
        throw new BadRequestException('Referral not converted or not found');
      }

      // Verificar si ya se aplicaron recompensas
      const existingTransactions =
        await this.prisma.referralTransaction.findMany({
          where: { referralId },
        });

      if (existingTransactions.length > 0) {
        this.logger.warn(`Rewards already applied for referral ${referralId}`);
        return {};
      }

      // Calcular recompensas
      const rewards = await this.calculateReferralReward(referralId);

      const result: {
        referrerTransactionId?: string;
        refereeTransactionId?: string;
      } = {};

      // Aplicar recompensa al referente
      if (rewards.referrerReward > 0) {
        try {
          const referrerTransaction =
            await this.prisma.referralTransaction.create({
              data: {
                referralId,
                userId: referral.referrerId,
                amount: rewards.referrerReward,
                type: 'EARNED',
                description: `Referral reward - ${rewards.tier} tier`,
              },
            });

          // Agregar fondos al wallet del referente
          await this.addFundsToWallet(
            referral.referrerId,
            rewards.referrerReward,
            'referral_earning',
          );

          result.referrerTransactionId = referrerTransaction.id.toString();
        } catch (error) {
          this.logger.error(
            `Error applying referrer reward for referral ${referralId}:`,
            error,
          );
        }
      }

      // Aplicar recompensa al referido
      if (rewards.refereeReward > 0) {
        try {
          const refereeTransaction =
            await this.prisma.referralTransaction.create({
              data: {
                referralId,
                userId: referral.refereeId,
                amount: rewards.refereeReward,
                type: 'EARNED',
                description: 'Welcome bonus for using referral code',
              },
            });

          // Agregar fondos al wallet del referido
          await this.addFundsToWallet(
            referral.refereeId,
            rewards.refereeReward,
            'referral_bonus',
          );

          result.refereeTransactionId = refereeTransaction.id.toString();
        } catch (error) {
          this.logger.error(
            `Error applying referee reward for referral ${referralId}:`,
            error,
          );
        }
      }

      // Send notifications for successful reward application
      try {
        await this.sendReferralRewardNotifications(referral, rewards);
      } catch (error) {
        this.logger.error(
          `Failed to send reward notifications for referral ${referralId}:`,
          error,
        );
        // Don't fail the entire process for notification errors
      }

      this.logger.log(
        `Applied rewards for referral ${referralId}: referrer $${rewards.referrerReward}, referee $${rewards.refereeReward}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error applying rewards for referral ${referralId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send notifications to referrer and referee when rewards are applied
   */
  private async sendReferralRewardNotifications(
    referral: any,
    rewards: { referrerReward: number; refereeReward: number; tier: string },
  ): Promise<void> {
    try {
      // Notify referrer of successful conversion
      if (rewards.referrerReward > 0) {
        await this.notificationManager.notifyReferralRewardEarned(
          referral.referrerId,
          {
            refereeName: referral.referee.name,
            amount: rewards.referrerReward,
            tier: rewards.tier,
          },
        );
      }

      // Notify referee of welcome bonus
      if (rewards.refereeReward > 0) {
        await this.notificationManager.notifyReferralBonusReceived(
          referral.refereeId,
          {
            referrerName: referral.referrer.name,
            amount: rewards.refereeReward,
          },
        );
      }

      this.logger.log(`Sent reward notifications for referral ${referral.id}`);
    } catch (error) {
      this.logger.error(
        `Error sending reward notifications for referral ${referral.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Método helper para agregar fondos al wallet de manera segura
   */
  private async addFundsToWallet(
    userId: number,
    amount: number,
    description: string,
  ): Promise<void> {
    try {
      // Usar el método addFunds del WalletService con el DTO correcto
      const addFundsDto = {
        userId,
        amount,
        description,
      };

      await this.walletService.addFunds(addFundsDto);
      this.logger.log(
        `Added $${amount} to wallet for user ${userId}: ${description}`,
      );
    } catch (error) {
      this.logger.error(
        `Error adding funds to wallet for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Valida si se cumplen las condiciones para aplicar recompensas
   */
  async validateRewardConditions(
    referralId: number,
    conditions: any,
  ): Promise<boolean> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
        include: { referee: true },
      });

      if (!referral || referral.status !== 'converted') {
        return false;
      }

      // Verificar primera condición: primer viaje completado
      if (conditions.firstRideCompleted) {
        const completedRides = await this.prisma.ride.count({
          where: {
            userId: referral.refereeId,
            paymentStatus: 'completed',
          },
        });

        if (completedRides === 0) {
          return false;
        }

        // Verificar condición de valor mínimo del viaje (opcional)
        if (conditions.minRideValue) {
          const recentRide = await this.prisma.ride.findFirst({
            where: {
              userId: referral.refereeId,
              paymentStatus: 'completed',
            },
            orderBy: { createdAt: 'desc' },
          });

          if (
            recentRide &&
            Number(recentRide.farePrice) < conditions.minRideValue
          ) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error validating reward conditions for referral ${referralId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Obtiene el resumen de recompensas de un usuario
   */
  async getUserRewardsSummary(userId: number): Promise<{
    totalEarned: number;
    availableBalance: number;
    pendingRewards: number;
    tier: string;
    nextTierRequirements?: {
      tier: string;
      referralsNeeded: number;
    };
  }> {
    try {
      // Obtener todas las transacciones del usuario
      const transactions = await this.prisma.referralTransaction.findMany({
        where: { userId },
      });

      const totalEarned = transactions
        .filter((t) => t.type === 'EARNED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Obtener balance actual del wallet
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: userId },
      });

      const availableBalance = wallet ? Number(wallet.balance) : 0;

      // Calcular recompensas pendientes
      const pendingReferrals = await this.prisma.referral.findMany({
        where: {
          referrerId: userId,
          status: 'converted',
        },
        include: {
          transactions: {
            where: { userId },
          },
        },
      });

      const pendingRewards =
        pendingReferrals.filter((r) => r.transactions.length === 0).length *
        this.configService.referral.referrerBaseReward;

      // Obtener tier actual
      const tier = await this.getUserCurrentTier(userId);

      // Calcular requisitos para siguiente tier
      let nextTierRequirements;
      const convertedCount = await this.prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'converted',
        },
      });

      if (tier === 'BASIC' && convertedCount < 6) {
        nextTierRequirements = {
          tier: 'ADVANCED',
          referralsNeeded: 6 - convertedCount,
        };
      } else if (tier === 'ADVANCED' && convertedCount < 21) {
        nextTierRequirements = {
          tier: 'VIP',
          referralsNeeded: 21 - convertedCount,
        };
      }

      return {
        totalEarned,
        availableBalance,
        pendingRewards,
        tier,
        nextTierRequirements,
      };
    } catch (error) {
      this.logger.error(
        `Error getting rewards summary for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Procesa recompensas pendientes (para jobs programados)
   */
  async processPendingRewards(): Promise<number> {
    try {
      const pendingReferrals = await this.prisma.referral.findMany({
        where: { status: 'converted' },
        include: {
          transactions: true,
        },
      });

      let processedCount = 0;

      for (const referral of pendingReferrals) {
        // Verificar si ya tiene transacciones
        if (referral.transactions.length === 0) {
          try {
            await this.applyReferralRewards(referral.id);
            processedCount++;
          } catch (error) {
            this.logger.error(
              `Error processing rewards for referral ${referral.id}:`,
              error,
            );
          }
        }
      }

      this.logger.log(`Processed ${processedCount} pending referral rewards`);
      return processedCount;
    } catch (error) {
      this.logger.error('Error processing pending referral rewards:', error);
      throw error;
    }
  }
}
