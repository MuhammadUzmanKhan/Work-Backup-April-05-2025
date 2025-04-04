import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AnalyticCommunicationService,
  ChangeLogService,
  CommunicationService,
  ImageService,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { ChangeLogModule } from '@ontrack-tech-group/common/services';
import { IncidentModule } from '@Modules/incident/incident.module';
import { IncidentService } from '@Modules/incident/incident.service';
import { HttpModule } from '@nestjs/axios';
import { IncidentDivisionService } from '@Modules/incident-division/incident-division.service';
import { IncidentZoneService } from '@Modules/incident-zone/incident-zone.service';
import { ReferenceMapService } from '@Modules/reference-map/reference-map.service';
import { SourceService } from '@Modules/source/source.service';
import { IncidentTypeService } from '@Modules/incident-type/incident-type.service';
import { AlertService } from '@Modules/alert/alert.service';
import { QueueService } from '@Modules/queue/queue.service';
import { PriorityGuideService } from '@Modules/priority-guide/priority-guide.service';

import { LegalChatService } from './legal-chat.service';
import { LegalChatController } from './legal-chat.controller';

@Module({
  controllers: [LegalChatController],
  providers: [
    LegalChatService,
    PusherService,
    CommunicationService,
    IncidentService,
    AnalyticCommunicationService,
    IncidentDivisionService,
    IncidentZoneService,
    ReferenceMapService,
    TranslateService,
    SourceService,
    IncidentTypeService,
    AlertService,
    ChangeLogService,
    ImageService,
    QueueService,
    PriorityGuideService,
  ],
  exports: [LegalChatService, LegalChatModule],
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
    ChangeLogModule,
    forwardRef(() => IncidentModule), // Use forwardRef to resolve circular dependency
    HttpModule,
  ],
})
export class LegalChatModule {}
