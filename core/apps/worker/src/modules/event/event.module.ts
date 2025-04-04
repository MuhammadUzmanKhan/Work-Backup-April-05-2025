import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { BullQueues } from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { CoreService } from '@ontrack-tech-group/common/services';
import { EventConsumer } from './event.consumer';
import Config from '../../common';

@Module({
  imports: [
    ClientsModule.register(Config),
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
  providers: [EventConsumer, PusherService, CoreService],
})
export class EventModule {}
