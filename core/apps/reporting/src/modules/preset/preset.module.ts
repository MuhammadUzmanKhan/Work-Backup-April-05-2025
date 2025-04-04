import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  IncidentService,
} from '@ontrack-tech-group/common/services';
import { QueuesModule } from '@Modules/queues/queues.module';
import { PresetService } from './preset.service';
import { PresetController } from './preset.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.INCIDENT,
        transport: Transport.TCP,
        options: {
          host: process.env.INCIDENT_MICRO_SERVICE_HOST,
          port: +process.env.INCIDENT_MICRO_SERVICE_PORT,
        },
      },
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION,
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    HttpModule,
    QueuesModule,
  ],
  controllers: [PresetController],
  providers: [PresetService, IncidentService, CommunicationService],
  exports: [PresetService],
})
export class PresetModule {}
