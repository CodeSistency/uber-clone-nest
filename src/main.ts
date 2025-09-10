import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/exceptions/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

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
  const protocol = (environment === 'production' && !isIPAddress) ? 'https' : 'http';

  // Include port for IP addresses, development environment, or when explicitly different from default
  const needsPort = isIPAddress ||
                   (environment === 'development') ||
                   (environment === 'production' && port !== 80 && port !== 443);

  const baseUrl = needsPort
    ? `${protocol}://${host}:${port}`
    : `${protocol}://${host}`;

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title || 'Uber Clone API')
    .setDescription(
      swaggerConfig.description ||
      'Complete API documentation for Uber Clone application with ride-sharing, delivery, and marketplace features. ' +
      'Use the "Authorize" button to set your JWT token for testing authenticated endpoints. ' +
      'Note: Registration endpoint (POST /api/user) is public and does not require authentication.',
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
    .addTag('analytics', 'Analytics and reporting endpoints')
    .addTag('notifications', 'Notification management endpoints')
    .addTag('stores', 'Store management endpoints')
    .addTag('orders', 'Order management endpoints')
    .addServer(baseUrl, `${environment} server`)
    .addServer('http://localhost:3000', 'Local development server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token. For development testing, you can use: Bearer dev-test-token',
        in: 'header',
      },
      'JWT-auth', // This name will be used in the security schemes
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Note: Security is applied per endpoint using guards, not globally
  // This allows public endpoints like registration to work without authentication

  SwaggerModule.setup(swaggerConfig.path || 'api', app, document);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
  console.log(`🚀 Application is running on: ${baseUrl}`);
  console.log(`📖 Swagger documentation: ${baseUrl}/${swaggerConfig.path || 'api'}`);
  console.log(`🔧 Environment: ${environment}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`📡 Port: ${port}`);
}
void bootstrap();
