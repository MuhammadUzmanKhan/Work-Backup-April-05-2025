import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { CommonController } from '@ontrack-tech-group/common/controllers';
import {
  PusherService,
  AuthModule,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { TaskModule } from '@Modules/task/task.module';
import { SubtaskModule } from '@Modules/subtask/subtask.module';
import { TaskListModule } from '@Modules/task-list/task-list.module';
import { TaskCategoryModule } from '@Modules/task-category/task-category.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'en',
        loaderOptions: {
          path: path.join(__dirname, 'i18n'),
          watch: true,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    AuthModule,
    TaskModule,
    SubtaskModule,
    TaskListModule,
    TaskCategoryModule,
  ],
  controllers: [AppController, CommonController],
  providers: [AppService, PusherService, TranslateService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
