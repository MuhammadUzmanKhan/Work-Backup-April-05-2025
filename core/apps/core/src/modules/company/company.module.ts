import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AnalyticCommunicationService,
  ChangeLogModule,
  PusherService,
  TranslateService,
  UsersPinsService,
} from '@ontrack-tech-group/common/services';
import { v2 } from '@google-cloud/translate';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { EventModule } from '@Modules/event/event.module';
import { ImageModule } from '@Modules/image/image.module';
import { CommentsModule } from '@Modules/comments/comments.module';
import { CompanyContactModule } from '@Modules/company-contact/company-contact.module';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  controllers: [CompanyController],
  providers: [
    UsersPinsService,
    CompanyService,
    PusherService,
    AnalyticCommunicationService,
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
        name: COMMUNICATIONS_CLIENT.ANALYTICS, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_MICRO_SERVICE_HOST,
          port: +process.env.ANALYTICS_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ConfigModule,
    EventModule,
    ImageModule,
    CommentsModule,
    ChangeLogModule,
    HttpModule,
    CompanyContactModule,
  ],
  exports: [CompanyService],
})
export class CompaniesModule {}
