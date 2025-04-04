import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import {
  TransformInterceptor,
  HttpExceptionFilter,
  SentryInterceptor,
} from '@ontrack-tech-group/common/interceptors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { MetadataStorage, getFromContainer } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { json } from 'express';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    rawBody: true,
  });

  app.use(json({ limit: '100mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '100mb',
      extended: true,
      parameterLimit: 1000000,
    }),
  );

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  // ENABLING VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  // ENABLING CUSTOM EXCEPTION HANDLER
  app.useGlobalFilters(new HttpExceptionFilter());

  // ENABLING CUSTOM RESPONSE HANDLER
  app.useGlobalInterceptors(new TransformInterceptor());

  // ENABLE SENTRY INTERCEPTOR
  app.useGlobalInterceptors(new SentryInterceptor());

  // APP CONFIGURATION
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // SWAGGER SETUP
  const config = new DocumentBuilder()
    .setTitle('OnTrack Worker APIS')
    .setDescription('OnTrack API description')
    .setVersion('3.0')
    .addBearerAuth({
      type: 'http',
      in: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  app.use(
    '/swagger/api',
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USERNAME]: process.env.SWAGGER_PASSWORD,
      },
    }),
  );

  const document = SwaggerModule.createDocument(app, config);

  const metadatas = (getFromContainer(MetadataStorage) as any)
    .validationMetadatas;

  const schemas = validationMetadatasToSchemas(metadatas);

  document.components.schemas = Object.assign(
    {},
    document.components.schemas || {},
    schemas,
  );

  SwaggerModule.setup('swagger/api', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3003);
}
bootstrap();
