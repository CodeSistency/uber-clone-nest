import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './configuration.interface';

/**
 * Servicio de configuración personalizado
 * Proporciona acceso tipado fuerte a todas las configuraciones
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // ===============================
  // APP CONFIGURATION
  // ===============================
  get app() {
    return {
      port: parseInt(this.configService.get<string>('PORT', '3000'), 10),
      environment: this.configService.get<
        'development' | 'production' | 'test'
      >('NODE_ENV', 'development'),
      cors: {
        origin: this.configService.get<string>('CORS_ORIGIN', '*'),
        credentials:
          this.configService.get<string>('CORS_CREDENTIALS', 'true') === 'true',
      },
      swagger: {
        enabled:
          this.configService.get<string>('SWAGGER_ENABLED', 'true') === 'true',
        path: this.configService.get<string>('SWAGGER_PATH', 'api'),
        title: this.configService.get<string>(
          'SWAGGER_TITLE',
          'Uber Clone API',
        ),
        description: this.configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'API para aplicación de transporte compartido',
        ),
        version: this.configService.get<string>('SWAGGER_VERSION', '1.0'),
      },
    };
  }

  // ===============================
  // DATABASE CONFIGURATION
  // ===============================
  get database() {
    const url = this.configService.get<string>('DATABASE_URL');
    return {
      url: url || '',
      host: extractDatabaseHost(url || ''),
      port: extractDatabasePort(url || ''),
      username: extractDatabaseUsername(url || ''),
      password: extractDatabasePassword(url || ''),
      database: extractDatabaseName(url || ''),
      ssl: this.app.environment === 'production',
    };
  }

  // ===============================
  // FIREBASE CONFIGURATION
  // ===============================
  get firebase() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const serviceAccount = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT',
    );

    return {
      projectId: projectId || '',
      serviceAccount: serviceAccount || '',
      storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.configService.get<string>(
        'FIREBASE_MESSAGING_SENDER_ID',
      ),
      appId: this.configService.get<string>('FIREBASE_APP_ID'),
      measurementId: this.configService.get<string>('FIREBASE_MEASUREMENT_ID'),
      initialized: !!(projectId && serviceAccount),
      isConfigured: (): boolean => {
        return !!(projectId && serviceAccount);
      },
    };
  }

  // ===============================
  // TWILIO CONFIGURATION
  // ===============================
  get twilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    return {
      accountSid: accountSid || '',
      authToken: authToken || '',
      phoneNumber: phoneNumber || '',
      initialized: !!(accountSid && authToken && phoneNumber),
      isConfigured: (): boolean => {
        return !!(accountSid && authToken && phoneNumber);
      },
    };
  }

  // ===============================
  // REDIS CONFIGURATION
  // ===============================
  get redis() {
    const url = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    return {
      url: url || 'redis://localhost:6379',
      host: extractRedisHost(url || 'redis://localhost:6379'),
      port: extractRedisPort(url || 'redis://localhost:6379'),
      password: extractRedisPassword(url || 'redis://localhost:6379'),
      db: extractRedisDb(url || 'redis://localhost:6379'),
    };
  }

  // ===============================
  // STRIPE CONFIGURATION
  // ===============================
  get stripe() {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    return {
      secretKey: secretKey || '',
      webhookSecret: this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      isConfigured: (): boolean => {
        return !!secretKey;
      },
    };
  }

  // ===============================
  // JWT CONFIGURATION
  // ===============================
  get jwt() {
    return {
      secret: this.configService.get<string>('JWT_SECRET') || '',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      refreshExpiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ),
    };
  }

  // ===============================
  // CLERK CONFIGURATION
  // ===============================
  get clerk() {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    const publishableKey = this.configService.get<string>(
      'CLERK_PUBLISHABLE_KEY',
    );
    const jwtPublicKey = this.configService.get<string>('CLERK_JWT_PUBLIC_KEY');
    const apiUrl = this.configService.get<string>(
      'CLERK_API_URL',
      'https://api.clerk.com/v1',
    );
    const frontendApi = this.configService.get<string>(
      'CLERK_FRONTEND_API',
      'clerk.your-domain.com',
    );
    const domain = this.configService.get<string>(
      'CLERK_DOMAIN',
      'your-domain.com',
    );

    return {
      secretKey: secretKey || '',
      publishableKey: publishableKey || '',
      jwtPublicKey: jwtPublicKey || '',
      apiUrl: apiUrl || 'https://api.clerk.com/v1',
      frontendApi: frontendApi || 'clerk.your-domain.com',
      domain: domain || 'your-domain.com',

      // Helper methods
      isConfigured: (): boolean => {
        return !!(secretKey && publishableKey && jwtPublicKey);
      },
      getBaseUrl: (): string => {
        return this.app.environment === 'production'
          ? `https://${domain}`
          : 'http://localhost:3000';
      },
    };
  }

  // ===============================
  // NOTIFICATION CONFIGURATION
  // ===============================
  get notification() {
    return {
      rateLimitPerHour: parseInt(
        this.configService.get<string>(
          'NOTIFICATION_RATE_LIMIT_PER_HOUR',
          '100',
        ),
        10,
      ),
      rateLimitPerMinute: parseInt(
        this.configService.get<string>(
          'NOTIFICATION_RATE_LIMIT_PER_MINUTE',
          '10',
        ),
        10,
      ),
      analyticsEnabled:
        this.configService.get<string>(
          'NOTIFICATION_ANALYTICS_ENABLED',
          'true',
        ) === 'true',
      retentionDays: parseInt(
        this.configService.get<string>(
          'NOTIFICATION_ANALYTICS_RETENTION_DAYS',
          '30',
        ),
        10,
      ),
    };
  }

  // ===============================
  // REFERRAL SYSTEM CONFIGURATION
  // ===============================
  get referral() {
    return {
      // Code Configuration
      codeLength: parseInt(
        this.configService.get<string>('REFERRAL_CODE_LENGTH', '12'),
        10,
      ),
      maxReferralsPerUser: parseInt(
        this.configService.get<string>('MAX_REFERRALS_PER_USER', '100'),
        10,
      ),
      codeExpiryDays: parseInt(
        this.configService.get<string>('REFERRAL_CODE_EXPIRY_DAYS', '365'),
        10,
      ),

      // Reward Configuration
      referrerBaseReward: parseFloat(
        this.configService.get<string>('REFERRAL_REWARD_REFERRER_BASE', '5.00'),
      ),
      refereeBaseReward: parseFloat(
        this.configService.get<string>('REFERRAL_REWARD_REFEREE_BASE', '10.00'),
      ),
      advancedMultiplier: parseFloat(
        this.configService.get<string>(
          'REFERRAL_REWARD_ADVANCED_MULTIPLIER',
          '1.5',
        ),
      ),
      vipMultiplier: parseFloat(
        this.configService.get<string>('REFERRAL_REWARD_VIP_MULTIPLIER', '2.0'),
      ),

      // Limits Configuration
      maxFreeRidesPerUser: parseInt(
        this.configService.get<string>('MAX_FREE_RIDES_PER_USER', '5'),
        10,
      ),
      creditValidityDays: parseInt(
        this.configService.get<string>('REFERRAL_CREDIT_VALIDITY_DAYS', '30'),
        10,
      ),
      freeRideValidityDays: parseInt(
        this.configService.get<string>(
          'REFERRAL_FREE_RIDE_VALIDITY_DAYS',
          '60',
        ),
        10,
      ),

      // Processing Configuration
      autoProcess:
        this.configService.get<string>('REFERRAL_AUTO_PROCESS', 'true') ===
        'true',
      processDelayMinutes: parseInt(
        this.configService.get<string>('REFERRAL_PROCESS_DELAY_MINUTES', '5'),
        10,
      ),
      maxProcessingAttempts: parseInt(
        this.configService.get<string>('REFERRAL_MAX_PROCESSING_ATTEMPTS', '3'),
        10,
      ),

      // Analytics & Security
      analyticsEnabled:
        this.configService.get<string>('REFERRAL_ANALYTICS_ENABLED', 'true') ===
        'true',
      fraudDetectionEnabled:
        this.configService.get<string>(
          'REFERRAL_FRAUD_DETECTION_ENABLED',
          'true',
        ) === 'true',
      maxSameIpReferrals: parseInt(
        this.configService.get<string>('REFERRAL_MAX_SAME_IP_REFERRALS', '3'),
        10,
      ),
    };
  }

  // ===============================
  // MINIO CONFIGURATION
  // ===============================
  get minio() {
    return {
      endpoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      bucketName: this.configService.get<string>('MINIO_BUCKET_NAME', 'uber-clone-uploads'),
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      publicUrl: this.configService.get<string>('MINIO_PUBLIC_URL'),
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================
  isProduction(): boolean {
    return this.app.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.app.environment === 'development';
  }

  isTest(): boolean {
    return this.app.environment === 'test';
  }

  getAllConfig(): any {
    return {
      app: this.app,
      database: this.database,
      firebase: this.firebase,
      twilio: this.twilio,
      redis: this.redis,
      stripe: this.stripe,
      jwt: this.jwt,
      clerk: this.clerk,
      notification: this.notification,
      referral: this.referral,
      minio: this.minio,
    };
  }

  // Método para obtener cualquier variable de entorno con tipado
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(key) || defaultValue;
  }
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function extractDatabaseHost(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'localhost';
  }
}

function extractDatabasePort(url: string): number {
  try {
    const urlObj = new URL(url);
    return parseInt(urlObj.port || '5432', 10);
  } catch {
    return 5432;
  }
}

function extractDatabaseUsername(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.username;
  } catch {
    return 'postgres';
  }
}

function extractDatabasePassword(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.password;
  } catch {
    return '';
  }
}

function extractDatabaseName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.slice(1); // Remove leading slash
  } catch {
    return 'uber_clone';
  }
}

function extractRedisHost(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'localhost';
  }
}

function extractRedisPort(url: string): number {
  try {
    const urlObj = new URL(url);
    return parseInt(urlObj.port || '6379', 10);
  } catch {
    return 6379;
  }
}

function extractRedisPassword(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.password || undefined;
  } catch {
    return undefined;
  }
}

function extractRedisDb(url: string): number {
  try {
    const urlObj = new URL(url);
    const db = urlObj.pathname?.slice(1); // Remove leading slash
    return db ? parseInt(db, 10) : 0;
  } catch {
    return 0;
  }
}
