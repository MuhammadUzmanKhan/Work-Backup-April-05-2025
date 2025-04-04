import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ChangeLogModule,
  CommunicationService,
  ImageModule,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { TaskModule } from '@Modules/task/task.module';
import { SubtaskService } from './subtask.service';
import { SubtaskController } from './subtask.controller';

@Module({
  controllers: [SubtaskController],
  providers: [SubtaskService, PusherService, CommunicationService],
  imports: [
    ImageModule,
    ChangeLogModule,
    TaskModule,
    ConfigModule,
    ClientsModule.register([
      {
        name: 'ontrack-communication',
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
  ],
})
export class SubtaskModule {}
