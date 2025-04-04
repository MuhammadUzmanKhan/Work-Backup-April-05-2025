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
  IncidentService,
  PusherService,
  RolePermissionGuard,
  CoreService,
} from '@ontrack-tech-group/common/services';
import { TransactionProvider } from '@Common/providers/transaction';
import { BullQueueModule } from '@Modules/queue/bull.module';
import { CloneService } from '@Modules/clone/clone.service';
import { CloneController } from '@Modules/clone/clone.controller';
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
    CloneService,
    PusherService,
    IncidentService,
    CoreService,
    RolePermissionGuard,
  ],
  controllers: [CloneController],
})
export class CloneModule {}
