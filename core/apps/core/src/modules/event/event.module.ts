import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  PusherService,
  CommunicationService,
  AnalyticCommunicationService,
  ChangeLogModule,
  UsersPinsService,
  TranslateService,
  ReportingCommunicationService,
} from '@ontrack-tech-group/common/services';
import { v2 } from '@google-cloud/translate';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { ImageModule } from '@Modules/image/image.module';
import { CommentsModule } from '@Modules/comments/comments.module';
import { CompanyService } from '@Modules/company/company.service';
import { QueuesModule } from '@Modules/queues/queues.module';
import { CompanyContactModule } from '@Modules/company-contact/company-contact.module';
import { EventCadModule } from '@Modules/event-cads/event-cad.module';
import { AppService } from 'src/app.service';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
  controllers: [EventController],
  providers: [
    UsersPinsService,
    EventService,
    PusherService,
    CompanyService,
    CommunicationService,
    AnalyticCommunicationService,
    ReportingCommunicationService,
    AppService,
    TranslateService,
    {
      provide: 'TRANSLATE',
      useFactory: () => {
        return new v2.Translate({
          key: process.env.GOOGLE_TRANSLATE_KEY,
        });
      },
    },
  ],
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
      {
        name: COMMUNICATIONS_CLIENT.ANALYTICS, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_MICRO_SERVICE_HOST,
          port: +process.env.ANALYTICS_MICRO_SERVICE_PORT,
        },
      },
      {
        name: COMMUNICATIONS_CLIENT.REPORTING, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.REPORTING_MICRO_SERVICE_HOST,
          port: +process.env.REPORTING_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ConfigModule,
    ChangeLogModule,
    ImageModule,
    CommentsModule,
    HttpModule,
    QueuesModule,
    CompanyContactModule,
    forwardRef(() => EventCadModule),
  ],
  exports: [EventService],
})
export class EventModule {}
