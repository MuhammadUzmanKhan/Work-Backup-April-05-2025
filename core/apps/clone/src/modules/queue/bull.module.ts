// bull.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CommunicationService,
  CoreService,
  IncidentService,
} from '@ontrack-tech-group/common/services';
import {
  Department,
  Event,
  EventDepartment,
  EventIncidentDivision,
  EventIncidentType,
  EventUser,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  User,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { QueueProcessor } from '@Modules/queue/queue.processor';
import { QueueService } from '@Modules/queue/queue.service';
import { EventService } from '@Modules/event/event.service';
import { EventProvider } from '@Modules/event/event.provider';
import { TransactionProvider } from '@Common/providers/transaction';
import { Config, ConstantsHelper } from '@Common/helpers';
import { ClientsModule } from '@nestjs/microservices';
import { CloneService } from '@Modules/clone/clone.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Optionally make the config global
    }),
    ClientsModule.register(Config),
    SequelizeModule.forFeature([
      Event,
      User,
      EventUser,
      Department,
      EventDepartment,
      IncidentType,
      IncidentZone,
      IncidentDivision,
      EventIncidentDivision,
      EventIncidentType,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: ConstantsHelper.EVENT_CLONING_QUEUE }),
  ],
  providers: [
    PusherService,
    TransactionProvider,
    EventService,
    CloneService,
    EventProvider,
    QueueService,
    QueueProcessor,
    CoreService,
    IncidentService,
    CommunicationService,
  ],
  exports: [QueueService],
})
export class BullQueueModule {}
