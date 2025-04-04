import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

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
        name: COMMUNICATIONS_CLIENT.COMMUNICATION, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}
