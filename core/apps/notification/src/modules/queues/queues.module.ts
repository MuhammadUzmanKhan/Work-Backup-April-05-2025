import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullQueues } from '@ontrack-tech-group/common/constants';
import { QueueService } from './queues.service';
import { QueueProcessor } from './queue.processor';

@Module({
  imports: [
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
      name: BullQueues.NOTIFICATION,
    }),
    ConfigModule,
  ],
  providers: [QueueService, ConfigService, QueueProcessor],
  exports: [QueueService],
})
export class QueuesModule {}
