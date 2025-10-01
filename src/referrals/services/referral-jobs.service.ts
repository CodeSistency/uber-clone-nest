import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReferralCodesService } from './referral-codes.service';
import { ReferralsService } from './referrals.service';
import { ReferralRewardsService } from './referral-rewards.service';
import { ReferralAnalyticsService } from './referral-analytics.service';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class ReferralJobsService {
  private readonly logger = new Logger(ReferralJobsService.name);

  constructor(
    private referralCodesService: ReferralCodesService,
    private referralsService: ReferralsService,
    private referralRewardsService: ReferralRewardsService,
    private referralAnalyticsService: ReferralAnalyticsService,
    private configService: AppConfigService,
  ) {}

  /**
   * Job programado: Procesar conversiones de referidos pendientes
   * Ejecuta cada 5 minutos para verificar usuarios que han completado viajes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingReferralConversions() {
    try {
      this.logger.log('🚀 Starting scheduled job: Process pending referral conversions');

      const processedCount = await this.referralsService.processPendingConversions();

      if (processedCount > 0) {
        this.logger.log(`✅ Processed ${processedCount} pending referral conversions`);
      } else {
        this.logger.debug('ℹ️ No pending referral conversions to process');
      }

    } catch (error) {
      this.logger.error('❌ Error in processPendingReferralConversions job:', error);
    }
  }

  /**
   * Job programado: Limpiar códigos de referido expirados
   * Ejecuta diariamente a la medianoche
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredReferralCodes() {
    try {
      this.logger.log('🧹 Starting scheduled job: Cleanup expired referral codes');

      const cleanedCount = await this.referralCodesService.cleanupExpiredCodes();

      if (cleanedCount > 0) {
        this.logger.log(`🗑️ Cleaned up ${cleanedCount} expired referral codes`);
      } else {
        this.logger.debug('ℹ️ No expired referral codes to clean up');
      }

    } catch (error) {
      this.logger.error('❌ Error in cleanupExpiredReferralCodes job:', error);
    }
  }

  /**
   * Job programado: Procesar recompensas pendientes
   * Ejecuta cada 10 minutos para aplicar recompensas que no se procesaron automáticamente
   */
  @Cron('0 */10 * * * *') // Every 10 minutes
  async processPendingReferralRewards() {
    try {
      this.logger.log('💰 Starting scheduled job: Process pending referral rewards');

      const processedCount = await this.referralRewardsService.processPendingRewards();

      if (processedCount > 0) {
        this.logger.log(`💸 Processed ${processedCount} pending referral rewards`);
      } else {
        this.logger.debug('ℹ️ No pending referral rewards to process');
      }

    } catch (error) {
      this.logger.error('❌ Error in processPendingReferralRewards job:', error);
    }
  }

  /**
   * Job programado: Generar reportes semanales de referidos
   * Ejecuta todos los domingos a las 2 AM
   */
  @Cron('0 2 * * 0') // Every Sunday at 2 AM
  async generateWeeklyReferralReport() {
    try {
      this.logger.log('📊 Starting scheduled job: Generate weekly referral report');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Last 7 days

      const report = await this.referralAnalyticsService.generatePerformanceReport(
        startDate,
        endDate
      );

      // Log detailed report
      this.logger.log('📈 Weekly Referral Report:');
      this.logger.log(`   Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      this.logger.log(`   New Referrals: ${report.metrics.newReferrals}`);
      this.logger.log(`   Conversions: ${report.metrics.conversions}`);
      this.logger.log(`   Rewards Paid: $${report.metrics.rewardsPaid.toFixed(2)}`);
      this.logger.log(`   Avg Conversion Time: ${report.metrics.avgConversionTime.toFixed(1)} days`);

      // TODO: In a production system, this report would be:
      // - Saved to database
      // - Sent via email to administrators
      // - Stored in analytics platform

    } catch (error) {
      this.logger.error('❌ Error in generateWeeklyReferralReport job:', error);
    }
  }

  /**
   * Job programado: Detectar patrones de fraude
   * Ejecuta cada hora para identificar actividades sospechosas
   */
  @Cron(CronExpression.EVERY_HOUR)
  async detectReferralFraudPatterns() {
    try {
      this.logger.log('🔍 Starting scheduled job: Detect referral fraud patterns');

      const { suspiciousUsers, totalSuspicious } = await this.referralAnalyticsService.detectFraudPatterns();

      if (totalSuspicious > 0) {
        this.logger.warn(`⚠️ Detected ${totalSuspicious} suspicious referral patterns:`);

        suspiciousUsers.forEach((user, index) => {
          this.logger.warn(`   ${index + 1}. User ${user.userId}: ${user.reason} (Severity: ${user.severity})`);
        });

        // TODO: In a production system, suspicious activities would trigger:
        // - Automated alerts to administrators
        // - Temporary account restrictions
        // - Manual review queue
      } else {
        this.logger.debug('✅ No suspicious referral patterns detected');
      }

    } catch (error) {
      this.logger.error('❌ Error in detectReferralFraudPatterns job:', error);
    }
  }

  /**
   * Job programado: Optimizar índices y estadísticas
   * Ejecuta semanalmente para mantener el rendimiento
   */
  @Cron('0 3 * * 1') // Every Monday at 3 AM
  async optimizeReferralDatabase() {
    try {
      this.logger.log('🔧 Starting scheduled job: Optimize referral database');

      // Invalidate old cache entries
      await this.referralAnalyticsService.invalidateCache();

      // Additional optimization tasks could include:
      // - Rebuilding indexes
      // - Updating statistics
      // - Cleaning up old notification records

      this.logger.log('✅ Referral database optimization completed');

    } catch (error) {
      this.logger.error('❌ Error in optimizeReferralDatabase job:', error);
    }
  }

  /**
   * Método manual para ejecutar jobs bajo demanda (útil para testing)
   */
  async executeJobManually(jobName: string): Promise<any> {
    switch (jobName) {
      case 'processPendingReferralConversions':
        return await this.processPendingReferralConversions();
      case 'cleanupExpiredReferralCodes':
        return await this.cleanupExpiredReferralCodes();
      case 'processPendingReferralRewards':
        return await this.processPendingReferralRewards();
      case 'generateWeeklyReferralReport':
        return await this.generateWeeklyReferralReport();
      case 'detectReferralFraudPatterns':
        return await this.detectReferralFraudPatterns();
      case 'optimizeReferralDatabase':
        return await this.optimizeReferralDatabase();
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}


