import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import {
  TransformInterceptor,
  HttpExceptionFilter,
  SentryInterceptor,
} from '@ontrack-tech-group/common/interceptors';
import { PusherChannelsDto } from '@ontrack-tech-group/common/dto';
import basicAuth from 'express-basic-auth';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigin =
          process.env.ALLOWED_ORIGIN === '*'
            ? '*'
            : [...process.env.ALLOWED_ORIGIN.split(',')];

        const isAllowOrigin =
          allowedOrigin === '*' ||
          allowedOrigin
            .map((origin) => new RegExp(origin.slice(1, -1)))
            .some((pattern) => (pattern as unknown as RegExp).test(origin));

        if (!origin || isAllowOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: '*',
      allowedHeaders: '*',
      credentials: true,
    },
  });

  // INITIALIZE SENTRY IN APPLICATION
  Sentry.init({
    dsn: process.env.SENTRY_URL,
    environment: process.env.ENV,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // Check if there is an exception
      if (hint.originalException) {
        const exception = hint.originalException as any;
        // Check if it's an HTTP exception with a status code
        if (
          exception.status &&
          [400, 401, 403, 404].includes(exception.status)
        ) {
          // Don't send these errors to Sentry
          return null;
        }
      }
      // Otherwise, send the event to Sentry
      return event;
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: +process.env.INCIDENT_MICRO_SERVICE_PORT,
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

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // SWAGGER SETUP
  const config = new DocumentBuilder()
    .setTitle('OnTrack Incident APIS')
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

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [PusherChannelsDto],
  });

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

  // SERVE APP
  await app.listen(process.env.PORT || 3004);
}
bootstrap();
