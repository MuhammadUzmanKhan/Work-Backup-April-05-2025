import { Module } from '@nestjs/common';
import { UserService } from '@Modules/user/user.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';

@Module({
  controllers: [ConversationController],
  imports: [HttpModule],
  providers: [ConversationService, UserService, PusherService, ConfigService],
})
export class ConversationModule {}
