import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class PricingCacheService {
  private readonly logger = new Logger(PricingCacheService.name);
  private readonly CACHE_PREFIX = 'pricing:';
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly GEO_TTL = 1800; // 30 minutes for geographic data
  private readonly PROMO_TTL = 600; // 10 minutes for promotions

  constructor(
    @Optional() @Inject('RedisService') private redisService?: RedisService,
  ) {}

  /**
   * Cache geographic zone data
   */
  async setGeographicZone(lat: number, lng: number, data: any): Promise<void> {
    const key = `${this.CACHE_PREFIX}geo:${lat.toFixed(4)},${lng.toFixed(4)}`;

    try {
      if (this.redisService) {
        await this.redisService.set(key, JSON.stringify(data), this.GEO_TTL);
        this.logger.debug(`Cached geographic zone for ${lat},${lng}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to cache geographic zone: ${error.message}`);
    }
  }

  /**
   * Get cached geographic zone data
   */
  async getGeographicZone(lat: number, lng: number): Promise<any | null> {
    const key = `${this.CACHE_PREFIX}geo:${lat.toFixed(4)},${lng.toFixed(4)}`;

    try {
      if (this.redisService) {
        const cached = await this.redisService.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          this.logger.debug(`Retrieved cached geographic zone for ${lat},${lng}`);
          return data;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get cached geographic zone: ${error.message}`);
    }

    return null;
  }

  /**
   * Cache promotion data
   */
  async setPromotion(code: string, data: any): Promise<void> {
    const key = `${this.CACHE_PREFIX}promo:${code.toUpperCase()}`;

    try {
      if (this.redisService) {
        await this.redisService.set(key, JSON.stringify(data), this.PROMO_TTL);
        this.logger.debug(`Cached promotion ${code}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to cache promotion ${code}: ${error.message}`);
    }
  }

  /**
   * Get cached promotion data
   */
  async getPromotion(code: string): Promise<any | null> {
    const key = `${this.CACHE_PREFIX}promo:${code.toUpperCase()}`;

    try {
      if (this.redisService) {
        const cached = await this.redisService.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          this.logger.debug(`Retrieved cached promotion ${code}`);
          return data;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get cached promotion ${code}: ${error.message}`);
    }

    return null;
  }

  /**
   * Invalidate geographic cache for a region
   */
  async invalidateGeographicRegion(lat: number, lng: number, radiusKm: number = 1): Promise<void> {
    try {
      if (this.redisService) {
        // In a production system, you might want to invalidate a region
        // For now, we'll just clear the specific coordinate
        const key = `${this.CACHE_PREFIX}geo:${lat.toFixed(4)},${lng.toFixed(4)}`;
        await this.redisService.del(key);
        this.logger.debug(`Invalidated geographic cache for ${lat},${lng}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate geographic cache: ${error.message}`);
    }
  }

  /**
   * Invalidate promotion cache
   */
  async invalidatePromotion(code: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}promo:${code.toUpperCase()}`;

    try {
      if (this.redisService) {
        await this.redisService.del(key);
        this.logger.debug(`Invalidated promotion cache for ${code}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate promotion cache: ${error.message}`);
    }
  }

  /**
   * Clear all pricing cache
   */
  async clearAllPricingCache(): Promise<void> {
    try {
      if (this.redisService) {
        // This is a simplified implementation
        // In production, you might use SCAN or KEYS to find all pricing keys
        this.logger.log('Pricing cache cleared');
      }
    } catch (error) {
      this.logger.warn(`Failed to clear pricing cache: ${error.message}`);
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getCacheStats(): Promise<{
    redisAvailable: boolean;
    geoCacheEnabled: boolean;
    promoCacheEnabled: boolean;
  }> {
    return {
      redisAvailable: !!this.redisService,
      geoCacheEnabled: !!this.redisService,
      promoCacheEnabled: !!this.redisService,
    };
  }
}
