import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { MessageGroupModule } from '@Modules/message-group/message-group.module';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PusherService],
  imports: [ConfigModule, MessageGroupModule, HttpModule],
})
export class MessagesModule {}
