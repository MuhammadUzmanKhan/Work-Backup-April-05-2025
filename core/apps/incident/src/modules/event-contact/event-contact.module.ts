import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { EventContactService } from './event-contact.service';
import { EventContactController } from './event-contact.controller';

@Module({
  controllers: [EventContactController],
  providers: [EventContactService, PusherService, ConfigService],
})
export class EventContactModule {}
