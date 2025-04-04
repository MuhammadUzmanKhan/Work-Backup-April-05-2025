import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import {
  Incident,
  Company,
  Event,
  CompanyContact,
  IncidentType,
  Alert,
  User,
  EventContact,
  PriorityGuide,
  Location,
  UserPins,
  Department,
  IncidentDivision,
  IncidentZone,
  IncidentDepartmentUsers,
  ResolvedIncidentNote,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PusherService],
  imports: [
    HttpModule,
    ConfigModule,
    SequelizeModule.forFeature([
      Incident,
      Company,
      Event,
      CompanyContact,
      IncidentType,
      Alert,
      User,
      EventContact,
      PriorityGuide,
      Location,
      UserPins,
      IncidentDivision,
      Department,
      IncidentZone,
      IncidentDepartmentUsers,
      ResolvedIncidentNote,
    ]), // Add User and Company models here if using Sequelize
  ],
})
export class DashboardModule {}
