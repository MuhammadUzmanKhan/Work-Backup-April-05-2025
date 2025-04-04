import { ConfigModule } from '@nestjs/config';
import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ChangeLogModule,
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { EventModule } from '@Modules/event/event.module';
import { EventCadController } from './event-cad.controller';
import { EventCadService } from './event-cad.service';

@Module({
  controllers: [EventCadController],
  providers: [EventCadService, PusherService, CommunicationService],
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
    ConfigModule,
    HttpModule,
    forwardRef(() => EventModule), // Use forwardRef to resolve circular dependency
    ChangeLogModule,
  ],
  exports: [EventCadService],
})
export class EventCadModule {}
