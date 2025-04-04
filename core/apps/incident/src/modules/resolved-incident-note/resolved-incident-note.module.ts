import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AnalyticCommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { IncidentModule } from '@Modules/incident/incident.module';
import { ResolvedIncidentNoteService } from './resolved-incident-note.service';
import { ResolvedIncidentNoteController } from './resolved-incident-note.controller';

@Module({
  imports: [
    ConfigModule,
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
    IncidentModule,
  ],
  controllers: [ResolvedIncidentNoteController],
  providers: [
    ResolvedIncidentNoteService,
    AnalyticCommunicationService,
    PusherService,
  ],
})
export class ResolvedIncidentNoteModule {}
