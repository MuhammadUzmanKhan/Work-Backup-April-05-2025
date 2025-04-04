import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  BullQueues,
  COMMUNICATIONS_CLIENT,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  IncidentService,
} from '@ontrack-tech-group/common/services';
import { QueueService } from './queues.service';
import { QueueProcessor } from './queue.processor';

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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: BullQueues.REPORTING,
    }),
    ConfigModule,
  ],
  providers: [
    QueueService,
    ConfigService,
    QueueProcessor,
    IncidentService,
    CommunicationService,
  ],
  exports: [QueueService],
})
export class QueuesModule {}
