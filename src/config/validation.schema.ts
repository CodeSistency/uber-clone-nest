import * as Joi from 'joi';

/**
 * Esquema de validación para variables de entorno usando Joi
 * Proporciona validación robusta y mensajes de error descriptivos
 */

export const validationSchema = Joi.object({
  // ===============================
  // APP CONFIGURATION
  // ===============================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  // ===============================
  // DATABASE CONFIGURATION
  // ===============================
  DATABASE_URL: Joi.string()
    .required()
    .pattern(/^postgresql:\/\/.+$/)
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe ser una URL válida de PostgreSQL',
      'any.required': 'DATABASE_URL es requerido',
    }),

  // ===============================
  // FIREBASE CONFIGURATION (OPCIONAL)
  // ===============================
  FIREBASE_PROJECT_ID: Joi.string().optional(),

  FIREBASE_SERVICE_ACCOUNT: Joi.string().optional(),

  FIREBASE_STORAGE_BUCKET: Joi.string().optional(),

  FIREBASE_MESSAGING_SENDER_ID: Joi.string().optional(),

  FIREBASE_APP_ID: Joi.string().optional(),

  FIREBASE_MEASUREMENT_ID: Joi.string().optional(),

  // ===============================
  // TWILIO CONFIGURATION (OPCIONAL)
  // ===============================
  TWILIO_ACCOUNT_SID: Joi.string().optional(),

  TWILIO_AUTH_TOKEN: Joi.string().optional(),

  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // ===============================
  // REDIS CONFIGURATION
  // ===============================
  REDIS_URL: Joi.string()
    .default('redis://localhost:6379')
    .pattern(/^redis:\/\/.+$/)
    .messages({
      'string.pattern.base': 'REDIS_URL debe ser una URL válida de Redis',
    }),

  // ===============================
  // STRIPE CONFIGURATION (OPCIONAL)
  // ===============================
  STRIPE_SECRET_KEY: Joi.string()
    .optional()
    .pattern(/^(sk_test_|sk_live_)[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base':
        'STRIPE_SECRET_KEY debe comenzar con sk_test_ o sk_live_',
    }),

  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // ===============================
  // JWT CONFIGURATION
  // ===============================
  JWT_SECRET: Joi.string().required().min(32).messages({
    'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
    'any.required': 'JWT_SECRET es requerido',
  }),

  JWT_EXPIRES_IN: Joi.string()
    .default('1h')
    .pattern(/^\d+[smhd]$/)
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN debe tener formato como "1h", "30m", "7d"',
    }),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .pattern(/^\d+[smhd]$/)
    .messages({
      'string.pattern.base':
        'JWT_REFRESH_EXPIRES_IN debe tener formato como "1h", "30m", "7d"',
    }),

  // ===============================
  // CORS CONFIGURATION
  // ===============================
  CORS_ORIGIN: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .default('*'),

  CORS_CREDENTIALS: Joi.boolean().default(true),

  // ===============================
  // SWAGGER CONFIGURATION
  // ===============================
  SWAGGER_ENABLED: Joi.boolean().default(true),

  SWAGGER_PATH: Joi.string().default('api'),

  SWAGGER_TITLE: Joi.string().default('Uber Clone API'),

  SWAGGER_DESCRIPTION: Joi.string().default(
    'API para aplicación de transporte compartido',
  ),

  SWAGGER_VERSION: Joi.string().default('1.0'),

  // ===============================
  // CLERK CONFIGURATION (OPCIONAL)
  // ===============================
  CLERK_SECRET_KEY: Joi.string()
    .optional()
    .pattern(/^(sk_test_|sk_live_)[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base':
        'CLERK_SECRET_KEY debe comenzar con sk_test_ o sk_live_',
    }),

  CLERK_PUBLISHABLE_KEY: Joi.string()
    .optional()
    .pattern(/^(pk_test_|pk_live_)[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base':
        'CLERK_PUBLISHABLE_KEY debe comenzar con pk_test_ o pk_live_',
    }),

  CLERK_JWT_PUBLIC_KEY: Joi.string()
    .optional()
    .min(20) // Mínima longitud razonable para una clave
    .messages({
      'string.min': 'CLERK_JWT_PUBLIC_KEY debe tener al menos 20 caracteres',
    }),

  CLERK_API_URL: Joi.string()
    .optional()
    .default('https://api.clerk.com/v1')
    .pattern(/^https:\/\/.+$/)
    .messages({
      'string.pattern.base': 'CLERK_API_URL debe ser una URL HTTPS válida',
    }),

  CLERK_FRONTEND_API: Joi.string().optional().default('clerk.your-domain.com'),

  CLERK_DOMAIN: Joi.string().optional().default('your-domain.com'),

  // ===============================
  // NOTIFICATION CONFIGURATION
  // ===============================
  NOTIFICATION_RATE_LIMIT_PER_HOUR: Joi.number()
    .min(1)
    .max(10000)
    .default(100)
    .messages({
      'number.min': 'NOTIFICATION_RATE_LIMIT_PER_HOUR debe ser mayor a 0',
      'number.max': 'NOTIFICATION_RATE_LIMIT_PER_HOUR debe ser menor a 10000',
    }),

  NOTIFICATION_RATE_LIMIT_PER_MINUTE: Joi.number()
    .min(1)
    .max(1000)
    .default(10)
    .messages({
      'number.min': 'NOTIFICATION_RATE_LIMIT_PER_MINUTE debe ser mayor a 0',
      'number.max': 'NOTIFICATION_RATE_LIMIT_PER_MINUTE debe ser menor a 1000',
    }),

  NOTIFICATION_ANALYTICS_ENABLED: Joi.boolean().default(true),

  NOTIFICATION_ANALYTICS_RETENTION_DAYS: Joi.number()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.min': 'NOTIFICATION_ANALYTICS_RETENTION_DAYS debe ser mayor a 0',
      'number.max':
        'NOTIFICATION_ANALYTICS_RETENTION_DAYS debe ser menor a 365',
    }),

  // ===============================
  // REFERRAL SYSTEM CONFIGURATION
  // ===============================
  REFERRAL_CODE_LENGTH: Joi.number().min(8).max(20).default(12).messages({
    'number.min': 'REFERRAL_CODE_LENGTH debe ser mayor o igual a 8',
    'number.max': 'REFERRAL_CODE_LENGTH debe ser menor o igual a 20',
  }),

  REFERRAL_CODE_EXPIRY_DAYS: Joi.number()
    .min(1)
    .max(3650)
    .default(365)
    .messages({
      'number.min': 'REFERRAL_CODE_EXPIRY_DAYS debe ser mayor a 0',
      'number.max': 'REFERRAL_CODE_EXPIRY_DAYS debe ser menor a 3650',
    }),

  MAX_REFERRALS_PER_USER: Joi.number().min(1).max(1000).default(100).messages({
    'number.min': 'MAX_REFERRALS_PER_USER debe ser mayor a 0',
    'number.max': 'MAX_REFERRALS_PER_USER debe ser menor a 1000',
  }),

  REFERRAL_REWARD_REFERRER_BASE: Joi.number()
    .min(0)
    .max(1000)
    .default(5.0)
    .messages({
      'number.min': 'REFERRAL_REWARD_REFERRER_BASE debe ser mayor o igual a 0',
      'number.max': 'REFERRAL_REWARD_REFERRER_BASE debe ser menor a 1000',
    }),

  REFERRAL_REWARD_REFEREE_BASE: Joi.number()
    .min(0)
    .max(1000)
    .default(10.0)
    .messages({
      'number.min': 'REFERRAL_REWARD_REFEREE_BASE debe ser mayor o igual a 0',
      'number.max': 'REFERRAL_REWARD_REFEREE_BASE debe ser menor a 1000',
    }),

  REFERRAL_REWARD_ADVANCED_MULTIPLIER: Joi.number()
    .min(0.1)
    .max(10)
    .default(1.5)
    .messages({
      'number.min': 'REFERRAL_REWARD_ADVANCED_MULTIPLIER debe ser mayor a 0.1',
      'number.max': 'REFERRAL_REWARD_ADVANCED_MULTIPLIER debe ser menor a 10',
    }),

  REFERRAL_REWARD_VIP_MULTIPLIER: Joi.number()
    .min(0.1)
    .max(10)
    .default(2.0)
    .messages({
      'number.min': 'REFERRAL_REWARD_VIP_MULTIPLIER debe ser mayor a 0.1',
      'number.max': 'REFERRAL_REWARD_VIP_MULTIPLIER debe ser menor a 10',
    }),

  MAX_FREE_RIDES_PER_USER: Joi.number().min(0).max(100).default(5).messages({
    'number.min': 'MAX_FREE_RIDES_PER_USER debe ser mayor o igual a 0',
    'number.max': 'MAX_FREE_RIDES_PER_USER debe ser menor a 100',
  }),

  REFERRAL_CREDIT_VALIDITY_DAYS: Joi.number()
    .min(1)
    .max(3650)
    .default(30)
    .messages({
      'number.min': 'REFERRAL_CREDIT_VALIDITY_DAYS debe ser mayor a 0',
      'number.max': 'REFERRAL_CREDIT_VALIDITY_DAYS debe ser menor a 3650',
    }),

  REFERRAL_FREE_RIDE_VALIDITY_DAYS: Joi.number()
    .min(1)
    .max(3650)
    .default(60)
    .messages({
      'number.min': 'REFERRAL_FREE_RIDE_VALIDITY_DAYS debe ser mayor a 0',
      'number.max': 'REFERRAL_FREE_RIDE_VALIDITY_DAYS debe ser menor a 3650',
    }),

  REFERRAL_AUTO_PROCESS: Joi.boolean().default(true),

  REFERRAL_PROCESS_DELAY_MINUTES: Joi.number()
    .min(0)
    .max(1440)
    .default(5)
    .messages({
      'number.min': 'REFERRAL_PROCESS_DELAY_MINUTES debe ser mayor o igual a 0',
      'number.max': 'REFERRAL_PROCESS_DELAY_MINUTES debe ser menor a 1440',
    }),

  REFERRAL_MAX_PROCESSING_ATTEMPTS: Joi.number()
    .min(1)
    .max(10)
    .default(3)
    .messages({
      'number.min': 'REFERRAL_MAX_PROCESSING_ATTEMPTS debe ser mayor a 0',
      'number.max': 'REFERRAL_MAX_PROCESSING_ATTEMPTS debe ser menor a 10',
    }),

  REFERRAL_ANALYTICS_ENABLED: Joi.boolean().default(true),

  REFERRAL_FRAUD_DETECTION_ENABLED: Joi.boolean().default(true),

  REFERRAL_MAX_SAME_IP_REFERRALS: Joi.number()
    .min(1)
    .max(100)
    .default(3)
    .messages({
      'number.min': 'REFERRAL_MAX_SAME_IP_REFERRALS debe ser mayor a 0',
      'number.max': 'REFERRAL_MAX_SAME_IP_REFERRALS debe ser menor a 100',
    }),

  // ===============================
  // MINIO CONFIGURATION
  // ===============================
  MINIO_ENDPOINT: Joi.string().default('localhost').messages({
    'string.base': 'MINIO_ENDPOINT debe ser una cadena de texto',
  }),

  MINIO_PORT: Joi.number().min(1).max(65535).default(9000).messages({
    'number.min': 'MINIO_PORT debe ser mayor a 0',
    'number.max': 'MINIO_PORT debe ser menor a 65535',
  }),

  MINIO_ACCESS_KEY: Joi.string()
    .min(3)
    .max(100)
    .default('minioadmin')
    .messages({
      'string.min': 'MINIO_ACCESS_KEY debe tener al menos 3 caracteres',
      'string.max': 'MINIO_ACCESS_KEY debe tener máximo 100 caracteres',
    }),

  MINIO_SECRET_KEY: Joi.string()
    .min(3)
    .max(100)
    .default('minioadmin')
    .messages({
      'string.min': 'MINIO_SECRET_KEY debe tener al menos 3 caracteres',
      'string.max': 'MINIO_SECRET_KEY debe tener máximo 100 caracteres',
    }),

  MINIO_USE_SSL: Joi.boolean().default(false),

  MINIO_BUCKET_NAME: Joi.string()
    .min(3)
    .max(63)
    .pattern(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .default('uber-clone-uploads')
    .messages({
      'string.min': 'MINIO_BUCKET_NAME debe tener al menos 3 caracteres',
      'string.max': 'MINIO_BUCKET_NAME debe tener máximo 63 caracteres',
      'string.pattern.base':
        'MINIO_BUCKET_NAME debe seguir el formato de nombres de bucket S3',
    }),

  MINIO_REGION: Joi.string().default('us-east-1').messages({
    'string.base': 'MINIO_REGION debe ser una cadena de texto',
  }),

  MINIO_PUBLIC_URL: Joi.string().uri().optional().messages({
    'string.uri': 'MINIO_PUBLIC_URL debe ser una URL válida',
  }),
});
