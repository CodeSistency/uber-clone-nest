/**
 * Interfaces de configuración tipadas para NestJS
 * Proporciona tipado fuerte y autocompletado para variables de entorno
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface FirebaseConfig {
  projectId: string;
  serviceAccount: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  initialized: boolean;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  initialized: boolean;
}

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey?: string;
  webhookSecret?: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface ClerkConfig {
  secretKey: string;
  publishableKey: string;
  jwtPublicKey: string;
  apiUrl: string;
  frontendApi: string;
  domain: string;
  isConfigured: () => boolean;
  getBaseUrl: () => string;
}

export interface NotificationConfig {
  rateLimitPerHour: number;
  rateLimitPerMinute: number;
  analyticsEnabled: boolean;
  retentionDays: number;
}

export interface ReferralConfig {
  // Code Configuration
  codeLength: number;
  maxReferralsPerUser: number;
  codeExpiryDays: number;

  // Reward Configuration
  referrerBaseReward: number;
  refereeBaseReward: number;
  advancedMultiplier: number;
  vipMultiplier: number;

  // Limits Configuration
  maxFreeRidesPerUser: number;
  creditValidityDays: number;
  freeRideValidityDays: number;
  minRideAmount: number;
  maxRewardPerRide: number;
  tierUpgradeThreshold: number;
  vipThreshold: number;

  // Processing Configuration
  autoProcess: boolean;
  processDelayMinutes: number;
  maxProcessingAttempts: number;

  // Analytics & Security
  analyticsEnabled: boolean;
  fraudDetectionEnabled: boolean;
  maxSameIpReferrals: number;
}

export interface MinioConfig {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
  bucketName: string;
  region: string;
  publicUrl?: string;
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  swagger: {
    enabled: boolean;
    path: string;
    title: string;
    description: string;
    version: string;
  };
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  firebase: FirebaseConfig;
  twilio: TwilioConfig;
  redis: RedisConfig;
  stripe: StripeConfig;
  jwt: JWTConfig;
  clerk: ClerkConfig;
  notification: NotificationConfig;
  referral: ReferralConfig;
  minio: MinioConfig;
}
