import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MetadataStorage, getFromContainer } from 'class-validator';
import { NestExpressApplication } from '@nestjs/platform-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // ENABLING VALIDATION PIPE
  app.useGlobalPipes(new ValidationPipe());

  // APP CONFIGURATION
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // SWAGGER SETUP
  const config = new DocumentBuilder()
    .setTitle('Alpha Portfoio APIS')
    .setDescription('Alpha Portfoio API description')
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
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
