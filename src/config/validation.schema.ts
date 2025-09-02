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

  PORT: Joi.number()
    .default(3000),

  // ===============================
  // DATABASE CONFIGURATION
  // ===============================
  DATABASE_URL: Joi.string()
    .required()
    .pattern(/^postgresql:\/\/.+$/)
    .messages({
      'string.pattern.base': 'DATABASE_URL debe ser una URL válida de PostgreSQL',
      'any.required': 'DATABASE_URL es requerido'
    }),

  // ===============================
  // FIREBASE CONFIGURATION (OPCIONAL)
  // ===============================
  FIREBASE_PROJECT_ID: Joi.string()
    .optional(),

  FIREBASE_SERVICE_ACCOUNT: Joi.string()
    .optional(),

  FIREBASE_STORAGE_BUCKET: Joi.string()
    .optional(),

  FIREBASE_MESSAGING_SENDER_ID: Joi.string()
    .optional(),

  FIREBASE_APP_ID: Joi.string()
    .optional(),

  FIREBASE_MEASUREMENT_ID: Joi.string()
    .optional(),

  // ===============================
  // TWILIO CONFIGURATION (OPCIONAL)
  // ===============================
  TWILIO_ACCOUNT_SID: Joi.string()
    .optional(),

  TWILIO_AUTH_TOKEN: Joi.string()
    .optional(),

  TWILIO_PHONE_NUMBER: Joi.string()
    .optional(),

  // ===============================
  // REDIS CONFIGURATION
  // ===============================
  REDIS_URL: Joi.string()
    .default('redis://localhost:6379')
    .pattern(/^redis:\/\/.+$/)
    .messages({
      'string.pattern.base': 'REDIS_URL debe ser una URL válida de Redis'
    }),

  // ===============================
  // STRIPE CONFIGURATION (OPCIONAL)
  // ===============================
  STRIPE_SECRET_KEY: Joi.string()
    .optional()
    .pattern(/^(sk_test_|sk_live_)[a-zA-Z0-9]+$/)
    .messages({
      'string.pattern.base': 'STRIPE_SECRET_KEY debe comenzar con sk_test_ o sk_live_'
    }),

  STRIPE_WEBHOOK_SECRET: Joi.string()
    .optional(),

  // ===============================
  // JWT CONFIGURATION
  // ===============================
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .messages({
      'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
      'any.required': 'JWT_SECRET es requerido'
    }),

  JWT_EXPIRES_IN: Joi.string()
    .default('1h')
    .pattern(/^\d+[smhd]$/)
    .messages({
      'string.pattern.base': 'JWT_EXPIRES_IN debe tener formato como "1h", "30m", "7d"'
    }),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .pattern(/^\d+[smhd]$/)
    .messages({
      'string.pattern.base': 'JWT_REFRESH_EXPIRES_IN debe tener formato como "1h", "30m", "7d"'
    }),

  // ===============================
  // CORS CONFIGURATION
  // ===============================
  CORS_ORIGIN: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string())
    )
    .default('*'),

  CORS_CREDENTIALS: Joi.boolean()
    .default(true),

  // ===============================
  // SWAGGER CONFIGURATION
  // ===============================
  SWAGGER_ENABLED: Joi.boolean()
    .default(true),

  SWAGGER_PATH: Joi.string()
    .default('api'),

  SWAGGER_TITLE: Joi.string()
    .default('Uber Clone API'),

  SWAGGER_DESCRIPTION: Joi.string()
    .default('API para aplicación de transporte compartido'),

  SWAGGER_VERSION: Joi.string()
    .default('1.0'),

  // ===============================
  // NOTIFICATION CONFIGURATION
  // ===============================
  NOTIFICATION_RATE_LIMIT_PER_HOUR: Joi.number()
    .min(1)
    .max(10000)
    .default(100)
    .messages({
      'number.min': 'NOTIFICATION_RATE_LIMIT_PER_HOUR debe ser mayor a 0',
      'number.max': 'NOTIFICATION_RATE_LIMIT_PER_HOUR debe ser menor a 10000'
    }),

  NOTIFICATION_RATE_LIMIT_PER_MINUTE: Joi.number()
    .min(1)
    .max(1000)
    .default(10)
    .messages({
      'number.min': 'NOTIFICATION_RATE_LIMIT_PER_MINUTE debe ser mayor a 0',
      'number.max': 'NOTIFICATION_RATE_LIMIT_PER_MINUTE debe ser menor a 1000'
    }),

  NOTIFICATION_ANALYTICS_ENABLED: Joi.boolean()
    .default(true),

  NOTIFICATION_ANALYTICS_RETENTION_DAYS: Joi.number()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.min': 'NOTIFICATION_ANALYTICS_RETENTION_DAYS debe ser mayor a 0',
      'number.max': 'NOTIFICATION_ANALYTICS_RETENTION_DAYS debe ser menor a 365'
    }),
});
