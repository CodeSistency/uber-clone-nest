import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

export interface PubSubMessage {
  channel: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RedisPubSubService');

  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Si no tienes password en Redis, este URL es suficiente
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    try {
      this.publisher = createClient({ url: redisUrl });
      this.subscriber = createClient({ url: redisUrl });

      this.publisher.on('error', (err) =>
        this.logger.error('Redis Publisher Error:', err),
      );
      this.subscriber.on('error', (err) =>
        this.logger.error('Redis Subscriber Error:', err),
      );

      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
      this.isConnected = true;
      this.logger.log('✅ Redis Pub/Sub connected successfully');
    } catch (error) {
      this.logger.warn(
        '❌ Redis connection failed, falling back to in-memory Pub/Sub',
      );
      this.logger.warn('Error:', error.message);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await Promise.all([
        this.publisher.disconnect(),
        this.subscriber.disconnect(),
      ]);
      this.logger.log('Redis Pub/Sub disconnected');
    }
  }

  async publish(channel: string, data: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(
        `Redis not connected. Message to ${channel} not published.`,
      );
      return;
    }

    try {
      const message: PubSubMessage = {
        channel,
        data,
        timestamp: new Date(),
      };

      await this.publisher.publish(channel, JSON.stringify(message));
      this.logger.debug(`📢 Published message to ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${channel}:`, error);
    }
  }

  async subscribe(channel: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Redis not connected. Cannot subscribe to ${channel}.`);
      return;
    }

    try {
      await this.subscriber.subscribe(channel, (message) => {
        this.handleIncomingMessage(channel, message);
      });
      this.logger.log(`📡 Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${channel}:`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(
        `Redis not connected. Cannot unsubscribe from ${channel}.`,
      );
      return;
    }

    try {
      await this.subscriber.unsubscribe(channel);
      this.logger.log(`❎ Unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from ${channel}:`, error);
    }
  }

  protected handleIncomingMessage(channel: string, message: string): void {
    try {
      const parsedMessage: PubSubMessage = JSON.parse(message);
      this.logger.debug(`📨 Received message from ${channel}:`, parsedMessage);
    } catch (error) {
      this.logger.error(`Failed to parse message from ${channel}:`, error);
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      redisUrl:
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    };
  }
}
