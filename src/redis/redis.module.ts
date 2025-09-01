import { Module } from '@nestjs/common';
import { RedisPubSubService } from './redis-pubsub.service';
import { LocationTrackingService } from './location-tracking.service';

@Module({
  providers: [RedisPubSubService, LocationTrackingService],
  exports: [RedisPubSubService, LocationTrackingService],
})
export class RedisModule {}
