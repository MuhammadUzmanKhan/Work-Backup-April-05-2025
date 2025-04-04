import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { MobileIncidentInboxService } from './mobile-incident-inbox.service';
import { MobileIncidentInboxController } from './mobile-incident-inbox.controller';

@Module({
  controllers: [MobileIncidentInboxController],
  providers: [MobileIncidentInboxService, PusherService, ConfigService],
})
export class MobileIncidentInboxModule {}
