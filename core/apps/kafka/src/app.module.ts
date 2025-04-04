import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { AuthModule, PusherService } from '@ontrack-tech-group/common/services';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [DatabaseModule, KafkaModule, AuthModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, PusherService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
