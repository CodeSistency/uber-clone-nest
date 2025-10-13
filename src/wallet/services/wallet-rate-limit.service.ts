import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

@Injectable()
export class WalletRateLimitService {
  private readonly logger = new Logger(WalletRateLimitService.name);

  // Rate limit configurations for different operations
  private readonly rateLimits: Record<string, RateLimitConfig> = {
    addFunds: {
      maxAttempts: 5, // 5 attempts per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
    },
    transfer: {
      maxAttempts: 10, // 10 attempts per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 1 * 60 * 60 * 1000, // 1 hour
    },
    validate: {
      maxAttempts: 20, // 20 attempts per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    balance: {
      maxAttempts: 30, // 30 attempts per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    transactions: {
      maxAttempts: 50, // 50 attempts per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 10 * 60 * 1000, // 10 minutes
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async checkRateLimit(
    userId: number,
    operation: string,
    ipAddress?: string,
  ): Promise<RateLimitResult> {
    try {
      const config = this.rateLimits[operation];
      if (!config) {
        this.logger.warn(
          `⚠️ Configuración de rate limit no encontrada para operación: ${operation}`,
        );
        return {
          allowed: true,
          remaining: 999,
          resetTime: new Date(Date.now() + 60 * 60 * 1000),
        };
      }

      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Check if user is currently blocked
      const isBlocked = await this.isUserBlocked(userId, operation);
      if (isBlocked) {
        const blockExpiry = await this.getBlockExpiry(userId, operation);
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiry,
          retryAfter: Math.ceil((blockExpiry.getTime() - now.getTime()) / 1000),
        };
      }

      // Count attempts in current window
      const attempts = await this.getAttemptCount(
        userId,
        operation,
        windowStart,
        ipAddress,
      );

      if (attempts >= config.maxAttempts) {
        // Block user for the configured duration
        await this.blockUser(
          userId,
          operation,
          config.blockDurationMs,
          ipAddress,
        );

        const resetTime = new Date(now.getTime() + config.blockDurationMs);
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(config.blockDurationMs / 1000),
        };
      }

      // Record this attempt
      await this.recordAttempt(userId, operation, ipAddress);

      const remaining = config.maxAttempts - attempts - 1;
      const resetTime = new Date(now.getTime() + config.windowMs);

      return {
        allowed: true,
        remaining: Math.max(0, remaining),
        resetTime,
      };
    } catch (error) {
      this.logger.error(`❌ Error verificando rate limit: ${error.message}`);
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
      };
    }
  }

  async resetRateLimit(userId: number, operation: string): Promise<void> {
    try {
      await this.prisma.walletRateLimit.deleteMany({
        where: {
          userId,
          operation,
        },
      });

      this.logger.log(
        `🔄 Rate limit reseteado para usuario ${userId}, operación ${operation}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error reseteando rate limit: ${error.message}`);
    }
  }

  async getRateLimitStatus(
    userId: number,
    operation: string,
  ): Promise<{
    attempts: number;
    maxAttempts: number;
    remaining: number;
    resetTime: Date;
    isBlocked: boolean;
    blockExpiry?: Date;
  }> {
    try {
      const config = this.rateLimits[operation];
      if (!config) {
        throw new Error(
          `Configuración no encontrada para operación: ${operation}`,
        );
      }

      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      const [attempts, isBlocked, blockExpiry] = await Promise.all([
        this.getAttemptCount(userId, operation, windowStart),
        this.isUserBlocked(userId, operation),
        this.getBlockExpiry(userId, operation),
      ]);

      const remaining = Math.max(0, config.maxAttempts - attempts);
      const resetTime = new Date(now.getTime() + config.windowMs);

      return {
        attempts,
        maxAttempts: config.maxAttempts,
        remaining,
        resetTime,
        isBlocked,
        blockExpiry,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo estado de rate limit: ${error.message}`,
      );
      throw error;
    }
  }

  private async getAttemptCount(
    userId: number,
    operation: string,
    windowStart: Date,
    ipAddress?: string,
  ): Promise<number> {
    const where: any = {
      userId,
      operation,
      attemptedAt: { gte: windowStart },
    };

    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    return this.prisma.walletRateLimit.count({ where });
  }

  private async isUserBlocked(
    userId: number,
    operation: string,
  ): Promise<boolean> {
    const block = await this.prisma.walletRateLimit.findFirst({
      where: {
        userId,
        operation,
        isBlocked: true,
        blockedUntil: { gt: new Date() },
      },
    });

    return !!block;
  }

  private async getBlockExpiry(
    userId: number,
    operation: string,
  ): Promise<Date> {
    const block = await this.prisma.walletRateLimit.findFirst({
      where: {
        userId,
        operation,
        isBlocked: true,
        blockedUntil: { gt: new Date() },
      },
      select: { blockedUntil: true },
    });

    return block?.blockedUntil || new Date();
  }

  private async blockUser(
    userId: number,
    operation: string,
    blockDurationMs: number,
    ipAddress?: string,
  ): Promise<void> {
    const blockedUntil = new Date(Date.now() + blockDurationMs);

    await this.prisma.walletRateLimit.create({
      data: {
        userId,
        operation,
        ipAddress,
        isBlocked: true,
        blockedUntil,
        attemptedAt: new Date(),
      },
    });

    this.logger.warn(
      `🚫 Usuario ${userId} bloqueado para operación ${operation} hasta ${blockedUntil.toISOString()}`,
    );
  }

  private async recordAttempt(
    userId: number,
    operation: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.walletRateLimit.create({
      data: {
        userId,
        operation,
        ipAddress,
        isBlocked: false,
        attemptedAt: new Date(),
      },
    });
  }

  // Cleanup old rate limit records
  @Cron('0 0 * * *') // Daily at midnight
  async cleanupOldRecords(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const deleted = await this.prisma.walletRateLimit.deleteMany({
        where: {
          attemptedAt: { lt: cutoffDate },
        },
      });

      this.logger.log(
        `🧹 Limpieza de rate limits: ${deleted.count} registros eliminados`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en limpieza de rate limits: ${error.message}`,
      );
    }
  }
}
