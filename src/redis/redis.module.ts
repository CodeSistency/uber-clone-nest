import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisPubSubService } from './redis-pubsub.service';
import { LocationTrackingService } from './location-tracking.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [RedisService, RedisPubSubService, LocationTrackingService],
  exports: [RedisService, RedisPubSubService, LocationTrackingService],
})
export class RedisModule {}
