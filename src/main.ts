import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/exceptions/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Uber Clone API')
    .setDescription(
      'Complete API documentation for Uber Clone application with ride-sharing, delivery, and marketplace features',
    )
    .setVersion('1.0.0')
    .addTag('users', 'User management endpoints')
    .addTag('drivers', 'Driver management endpoints')
    .addTag('rides', 'Ride management endpoints')
    .addTag('wallet', 'Wallet and payment endpoints')
    .addTag('promotions', 'Promotion and discount endpoints')
    .addTag('safety', 'Safety and emergency endpoints')
    .addTag('chat', 'Chat and messaging endpoints')
    .addTag('stripe', 'Stripe payment endpoints')
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📖 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
