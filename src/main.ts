import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/exceptions/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfigService } from './config/config.service';

async function logEnvironmentConfig(configService: AppConfigService) {
  console.log('\n🔍 ENVIRONMENT CONFIGURATION DEBUG');
  console.log('=====================================');

  // App config
  console.log('\n🏗️  APP CONFIG:');
  console.log(`- Port: ${configService.app.port}`);
  console.log(`- Environment: ${configService.app.environment}`);
  console.log(`- CORS Origin: ${configService.app.cors.origin}`);
  console.log(`- CORS Credentials: ${configService.app.cors.credentials}`);

  // Database config
  console.log('\n🗄️  DATABASE CONFIG:');
  console.log(`- URL: ${configService.database.url ? '✅ Set' : '❌ Not set'}`);
  console.log(`- Host: ${configService.database.host}`);
  console.log(`- Port: ${configService.database.port}`);
  console.log(`- Username: ${configService.database.username}`);
  console.log(
    `- Password: ${configService.database.password ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(`- Database: ${configService.database.database}`);
  console.log(`- SSL: ${configService.database.ssl}`);

  // Firebase config
  console.log('\n🔥 FIREBASE CONFIG:');
  console.log(
    `- Project ID: ${configService.firebase.projectId || '❌ Not set'}`,
  );
  console.log(
    `- Service Account: ${configService.firebase.serviceAccount ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(`- Initialized: ${configService.firebase.initialized}`);
  console.log(
    `- Storage Bucket: ${configService.firebase.storageBucket || 'Not set'}`,
  );
  console.log(
    `- Messaging Sender ID: ${configService.firebase.messagingSenderId || 'Not set'}`,
  );

  // Raw environment variables for Firebase
  console.log('\n🔍 RAW FIREBASE ENV VARS:');
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  console.log(
    `- FIREBASE_PROJECT_ID: ${envProjectId ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(
    `- FIREBASE_SERVICE_ACCOUNT: ${envServiceAccount ? '✅ Set' : '❌ Not set'}`,
  );
  if (envServiceAccount) {
    console.log(`- Length: ${envServiceAccount.length}`);
    console.log(`- First 100 chars: ${envServiceAccount.substring(0, 100)}`);
    console.log(
      `- Last 100 chars: ${envServiceAccount.substring(Math.max(0, envServiceAccount.length - 100))}`,
    );
  }

  // Redis config
  console.log('\n🔴 REDIS CONFIG:');
  console.log(`- URL: ${configService.redis.url || '❌ Not set'}`);
  console.log(`- Host: ${configService.redis.host || '❌ Not set'}`);
  console.log(`- Port: ${configService.redis.port || '❌ Not set'}`);
  console.log(
    `- Password: ${configService.redis.password ? '✅ Set' : 'Not set'}`,
  );
  console.log(`- DB: ${configService.redis.db || 'Not set'}`);

  // Stripe config
  console.log('\n💳 STRIPE CONFIG:');
  console.log(
    `- Secret Key: ${configService.stripe.secretKey ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(
    `- Webhook Secret: ${configService.stripe.webhookSecret ? '✅ Set' : '❌ Not set'}`,
  );

  // JWT config
  console.log('\n🔐 JWT CONFIG:');
  console.log(
    `- Secret: ${configService.jwt.secret ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(`- Expires In: ${configService.jwt.expiresIn}`);
  console.log(`- Refresh Expires In: ${configService.jwt.refreshExpiresIn}`);

  // Twilio config
  console.log('\n📱 TWILIO CONFIG:');
  console.log(
    `- Account SID: ${configService.twilio.accountSid ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(
    `- Auth Token: ${configService.twilio.authToken ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(
    `- Phone Number: ${configService.twilio.phoneNumber ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(`- Initialized: ${configService.twilio.initialized}`);

  // Clerk config
  console.log('\n👤 CLERK CONFIG:');
  console.log(
    `- Secret Key: ${configService.clerk.secretKey ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(
    `- Publishable Key: ${configService.clerk.publishableKey ? '✅ Set' : '❌ Not set'}`,
  );
  console.log(`- API URL: ${configService.clerk.apiUrl}`);
  console.log(`- Frontend API: ${configService.clerk.frontendApi}`);
  console.log(`- Domain: ${configService.clerk.domain}`);
  console.log(`- Initialized: ${configService.clerk.isConfigured()}`);

  // Notification config
  console.log('\n🔔 NOTIFICATION CONFIG:');
  console.log(
    `- Rate Limit Per Hour: ${configService.notification.rateLimitPerHour}`,
  );
  console.log(
    `- Rate Limit Per Minute: ${configService.notification.rateLimitPerMinute}`,
  );
  console.log(
    `- Analytics Enabled: ${configService.notification.analyticsEnabled}`,
  );
  console.log(`- Retention Days: ${configService.notification.retentionDays}`);

  console.log('\n=====================================\n');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

  // Log all environment configuration
  logEnvironmentConfig(configService);

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporarily allow non-whitelisted properties for debugging
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Get configuration values
  const port = configService.get('app.port');
  const environment = configService.get('app.environment');
  const swaggerConfig = configService.get('app.swagger');

  // Determine base URL for Swagger
  const host = process.env.HOST || process.env.DOMAIN || 'localhost';

  // Detect if host is an IP address (VPS scenario)
  const isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

  // For IP addresses (VPS), use HTTP. For domains, use HTTPS in production
  const protocol =
    environment === 'production' && !isIPAddress ? 'https' : 'http';

  // Include port for IP addresses, development environment, or when explicitly different from default
  const needsPort =
    isIPAddress ||
    environment === 'development' ||
    (environment === 'production' && port !== 80 && port !== 443);

  const baseUrl = needsPort
    ? `${protocol}://${host}:${port}`
    : `${protocol}://${host}`;

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title || 'Uber Clone API')
    .setDescription(
      swaggerConfig.description ||
        '🚗 Complete API documentation for Uber Clone application with ride-sharing, delivery, and marketplace features.\n\n' +
          '## 🔐 Authentication\n' +
          '- **User Endpoints**: Use JWT token obtained from login endpoints\n' +
          '- **Admin Endpoints**: Use admin JWT token from `/admin/auth/login`\n' +
          '- **Public Endpoints**: Registration and some informational endpoints\n\n' +
          '## 🏗️ System Modules\n' +
          '- **Ride Sharing**: Complete ride booking and management system\n' +
          '- **Delivery & Marketplace**: Store management and order processing\n' +
          '- **Admin Panel**: Comprehensive administrative interface\n' +
          '- **Real-time**: WebSocket-based live tracking and notifications\n' +
          '- **Payments**: Stripe integration with wallet system\n\n' +
          '## 📊 Admin Panel Features\n' +
          '- Real-time dashboard with KPIs and metrics\n' +
          '- User, driver, and ride management\n' +
          '- Geographical zone management\n' +
          '- Dynamic pricing and tier configuration\n' +
          '- Comprehensive reporting and analytics\n' +
          '- Feature flags and system configuration\n' +
          '- Secure API key management\n\n' +
          '**Note**: Use the "Authorize" button to set your JWT token for testing authenticated endpoints.',
    )
    .setVersion(swaggerConfig.version || '1.0.0')
    .addTag('users', 'User management endpoints')
    .addTag('drivers', 'Driver management endpoints')
    .addTag('rides', 'Ride management endpoints')
    .addTag('wallet', 'Wallet and payment endpoints')
    .addTag('promotions', 'Promotion and discount endpoints')
    .addTag('safety', 'Safety and emergency endpoints')
    .addTag('chat', 'Chat and messaging endpoints')
    .addTag('stripe', 'Stripe payment endpoints')
    .addTag('admin', 'Admin management endpoints')
    .addTag('Admin Authentication', 'Admin authentication and authorization')
    .addTag('Admin Dashboard', 'Admin dashboard and analytics')
    .addTag('Admin Ride Management', 'Admin ride management')
    .addTag('Admin User Management', 'Admin user management')
    .addTag('Admin Driver Management', 'Admin driver management')
    .addTag('Admin Reports & Analytics', 'Admin reporting and analytics')
    .addTag('Admin Notifications', 'Admin notification management')
    .addTag('Admin Geography - Countries', 'Admin geographical management - Countries')
    .addTag('Admin Geography - States', 'Admin geographical management - States')
    .addTag('Admin Geography - Cities', 'Admin geographical management - Cities')
    .addTag('Admin Geography - Service Zones', 'Admin geographical management - Service Zones')
    .addTag('Admin Pricing - Ride Tiers', 'Admin pricing and tier management - Ride Tiers')
    .addTag('Admin Pricing - Temporal Rules', 'Admin pricing and tier management - Temporal Rules')
    .addTag('Admin Config - API Keys', 'Admin system configuration - API Keys')
    .addTag('Admin Config - Feature Flags', 'Admin system configuration - Feature Flags')
    .addTag('Analytics', 'Analytics and reporting endpoints')
    .addTag('Stores', 'Store management endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addServer(baseUrl, `${environment} server`)
    .addServer('http://localhost:3000', 'Local development server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Enter JWT token. For development testing, you can use: Bearer dev-test-token',
        in: 'header',
      },
      'JWT-auth', // This name will be used in the security schemes
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Note: Security is applied per endpoint using guards, not globally
  // This allows public endpoints like registration to work without authentication

  SwaggerModule.setup(swaggerConfig.path || 'api', app, document);

  // Enable CORS with secure defaults
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-Access-Token',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(port);
  console.log(`🚀 Application is running on: ${baseUrl}`);
  console.log(
    `📖 Swagger documentation: ${baseUrl}/${swaggerConfig.path || 'api'}`,
  );
  console.log(`🔧 Environment: ${environment}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`📡 Port: ${port}`);
}
void bootstrap();
