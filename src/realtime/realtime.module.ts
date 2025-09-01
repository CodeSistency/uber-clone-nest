import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { WebSocketModule } from '../websocket/websocket.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [WebSocketModule, RedisModule],
  controllers: [RealtimeController],
})
export class RealtimeModule {}
