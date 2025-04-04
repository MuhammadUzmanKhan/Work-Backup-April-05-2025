import { Module } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { IncidentZoneService } from './incident-zone.service';
import { IncidentZoneController } from './incident-zone.controller';
import { IncidentZoneV2Service } from './incident-zone.v2.service';
import { IncidentZoneV2Controller } from './incident-zone.v2.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [IncidentZoneController, IncidentZoneV2Controller],
  providers: [IncidentZoneService, PusherService, IncidentZoneV2Service],
})
export class IncidentZoneModule {}
