import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresetMessageController } from './preset-message.controller';
import { PusherService } from '@ontrack-tech-group/common/services';
import { PresetMessageService } from './preset-message.service';

@Module({
  controllers: [PresetMessageController],
  providers: [PresetMessageService, PusherService, ConfigService],
})
export class PresetMessageModule {}
