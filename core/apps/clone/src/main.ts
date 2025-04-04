import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import {
  HttpExceptionFilter,
  TransformInterceptor,
} from '@ontrack-tech-group/common/interceptors';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // ENABLING VALIDATION PIPE
  app.useGlobalPipes(new ValidationPipe());

  // ENABLING CUSTOM EXCEPTION HANDLER
  app.useGlobalFilters(new HttpExceptionFilter());

  // ENABLING CUSTOM RESPONSE HANDLER
  app.useGlobalInterceptors(new TransformInterceptor());

  // APP CONFIGURATION
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // SWAGGER SETUP
  const config = new DocumentBuilder()
    .setTitle('OnTrack Clone APIS')
    .setDescription('OnTrack Clone API description')
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

  // SERVE APP
  await app.listen(process.env.PORT || 3010);
}

bootstrap();
