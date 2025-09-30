import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface CachedFeatureFlag {
  id: number;
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  userRoles?: string[];
  userIds?: number[];
  environments?: string[];
  config?: any;
  isActive: boolean;
  lastUpdated?: Date;
}

export interface CachedEvaluation {
  featureKey: string;
  userId?: number;
  userRole?: string;
  environment?: string;
  result: boolean;
  config?: any;
  cachedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class FeatureFlagsCacheService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagsCacheService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly EVALUATION_TTL = 60; // 1 minute for evaluations

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Warm up cache on startup
    await this.warmupCache();
  }

  /**
   * Get cached feature flag
   */
  async getCachedFlag(key: string): Promise<CachedFeatureFlag | null> {
    try {
      const cacheKey = `feature_flag:${key}`;
      const cached = await this.redisService.get(cacheKey);

      if (!cached) {
        return null;
      }

      const flag: CachedFeatureFlag = JSON.parse(cached);

      // Check if cache is stale (flag was updated after cache)
      const dbFlag = await this.prisma.featureFlag.findUnique({
        where: { key },
        select: { updatedAt: true },
      });

      if (
        dbFlag &&
        flag.lastUpdated &&
        dbFlag.updatedAt > new Date(flag.lastUpdated)
      ) {
        // Cache is stale, remove it
        await this.redisService.del(cacheKey);
        return null;
      }

      return flag;
    } catch (error) {
      this.logger.error(`Error getting cached flag ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached feature flag
   */
  async setCachedFlag(flag: any): Promise<void> {
    try {
      const cachedFlag: CachedFeatureFlag = {
        id: flag.id,
        key: flag.key,
        isEnabled: flag.isEnabled,
        rolloutPercentage: flag.rolloutPercentage || 100,
        userRoles: flag.userRoles,
        userIds: flag.userIds,
        environments: flag.environments,
        config: flag.config,
        isActive: flag.isActive,
        lastUpdated: flag.updatedAt || flag.createdAt,
      };

      const cacheKey = `feature_flag:${flag.key}`;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(cachedFlag),
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.error(`Error setting cached flag ${flag.key}:`, error);
    }
  }

  /**
   * Get cached evaluation result
   */
  async getCachedEvaluation(
    featureKey: string,
    userId?: number,
    userRole?: string,
    environment?: string,
  ): Promise<CachedEvaluation | null> {
    try {
      const cacheKey = this.getEvaluationCacheKey(
        featureKey,
        userId,
        userRole,
        environment,
      );
      const cached = await this.redisService.get(cacheKey);

      if (!cached) {
        return null;
      }

      const evaluation: CachedEvaluation = JSON.parse(cached);

      // Check if expired
      if (new Date() > new Date(evaluation.expiresAt)) {
        await this.redisService.del(cacheKey);
        return null;
      }

      return evaluation;
    } catch (error) {
      this.logger.error(
        `Error getting cached evaluation for ${featureKey}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Set cached evaluation result
   */
  async setCachedEvaluation(
    featureKey: string,
    userId: number | undefined,
    userRole: string | undefined,
    environment: string | undefined,
    result: boolean,
    config?: any,
  ): Promise<void> {
    try {
      const cachedEvaluation: CachedEvaluation = {
        featureKey,
        userId,
        userRole,
        environment,
        result,
        config,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.EVALUATION_TTL * 1000),
      };

      const cacheKey = this.getEvaluationCacheKey(
        featureKey,
        userId,
        userRole,
        environment,
      );
      await this.redisService.set(
        cacheKey,
        JSON.stringify(cachedEvaluation),
        this.EVALUATION_TTL,
      );
    } catch (error) {
      this.logger.error(
        `Error setting cached evaluation for ${featureKey}:`,
        error,
      );
    }
  }

  /**
   * Invalidate flag cache
   */
  async invalidateFlagCache(key: string): Promise<void> {
    try {
      const cacheKey = `feature_flag:${key}`;
      await this.redisService.del(cacheKey);

      // Also invalidate all evaluation caches for this flag
      const evaluationPattern = `feature_evaluation:${key}:*`;
      await this.invalidatePattern(evaluationPattern);

      this.logger.log(`Invalidated cache for feature flag: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for flag ${key}:`, error);
    }
  }

  /**
   * Invalidate all flag caches
   */
  async invalidateAllFlagCaches(): Promise<void> {
    try {
      const pattern = 'feature_flag:*';
      await this.invalidatePattern(pattern);

      // Also invalidate all evaluation caches
      const evaluationPattern = 'feature_evaluation:*';
      await this.invalidatePattern(evaluationPattern);

      this.logger.log('Invalidated all feature flag caches');
    } catch (error) {
      this.logger.error('Error invalidating all flag caches:', error);
    }
  }

  /**
   * Warm up cache with all active flags
   */
  async warmupCache(): Promise<void> {
    try {
      this.logger.log('Starting feature flags cache warmup...');

      const flags = await this.prisma.featureFlag.findMany({
        where: { isActive: true },
      });

      for (const flag of flags) {
        await this.setCachedFlag(flag);
      }

      this.logger.log(`Cache warmup completed: ${flags.length} flags cached`);
    } catch (error) {
      this.logger.error('Error during cache warmup:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      // Note: This is a simplified version. In production, you might want to use Redis INFO command
      const flagKeys = await this.redisService.keys('feature_flag:*');
      const evaluationKeys = await this.redisService.keys(
        'feature_evaluation:*',
      );

      return {
        flagsCached: flagKeys.length,
        evaluationsCached: evaluationKeys.length,
        cacheTTL: this.CACHE_TTL,
        evaluationTTL: this.EVALUATION_TTL,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        flagsCached: 0,
        evaluationsCached: 0,
        error: error.message,
      };
    }
  }

  /**
   * Clean expired evaluation caches
   */
  async cleanExpiredEvaluations(): Promise<void> {
    try {
      // This is a simplified cleanup. In production, you might want a more sophisticated approach
      const evaluationKeys = await this.redisService.keys(
        'feature_evaluation:*',
      );

      for (const key of evaluationKeys) {
        const cached = await this.redisService.get(key);
        if (cached) {
          const evaluation: CachedEvaluation = JSON.parse(cached);
          if (new Date() > new Date(evaluation.expiresAt)) {
            await this.redisService.del(key);
          }
        }
      }

      this.logger.log(
        `Cleaned expired evaluations: ${evaluationKeys.length} keys checked`,
      );
    } catch (error) {
      this.logger.error('Error cleaning expired evaluations:', error);
    }
  }

  /**
   * Get evaluation cache key
   */
  private getEvaluationCacheKey(
    featureKey: string,
    userId?: number,
    userRole?: string,
    environment?: string,
  ): string {
    const parts = [
      featureKey,
      userId || 'null',
      userRole || 'null',
      environment || 'null',
    ];
    return `feature_evaluation:${parts.join(':')}`;
  }

  /**
   * Invalidate keys by pattern (simplified version)
   */
  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      // In Redis, we can use KEYS to find matching keys
      const keys = await this.redisService.keys(pattern);

      if (keys.length > 0) {
        await this.redisService.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }
}
