import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { IncidentDivisionService } from './incident-division.service';
import { IncidentDivisionController } from './incident-division.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [IncidentDivisionController],
  providers: [IncidentDivisionService, PusherService],
})
export class IncidentDivisionModule {}
