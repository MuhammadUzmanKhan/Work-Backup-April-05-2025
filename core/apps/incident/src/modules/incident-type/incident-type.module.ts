import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { IncidentModule } from '@Modules/incident/incident.module';
import { IncidentTypeService } from './incident-type.service';
import { IncidentTypeController } from './incident-type.controller';

@Module({
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
    ]),
    HttpModule,
    ConfigModule,
    forwardRef(() => IncidentModule),
  ],
  controllers: [IncidentTypeController],
  providers: [IncidentTypeService, PusherService, CommunicationService],
  exports: [IncidentTypeService],
})
export class IncidentTypeModule {}
