import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { AlertService } from '@Modules/alert/alert.service';
import { PriorityGuideService } from './priority-guide.service';
import { PriorityGuideController } from './priority-guide.controller';

@Module({
  controllers: [PriorityGuideController],
  providers: [PriorityGuideService, PusherService, AlertService, ConfigService],
})
export class PriorityGuideModule {}
