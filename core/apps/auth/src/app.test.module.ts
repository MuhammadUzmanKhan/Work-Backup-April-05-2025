import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TwilioService } from './twilio/twilio.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, TwilioService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
