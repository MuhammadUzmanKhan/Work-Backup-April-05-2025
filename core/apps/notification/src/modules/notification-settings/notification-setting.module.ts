import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { NotificationSettingController } from './notification-setting.controller';
import { NotificationSettingService } from './notification-setting.service';

@Module({
  controllers: [NotificationSettingController],
  providers: [NotificationSettingService, PusherService, ConfigService],
})
export class NotificationSettingModule {}
