import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import configuration from './configuration';
import { validationSchema } from './validation.schema';

/**
 * Módulo de configuración global
 * Proporciona configuración tipada y validada para toda la aplicación
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath: ['.env.local', '.env', '.env.example'].filter((path) => {
        try {
          require('fs').accessSync(path);
          return true;
        } catch {
          return false;
        }
      }),
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
