import { Module } from '@nestjs/common';

// Controllers
import { FeatureFlagsController } from './controllers/feature-flags.controller';
import { APIKeysController } from './controllers/api-keys.controller';

// Services
import { FeatureFlagsService } from './services/feature-flags.service';
import { FeatureFlagsCacheService } from './services/feature-flags-cache.service';
import { APIKeysService } from './services/api-keys.service';
import { APIKeysRotationService } from './services/api-keys-rotation.service';
import { EncryptionService } from './services/encryption.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

// Redis
import { RedisModule } from '../../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [FeatureFlagsController, APIKeysController],
  providers: [
    FeatureFlagsService,
    FeatureFlagsCacheService,
    APIKeysService,
    APIKeysRotationService,
    EncryptionService,
  ],
  exports: [
    FeatureFlagsService,
    FeatureFlagsCacheService,
    APIKeysService,
    EncryptionService,
  ],
})
export class ConfigModule {}
