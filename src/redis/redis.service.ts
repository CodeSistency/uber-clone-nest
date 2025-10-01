import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private isReadOnly: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
        // Check if it's a read-only replica error
        if (err.message && err.message.includes('READONLY')) {
          this.logger.warn(
            'Redis is configured as read-only replica. Cache writes will be skipped.',
          );
        }
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      await this.client.connect();

      // Test if we can write to Redis (check if it's read-only)
      try {
        await this.client.setEx('redis:health:check', 10, 'ok');
        this.logger.log('Redis write test successful');
      } catch (writeError: any) {
        if (writeError.message && writeError.message.includes('READONLY')) {
          this.logger.warn(
            'Redis is read-only. Cache operations will fallback to database queries.',
          );
          this.isReadOnly = true;
        } else {
          this.logger.error('Redis write test failed:', writeError);
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    // Skip write operations if Redis is read-only
    if (this.isReadOnly) {
      this.logger.debug(
        `Skipping set operation for key ${key} - Redis is read-only`,
      );
      return;
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error: any) {
      if (error.message && error.message.includes('READONLY')) {
        this.logger.warn(
          `Redis is read-only. Skipping set operation for key ${key}`,
        );
        this.isReadOnly = true;
        return;
      }
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async del(...keys: string[]): Promise<number> {
    // Skip write operations if Redis is read-only
    if (this.isReadOnly) {
      this.logger.debug(
        `Skipping del operation for keys ${keys} - Redis is read-only`,
      );
      return keys.length; // Return number of keys as if they were deleted
    }

    try {
      return await this.client.del(keys);
    } catch (error: any) {
      if (error.message && error.message.includes('READONLY')) {
        this.logger.warn(
          `Redis is read-only. Skipping del operation for keys ${keys}`,
        );
        this.isReadOnly = true;
        return keys.length;
      }
      this.logger.error(`Error deleting keys ${keys}:`, error);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async exists(...keys: string[]): Promise<number> {
    try {
      return await this.client.exists(keys);
    } catch (error) {
      this.logger.error(`Error checking existence of keys ${keys}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    // Skip write operations if Redis is read-only
    if (this.isReadOnly) {
      this.logger.debug(
        `Skipping expire operation for key ${key} - Redis is read-only`,
      );
      return 1; // Return 1 to indicate "success" for read-only mode
    }

    try {
      return await this.client.expire(key, seconds);
    } catch (error: any) {
      if (error.message && error.message.includes('READONLY')) {
        this.logger.warn(
          `Redis is read-only. Skipping expire operation for key ${key}`,
        );
        this.isReadOnly = true;
        return 1;
      }
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async incr(key: string): Promise<number> {
    // Skip write operations if Redis is read-only
    if (this.isReadOnly) {
      this.logger.debug(
        `Skipping incr operation for key ${key} - Redis is read-only`,
      );
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error: any) {
      if (error.message && error.message.includes('READONLY')) {
        this.logger.warn(
          `Redis is read-only. Skipping incr operation for key ${key}`,
        );
        this.isReadOnly = true;
        return 0;
      }
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    // Skip write operations if Redis is read-only
    if (this.isReadOnly) {
      this.logger.debug(
        `Skipping incrBy operation for key ${key} - Redis is read-only`,
      );
      return 0;
    }

    try {
      return await this.client.incrBy(key, increment);
    } catch (error: any) {
      if (error.message && error.message.includes('READONLY')) {
        this.logger.warn(
          `Redis is read-only. Skipping incrBy operation for key ${key}`,
        );
        this.isReadOnly = true;
        return 0;
      }
      this.logger.error(
        `Error incrementing key ${key} by ${increment}:`,
        error,
      );
      return 0;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      this.logger.error(
        `Error getting hash field ${field} from key ${key}:`,
        error,
      );
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value);
    } catch (error) {
      this.logger.error(
        `Error setting hash field ${field} in key ${key}:`,
        error,
      );
      return 0;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.client.hDel(key, fields);
    } catch (error) {
      this.logger.error(
        `Error deleting hash fields ${fields} from key ${key}:`,
        error,
      );
      return 0;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      this.logger.error(
        `Error getting all hash fields from key ${key}:`,
        error,
      );
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      return 0;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lPop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      this.logger.error(`Error getting list length for key ${key}:`, error);
      return 0;
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      this.logger.error(`Error adding to set ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sRem(key, members);
    } catch (error) {
      this.logger.error(`Error removing from set ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      this.logger.error(`Error getting set members for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<number> {
    try {
      const result = await this.client.sIsMember(key, member);
      return result ? 1 : 0;
    } catch (error) {
      this.logger.error(`Error checking set membership for key ${key}:`, error);
      return 0;
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      throw error;
    }
  }

  async flushall(): Promise<void> {
    try {
      await this.client.flushAll();
      this.logger.warn('All Redis data flushed');
    } catch (error) {
      this.logger.error('Error flushing all data:', error);
      throw error;
    }
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  // Get raw client for advanced operations
  getClient(): RedisClientType {
    return this.client;
  }
}
