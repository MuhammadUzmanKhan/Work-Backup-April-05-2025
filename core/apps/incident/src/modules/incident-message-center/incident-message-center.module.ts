import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { IncidentMessageCenterService } from './incident-message-center.service';
import { IncidentMessageCenterController } from './incident-message-center.controller';

@Module({
  controllers: [IncidentMessageCenterController],
  providers: [IncidentMessageCenterService, PusherService, ConfigService],
})
export class IncidentMessageCenterModule {}
