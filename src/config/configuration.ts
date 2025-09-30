import { Config } from './configuration.interface';

/**
 * Configuración principal de la aplicación
 * Centraliza todas las configuraciones usando tipado fuerte
 */
export default (): Config => ({
  // ===============================
  // APP CONFIGURATION
  // ===============================
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment:
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
      'development',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    swagger: {
      enabled: process.env.SWAGGER_ENABLED !== 'false',
      path: process.env.SWAGGER_PATH || 'api',
      title: process.env.SWAGGER_TITLE || 'Uber Clone API',
      description:
        process.env.SWAGGER_DESCRIPTION ||
        'API para aplicación de transporte compartido',
      version: process.env.SWAGGER_VERSION || '1.0',
    },
  },

  // ===============================
  // DATABASE CONFIGURATION
  // ===============================
  database: {
    url: process.env.DATABASE_URL!,
    host: extractDatabaseHost(process.env.DATABASE_URL!),
    port: extractDatabasePort(process.env.DATABASE_URL!),
    username: extractDatabaseUsername(process.env.DATABASE_URL!),
    password: extractDatabasePassword(process.env.DATABASE_URL!),
    database: extractDatabaseName(process.env.DATABASE_URL!),
    ssl: process.env.NODE_ENV === 'production',
  },

  // ===============================
  // FIREBASE CONFIGURATION
  // ===============================
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    initialized: !!(
      process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_SERVICE_ACCOUNT
    ),
  },

  // ===============================
  // TWILIO CONFIGURATION
  // ===============================
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    initialized: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ),
  },

  // ===============================
  // REDIS CONFIGURATION
  // ===============================
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: extractRedisHost(process.env.REDIS_URL || 'redis://localhost:6379'),
    port: extractRedisPort(process.env.REDIS_URL || 'redis://localhost:6379'),
    password: extractRedisPassword(
      process.env.REDIS_URL || 'redis://localhost:6379',
    ),
    db: extractRedisDb(process.env.REDIS_URL || 'redis://localhost:6379'),
  },

  // ===============================
  // STRIPE CONFIGURATION
  // ===============================
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // ===============================
  // JWT CONFIGURATION
  // ===============================
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ===============================
  // CLERK CONFIGURATION
  // ===============================
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY || '',
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    jwtPublicKey: process.env.CLERK_JWT_PUBLIC_KEY || '',
    apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.com/v1',
    frontendApi: process.env.CLERK_FRONTEND_API || 'clerk.your-domain.com',
    domain: process.env.CLERK_DOMAIN || 'your-domain.com',

    // Helper methods
    isConfigured: (): boolean => {
      return !!(
        process.env.CLERK_SECRET_KEY &&
        process.env.CLERK_PUBLISHABLE_KEY &&
        process.env.CLERK_JWT_PUBLIC_KEY
      );
    },
    getBaseUrl: (): string => {
      return process.env.NODE_ENV === 'production'
        ? `https://${process.env.CLERK_DOMAIN || 'your-domain.com'}`
        : 'http://localhost:3000';
    },
  },

  // ===============================
  // NOTIFICATION CONFIGURATION
  // ===============================
  notification: {
    rateLimitPerHour: parseInt(
      process.env.NOTIFICATION_RATE_LIMIT_PER_HOUR || '100',
      10,
    ),
    rateLimitPerMinute: parseInt(
      process.env.NOTIFICATION_RATE_LIMIT_PER_MINUTE || '10',
      10,
    ),
    analyticsEnabled: process.env.NOTIFICATION_ANALYTICS_ENABLED !== 'false',
    retentionDays: parseInt(
      process.env.NOTIFICATION_ANALYTICS_RETENTION_DAYS || '30',
      10,
    ),
  },
});

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
    return urlObj.pathname.slice(1); // Remove leading slash
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
