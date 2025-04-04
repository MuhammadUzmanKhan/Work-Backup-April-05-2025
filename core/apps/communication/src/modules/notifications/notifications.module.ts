import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PusherService],
  imports: [ConfigModule, HttpModule],
})
export class NotificationsModule {}
