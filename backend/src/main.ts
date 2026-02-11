import './instrument';
import 'reflect-metadata';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Security Headers
  app.use(helmet());

  // Increase payload limit for large imports
  // Note: NestJS by default uses body-parser under the hood. 
  // We can adjust the limit by passing options to the underlying platform (Express)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Use nestjs-pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Global Exception Filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Global prefix
  app.setGlobalPrefix('api');
  // Trigger reload for webhook

  // Validation pipe
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

  // CORS for development
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EMS Studio API')
    .setDescription('Multi-tenant EMS Studio Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tenants', 'Tenant management')
    .addTag('studios', 'Studio management')
    .addTag('rooms', 'Room management')
    .addTag('coaches', 'Coach management')
    .addTag('clients', 'Client management')
    .addTag('sessions', 'Session scheduling')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 EMS Studio API running on http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
