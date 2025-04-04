import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import {
  PusherService,
  UsersPinsModule,
} from '@ontrack-tech-group/common/services';
import { TaskListService } from './task-list.service';
import { TaskListController } from './task-list.controller';

@Module({
  controllers: [TaskListController],
  providers: [TaskListService, PusherService],
  exports: [TaskListService],
  imports: [ConfigModule, HttpModule, UsersPinsModule],
})
export class TaskListModule {}
