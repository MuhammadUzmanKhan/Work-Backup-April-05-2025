import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PusherService, ConfigService],
})
export class NotificationModule {}
