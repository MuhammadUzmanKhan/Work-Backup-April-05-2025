import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swagger } from '@common/constants';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    const swaggerOptions = new DocumentBuilder().setTitle(swagger.title)
        .setDescription(swagger.description)
        .setVersion(swagger.version)
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerOptions);
    SwaggerModule.setup('/api', app, document);
    await app.listen(configService.get("PORT") || 3121);
}

bootstrap();
