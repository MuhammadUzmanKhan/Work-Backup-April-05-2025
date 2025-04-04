import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import {
  Event,
  EventUser,
  User,
  EventDepartment,
  Department,
  IncidentType,
  IncidentZone,
  IncidentDivision,
  EventIncidentDivision,
  EventIncidentType,
} from '@ontrack-tech-group/common/models';
import {
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { CoreService } from '@ontrack-tech-group/common/services';
import { TransactionProvider } from '@Common/providers/transaction';
import { BullQueueModule } from '@Modules/queue/bull.module';
import { EventService } from '@Modules/event/event.service';
import { EventController } from '@Modules/event/event.controller';
import { EventProvider } from '@Modules/event/event.provider';
import { Config } from '@Common/helpers';

@Module({
  imports: [
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
    BullQueueModule,
    ConfigModule,
  ],
  providers: [
    TransactionProvider,
    CommunicationService,
    EventProvider,
    EventService,
    PusherService,
    CoreService,
  ],
  controllers: [EventController],
})
export class EventModule {}
