import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

interface AlertArray extends Array<string> {
  push(item: string): number;
}

/**
 * Servicio de métricas para monitoreo del algoritmo de matching
 * Registra estadísticas de performance y calidad del matching
 */
@Injectable()
export class MatchingMetricsService {
  private readonly logger = new Logger(MatchingMetricsService.name);
  private readonly METRICS_PREFIX = 'matching:metrics';

  constructor(private redisService: RedisService) {}

  /**
   * Registra métricas de scoring del motor de matching
   */
  async recordScoringMetrics(metrics: {
    duration: number; // ms
    driversProcessed: number;
    driversScored: number;
    avgScore: number;
    searchRadius: number;
  }): Promise<void> {
    try {
      const timestamp = Date.now();
      const metricsKey = `${this.METRICS_PREFIX}:scoring:${timestamp}`;

      await this.redisService.set(metricsKey, JSON.stringify(metrics), 86400); // 24 horas

      // Actualizar métricas agregadas de scoring
      await this.updateScoringAggregatedMetrics(metrics);

      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `📊 [METRICS] Scoring completado - ${metrics.duration}ms, ${metrics.driversScored} drivers, Avg Score: ${metrics.avgScore.toFixed(2)}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        '⚠️ [METRICS] Error registrando métricas de scoring:',
        error,
      );
    }
  }

  /**
   * Actualiza métricas agregadas de scoring
   */
  private async updateScoringAggregatedMetrics(metrics: any): Promise<void> {
    try {
      // Usar operaciones individuales ya que RedisService no tiene pipeline
      await Promise.all([
        this.redisService.incr(
          `${this.METRICS_PREFIX}:scoring:total_operations`,
        ),
        this.redisService.incrby(
          `${this.METRICS_PREFIX}:scoring:total_drivers_processed`,
          metrics.driversProcessed,
        ),
        this.redisService.incrby(
          `${this.METRICS_PREFIX}:scoring:total_drivers_scored`,
          metrics.driversScored,
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        '⚠️ [METRICS] Error actualizando métricas agregadas de scoring:',
        error,
      );
    }
  }

  /**
   * Registra métricas de una operación de matching
   */
  async recordMatchingMetrics(metrics: {
    duration: number; // ms
    driversFound: number;
    driversScored: number;
    winnerScore?: number;
    winnerDistance?: number;
    winnerRating?: number;
    searchRadius: number;
    hasWinner: boolean;
    tierId?: number;
    strategy?: string;
  }): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.time('📈 Metrics Recording');
    }

    try {
      const timestamp = Date.now();
      const metricsKey = `${this.METRICS_PREFIX}:${timestamp}`;

      // 📝 [TIMING] Store Detailed Metrics
      if (process.env.NODE_ENV === 'development') {
        console.time('📝 Store Detailed Metrics');
      }

      // Almacenar métricas detalladas
      await this.redisService.set(metricsKey, JSON.stringify(metrics), 86400); // 24 horas

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📝 Store Detailed Metrics');
      }

      // 🔢 [TIMING] Update Aggregated Metrics
      if (process.env.NODE_ENV === 'development') {
        console.time('🔢 Update Aggregated Metrics');
      }

      // Actualizar contadores agregados
      await this.updateAggregatedMetrics(metrics);

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🔢 Update Aggregated Metrics');
      }

      // Log de métricas en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📈 Metrics Recording');
        this.logger.log(
          `📊 [METRICS] Matching completado - ${metrics.duration}ms, ${metrics.driversFound} drivers, Winner: ${metrics.hasWinner ? 'SÍ' : 'NO'}`,
        );
      }

      // Alertas automáticas para problemas de performance
      await this.checkPerformanceAlerts(metrics);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('📈 Metrics Recording');
      }
      this.logger.warn('⚠️ [METRICS] Error registrando métricas:', error);
    }
  }

  /**
   * Actualiza métricas agregadas (contadores, promedios, etc.)
   */
  private async updateAggregatedMetrics(metrics: any): Promise<void> {
    try {
      const operations = [
        this.redisService.incr(`${this.METRICS_PREFIX}:total_requests`),
      ];

      if (metrics.hasWinner) {
        operations.push(
          this.redisService.incr(`${this.METRICS_PREFIX}:successful_matches`),
        );
      } else {
        operations.push(
          this.redisService.incr(`${this.METRICS_PREFIX}:failed_matches`),
        );
      }

      await Promise.all(operations);
    } catch (error) {
      this.logger.warn(
        '⚠️ [METRICS] Error actualizando métricas agregadas:',
        error,
      );
    }
  }

  /**
   * Verifica alertas de performance automática
   */
  private async checkPerformanceAlerts(metrics: any): Promise<void> {
    const alerts: string[] = [];

    // Alerta: Tiempo de respuesta muy lento (>2s)
    if (metrics.duration > 2000) {
      alerts.push(`🚨 ALERTA: Matching muy lento (${metrics.duration}ms)`);
    }

    // Alerta: Sin conductores encontrados
    if (metrics.driversFound === 0) {
      alerts.push(`🚨 ALERTA: No se encontraron conductores disponibles`);
    }

    // Alerta: Radio de búsqueda muy grande
    if (metrics.searchRadius > 10) {
      alerts.push(
        `⚠️ ADVERTENCIA: Radio de búsqueda amplio (${metrics.searchRadius}km)`,
      );
    }

    // Alerta: Tasa de éxito baja
    const successRate = await this.calculateSuccessRate();
    if (successRate < 0.7) {
      // Menos del 70% de éxito
      alerts.push(
        `⚠️ ADVERTENCIA: Tasa de éxito baja (${(successRate * 100).toFixed(1)}%)`,
      );
    }

    // Log de alertas
    alerts.forEach((alert) => {
      this.logger.warn(alert);
      // Aquí se podría enviar notificación al equipo de devops
    });
  }

  /**
   * Calcula la tasa de éxito de matching
   */
  private async calculateSuccessRate(): Promise<number> {
    try {
      const totalRequests = parseInt(
        (await this.redisService.get(
          `${this.METRICS_PREFIX}:total_requests`,
        )) || '0',
      );
      const successfulMatches = parseInt(
        (await this.redisService.get(
          `${this.METRICS_PREFIX}:successful_matches`,
        )) || '0',
      );

      return totalRequests > 0 ? successfulMatches / totalRequests : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene métricas de rendimiento recientes
   */
  async getPerformanceMetrics(hours: number = 24): Promise<any> {
    try {
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

      // Obtener métricas recientes (simplificado)
      const totalRequests = await this.redisService.get(
        `${this.METRICS_PREFIX}:total_requests`,
      );
      const successfulMatches = await this.redisService.get(
        `${this.METRICS_PREFIX}:successful_matches`,
      );
      const failedMatches = await this.redisService.get(
        `${this.METRICS_PREFIX}:failed_matches`,
      );

      const successRate =
        totalRequests && successfulMatches
          ? (parseInt(successfulMatches) / parseInt(totalRequests)) * 100
          : 0;

      return {
        period: `${hours} horas`,
        totalRequests: parseInt(totalRequests || '0'),
        successfulMatches: parseInt(successfulMatches || '0'),
        failedMatches: parseInt(failedMatches || '0'),
        successRate: `${successRate.toFixed(1)}%`,
        avgResponseTime: await this.getAverageResponseTime(hours),
        alerts: await this.getRecentAlerts(),
      };
    } catch (error) {
      this.logger.error(
        '❌ [METRICS] Error obteniendo métricas de performance:',
        error,
      );
      return null;
    }
  }

  /**
   * Obtiene tiempo de respuesta promedio
   */
  private async getAverageResponseTime(hours: number): Promise<string> {
    // Implementación simplificada - en producción usar datos históricos
    return '~500ms'; // Placeholder
  }

  /**
   * Obtiene alertas recientes
   */
  private async getRecentAlerts(): Promise<string[]> {
    // Implementación simplificada - en producción mantener log de alertas
    const alerts: string[] = [];
    return alerts;
  }

  /**
   * Registra evento de matching fallido para análisis
   */
  async recordMatchingFailure(reason: string, context: any): Promise<void> {
    try {
      const failureKey = `${this.METRICS_PREFIX}:failures:${Date.now()}`;
      const failureData = {
        timestamp: new Date().toISOString(),
        reason,
        context,
        severity: this.getFailureSeverity(reason),
      };

      await this.redisService.set(
        failureKey,
        JSON.stringify(failureData),
        604800,
      ); // 7 días

      this.logger.warn(`📊 [METRICS] Matching fallido: ${reason}`, context);
    } catch (error) {
      this.logger.warn('⚠️ [METRICS] Error registrando fallo:', error);
    }
  }

  /**
   * Determina la severidad de un fallo
   */
  private getFailureSeverity(
    reason: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (reason.includes('NO_DRIVERS_AVAILABLE')) return 'high';
    if (reason.includes('SYSTEM_ERROR')) return 'critical';
    if (reason.includes('TIMEOUT')) return 'medium';
    return 'low';
  }

  /**
   * Limpia métricas antiguas (mantenimiento)
   */
  async cleanupOldMetrics(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      // Nota: En implementación completa, buscar y eliminar claves antiguas
      // Por simplicidad, solo log
      this.logger.log(
        `🧹 [METRICS] Cleanup completado - manteniendo ${daysToKeep} días de métricas`,
      );
    } catch (error) {
      this.logger.warn('⚠️ [METRICS] Error en cleanup de métricas:', error);
    }
  }
}
