import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import {
  PusherService,
  AuthModule,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { CommonController } from '@ontrack-tech-group/common/controllers';
import { DayModule } from '@Modules/day/day.module';
import { ScanModule } from '@Modules/scan/scan.module';
import { IncidentZoneModule } from '@Modules/incident-zone/incident-zone.module';
import { IncidentDivisionModule } from '@Modules/incident-division/incident-division.module';
import { IncidentTypeModule } from '@Modules/incident-type/incident-type.module';
import { IncidentModule } from '@Modules/incident/incident.module';
import { SourceModule } from '@Modules/source/source.module';
import { UsersModule } from '@Modules/user/user.module';
import { PriorityGuideModule } from '@Modules/priority-guide/priority-guide.module';
import { PresetMessageModule } from '@Modules/preset-message/preset-message.module';
import { AlertModule } from '@Modules/alert/alert.module';
import { IncidentMessageCenterModule } from '@Modules/incident-message-center/incident-message-center.module';
import { MobileIncidentInboxModule } from '@Modules/mobile-incident-inbox/mobile-incident-inbox.module';
import { ReferenceMapModule } from '@Modules/reference-map/reference-map.module';
import { ResolvedIncidentNoteModule } from '@Modules/resolved-incident-note/resolved-incident-note.module';
import { IncidentFormModule } from '@Modules/incident-form/incident-form.module';
import { EventContactModule } from '@Modules/event-contact/event-contact.module';
import { ScanCountModule } from '@Modules/scan-count/scan-count.module';
import { EventNoteModule } from '@Modules/event-notes/event-notes.module';
import { LiveVideoModule } from '@Modules/live-video/live-video.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConversationModule } from '@Modules/conversation/conversation.module';
import { GlobalIncidentModule } from '@Modules/global-incident/global-incident.module';
import { IncidentTypeManagementModule } from '@Modules/type-management/type-management.module';
import { LegalChatModule } from '@Modules/legal-chat/legal-chat.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
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
    DatabaseModule,
    AuthModule,
    DayModule,
    ScanModule,
    IncidentZoneModule,
    LegalChatModule,
    IncidentDivisionModule,
    IncidentTypeModule,
    IncidentModule,
    SourceModule,
    UsersModule,
    PriorityGuideModule,
    PresetMessageModule,
    AlertModule,
    IncidentMessageCenterModule,
    MobileIncidentInboxModule,
    ReferenceMapModule,
    ResolvedIncidentNoteModule,
    IncidentFormModule,
    EventContactModule,
    ScanCountModule,
    EventNoteModule,
    LiveVideoModule,
    ConversationModule,
    GlobalIncidentModule,
    IncidentTypeManagementModule,
  ],
  controllers: [AppController, CommonController],
  providers: [AppService, PusherService, TranslateService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
