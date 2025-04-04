import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { PusherService, AuthModule } from '@ontrack-tech-group/common/services';
import { MessagesModule } from '@Modules/messages/messages.module';
import { MessageGroupModule } from '@Modules/message-group/message-group.module';
import { CommentsModule } from '@Modules/comments/comments.module';
import { EmailModule } from '@Modules/email/email.module';
import { NotificationsModule } from '@Modules/notifications/notifications.module';
import { SlackModule } from '@Modules/slack/slack.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    AuthModule,
    MessagesModule,
    MessageGroupModule,
    CommentsModule,
    EmailModule,
    NotificationsModule,
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService, PusherService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
