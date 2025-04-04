import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from '@Modules/event/event.module';
import { ImageModule } from '@Modules/image/image.module';
import { CommentsModule } from '@Modules/comments/comments.module';
import { CompaniesModule } from '@Modules/company/company.module';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ChangeLogModule,
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { QueuesModule } from '@Modules/queues/queues.module';
import { EventSubtasksService } from './event-subtasks.service';
import { EventSubtasksController } from './event-subtasks.controller';

@Module({
  controllers: [EventSubtasksController],
  providers: [EventSubtasksService, PusherService, CommunicationService],
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
    EventModule,
    ChangeLogModule,
    ImageModule,
    CommentsModule,
    CompaniesModule,
    HttpModule,
    QueuesModule,
  ],
  exports: [EventSubtasksService],
})
export class EventSubtasksModule {}
