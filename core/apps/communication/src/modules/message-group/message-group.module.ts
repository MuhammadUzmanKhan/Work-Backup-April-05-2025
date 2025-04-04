import { Module } from '@nestjs/common';
import { MessageGroupService } from './message-group.service';
import { MessageGroupController } from './message-group.controller';

@Module({
  controllers: [MessageGroupController],
  providers: [MessageGroupService],
  exports: [MessageGroupService],
})
export class MessageGroupModule {}
