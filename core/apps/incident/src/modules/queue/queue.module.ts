// bull.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import {
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

@Module({
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.CORE,
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_MICRO_SERVICE_HOST,
          port: +process.env.CORE_MICRO_SERVICE_PORT,
        },
      },
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
    ConfigModule.forRoot({
      isGlobal: true, // Optionally make the config global
    }),
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
    BullModule.registerQueue({ name: 'incidentQueue' }),
  ],
  providers: [
    PusherService,
    QueueService,
    QueueProcessor,

    CoreService,
    IncidentService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
