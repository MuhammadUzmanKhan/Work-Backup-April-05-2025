import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  BullQueues,
  COMMUNICATIONS_CLIENT,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { QueuesService } from './queues.service';
import { QueueProcessor } from './queues.proccessor';

@Module({
  imports: [
    ClientsModule.register([
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
      name: BullQueues.EVENT,
    }),
    ConfigModule,
  ],
  providers: [
    QueuesService,
    ConfigService,
    QueueProcessor,
    CommunicationService,
    PusherService,
  ],
  exports: [QueuesService],
})
export class QueuesModule {}
