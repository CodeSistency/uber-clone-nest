import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/config.service';
import { ReferralCodesService } from './referral-codes.service';
import { Referral } from '@prisma/client';
import { ReferralStatus } from '../types/referral-status.type';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
    private referralCodesService: ReferralCodesService,
  ) {}

  /**
   * Aplica un código de referido durante el registro de un nuevo usuario
   */
  async applyReferralCode(referralCode: string, refereeId: number): Promise<{
    success: boolean;
    referral?: Referral;
    error?: string;
  }> {
    try {
      // Validar código
      const validation = await this.referralCodesService.validateReferralCode(referralCode);
      if (!validation.isValid || !validation.referralCode) {
        return { success: false, error: validation.error };
      }

      const code = validation.referralCode;

      // Verificar que no sea auto-referido
      if (code.userId === refereeId) {
        return { success: false, error: 'Cannot use your own referral code' };
      }

      // Verificar que no exista ya una relación entre estos usuarios
      const existingReferral = await this.prisma.referral.findUnique({
        where: {
          referrerId_refereeId: {
            referrerId: code.userId,
            refereeId,
          },
        },
      });

      if (existingReferral) {
        return { success: false, error: 'Referral relationship already exists' };
      }

      // Crear la relación de referido
      const referral = await this.prisma.referral.create({
        data: {
          referrerId: code.userId,
          refereeId,
          referralCodeId: code.id,
          status: 'pending',
        },
      });

      // Incrementar contador de uso del código
      await this.referralCodesService.incrementUsageCount(referralCode);

      this.logger.log(`Applied referral code ${referralCode} for new user ${refereeId}`);
      return { success: true, referral };

    } catch (error) {
      this.logger.error(`Error applying referral code ${referralCode} for user ${refereeId}:`, error);
      return { success: false, error: 'Internal error processing referral' };
    }
  }

  /**
   * Marca un referido como convertido cuando completa su primer viaje
   */
  async convertReferral(referralId: number): Promise<Referral> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
        include: { referrer: true, referee: true },
      });

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }

      if (referral.status === 'converted') {
        throw new BadRequestException('Referral is already converted');
      }

      if (referral.status === 'cancelled') {
        throw new BadRequestException('Referral is cancelled');
      }

      if (referral.status === 'expired') {
        throw new BadRequestException('Referral has expired');
      }

      // Marcar como convertido
      const updatedReferral = await this.prisma.referral.update({
        where: { id: referralId },
        data: {
          status: 'converted',
          convertedAt: new Date(),
        },
        include: { referrer: true, referee: true },
      });

      this.logger.log(`Converted referral ${referralId} for users ${referral.referrerId} -> ${referral.refereeId}`);
      return updatedReferral;

    } catch (error) {
      this.logger.error(`Error converting referral ${referralId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los referidos de un usuario
   */
  async getUserReferrals(userId: number) {
    try {
      return await this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referee: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
          referralCode: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    } catch (error) {
      this.logger.error(`Error getting referrals for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas personales de referidos para un usuario
   */
  async getUserReferralStats(userId: number): Promise<{
    totalReferrals: number;
    convertedReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    currentTier: string;
  }> {
    try {
      const referrals = await this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          transactions: {
            where: { type: 'EARNED' },
          },
        },
      });

      const totalReferrals = referrals.length;
      const convertedReferrals = referrals.filter(r => r.status === 'converted').length;
      const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

      const totalEarned = referrals
        .flatMap(r => r.transactions)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Calcular tier actual basado en referidos convertidos
      let currentTier = 'BASIC';
      if (convertedReferrals >= 21) {
        currentTier = 'VIP';
      } else if (convertedReferrals >= 6) {
        currentTier = 'ADVANCED';
      }

      return {
        totalReferrals,
        convertedReferrals,
        pendingReferrals,
        totalEarned,
        currentTier,
      };

    } catch (error) {
      this.logger.error(`Error getting referral stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario puede ser referido (no ha sido referido antes)
   */
  async canUserBeReferred(userId: number): Promise<boolean> {
    try {
      const existingReferral = await this.prisma.referral.findFirst({
        where: { refereeId: userId },
      });

      return !existingReferral;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} can be referred:`, error);
      return false;
    }
  }

  /**
   * Cancela un referido (por ejemplo, si el usuario solicita eliminación de cuenta)
   */
  async cancelReferral(referralId: number, reason?: string): Promise<Referral> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
      });

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }

      if (referral.status === 'cancelled') {
        throw new BadRequestException('Referral is already cancelled');
      }

      if (referral.status === 'converted') {
        throw new BadRequestException('Cannot cancel a converted referral');
      }

      const updatedReferral = await this.prisma.referral.update({
        where: { id: referralId },
        data: {
          status: 'cancelled',
        },
      });

      // Crear registro de transacción de cancelación
      await this.prisma.referralTransaction.create({
        data: {
          referralId,
          userId: referral.referrerId,
          amount: 0,
          type: 'CANCELLED',
          description: reason || 'Referral cancelled',
        },
      });

      this.logger.log(`Cancelled referral ${referralId} with reason: ${reason}`);
      return updatedReferral;

    } catch (error) {
      this.logger.error(`Error cancelling referral ${referralId}:`, error);
      throw error;
    }
  }

  /**
   * Procesa conversiones automáticas basadas en actividad del usuario
   * (para ser llamado desde jobs programados)
   */
  async processPendingConversions(): Promise<number> {
    try {
      // Buscar referidos pendientes que han completado viajes
      const pendingReferrals = await this.prisma.referral.findMany({
        where: { status: 'pending' },
        include: { referee: true },
      });

      let convertedCount = 0;

      for (const referral of pendingReferrals) {
        // Verificar si el referee ha completado al menos un viaje
        const completedRides = await this.prisma.ride.count({
          where: {
            userId: referral.refereeId,
            paymentStatus: 'completed',
          },
        });

        if (completedRides > 0) {
          await this.convertReferral(referral.id);
          convertedCount++;
        }
      }

      this.logger.log(`Processed ${convertedCount} automatic referral conversions`);
      return convertedCount;

    } catch (error) {
      this.logger.error('Error processing pending referral conversions:', error);
      throw error;
    }
  }
}


