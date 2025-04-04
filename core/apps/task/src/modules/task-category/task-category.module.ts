import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { TaskCategoryService } from './task-category.service';
import { TaskCategoryController } from './task-category.controller';

@Module({
  controllers: [TaskCategoryController],
  providers: [TaskCategoryService, ConfigService, PusherService],
})
export class TaskCategoryModule {}
