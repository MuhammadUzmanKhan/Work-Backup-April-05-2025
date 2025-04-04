import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { UserService } from '@Modules/user/user.service';
import { EventNoteService } from './event-notes.service';
import { EventNoteController } from './event-notes.controller';

@Module({
  controllers: [EventNoteController],
  imports: [HttpModule],
  providers: [EventNoteService, UserService, PusherService],
})
export class EventNoteModule {}
