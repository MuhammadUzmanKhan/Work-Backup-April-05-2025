import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import {
  PusherService,
  MailModule,
  AuthModule,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { CommonController } from '@ontrack-tech-group/common/controllers';
import { DownloadAttachmentsModule } from '@Modules/download-attachments/download-attachments.module';
import { CompaniesModule } from '@Modules/company/company.module';
import { EventModule } from '@Modules/event/event.module';
import { UsersModule } from '@Modules/user/user.module';
import { InformationRequestModule } from '@Modules/information-request/information-request.module';
import { EventSubtasksModule } from '@Modules/event-subtasks/event-subtasks.module';
import { PublicModule } from '@Modules/public/public.module';
import { CompanyContactModule } from '@Modules/company-contact/company-contact.module';
import { EventCadModule } from '@Modules/event-cads/event-cad.module';
import { CommentsModule } from '@Modules/comments/comments.module';
import { MessagesModule } from '@Modules/messages/messages.module';
import { CadTypeModule } from '@Modules/cad-types/cad-type.module';
import { CadModule } from '@Modules/cads/cad.module';
import { UserCompaniesModule } from '@Modules/user-companies/user-companies.module';
import { TicketClearModule } from '@Modules/ticket-clear/ticket-clear.module';
import { RolePermissionModule } from '@Modules/role-permission/role-permission.module';
import { TemplateModule } from '@Modules/template/template.module';
import { TwilioSettingsModule } from '@Modules/twilio-settings/twilio-settings.module';
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
    UsersModule,
    CompaniesModule,
    EventModule,
    AuthModule,
    InformationRequestModule,
    EventSubtasksModule,
    PublicModule,
    DownloadAttachmentsModule,
    CompanyContactModule,
    EventCadModule,
    CommentsModule,
    MessagesModule,
    MailModule,
    UserCompaniesModule,
    TicketClearModule,
    RolePermissionModule,
    TemplateModule,
    CadModule,
    CadTypeModule,
    TwilioSettingsModule,
  ],
  controllers: [AppController, CommonController],
  providers: [AppService, PusherService, TranslateService],
  exports: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
