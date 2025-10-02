import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/config.service';
import { RedisService } from '../../redis/redis.service';

interface ReferralMetrics {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalRewardsPaid: number;
  avgRewardPerReferral: number;
  topReferrers: Array<{
    userId: number;
    name: string;
    totalReferrals: number;
    convertedReferrals: number;
    totalEarned: number;
  }>;
}

interface UserReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalEarned: number;
  pendingRewards: number;
  tier: string;
  rank: number;
}

@Injectable()
export class ReferralAnalyticsService {
  private readonly logger = new Logger(ReferralAnalyticsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'referral:analytics:';

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
    private redisService: RedisService,
  ) {}

  /**
   * Obtiene métricas generales del sistema de referidos con cache
   */
  async getGlobalMetrics(): Promise<ReferralMetrics> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}global`;

      // Intentar obtener del cache primero
      if (this.configService.app.environment !== 'development') {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Calcular métricas desde la base de datos
      const [totalReferrals, convertedReferrals, rewardsData] = await Promise.all([
        this.prisma.referral.count(),
        this.prisma.referral.count({ where: { status: 'converted' } }),
        this.prisma.referralTransaction.aggregate({
          where: { type: 'EARNED' },
          _sum: { amount: true },
        }),
      ]);

      const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;
      const totalRewardsPaid = Number(rewardsData._sum.amount || 0);
      const avgRewardPerReferral = convertedReferrals > 0 ? totalRewardsPaid / convertedReferrals : 0;

      // Obtener top referrers
      const topReferrers = await this.getTopReferrers(10);

      const metrics: ReferralMetrics = {
        totalReferrals,
        convertedReferrals,
        conversionRate,
        totalRewardsPaid,
        avgRewardPerReferral,
        topReferrers,
      };

      // Cachear resultado
      if (this.configService.app.environment !== 'development') {
        await this.redisService.set(cacheKey, JSON.stringify(metrics), this.CACHE_TTL);
      }

      return metrics;

    } catch (error) {
      this.logger.error('Error getting global referral metrics:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas detalladas de un usuario específico
   */
  async getUserReferralStats(userId: number): Promise<UserReferralStats> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;

      // Intentar obtener del cache
      if (this.configService.app.environment !== 'development') {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Obtener datos del usuario
      const [userReferrals, userTransactions] = await Promise.all([
        this.prisma.referral.findMany({
          where: { referrerId: userId },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.referralTransaction.findMany({
          where: {
            userId,
            type: 'EARNED',
          },
          select: {
            amount: true,
          },
        }),
      ]);

      const totalReferrals = userReferrals.length;
      const convertedReferrals = userReferrals.filter(r => r.status === 'converted').length;
      const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

      const totalEarned = userTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calcular recompensas pendientes
      const pendingRewards = userReferrals
        .filter(r => r.status === 'converted')
        .length * this.configService.referral.referrerBaseReward - totalEarned;

      // Determinar tier
      let tier = 'BASIC';
      if (convertedReferrals >= 21) {
        tier = 'VIP';
      } else if (convertedReferrals >= 6) {
        tier = 'ADVANCED';
      }

      // Calcular ranking del usuario
      const rank = await this.getUserRank(userId);

      const stats: UserReferralStats = {
        totalReferrals,
        convertedReferrals,
        conversionRate,
        totalEarned,
        pendingRewards: Math.max(0, pendingRewards),
        tier,
        rank,
      };

      // Cachear resultado
      if (this.configService.app.environment !== 'development') {
        await this.redisService.set(cacheKey, JSON.stringify(stats), this.CACHE_TTL);
      }

      return stats;

    } catch (error) {
      this.logger.error(`Error getting referral stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el ranking de un usuario entre todos los referrers
   */
  private async getUserRank(userId: number): Promise<number> {
    try {
      const userConvertedCount = await this.prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'converted',
        },
      });

      // Contar cuántos usuarios tienen más referidos convertidos que este usuario
      const usersWithMoreReferrals = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM (
          SELECT referrer_id
          FROM referrals
          WHERE status = 'converted'
          GROUP BY referrer_id
          HAVING COUNT(*) > ${userConvertedCount}
        ) as subquery
      `;

      return (usersWithMoreReferrals[0]?.count || 0) + 1;

    } catch (error) {
      this.logger.error(`Error calculating rank for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Obtiene los top referrers del sistema
   */
  private async getTopReferrers(limit: number = 10): Promise<ReferralMetrics['topReferrers']> {
    try {
      const topReferrers = await this.prisma.$queryRaw<Array<{
        userId: number;
        name: string;
        totalReferrals: number;
        convertedReferrals: number;
        totalEarned: number;
      }>>`
        SELECT
          u.id as "userId",
          u.name,
          COUNT(r.id) as "totalReferrals",
          COUNT(CASE WHEN r.status = 'converted' THEN 1 END) as "convertedReferrals",
          COALESCE(SUM(rt.amount), 0) as "totalEarned"
        FROM users u
        LEFT JOIN referrals r ON u.id = r.referrer_id
        LEFT JOIN referral_transactions rt ON r.id = rt.referral_id AND rt.type = 'EARNED'
        GROUP BY u.id, u.name
        HAVING COUNT(r.id) > 0
        ORDER BY "convertedReferrals" DESC, "totalReferrals" DESC
        LIMIT ${limit}
      `;

      return topReferrers.map(row => ({
        userId: Number(row.userId),
        name: row.name,
        totalReferrals: Number(row.totalReferrals),
        convertedReferrals: Number(row.convertedReferrals),
        totalEarned: Number(row.totalEarned),
      }));

    } catch (error) {
      this.logger.error('Error getting top referrers:', error);
      return [];
    }
  }

  /**
   * Detección básica de fraude en el sistema de referidos
   */
  async detectFraudPatterns(): Promise<{
    suspiciousUsers: Array<{
      userId: number;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    totalSuspicious: number;
  }> {
    try {
      const suspiciousUsers: Array<{
        userId: number;
        reason: string;
        severity: 'low' | 'medium' | 'high';
      }> = [];

      if (!this.configService.referral.fraudDetectionEnabled) {
        return { suspiciousUsers, totalSuspicious: 0 };
      }

      // Patrón 1: Usuarios con muchos referidos desde la misma IP (alta frecuencia)
      const ipBasedSuspicious = await this.prisma.$queryRaw<Array<{ userId: number; referralCount: number }>>`
        SELECT referrer_id as "userId", COUNT(*) as "referralCount"
        FROM referrals r
        WHERE r.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY referrer_id
        HAVING COUNT(*) > ${this.configService.referral.maxSameIpReferrals}
      `;

      for (const record of ipBasedSuspicious) {
        suspiciousUsers.push({
          userId: Number(record.userId),
          reason: `High referral frequency: ${record.referralCount} referrals in 24h`,
          severity: record.referralCount > this.configService.referral.maxSameIpReferrals * 2 ? 'high' : 'medium',
        });
      }

      // Patrón 2: Usuarios con baja conversión pero muchos referidos
      const lowConversionSuspicious = await this.prisma.$queryRaw<Array<{
        userId: number;
        totalReferrals: number;
        convertedReferrals: number;
        conversionRate: number;
      }>>`
        SELECT
          referrer_id as "userId",
          COUNT(*) as "totalReferrals",
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as "convertedReferrals",
          (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)) as "conversionRate"
        FROM referrals
        GROUP BY referrer_id
        HAVING COUNT(*) >= 10 AND (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)) < 5.0
      `;

      for (const record of lowConversionSuspicious) {
        suspiciousUsers.push({
          userId: Number(record.userId),
          reason: `Low conversion rate: ${record.conversionRate.toFixed(1)}% (${record.convertedReferrals}/${record.totalReferrals})`,
          severity: 'medium',
        });
      }

      this.logger.warn(`Detected ${suspiciousUsers.length} suspicious referral patterns`);
      return {
        suspiciousUsers,
        totalSuspicious: suspiciousUsers.length,
      };

    } catch (error) {
      this.logger.error('Error detecting fraud patterns:', error);
      return { suspiciousUsers: [], totalSuspicious: 0 };
    }
  }

  /**
   * Invalida el cache de estadísticas (para actualizaciones manuales)
   */
  async invalidateCache(userId?: number): Promise<void> {
    try {
      const keys = userId
        ? [`${this.CACHE_PREFIX}user:${userId}`]
        : await this.redisService.keys(`${this.CACHE_PREFIX}*`);

      if (keys.length > 0) {
        // Delete keys one by one or use Redis pipeline for batch deletion
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`Invalidated ${keys.length} referral analytics cache entries`);
      }

    } catch (error) {
      this.logger.error('Error invalidating referral analytics cache:', error);
    }
  }

  /**
   * Genera reporte de rendimiento del sistema de referidos
   */
  async generatePerformanceReport(startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date };
    metrics: {
      newReferrals: number;
      conversions: number;
      rewardsPaid: number;
      avgConversionTime: number;
    };
    trends: {
      dailyReferrals: Array<{ date: string; count: number }>;
      conversionRateTrend: Array<{ date: string; rate: number }>;
    };
  }> {
    try {
      const [periodStats, dailyReferrals, conversionTrends] = await Promise.all([
        // Estadísticas del período
        this.prisma.$queryRaw<Array<{
          newReferrals: number;
          conversions: number;
          rewardsPaid: number;
          avgConversionTime: number;
        }>>`
          SELECT
            COUNT(CASE WHEN r.created_at >= ${startDate} AND r.created_at <= ${endDate} THEN 1 END) as "newReferrals",
            COUNT(CASE WHEN r.converted_at >= ${startDate} AND r.converted_at <= ${endDate} THEN 1 END) as "conversions",
            COALESCE(SUM(CASE WHEN rt.created_at >= ${startDate} AND rt.created_at <= ${endDate} THEN rt.amount END), 0) as "rewardsPaid",
            AVG(EXTRACT(EPOCH FROM (r.converted_at - r.created_at))/86400) as "avgConversionTime"
          FROM referrals r
          LEFT JOIN referral_transactions rt ON r.id = rt.referral_id AND rt.type = 'EARNED'
          WHERE r.created_at <= ${endDate}
        `,

        // Referidos diarios
        this.prisma.$queryRaw<Array<{ date: string; count: number }>>`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as count
          FROM referrals
          WHERE created_at >= ${startDate} AND created_at <= ${endDate}
          GROUP BY DATE(created_at)
          ORDER BY date
        `,

        // Tendencia de conversión
        this.prisma.$queryRaw<Array<{ date: string; rate: number }>>`
          SELECT
            DATE(created_at) as date,
            CASE
              WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*))
              ELSE 0
            END as rate
          FROM referrals
          WHERE created_at >= ${startDate} AND created_at <= ${endDate}
          GROUP BY DATE(created_at)
          ORDER BY date
        `,
      ]);

      return {
        period: { start: startDate, end: endDate },
        metrics: periodStats[0] || {
          newReferrals: 0,
          conversions: 0,
          rewardsPaid: 0,
          avgConversionTime: 0,
        },
        trends: {
          dailyReferrals: dailyReferrals.map(row => ({
            date: row.date,
            count: Number(row.count),
          })),
          conversionRateTrend: conversionTrends.map(row => ({
            date: row.date,
            rate: Number(row.rate),
          })),
        },
      };

    } catch (error) {
      this.logger.error('Error generating performance report:', error);
      throw error;
    }
  }
}


