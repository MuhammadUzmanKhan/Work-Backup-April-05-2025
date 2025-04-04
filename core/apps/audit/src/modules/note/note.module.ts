import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';

import { NoteController } from './note.controller';
import { NoteService } from './note.service';

@Module({
  imports: [ConfigModule],
  controllers: [NoteController],
  providers: [NoteService, PusherService],
})
export class NoteModule {}
