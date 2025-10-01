import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingMetricsService } from './matching-metrics.service';

/**
 * Motor de matching dedicado para algoritmos de selección de conductores
 * Separado del servicio principal para mejor mantenibilidad y testabilidad
 */
@Injectable()
export class MatchingEngine {
  private readonly logger = new Logger(MatchingEngine.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MatchingMetricsService,
    private parentLogger?: Logger,
  ) {}

  /**
   * Calcula scores para múltiples conductores usando procesamiento por lotes
   */
  async calculateBatchScores(
    drivers: any[],
    userLat: number,
    userLng: number,
    searchRadius?: number,
  ): Promise<any[]> {
    const startTime = Date.now();
    const BATCH_SIZE = 5; // Procesar de 5 en 5 para mejor performance

    if (process.env.NODE_ENV === 'development') {
      console.time('🧮 Batch Scoring Total');
    }

    try {
      const scoredDrivers: any[] = [];

      // Procesar en lotes para evitar sobrecargar el sistema
      for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
        const batch = drivers.slice(i, i + BATCH_SIZE);

        if (process.env.NODE_ENV === 'development') {
          console.time(
            `🔢 Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} drivers)`,
          );
        }

        const batchPromises = batch.map((driver) =>
          this.calculateDriverScore(driver, userLat, userLng),
        );

        const batchScores = await Promise.all(batchPromises);

        if (process.env.NODE_ENV === 'development') {
          console.timeEnd(
            `🔢 Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} drivers)`,
          );
        }

        batch.forEach((driver, index) => {
          scoredDrivers.push({
            ...driver,
            score: batchScores[index],
          });
        });
      }

      // Ordenar por score descendente
      scoredDrivers.sort((a, b) => b.score - a.score);

      const processingTime = Date.now() - startTime;

      // Registrar métricas de scoring
      if (this.metricsService) {
        await this.metricsService.recordScoringMetrics({
          duration: processingTime,
          driversProcessed: drivers.length,
          driversScored: scoredDrivers.length,
          avgScore:
            scoredDrivers.length > 0
              ? scoredDrivers.reduce((sum, d) => sum + d.score, 0) /
                scoredDrivers.length
              : 0,
          searchRadius: searchRadius || 5,
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('🧮 Batch Scoring Total');
        this.logger.log(
          `✅ [ENGINE] Scores calculados para ${scoredDrivers.length} conductores en ${processingTime}ms`,
        );
      }

      return scoredDrivers;
    } catch (error) {
      this.logger.error('❌ [ENGINE] Error calculando scores:', error);

      // Registrar error en métricas
      if (this.metricsService) {
        await this.metricsService.recordMatchingFailure('SCORING_ERROR', {
          driversCount: drivers.length,
          error: error.message,
        });
      }

      return [];
    }
  }

  /**
   * Calcula el score individual de un conductor basado en múltiples factores
   */
  private async calculateDriverScore(
    driver: any,
    userLat: number,
    userLng: number,
  ): Promise<number> {
    try {
      // Pesos para cada factor (suman 100)
      const WEIGHTS = {
        DISTANCE: 40, // 40% - Más cercano = mejor
        RATING: 35, // 35% - Mejor rating = mejor
        ETA: 25, // 25% - Menor tiempo de llegada = mejor
      };

      let totalScore = 0;

      // 1. Factor de distancia (inverso - más cercano = score más alto)
      const distanceKm = driver.distance || 0;
      const distanceScore = Math.max(
        0,
        Math.min(WEIGHTS.DISTANCE, WEIGHTS.DISTANCE * (1 / (1 + distanceKm))),
      );
      totalScore += distanceScore;

      // 2. Factor de rating (directo - mejor rating = score más alto)
      const rating = driver.rating || driver.averageRating || 0;
      const ratingScore = (rating / 5.0) * WEIGHTS.RATING; // Normalizar a 0-5 scale
      totalScore += ratingScore;

      // 3. Factor de ETA (estimación de tiempo de llegada)
      const estimatedMinutes =
        driver.estimatedMinutes ||
        Math.max(1, Math.round((distanceKm * 1000) / 500) * 60); // 500m/min = 30km/h
      const etaScore = Math.max(
        0,
        WEIGHTS.ETA * (1 / (1 + estimatedMinutes / 10)), // Penalizar ETAs largos
      );
      totalScore += etaScore;

      // Log detallado solo en desarrollo con debug habilitado
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.MATCHING_DEBUG
      ) {
        this.logger.debug(
          `📊 [SCORE] Driver ${driver.id}: Distance=${distanceKm}km (${distanceScore.toFixed(1)}), ` +
            `Rating=${rating} (${ratingScore.toFixed(1)}), ETA=${estimatedMinutes}min (${etaScore.toFixed(1)}) ` +
            `= Total: ${totalScore.toFixed(1)}`,
        );
      }

      return Math.round(totalScore * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      this.logger.error(
        `❌ [ENGINE] Error calculando score para driver ${driver.id}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Aplica filtros de compatibilidad de vehículo
   */
  async buildVehicleTypeFilters(
    tierId?: number,
    vehicleTypeId?: number,
  ): Promise<any> {
    if (vehicleTypeId) {
      return vehicleTypeId;
    }

    if (tierId) {
      const compatibleTypes = await this.prisma.tierVehicleType.findMany({
        where: { tierId, isActive: true },
        select: { vehicleTypeId: true },
      });

      if (compatibleTypes.length === 0) return null;
      if (compatibleTypes.length === 1) return compatibleTypes[0].vehicleTypeId;

      return { in: compatibleTypes.map((vt) => vt.vehicleTypeId) };
    }

    return null;
  }

  /**
   * Estrategias de scoring alternativas
   */
  async calculateDistanceFirstStrategy(
    drivers: any[],
    userLat: number,
    userLng: number,
  ): Promise<any[]> {
    // Implementar estrategia que prioriza distancia sobre rating
    const scoredDrivers = await this.calculateBatchScores(
      drivers,
      userLat,
      userLng,
    );

    // Ajustar pesos: 60% distancia, 20% rating, 20% ETA
    return scoredDrivers
      .map((driver) => ({
        ...driver,
        score:
          driver.score * 0.6 +
          (driver.distance ? (1 / (1 + driver.distance)) * 40 : 0),
      }))
      .sort((a, b) => a.score - b.score); // Menor distancia primero
  }

  async calculateRatingFirstStrategy(
    drivers: any[],
    userLat: number,
    userLng: number,
  ): Promise<any[]> {
    // Implementar estrategia que prioriza rating sobre distancia
    const scoredDrivers = await this.calculateBatchScores(
      drivers,
      userLat,
      userLng,
    );

    // Ajustar pesos: 30% distancia, 50% rating, 20% ETA
    return scoredDrivers
      .map((driver) => ({
        ...driver,
        score: ((driver.rating || 0) / 5.0) * 50 + driver.score * 0.5,
      }))
      .sort((a, b) => b.score - a.score);
  }
}
