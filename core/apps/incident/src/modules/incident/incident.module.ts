import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import {
  AnalyticCommunicationService,
  ChangeLogService,
  CommunicationService,
  ImageService,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { IncidentDivisionModule } from '@Modules/incident-division/incident-division.module';
import { QueueService } from '@Modules/queue/queue.service';
import { QueueModule } from '@Modules/queue/queue.module';
import { SourceModule } from '@Modules/source/source.module';
import { IncidentTypeModule } from '@Modules/incident-type/incident-type.module';
import { AlertModule } from '@Modules/alert/alert.module';
import { IncidentZoneModule } from '@Modules/incident-zone/incident-zone.module';
import { IncidentTypeService } from '@Modules/incident-type/incident-type.service';
import { IncidentZoneService } from '@Modules/incident-zone/incident-zone.service';
import { ReferenceMapService } from '@Modules/reference-map/reference-map.service';
import { SourceService } from '@Modules/source/source.service';
import { ReferenceMapModule } from '@Modules/reference-map/reference-map.module';
import { LegalChatService } from '@Modules/legal-chat/legal-chat.service';
import { IncidentDivisionService } from '@Modules/incident-division/incident-division.service';
import { AlertService } from '@Modules/alert/alert.service';
import { PriorityGuideService } from '@Modules/priority-guide/priority-guide.service';
import { LegalChatModule } from '@Modules/legal-chat/legal-chat.module';

import { IncidentController } from './incident.controller';
import { IncidentV2Controller } from './incident.v2.controller';
import { IncidentService } from './incident.service';
import { IncidentV2Service } from './incident.v2.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'incidentQueue' }),
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.ANALYTICS,
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_MICRO_SERVICE_HOST,
          port: Number(process.env.ANALYTICS_MICRO_SERVICE_PORT || 0),
        },
      },
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: Number(process.env.COMMUNICATION_MICRO_SERVICE_PORT || 0),
        },
      },
    ]),
    ConfigModule,
    HttpModule,
    IncidentDivisionModule,
    SourceModule,
    IncidentTypeModule,
    AlertModule,
    IncidentZoneModule,
    QueueModule,
    ReferenceMapModule,
    forwardRef(() => LegalChatModule),
  ],
  controllers: [IncidentController, IncidentV2Controller],
  providers: [
    IncidentService,
    IncidentV2Service,
    AnalyticCommunicationService,
    CommunicationService,
    AlertService,
    IncidentDivisionService,
    PusherService,
    PriorityGuideService,
    AnalyticCommunicationService,
    IncidentZoneService,
    ReferenceMapService,
    SourceService,
    IncidentTypeService,
    ChangeLogService,
    ImageService,
    TranslateService,
    QueueService,
    LegalChatService,
  ],
  exports: [IncidentService],
})
export class IncidentModule {}
