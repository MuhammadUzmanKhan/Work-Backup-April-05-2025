import 'multer';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { AuthModule } from '@ontrack-tech-group/common/services';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from '@Modules/upload/upload.module';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
