import { Module } from '@nestjs/common';
import { PriorityGuideService } from '@Modules/priority-guide/priority-guide.service';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';

@Module({
  controllers: [AlertController],
  providers: [AlertService, PriorityGuideService, PusherService, ConfigService],
  exports: [AlertService],
})
export class AlertModule {}
