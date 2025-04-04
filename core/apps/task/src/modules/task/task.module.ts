import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  ChangeLogModule,
  CommunicationService,
  ImageService,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TaskListModule } from '@Modules/task-list/task-list.module';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    CommunicationService,
    PusherService,
    ImageService,
    TranslateService,
  ],
  exports: [TaskService],
  imports: [
    ClientsModule.register([
      // {
      //   name: 'ontrack-communication',
      //   transport: Transport.NATS,
      //   options: {
      //     servers: 'nats://hub.nats.ontracktechgroup.com',
      //     token: '58c9a718cd48806abe07b9ff8d76c8179af8495352',
      //   },
      // },
      {
        name: 'ontrack-communication',
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ChangeLogModule,
    TaskListModule,
    ConfigModule,
    HttpModule,
  ],
})
export class TaskModule {}
