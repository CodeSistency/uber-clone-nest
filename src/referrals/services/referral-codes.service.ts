import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/config.service';
import { ReferralCode } from '@prisma/client';

@Injectable()
export class ReferralCodesService {
  private readonly logger = new Logger(ReferralCodesService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
  ) {}

  /**
   * Genera un código único de referido para un usuario
   * Algoritmo: timestamp + hash del userId + caracteres aleatorios
   */
  private generateUniqueCode(userId: number): string {
    const timestamp = Date.now().toString(36);
    const userHash = Math.abs(userId).toString(36).substring(0, 3);
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `UBER${timestamp}${userHash}${randomChars}`.substring(0, 12);
  }

  /**
   * Crea o obtiene el código de referido de un usuario
   */
  async getOrCreateUserReferralCode(userId: number): Promise<ReferralCode> {
    try {
      // Buscar código existente y activo
      let referralCode = await this.prisma.referralCode.findFirst({
        where: {
          userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
      });

      if (referralCode) {
        return referralCode;
      }

      // Generar nuevo código único
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = this.generateUniqueCode(userId);
        attempts++;

        if (attempts >= maxAttempts) {
          throw new BadRequestException('Unable to generate unique referral code');
        }
      } while (
        await this.prisma.referralCode.findUnique({
          where: { code },
        })
      );

      // Crear nuevo código
      referralCode = await this.prisma.referralCode.create({
        data: {
          code,
          userId,
          maxUses: this.configService.referral.maxReferralsPerUser,
          expiresAt: new Date(Date.now() + (this.configService.referral.codeExpiryDays * 24 * 60 * 60 * 1000)),
        },
      });

      this.logger.log(`Created new referral code ${code} for user ${userId}`);
      return referralCode;

    } catch (error) {
      this.logger.error(`Error creating referral code for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Valida si un código de referido es válido y puede ser usado
   */
  async validateReferralCode(code: string): Promise<{
    isValid: boolean;
    referralCode?: ReferralCode;
    error?: string;
  }> {
    try {
      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code },
        include: { user: true },
      });

      if (!referralCode) {
        return { isValid: false, error: 'Referral code not found' };
      }

      if (!referralCode.isActive) {
        return { isValid: false, error: 'Referral code is inactive' };
      }

      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        return { isValid: false, error: 'Referral code has expired' };
      }

      if (referralCode.usageCount >= referralCode.maxUses) {
        return { isValid: false, error: 'Referral code has reached maximum uses' };
      }

      return { isValid: true, referralCode };

    } catch (error) {
      this.logger.error(`Error validating referral code ${code}:`, error);
      return { isValid: false, error: 'Internal error validating code' };
    }
  }

  /**
   * Incrementa el contador de uso de un código de referido
   */
  async incrementUsageCount(code: string): Promise<void> {
    try {
      await this.prisma.referralCode.update({
        where: { code },
        data: { usageCount: { increment: 1 } },
      });

      this.logger.log(`Incremented usage count for referral code ${code}`);
    } catch (error) {
      this.logger.error(`Error incrementing usage count for code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas públicas de un código de referido
   */
  async getReferralCodeStats(code: string): Promise<{
    code: string;
    totalReferrals: number;
    convertedReferrals: number;
    totalEarned: number;
  }> {
    try {
      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code },
        include: {
          referrals: {
            include: {
              transactions: true,
            },
          },
        },
      });

      if (!referralCode) {
        throw new NotFoundException('Referral code not found');
      }

      const totalReferrals = referralCode.referrals.length;
      const convertedReferrals = referralCode.referrals.filter(
        r => r.status === 'converted'
      ).length;

      const totalEarned = referralCode.referrals
        .flatMap(r => r.transactions)
        .filter(t => t.type === 'EARNED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        code,
        totalReferrals,
        convertedReferrals,
        totalEarned,
      };

    } catch (error) {
      this.logger.error(`Error getting stats for referral code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Regenera el código de referido de un usuario (con límites)
   */
  async regenerateUserReferralCode(userId: number): Promise<ReferralCode> {
    try {
      // Marcar código anterior como inactivo
      await this.prisma.referralCode.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Crear nuevo código
      return await this.getOrCreateUserReferralCode(userId);

    } catch (error) {
      this.logger.error(`Error regenerating referral code for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Limpia códigos expirados (para tareas programadas)
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const result = await this.prisma.referralCode.updateMany({
        where: {
          isActive: true,
          expiresAt: { lt: new Date() },
        },
        data: { isActive: false },
      });

      this.logger.log(`Cleaned up ${result.count} expired referral codes`);
      return result.count;

    } catch (error) {
      this.logger.error('Error cleaning up expired referral codes:', error);
      throw error;
    }
  }
}


