import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '../pusher.service';
import { ChangeLogService } from './change-log.service';

@Module({
  providers: [PusherService, ChangeLogService],
  imports: [ConfigModule],
  exports: [ChangeLogService],
})
export class ChangeLogModule {}
