import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { AuthModule } from '@ontrack-tech-group/common/services';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { NotificationSettingModule } from '@Modules/notification-settings/notification-setting.module';
import { NotificationModule } from '@Modules/notification/notification.module';
import { QueuesModule } from '@Modules/queues/queues.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ConfigModule.forRoot(),
    NotificationSettingModule,
    NotificationModule,
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
